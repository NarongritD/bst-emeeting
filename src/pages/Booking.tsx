/**
 * ==========================================
 * ไฟล์: Booking.tsx
 * หน้าที่หลัก: ระบบจัดการปฏิทินและการจองห้องประชุม (Room Booking & Calendar Scheduler)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ตัวเลือกมุมมอง (Calendar Mode): สลับแสดงผลแบบ "รายสัปดาห์" (Timeline Grid) และ "รายเดือน" (Month Grid)
 * 2. คอนโทรลตัวกรอง (Sidebar Filters): กล่องค้นหาด้วยหัวข้อ, เลือกกรองดูเฉพาะห้องประชุมเดี่ยว หรือกรองเฉพาะ "การประชุมของฉัน"
 * 3. บล็อกตารางเวลา (Event Blocks Layout): คำนวณความสูงและตำแหน่งทับซ้อน (Overlap) ของแต่ละรายการประชุม เพื่อจัดเรียงการจองไม่ให้เบียดกัน
 * 4. หน้าฟอร์มจองและระบบเช็คเวลาซ้ำ (Booking Form & Conflict Checker): ป้องกันไม่ให้บันทึกหากเวลาจองทับซ้อนกับผู้ใช้อื่น
 * ==========================================
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import Icon from "../components/common/Icon";
import Modal from "../components/common/Modal";
import { FL, DateField, TimeField, RoomField } from "../components/common/FormFields";
import { AlertBox } from "../components/common/AlertBox";
import { BtnPri, BtnSec } from "../components/common/Buttons";
import { Avatar } from "../components/common/Avatar";
import Tooltip from "../components/common/Tooltip";
import { ROOM_ACCENT } from "./Rooms";
import type { User, Booking as BookingType, Room } from "../utils/types";
import {
  ymd,
  addDays,
  addMonths,
  startOfWeek,
  startOfMonth,
  isSameDay,
  toMin,
  findConflict,
  beThaiYear,
  pad2,
  MONTH_TH,
  DOW_TH,
  DOW_TH_S,
  DEPARTMENTS,
  formatDateBE
} from "../utils/helpers";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const IS = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid var(--border-2)",
  borderRadius: 10,
  fontSize: 14,
  color: "var(--text)",
  background: "var(--surface-2)",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit"
};

const LS = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-sub)",
  marginBottom: 7
};

/* ── คำนวณจัดวางตำแหน่งการจองชนกัน/ซ้อนกันในวันเดียวกัน เพื่อแสดงผลแบบขนานเลย์เอาท์ไม่ทับถมกัน (Timeline Side-by-Side Algorithm) ── */
function layoutOverlaps(dayBookings: BookingType[]) {
  const items = [...dayBookings]
    // แปลงเวลาเริ่ม/สิ้นสุดเป็นนาทีตัวเลข และจัดเรียงจากเวลาเริ่มเช้าสุด
    .map((b) => ({ b, s: toMin(b.start), e: toMin(b.end) }))
    .sort((x, y) => x.s - y.s || x.e - y.e);

  const clusters: typeof items[] = [];
  let cluster: typeof items = [];
  let clusterEnd = -Infinity;

  // จัดกลุ่มความขัดแย้งของการจองที่คาบเกี่ยวกันอยู่ในช่วงเวลาเดียวกัน (Overlap clusters)
  items.forEach((it) => {
    if (cluster.length && it.s >= clusterEnd) {
      clusters.push(cluster);
      cluster = [];
      clusterEnd = -Infinity;
    }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.e);
  });
  if (cluster.length) clusters.push(cluster);

  const out: (BookingType & { _col: number; _totalCols: number })[] = [];
  // สรุปจัดแบ่งคอลัมน์กว้างขนานและอัตราส่วนการแบ่งสัดส่วนหน้าจอให้กับการจองแต่ละแถว
  clusters.forEach((cl) => {
    const colEnd: number[] = [];
    cl.forEach((it) => {
      let col = colEnd.findIndex((end) => it.s >= end);
      if (col === -1) {
        col = colEnd.length;
        colEnd.push(it.e);
      } else {
        colEnd[col] = it.e;
      }
      (it as any).col = col;
    });
    const totalCols = colEnd.length;
    cl.forEach((it) => {
      out.push({ ...it.b, _col: (it as any).col, _totalCols: totalCols });
    });
  });
  return out;
}

// คอมโพเนนต์หลักควบคุมหน้าตารางปฏิทินจองห้องประชุม
export const Booking: React.FC = () => {
  // ดึงฐานข้อมูลจำลองส่วนกลาง และผู้ใช้ปัจจุบัน
  const { db, updateDB, currentUser, showToast, askConfirm, closeConfirm } = useApp();
  // สเตทสลับมุมมอง (รายสัปดาห์ / รายเดือน)
  const [view, setView] = useState<"week" | "month">("week");
  // วันที่เป้าหมายตัวชี้ตำแหน่งปฏิทินในปัจจุบัน
  const [cursor, setCursor] = useState(() => new Date());
  // ตัวกรองเลือกจำกัดห้องประชุมบางรายการ
  const [roomFilter, setRoomFilter] = useState<number[]>([]);
  // คำค้นหาการประชุม
  const [search, setSearch] = useState("");
  // กรองดูเฉพาะการประชุมที่ผู้ใช้งานมีส่วนร่วม
  const [myMeetingsOnly, setMyMeetingsOnly] = useState(false);
  // เปิด/ปิด Modal ป๊อปอัปสร้างฟอร์มจอง
  const [showModal, setShowModal] = useState(false);
  // สเตทเก็บข้อมูลแก้ไขการจอง (เป็นวัตถุกรณี Edit)
  const [editBooking, setEditBooking] = useState<any>(null);
  // สเตทเก็บรายละเอียดการจองห้องสำหรับการกดพรีวิวดูเนื้อหาย่อ
  const [detailBooking, setDetailBooking] = useState<BookingType | null>(null);

  // ตัวนำทางขนาดหน้าจอเพื่อรองรับการแสดงผล Responsive สำหรับหน้าจอไอแพด/มือถือ
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isWide = windowWidth > 1024;

  const today = new Date();
  // กรองเฉพาะห้องประชุมที่สถานะ "เปิดใช้งาน" (active) เท่านั้น
  const activeRooms = db.rooms.filter((r) => r.status === "active");

  // กำหนดสเปคสีประจำห้องประชุมโดยอ้างอิงลำดับอาเรย์พาเลทสีส่วนกลาง
  const roomColor = (id: number) =>
    ROOM_ACCENT[db.rooms.findIndex((r) => r.id === id) % ROOM_ACCENT.length] || ROOM_ACCENT[0];

  // กรองคัดเลือกรายการจองที่จะแสดงตามฟิลเตอร์ คีย์เวิร์ด และตัวเลือกการจองของฉัน
  const visibleBookings = useMemo(() => {
    console.log("=== Booking Sync Debug ===");
    console.log("Total Bookings in DB:", db.bookings?.length, db.bookings);
    console.log("Room Filter:", roomFilter);
    console.log("My Meetings Only:", myMeetingsOnly);
    const filtered = db.bookings.filter((b) => {
      if (roomFilter.length > 0 && !roomFilter.includes(b.roomId)) return false;
      if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (myMeetingsOnly && currentUser) {
        const isOrganizer = b.organizerId === currentUser.id;
        const isParticipant = b.participantIds?.includes(currentUser.id);
        if (!isOrganizer && !isParticipant) return false;
      }
      return true;
    });
    console.log("Filtered Bookings showing on calendar:", filtered);
    return filtered;
  }, [db.bookings, roomFilter, search, myMeetingsOnly, currentUser]);

  // ฟังก์ชันเลื่อนหน้าก่อนหน้า/ถัดไป หรือสลับมาวันปัจจุบัน
  const goPrev = () => setCursor((c) => (view === "week" ? addDays(c, -7) : addMonths(c, -1)));
  const goNext = () => setCursor((c) => (view === "week" ? addDays(c, 7) : addMonths(c, 1)));
  const goToday = () => setCursor(new Date());

  // เปิดหน้าต่างจองห้องใหม่ พร้อมกำหนดเงื่อนไขพรีเซ็ตวันที่หรือห้องประชุม
  const openNew = (presetDate?: string, presetRoomId?: number) => {
    setEditBooking(presetDate || presetRoomId ? { presetDate, presetRoomId } : null);
    setShowModal(true);
  };

  const doSave = (data: Omit<BookingType, "id">, originalId?: number) => {
    if (!currentUser) return;
    const roomName = db.rooms.find((r) => r.id === data.roomId)?.name || "";

    if (originalId) {
      // สร้างรายการแจ้งเตือนแบบกลุ่ม
      const newNotifs: any[] = [];
      if (data.participantIds && data.participantIds.length > 0) {
        data.participantIds.forEach((pId: number) => {
          if (pId !== currentUser.id) {
            newNotifs.push({
              id: Math.random().toString(36).substring(2, 9),
              userId: pId,
              title: "✏️ อัปเดตการจองห้องประชุม",
              message: `มีการแก้ไขรายละเอียดการจองห้อง "${roomName}" สำหรับหัวข้อ "${data.title}" วันที่ ${formatDateBE(data.date)} เวลา ${data.start}-${data.end} น.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              linkMenu: "booking",
              linkId: originalId
            });
          }
        });
      }

      updateDB({
        ...db,
        bookings: db.bookings.map((b) => (b.id === originalId ? { ...b, ...data } : b)),
        notifications: [...newNotifs, ...(db.notifications || [])]
      });
      showToast("แก้ไขการจองสำเร็จ");
    } else {
      const id = db.nextBookingId || db.bookings.length + 1;

      // สร้างรายการแจ้งเตือนแบบกลุ่ม
      const newNotifs: any[] = [];
      if (data.participantIds && data.participantIds.length > 0) {
        data.participantIds.forEach((pId: number) => {
          if (pId !== currentUser.id) {
            newNotifs.push({
              id: Math.random().toString(36).substring(2, 9),
              userId: pId,
              title: "🚪 คำเชิญเข้าประชุม (จองห้อง)",
              message: `มีการจองห้องประชุม "${roomName}" หัวข้อ "${data.title}" วันที่ ${formatDateBE(data.date)} เวลา ${data.start}-${data.end} น.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              linkMenu: "booking",
              linkId: id
            });
          }
        });
      }

      updateDB({
        ...db,
        bookings: [...db.bookings, { ...data, id }],
        nextBookingId: id + 1,
        notifications: [...newNotifs, ...(db.notifications || [])]
      });
      showToast("จองห้องประชุมสำเร็จ");
    }
    setShowModal(false);
    setEditBooking(null);
    setDetailBooking(null);
  };

  // ฟังก์ชันลบรายการจองห้องประชุม พร้อมป๊อปอัปถามความแน่ใจเพื่อยืนยันสิทธิ์
  const doDelete = (booking: BookingType) =>
    askConfirm({
      title: "ยกเลิกการจอง",
      msg: `ยืนยันยกเลิกการประชุม "${booking.title}"?`,
      icon: "x",
      color: "#B42318",
      okLabel: "ยกเลิกการจอง",
      onOk: () => {
        // อัปเดตตารางฐานข้อมูลคัดกรองเอาการจองไอดีนี้ออก
        updateDB({ ...db, bookings: db.bookings.filter((b) => b.id !== booking.id) });
        showToast("ยกเลิกการจองสำเร็จ", "info");
        closeConfirm();
        setDetailBooking(null);
      }
    });

  // คำนวณช่วงหัวข้อวันที่หลักของปฏิทินที่แสดงในแถบ Toolbar (เช่น มกราคม 2569 สัปดาห์ที่ 1)
  const periodLabel =
    view === "week"
      ? (() => {
          const s = startOfWeek(cursor);
          const diffDays = Math.floor((s.getTime() - startOfMonth(s).getTime()) / 86400000);
          const wk = Math.ceil((diffDays + startOfMonth(s).getDay() + 1) / 7);
          return `${MONTH_TH[s.getMonth()]} ${beThaiYear(s)} (สัปดาห์ที่ ${wk})`;
        })()
      : `${MONTH_TH[cursor.getMonth()]} ${beThaiYear(cursor)}`;

  return (
    <div className="fu">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 5, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon n="calendar-plus" s={{ fontSize: 24, color: "var(--accent)" }} /> จองห้องประชุมแบบปฏิทิน
          </h1>
          <p style={{ color: "var(--text-faint)", fontSize: 14 }}>เลือกผู้เข้าร่วมการประชุม จัดตามแผนก เฝ้าระวังเวลาซ้อนแบบอัตโนมัติ</p>
        </div>
        <BtnPri onClick={() => openNew()} icon="calendar-plus" style={{ width: "auto", padding: "0 22px", height: 44, boxShadow: "0 4px 16px rgba(26,95,168,.3)" }}>
          จองห้องประชุมใหม่
        </BtnPri>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 300px" : "1fr", gap: 20, alignItems: "flex-start" }}>
        {/* Main calendar */}
        <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden", minWidth: 0 }}>
          {/* Toolbar */}
          <div className="booking-toolbar" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", flexWrap: "wrap" }}>
            <div className="booking-pagination" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Tooltip label="วันก่อนหน้า" dir="t">
                <button onClick={goPrev} className="btn-sec" style={{ width: 36, height: 36, padding: 0, background: "var(--bg)", border: "none", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon n="arrow-left" s={{ fontSize: 16, color: "var(--text-mute)" }} />
                </button>
              </Tooltip>
              <button onClick={goToday} className="btn-sec" style={{ height: 36, padding: "0 16px", background: "var(--surface)", border: "1.5px solid var(--border-2)", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "var(--text-sub)", cursor: "pointer" }}>
                วันนี้
              </button>
              <Tooltip label="วันถัดไป" dir="t">
                <button onClick={goNext} className="btn-sec" style={{ width: 36, height: 36, padding: 0, background: "var(--bg)", border: "none", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon n="arrow-left" s={{ fontSize: 16, color: "var(--text-mute)", transform: "rotate(180deg)" }} />
                </button>
              </Tooltip>
            </div>
            <h3 className="booking-title" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", flex: 1, minWidth: 120 }}>{periodLabel}</h3>
            <div className="booking-search" style={{ position: "relative", width: 200 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                <Icon n="search" s={{ fontSize: 15, color: "var(--text-ghost)" }} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อการประชุม…" style={{ ...IS, padding: "8px 10px 8px 34px", fontSize: 13, height: 36 }} />
            </div>
            <div className="booking-view-switch" style={{ display: "flex", background: "var(--bg)", borderRadius: 9, padding: 3, gap: 2 }}>
              {[["week", "รายสัปดาห์"], ["month", "รายเดือน"]].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k as any)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    background: view === k ? "var(--surface)" : "transparent",
                    color: view === k ? "var(--accent)" : "var(--text-mute)",
                    boxShadow: view === k ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                    transition: "all .15s"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {view === "week" ? (
            <WeekView cursor={cursor} bookings={visibleBookings} db={db} roomColor={roomColor} today={today} onSlotClick={(date, roomId) => openNew(date, roomId)} onBookingClick={setDetailBooking} />
          ) : (
            <MonthView cursor={cursor} bookings={visibleBookings} roomColor={roomColor} today={today} onDayClick={(date) => openNew(date)} onBookingClick={setDetailBooking} />
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MiniCalendar cursor={cursor} setCursor={setCursor} today={today} bookings={visibleBookings} />
          
          {/* Personal Filter Card */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon n="user" s={{ fontSize: 16, color: myMeetingsOnly ? "var(--accent)" : "var(--text-ghost)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>แสดงเฉพาะการประชุมของฉัน</span>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 36, height: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={myMeetingsOnly}
                onChange={(e) => setMyMeetingsOnly(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
              />
              <span style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: myMeetingsOnly ? "var(--accent)" : "var(--border-soft)",
                transition: "0.2s",
                borderRadius: 20
              }}>
                <span style={{
                  position: "absolute",
                  height: 14, width: 14,
                  left: myMeetingsOnly ? 19 : 3,
                  bottom: 3,
                  backgroundColor: "white",
                  transition: "0.2s",
                  borderRadius: "50%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                }} />
              </span>
            </label>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "18px 18px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>ตัวกรองห้องประชุม</h4>
              {roomFilter.length > 0 && (
                <button onClick={() => setRoomFilter([])} style={{ fontSize: 11.5, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  เลือกทั้งหมด
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {activeRooms.map((r) => {
                const ac = roomColor(r.id);
                const checked = roomFilter.length === 0 || roomFilter.includes(r.id);
                return (
                  <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: ac.text, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{r.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0 }}>{r.place} · ชั้น {r.floor}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setRoomFilter((prev) => {
                          const all = activeRooms.map((x) => x.id);
                          const cur = prev.length === 0 ? all : prev;
                          return cur.includes(r.id) ? cur.filter((x) => x !== r.id) : [...cur, r.id];
                        });
                      }}
                      style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  </label>
                );
              })}
              {activeRooms.length === 0 && <p style={{ fontSize: 12, color: "var(--text-ghost)" }}>ยังไม่มีห้องประชุมที่พร้อมใช้งาน</p>}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <BookingModal
          db={db}
          currentUser={currentUser}
          initial={editBooking && editBooking.id ? editBooking : null}
          presetDate={editBooking?.presetDate}
          presetRoomId={editBooking?.presetRoomId}
          onSave={doSave}
          onClose={() => {
            setShowModal(false);
            setEditBooking(null);
          }}
        />
      )}

      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          db={db}
          currentUser={currentUser}
          roomColor={roomColor}
          onEdit={() => {
            setEditBooking(detailBooking);
            setDetailBooking(null);
            setShowModal(true);
          }}
          onDelete={() => doDelete(detailBooking)}
          onClose={() => setDetailBooking(null)}
        />
      )}
    </div>
  );
};

/* ── Mini calendar ── */
interface MiniCalendarProps {
  cursor: Date;
  setCursor: React.Dispatch<React.SetStateAction<Date>>;
  today: Date;
  bookings: BookingType[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ cursor, setCursor, today, bookings }) => {
  const [miniMonth, setMiniMonth] = useState(() => startOfMonth(cursor));
  const first = startOfMonth(miniMonth);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const bookedDates = new Set(bookings.map((b) => b.date));

  return (
    <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "16px 16px 12px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{MONTH_TH[miniMonth.getMonth()]} {beThaiYear(miniMonth)}</h4>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setMiniMonth(addMonths(miniMonth, -1))} style={{ width: 24, height: 24, border: "none", background: "var(--bg)", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n="arrow-left" s={{ fontSize: 12, color: "var(--text-mute)" }} />
          </button>
          <button onClick={() => setMiniMonth(addMonths(miniMonth, 1))} style={{ width: 24, height: 24, border: "none", background: "var(--bg)", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n="arrow-left" s={{ fontSize: 12, color: "var(--text-mute)", transform: "rotate(180deg)" }} />
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DOW_TH_S.map((d) => (
          <div key={d} style={{ fontSize: 10.5, color: "var(--text-ghost)", textAlign: "center", fontWeight: 600, padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {days.map((d, i) => {
          const inMonth = d.getMonth() === miniMonth.getMonth();
          const isToday = isSameDay(d, today);
          const isSel = isSameDay(d, cursor);
          const hasBooking = bookedDates.has(ymd(d));
          return (
            <button
              key={i}
              onClick={() => setCursor(d)}
              style={{
                aspectRatio: "1",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                position: "relative",
                background: isSel ? "var(--accent)" : isToday ? "var(--accent-soft)" : "transparent",
                color: isSel ? "var(--surface)" : !inMonth ? "#D1D5DB" : isToday ? "var(--accent)" : "var(--text-sub)",
                fontWeight: isToday || isSel ? 700 : 400,
                fontSize: 12.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {d.getDate()}
              {hasBooking && !isSel && <span style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: "#2E9E5B" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Week view ── */
interface WeekViewProps {
  cursor: Date;
  bookings: BookingType[];
  db: any;
  roomColor: (id: number) => any;
  today: Date;
  onSlotClick: (date: string, roomId?: number) => void;
  onBookingClick: (b: BookingType) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ cursor, bookings, db, roomColor, today, onSlotClick, onBookingClick }) => {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const ROW_H = 52;
  const VISIBLE_H = 16 * ROW_H;
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 6 * ROW_H;
  }, []);

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <div style={{ minWidth: 760 }}>
        {/* Grid body containing both sticky headers and grid columns */}
        <div ref={bodyRef} style={{ maxHeight: VISIBLE_H, overflowY: "auto", position: "relative" }}>
          {/* Day headers (Sticky) */}
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--surface)", display: "grid", gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ background: "var(--surface)" }} />
            {days.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <div key={i} style={{ padding: "10px 6px", textAlign: "center", borderLeft: "1px solid var(--border-soft)", background: isToday ? "var(--accent-soft)" : "transparent" }}>
                  <p style={{ fontSize: 11, color: isToday ? "var(--accent)" : "var(--text-faint)", fontWeight: 600, marginBottom: 2, margin: 0 }}>{DOW_TH[d.getDay()]}</p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isToday ? "var(--accent)" : "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: isToday ? 28 : "auto",
                      height: isToday ? 28 : "auto",
                      borderRadius: "50%",
                      background: isToday ? "var(--accent)" : "transparent",
                      margin: 0,
                      ...(isToday ? { color: "#fff" } : {})
                    }}
                  >
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
            {/* Hour labels */}
            <div>
              {HOURS.map((h) => (
                <div key={h} style={{ height: ROW_H, borderBottom: "1px solid var(--border-soft)", fontSize: 11, color: "var(--text-ghost)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 2 }}>
                  {pad2(h)}:00
                </div>
              ))}
            </div>
            {/* Day columns */}
            {days.map((d, di) => {
              const dayKey = ymd(d);
              const isToday = isSameDay(d, today);
              const dayBookings = bookings.filter((b) => b.date === dayKey);
              return (
                <div key={di} style={{ position: "relative", borderLeft: "1px solid var(--border-soft)", background: isToday ? "var(--accent-soft)" : "transparent" }}>
                  {HOURS.map((h) => (
                    <div key={h} onClick={() => onSlotClick(dayKey)} style={{ height: ROW_H, borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }} className="row-hover" />
                  ))}
                  {layoutOverlaps(dayBookings).map((b) => {
                    const top = ((toMin(b.start) - HOURS[0] * 60) / 60) * ROW_H;
                    const h = Math.max(((toMin(b.end) - toMin(b.start)) / 60) * ROW_H, 30);
                    const ac = roomColor(b.roomId);
                    const room = db.rooms.find((r: Room) => r.id === b.roomId);
                    const cols = b._totalCols || 1;
                    const col = b._col || 0;
                    const GAP = 4;
                    return (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick(b);
                        }}
                        style={{
                          position: "absolute",
                          top,
                          left: `calc(${(col / cols) * 100}% + ${GAP}px)`,
                          width: `calc(${100 / cols}% - ${GAP * 2}px)`,
                          height: h,
                          background: ac.soft,
                          borderLeft: `3px solid ${ac.text}`,
                          borderRadius: 8,
                          padding: "6px 8px",
                          overflow: "hidden",
                          cursor: "pointer",
                          zIndex: 2,
                          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                          transition: "transform .12s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.02)";
                          e.currentTarget.style.zIndex = "5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.zIndex = "2";
                        }}
                      >
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: ac.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "0 0 2px" }}>{b.title}</p>
                        <p style={{ fontSize: 10.5, color: ac.text, opacity: 0.8, margin: 0 }}>
                          {b.start} - {b.end}
                        </p>
                        {h > 44 && cols < 3 && (
                          <p style={{ fontSize: 10, color: ac.text, opacity: 0.7, fontWeight: 600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "2px 0 0" }}>
                            {room?.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Month view ── */
interface MonthViewProps {
  cursor: Date;
  bookings: BookingType[];
  roomColor: (id: number) => any;
  today: Date;
  onDayClick: (date: string) => void;
  onBookingClick: (b: BookingType) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ cursor, bookings, roomColor, today, onDayClick, onBookingClick }) => {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <div style={{ minWidth: 760 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: "1px solid var(--border-soft)" }}>
          {DOW_TH.map((d, idx) => (
            <div key={d} style={{ padding: "10px 6px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--text-faint)", borderRight: idx < 6 ? "1px solid var(--border-soft)" : "none" }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {days.map((d, i) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = isSameDay(d, today);
            const dayKey = ymd(d);
            const dayBookings = bookings.filter((b) => b.date === dayKey).sort((a, b) => toMin(a.start) - toMin(b.start));
            const extra = dayBookings.length - 3;
            return (
              <div
                key={i}
                onClick={() => onDayClick(dayKey)}
                style={{
                  minHeight: 104,
                  padding: "8px 7px",
                  borderRight: (i % 7) < 6 ? "1px solid var(--border-soft)" : "none",
                  borderBottom: "1px solid var(--border-soft)",
                  background: isToday ? "var(--accent-soft)" : !inMonth ? "var(--bg)" : "var(--surface)",
                  cursor: "pointer"
                }}
                className="row-hover"
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isToday ? 700 : 500,
                    color: !inMonth ? "var(--text-ghost)" : isToday ? "var(--surface)" : "var(--text-sub)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isToday ? 22 : "auto",
                    height: isToday ? 22 : "auto",
                    borderRadius: "50%",
                    background: isToday ? "var(--accent)" : "transparent"
                  }}
                >
                  {d.getDate()}
                </span>
                <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 3 }}>
                  {dayBookings.slice(0, 3).map((b) => {
                    const ac = roomColor(b.roomId);
                    return (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick(b);
                        }}
                        style={{
                          fontSize: 10.5,
                          background: ac.soft,
                          color: ac.text,
                          borderRadius: 5,
                          padding: "2px 6px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer"
                        }}
                      >
                        {b.start} {b.title}
                      </div>
                    );
                  })}
                  {extra > 0 && <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, paddingLeft: 6, margin: 0 }}>+{extra} เพิ่มเติม</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Booking detail modal ── */
interface DetailModalProps {
  booking: BookingType;
  db: any;
  currentUser: User | null;
  roomColor: (id: number) => any;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const BookingDetailModal: React.FC<DetailModalProps> = ({ booking, db, currentUser, roomColor, onEdit, onDelete, onClose }) => {
  const room = db.rooms.find((r: Room) => r.id === booking.roomId);
  const organizer = db.users.find((u: User) => u.id === booking.organizerId);
  const participants = db.users.filter((u: User) => booking.participantIds?.includes(u.id));
  const ac = roomColor(booking.roomId);
  const d = new Date(booking.date + "T00:00:00");
  
  const canModify = currentUser?.role === "แอดมิน" || booking.organizerId === currentUser?.id;

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
        <div style={{ width: 46, height: 46, background: ac.soft, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon n="meeting" s={{ fontSize: 22, color: ac.text }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 4, margin: "0 0 4px" }}>{booking.title}</h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
            {DOW_TH[d.getDay()]}ที่ {d.getDate()} {MONTH_TH[d.getMonth()]} {beThaiYear(d)} · {booking.start} - {booking.end} น.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <DetailRow icon="door" label="ห้องประชุม" value={`${room?.name || "-"} · ${room?.place || ""} ชั้น ${room?.floor || ""}`} />
        <DetailRow icon="user" label="ผู้จอง" value={organizer ? `${organizer.prefix}${organizer.firstName} ${organizer.lastName}` : "-"} />
        {booking.note && <DetailRow icon="file-text" label="รายละเอียด" value={booking.note} />}
      </div>

      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, margin: "0 0 10px" }}>
          ผู้เข้าร่วมประชุม ({participants.length} คน)
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {participants.map((u: User) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg)", borderRadius: 20, padding: "5px 12px 5px 5px" }}>
              <Avatar user={u} size={24} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-sub)" }}>{u.firstName}</span>
            </div>
          ))}
          {participants.length === 0 && <p style={{ fontSize: 12.5, color: "var(--text-ghost)", margin: 0 }}>ไม่มีผู้เข้าร่วมเพิ่มเติม</p>}
        </div>
      </div>

      {booking.agendaId ? (
        <AlertBox type="info" msg="การจองนี้ลิงก์กับ Agenda การแก้ไขต้องทำผ่านเมนู Agenda บันทึกการประชุม" style={{ marginBottom: 20 }} />
      ) : canModify ? (
        <div style={{ display: "flex", gap: 10 }}>
          <BtnSec onClick={onDelete} icon="x" style={{ flex: 1, justifyContent: "center", color: "#B42318", borderColor: "#FECACA", background: "#FFF7F7" }}>
            ยกเลิกการจอง
          </BtnSec>
          <BtnPri onClick={onEdit} icon="save" style={{ flex: 1 }}>
            แก้ไขการจอง
          </BtnPri>
        </div>
      ) : (
        <AlertBox type="info" msg="เฉพาะผู้จองหรือแอดมินเท่านั้นที่สามารถแก้ไขการจองนี้ได้" style={{ marginBottom: 20 }} />
      )}
    </Modal>
  );
};

const DetailRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{ width: 30, height: 30, background: "var(--bg)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon n={icon} s={{ fontSize: 14, color: "var(--text-mute)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2, margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 13.5, color: "var(--text-sub)", fontWeight: 500, lineHeight: 1.5, wordBreak: "break-word", margin: 0 }}>{value}</p>
      </div>
    </div>
  );
};

/* ── Booking creation modal ── */
interface BookingModalProps {
  db: any;
  currentUser: User | null;
  initial?: BookingType | null;
  presetDate?: string;
  presetRoomId?: number;
  onSave: (data: Omit<BookingType, "id">, originalId?: number) => void;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ db, currentUser, initial, presetDate, presetRoomId, onSave, onClose }) => {
  const isEdit = !!initial;
  const activeRooms = db.rooms.filter((r: Room) => r.status === "active");
  const [form, setForm] = useState({
    title: initial?.title || "",
    roomId: initial?.roomId || presetRoomId || "",
    date: initial?.date || presetDate || ymd(new Date()),
    start: initial?.start || "",
    end: initial?.end || "",
    note: initial?.note || ""
  });
  const [participantIds, setParticipantIds] = useState<number[]>(
    initial?.participantIds?.length ? initial.participantIds : currentUser ? [currentUser.id] : []
  );
  const [pSearch, setPSearch] = useState("");
  const [openDepts, setOpenDepts] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const usersByDept = useMemo(() => {
    const map: Record<string, User[]> = {};
    DEPARTMENTS.forEach((d) => (map[d] = []));
    db.users.forEach((u: User) => {
      if (!map[u.department]) map[u.department] = [];
      map[u.department].push(u);
    });
    return map;
  }, [db.users]);

  const matchesSearch = (u: User) =>
    !pSearch ||
    `${u.firstName}${u.lastName}`.includes(pSearch) ||
    u.empId.includes(pSearch) ||
    u.email.toLowerCase().includes(pSearch.toLowerCase());

  const toggleDept = (dept: string) =>
    setOpenDepts((prev) => {
      const n = new Set(prev);
      if (n.has(dept)) n.delete(dept);
      else n.add(dept);
      return n;
    });

  const toggleUser = (id: number) =>
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedUsers = db.users.filter((u: User) => participantIds.includes(u.id));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "กรุณากรอกหัวข้อการประชุม";
    if (!form.roomId) e.room = "กรุณาเลือกห้องประชุม";
    if (!form.date) e.date = "กรุณาเลือกวันที่";
    if (!form.start || !form.end) e.time = "กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด";
    else if (toMin(form.end) <= toMin(form.start)) e.time = "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";

    if (form.roomId && form.date && form.start && form.end && toMin(form.end) > toMin(form.start)) {
      const conflict = findConflict(
        db.bookings,
        { roomId: Number(form.roomId), date: form.date, start: form.start, end: form.end },
        initial?.id
      );
      if (conflict) {
        e.time = `ห้องนี้ถูกจองแล้วในช่วงเวลา ${conflict.start}-${conflict.end} น. ("${conflict.title}") กรุณาเลือกเวลาอื่น`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSubmit = () => {
    if (!validate() || !currentUser) return;
    onSave(
      {
        title: form.title.trim(),
        roomId: Number(form.roomId),
        date: form.date,
        start: form.start,
        end: form.end,
        note: form.note.trim(),
        organizerId: initial?.organizerId || currentUser.id,
        participantIds
      },
      initial?.id
    );
  };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
        <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon n="calendar-plus" s={{ fontSize: 22, color: "var(--accent)" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 2, margin: "0 0 2px" }}>{isEdit ? "แก้ไขการจองห้องประชุม" : "จองห้องประชุมองค์กร"}</h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>เลือกวันเวลาและเพิ่มผู้เข้าร่วมให้ครบเพื่อยืนยันการจอง</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: fields */}
        <div>
          <FL label="หัวข้อการประชุม *" error={errors.title}>
            <input style={IS} placeholder="เช่น สรุปป้ายขายไตรมาส 2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FL>
          <FL label="เลือกห้องประชุม *" error={errors.room}>
            <RoomField rooms={activeRooms} value={form.roomId} onChange={(id) => setForm({ ...form, roomId: id })} />
          </FL>
          <FL label="วันที่จอง *" error={errors.date}>
            <DateField value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
          </FL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FL label="เวลาเริ่มต้น *">
              <TimeField
                value={form.start}
                onChange={(t) => setForm((prev) => ({
                  ...prev,
                  start: t,
                  end: prev.end && prev.end <= t ? "" : prev.end
                }))}
              />
            </FL>
            <FL label="เวลาสิ้นสุด *">
              <TimeField
                value={form.end}
                minTime={form.start}
                onChange={(t) => setForm((prev) => ({ ...prev, end: t }))}
              />
            </FL>
          </div>
          {errors.time && <AlertBox type="error" msg={errors.time} style={{ marginBottom: 16, marginTop: -4 }} />}
          <FL label="รายละเอียดเพิ่มเติม">
            <textarea
              style={{ ...IS, minHeight: 78, resize: "vertical", fontFamily: "inherit" }}
              placeholder="เช่น ลิงก์ห้องประชุมออนไลน์ หรือเรื่องที่จะหารือ…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </FL>
        </div>

        {/* Right: participant picker */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={LS}>รายชื่อผู้เข้าร่วมการประชุม ({participantIds.length} คน)</label>
            {participantIds.length > 0 && (
              <button onClick={() => setParticipantIds([])} style={{ fontSize: 11.5, color: "#B42318", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              <Icon n="search" s={{ fontSize: 15, color: "var(--text-ghost)" }} />
            </span>
            <input value={pSearch} onChange={(e) => setPSearch(e.target.value)} placeholder="ค้นหาพนักงานด้วย ชื่อ-นามสกุล หรือ รหัสพนักงาน…" style={{ ...IS, padding: "9px 10px 9px 34px", fontSize: 13 }} />
          </div>

          {selectedUsers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {selectedUsers.map((u: User) => (
                <span
                  key={u.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--accent-soft)",
                    color: "var(--accent-dark)",
                    borderRadius: 20,
                    padding: "4px 6px 4px 10px",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {u.firstName}
                  <button
                    onClick={() => toggleUser(u.id)}
                    style={{
                      background: "var(--surface)",
                      border: "none",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <Icon n="x" s={{ fontSize: 10, color: "var(--accent-dark)" }} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", maxHeight: 330, overflowY: "auto" }}>
            {DEPARTMENTS.map((dept) => {
              const members = (usersByDept[dept] || []).filter(matchesSearch);
              if (pSearch && members.length === 0) return null;
              const selCount = members.filter((u) => participantIds.includes(u.id)).length;
              const isOpen = openDepts.has(dept) || !!pSearch;
              return (
                <div key={dept} style={{ borderBottom: "1px solid var(--bg)" }}>
                  <button
                    type="button"
                    onClick={() => toggleDept(dept)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      background: "var(--surface-2)",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: selCount > 0 ? "var(--accent)" : "#D1D5DB", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--text-sub)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dept}</span>
                    <span style={{ fontSize: 11, color: selCount > 0 ? "var(--accent)" : "var(--text-faint)", fontWeight: 600, background: selCount > 0 ? "var(--accent-soft)" : "var(--border-soft)", padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>
                      {selCount} คน
                    </span>
                    <Icon n={isOpen ? "chevron-up" : "chevron-down"} s={{ fontSize: 13, color: "var(--text-ghost)", flexShrink: 0 }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "4px 6px 6px" }}>
                      {members.length === 0 && <p style={{ fontSize: 12, color: "var(--text-ghost)", padding: "6px 10px", margin: 0 }}>ไม่มีพนักงานในแผนกนี้</p>}
                      {members.map((u) => {
                        const checked = participantIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "7px 10px",
                              borderRadius: 8,
                              cursor: "pointer",
                              background: checked ? "var(--accent-soft)" : "transparent"
                            }}
                          >
                            <input type="checkbox" checked={checked} readOnly style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                            <Avatar user={u} size={26} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                                {u.prefix}
                                {u.firstName} {u.lastName}
                              </p>
                              <p style={{ fontSize: 10.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                                {u.empId} · {u.email}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 20, marginTop: 20, borderTop: "1px solid var(--border-soft)" }}>
        <BtnSec onClick={onClose} icon="x">
          ยกเลิก
        </BtnSec>
        <BtnPri onClick={doSubmit} icon={isEdit ? "save" : "check"} style={{ width: "auto", padding: "0 28px" }}>
          {isEdit ? "บันทึกการแก้ไข" : `ยืนยันและส่งคำเชิญ (${participantIds.length} คน)`}
        </BtnPri>
      </div>
    </Modal>
  );
};

export default Booking;
