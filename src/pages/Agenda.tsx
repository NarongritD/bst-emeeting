/**
 * ==========================================
 * ไฟล์: Agenda.tsx
 * หน้าที่หลัก: ระบบบันทึกวาระและกำหนดการประชุม (Meeting Agenda Management)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ตารางรายชื่อวาระการประชุม (Agenda Table): ค้นหา แยกประเภทสถานะการประชุม อัปเดตสถานะและเปิดดูรายละเอียด
 * 2. แบบฟอร์มกรอกข้อมูลการประชุม (Agenda Detail/Edit Form): กรอกข้อมูลวันนัดหมาย เลือกห้องประชุมผู้ถูกจองอัตโนมัติ จัดการรายชื่อสมาชิกและกรรมการภายนอก
 * 3. วาระหัวข้อย่อยการประชุม (Agenda AgendaItems): เพิ่มหัวข้อย่อยและกำหนดเวลาเป้าหมายในการพูดคุยในแต่ละหัวข้อ
 * 4. ระบบดาวน์โหลด PDF (PDF Document Generator): สังเคราะห์เทมเพลต HTML ส่งผ่าน iframe เพื่อสั่งพิมพ์หรือดาวน์โหลดเอกสาร Agenda เป็น PDF ทันที
 * ==========================================
 */
import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import Icon from "../components/common/Icon";
import { AlertBox } from "../components/common/AlertBox";
import { BtnPri, BtnSec } from "../components/common/Buttons";
import { Avatar } from "../components/common/Avatar";
import Tooltip from "../components/common/Tooltip";
import { PageHeader, CardHead } from "./Dashboard";
import {
  FL,
  PillToggle,
  ParentAgendaField,
  DateField,
  TimeField,
  RoomField,
  Select
} from "../components/common/FormFields";
import {
  toMin,
  timeRangesOverlap,
  findConflict,
  DEPARTMENTS,
  formatDateBE,
  formatLongDateBE
} from "../utils/helpers";
import type { User, Agenda as AgendaType, Room, Booking, AgendaItem } from "../utils/types";


/* ── helper generators ── */
export function genAgendaCode(db: any): string {
  const yr = new Date().getFullYear();
  const n = db.nextAgendaId || ((db.agendas || []).length + 1);
  return `AGD-${yr}-${String(n).padStart(4, "0")}`;
}

export function canSeeAgenda(agenda: AgendaType, currentUser: User | null): boolean {
  if (!currentUser) return false;
  if (currentUser.role === "แอดมิน") return true;
  return agenda.organizerId === currentUser.id || (agenda.participantIds || []).includes(currentUser.id);
}

export function canEditAgenda(agenda: AgendaType, currentUser: User | null): boolean {
  if (!currentUser) return false;
  return currentUser.role === "แอดมิน" || agenda.organizerId === currentUser.id;
}

export function isInvolvedInAgenda(agenda: AgendaType, currentUser: User | null): boolean {
  if (!currentUser) return false;
  return agenda.organizerId === currentUser.id || (agenda.participantIds || []).includes(currentUser.id);
}

export function findRoomConflict(db: any, { roomId, date, start, end }: { roomId: number | null; date: string; start: string; end: string }, excludeAgendaId?: number | null) {
  if (!roomId || !date || !start || !end) return null;

  const bookingsToCheck = excludeAgendaId
    ? (db.bookings || []).filter((b: any) => b.agendaId !== excludeAgendaId)
    : (db.bookings || []);

  const bConflict = findConflict(bookingsToCheck, { roomId, date, start, end }, null);
  if (bConflict) {
    return { source: "booking", title: bConflict.title, start: bConflict.start, end: bConflict.end };
  }

  const aConflict = (db.agendas || []).find((a: AgendaType) =>
    a.id !== excludeAgendaId &&
    a.locationMode === "place" &&
    a.roomId === roomId &&
    a.date === date &&
    a.status !== "cancelled" &&
    timeRangesOverlap(a.start, a.end, start, end)
  );

  if (aConflict) {
    return { source: "agenda", title: aConflict.title, start: aConflict.start, end: aConflict.end, code: aConflict.code };
  }

  return null;
}

export const AGENDA_STATUS_META: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  upcoming:       { label: "รอการประชุม", bg: "#E6F1FB", color: "#0C447C", icon: "clock" },
  ongoing:        { label: "อยู่ระหว่างการประชุม", bg: "#FFF7ED", color: "#C2410C", icon: "loader" },
  done:           { label: "การประชุมเสร็จสิ้น", bg: "#E7F6EC", color: "#1A7F37", icon: "check-circle" },
  done_continued: { label: "การประชุมเสร็จสิ้น (ต่อเนื่อง)", bg: "#EAF3DE", color: "#2D5A0E", icon: "link" },
  cancelled:      { label: "ยกเลิกการประชุม", bg: "#FEE4E2", color: "#B42318", icon: "x-circle" }
};

export function getAgendaStatus(agenda: AgendaType, db: any): string {
  if (agenda.status === "cancelled") return "cancelled";
  const hasContinuation = (db.agendas || []).some((a: AgendaType) => a.parentAgendaId === agenda.id);

  const now = new Date();
  const startDt = new Date(`${agenda.date}T${agenda.start || "00:00"}:00`);
  const endDt = new Date(`${agenda.date}T${agenda.end || "23:59"}:00`);

  let base = "upcoming";
  if (now > endDt) base = "done";
  else if (now >= startDt && now <= endDt) base = "ongoing";

  if (base === "done" && hasContinuation) return "done_continued";
  return base;
}

export function agendaLocationLabel(a: AgendaType, db: any): string {
  if (a.locationMode === "offsite") return a.offsiteLocation || "นอกสถานที่";
  const room = (db.rooms || []).find((r: Room) => r.id === a.roomId);
  return room ? `${room.name} (${a.place})` : a.place || "—";
}

// ฟังก์ชันโหลดไลบรารีสร้าง PDF แบบไดนามิกผ่าน CDN เพื่อประหยัดพื้นที่ Bundle
function loadHtml2Pdf(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).html2pdf) {
      resolve((window as any).html2pdf);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => resolve((window as any).html2pdf);
    script.onerror = () => {
      alert("ไม่สามารถโหลดไลบรารีสร้าง PDF ได้สำเร็จ กรุณาลองใหม่อีกครั้ง");
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

function htmlEscape(v: string | null | undefined): string {
  return String(v ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch] || ch));
}

export function exportAgendaPdf({ agenda, organizer, participants, room, statusMeta }: {
  agenda: AgendaType;
  organizer: User | undefined;
  participants: User[];
  room: Room | null;
  statusMeta: { label: string; bg: string; color: string };
}): boolean {
  const safeFile = (agenda.code || "agenda").replace(/[^\w-]+/g, "-");
  const location = agenda.locationMode === "offsite" ? agenda.offsiteLocation : `${room?.name || "-"} (${agenda.place || "-"})`;
  
  const agendaRows = (agenda.items || []).map((it, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td>${htmlEscape(it.detail || "-")}</td>
    </tr>`).join("") || `<tr><td colspan="2" class="empty">ไม่มีวาระการประชุม</td></tr>`;
  
  const participantRows = participants.map((u, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td>${htmlEscape(`${u.prefix || ""}${u.firstName || ""} ${u.lastName || ""}`)}</td>
      <td>${htmlEscape(u.department || "-")}</td>
    </tr>`).join("") || `<tr><td colspan="3" class="empty">ไม่มีผู้เข้าร่วม</td></tr>`;

  const external = agenda.hasExternal && agenda.externalParticipants
    ? `<div class="section-box"><h2>ผู้เข้าร่วมภายนอก</h2><p class="pre">${htmlEscape(agenda.externalParticipants)}</p></div>`
    : "";

  // สังเคราะห์เอกสารและดาวน์โหลดเป็น PDF ผ่าน html2pdf.js
  loadHtml2Pdf().then((html2pdf) => {
    if (!html2pdf) return;
    const element = document.createElement("div");
    element.innerHTML = `
      <style>
        .doc{max-width:740px; font-family:'Sarabun','Tahoma','Arial',sans-serif; color:#111827; line-height:1.55; font-size:13px; margin:0 auto; padding:20px; background:#fff;}
        .brand{display:flex;align-items:center;gap:12px;border-bottom:3px solid #1A5FA8;padding-bottom:16px;margin-bottom:18px}
        .logo{width:42px;height:42px;border-radius:12px;background:#1A5FA8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
        .brand h1{font-size:22px;margin:0;color:#0F172A}
        .brand p{margin:2px 0 0;color:#64748B;font-size:11.5px}
        .title{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}
        .title h2{font-size:20px;margin:0 0 6px;color:#0F172A}
        .meta{color:#64748B;font-size:12px}
        .badge{display:inline-block;border-radius:999px;background:${statusMeta.bg};color:${statusMeta.color};padding:6px 12px;font-weight:700;white-space:nowrap}
        .section-box{border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px;margin-bottom:14px;break-inside:avoid}
        .section-box h2{font-size:15px;margin:0 0 12px;color:#0F172A;border-bottom:1.5px solid #F1F5F9;padding-bottom:6px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px}
        .field label{display:block;font-size:11px;color:#64748B;font-weight:700;margin-bottom:3px}
        .field div{font-weight:600;color:#111827}
        .pre{white-space:pre-wrap;margin:0;color:#334155}
        table{width:100%;border-collapse:collapse}
        th{background:#F1F5F9;color:#334155;text-align:left;font-size:12px;padding:9px 10px;border-bottom:1px solid #E2E8F0}
        td{padding:9px 10px;border-bottom:1px solid #EEF2F7;vertical-align:top}
        .num{width:42px;text-align:center;color:#1A5FA8;font-weight:700}
        .empty{text-align:center;color:#94A3B8;padding:18px}
        .footer{margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:18px;color:#64748B;font-size:12px}
        .sign{border-top:1px solid #CBD5E1;padding-top:8px;margin-top:42px;text-align:center}
      </style>
      <div class="doc">
        <div class="brand">
          <div class="logo" style="width:42px;height:42px;border-radius:12px;background:#1A5FA8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin-right:12px;">BST</div>
          <div><h1>บันทึกการประชุม (Agenda)</h1><p>BST e-Meeting Meeting Record</p></div>
        </div>
        <div class="title">
          <div>
            <h2>${htmlEscape(agenda.title)}</h2>
            <div class="meta">รหัส ${htmlEscape(agenda.code)} • สร้างโดย ${htmlEscape(`${organizer?.prefix || ""}${organizer?.firstName || ""} ${organizer?.lastName || ""}`)}</div>
          </div>
          <span class="badge">${htmlEscape(statusMeta.label)}</span>
        </div>
        <div class="section-box">
          <h2>ข้อมูลการประชุม</h2>
          <div class="grid">
            <div class="field"><label>วันที่</label><div>${htmlEscape(formatLongDateBE(agenda.date) || "-")}</div></div>
            <div class="field"><label>เวลา</label><div>${htmlEscape(`${agenda.start || "-"} - ${agenda.end || "-"} น.`)}</div></div>
            <div class="field"><label>สถานที่</label><div>${htmlEscape(location || "-")}</div></div>
            <div class="field"><label>ลิงก์ออนไลน์</label><div>${htmlEscape(agenda.hasOnlineLink ? agenda.onlineLink : "ไม่มี")}</div></div>
          </div>
          <div class="field" style="margin-top:14px"><label>วัตถุประสงค์การประชุม</label><div>${htmlEscape(agenda.objective || "-")}</div></div>
        </div>
        <div class="section-box"><h2>วาระการประชุม</h2><table><tbody>${agendaRows}</tbody></table></div>
        ${agenda.details ? `<div class="section-box"><h2>รายละเอียดเพิ่มเติม</h2><p class="pre">${htmlEscape(agenda.details)}</p></div>` : ""}
        <div class="section-box">
          <h2>ผู้เข้าร่วม (${participants.length})</h2>
          <table>
            <thead><tr><th style="width:42px">#</th><th>ชื่อ-นามสกุล</th><th>แผนก</th></tr></thead>
            <tbody>${participantRows}</tbody>
          </table>
        </div>
        ${external}
        <div class="footer"><div class="sign" style="border-top:1px solid #CBD5E1;padding-top:8px;margin-top:42px;text-align:center;">ผู้บันทึกการประชุม</div><div class="sign" style="border-top:1px solid #CBD5E1;padding-top:8px;margin-top:42px;text-align:center;">ผู้ตรวจสอบ / อนุมัติ</div></div>
      </div>
    `;
    
    const opt = {
      margin:       12,
      filename:     `${safeFile}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };
    
    // แปลงผลลัพธ์เป็นข้อมูล Blob เพื่อบังคับการดาวน์โหลดไฟล์พร้อมนามสกุล .pdf
    html2pdf().set(opt).from(element).output('blob').then((rawBlob: any) => {
      const blob = new Blob([rawBlob], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFile}.pdf`;
      // กำหนดเมตาดาต้าพิเศษสำหรับเบราว์เซอร์ตระกูล Chromium เพื่อบังคับชื่อและประเภทไฟล์ที่ถูกต้อง
      a.dataset.downloadurl = `application/pdf:${safeFile}.pdf:${url}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 250);
    }).catch((err: any) => {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
    });
  });
  return true;
}

export const SummaryRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, background: "var(--accent-soft)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon n={icon} s={{ fontSize: 14, color: "var(--accent)" }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 1, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{value}</p>
      </div>
    </div>
  );
};

export const DetailField: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => {
  return (
    <div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5, margin: "0 0 4px" }}>
        <Icon n={icon} s={{ fontSize: 12, color: "var(--text-faint)" }} />
        {label}
      </p>
      <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)", margin: 0, wordBreak: "break-word" }}>{value}</p>
    </div>
  );
};

// คอมโพเนนต์หลักควบคุมระบบจัดการวาระประชุม (Agenda Dashboard)
export const Agenda: React.FC = () => {
  // เชื่อมโยงตัวแปรฐานข้อมูลจำลองส่วนกลาง สิทธิ์บัญชีผู้ใช้ปัจจุบัน และฟังก์ชันช่วยเหลือจาก Context
  const { db, updateDB, currentUser, showToast, askConfirm, closeConfirm, deepLinkAgendaId, navigateMenu } = useApp();
  
  // ตรวจเช็คว่ามีการส่งลิงก์เรียกดูวาระประชุมแบบตรงมาหรือไม่ (Deep link)
  const deepLinked = deepLinkAgendaId ? (db.agendas || []).find((a) => a.id === deepLinkAgendaId) : null;
  // สเตทมุมมองหน้าจอหลัก (ตารางรายการ list / ฟอร์มสร้าง-แก้ไข form / รายละเอียดปลีกย่อย detail)
  const [view, setView] = useState<"list" | "form" | "detail">(deepLinked ? "detail" : "list");
  // วัตถุข้อมูลวาระการประชุมปัจจุบันที่กำลังทำรายการ
  const [selected, setSelected] = useState<AgendaType | null>(deepLinked || null);
  // คำค้นหาวาระการประชุม
  const [search, setSearch] = useState("");
  // กรองตามประเภทการประชุม (ทั้งหมด / ประชุมใหม่ / ประชุมต่อเนื่อง)
  const [typeFilter, setTypeFilter] = useState("all");
  // กรองตามสถานะดำเนินการ (ทั้งหมด / ร่าง / นัดหมายแล้ว / ประชุมเสร็จ)
  const [statusFilter, setStatusFilter] = useState("all");
  // กรองแสดงผลเฉพาะงานที่เกี่ยวข้องกับฉัน
  const [onlyMine, setOnlyMine] = useState(false);

  // ตรวจสอบระดับแอดมินสำหรับสิทธิ์การข้ามด่านแก้ไขข้อมูล
  const isAdmin = currentUser?.role === "แอดมิน";

  // เปิดแบบฟอร์มเปล่าเพื่อจองและร่างระเบียบวาระการประชุมใหม่
  const openCreate = () => {
    setSelected(null);
    setView("form");
  };
  
  // สลับเข้าสู่โหมดกรอกฟอร์มแก้ไขข้อมูลวาระประชุมเดิม
  const openEdit = (a: AgendaType) => {
    setSelected(a);
    setView("form");
  };

  // สลับหน้าจอเปิดอ่านเนื้อหารายละเอียดของวาระประชุมแบบเจาะลึก
  const openView = (a: AgendaType) => {
    setSelected(a);
    setView("detail");
  };

  // ย้อนกลับไปยังตารางรายชื่อวาระการประชุม
  const backToList = () => {
    setSelected(null);
    setView("list");
  };

  // ฟังก์ชันส่วนกลางดำเนินการบันทึกเขียนข้อมูลวาระการประชุมลงในหน่วยความจำเครื่อง
  const saveAgenda = (data: Omit<AgendaType, "id" | "code" | "organizerId" | "createdAt" | "updatedAt" | "status">) => {
    if (!currentUser) return;

    if (selected) {
      /* ── อัปเดตข้อมูลรายละเอียด Agenda และผูกอัปเดตข้อมูลกับประวัติปฏิทินจอง ── */
      const updatedAgenda: AgendaType = {
        ...selected,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      let newBookings = db.bookings;
      const linkedBooking = (db.bookings || []).find((b) => b.agendaId === selected.id);
      
      if (data.locationMode === "place" && data.roomId) {
        if (linkedBooking) {
          newBookings = newBookings.map((b) =>
            b.agendaId === selected.id
              ? {
                  ...b,
                  title: data.title,
                  roomId: Number(data.roomId),
                  date: data.date,
                  start: data.start,
                  end: data.end,
                  participantIds: data.participantIds || [],
                  note: data.objective || ""
                }
              : b
          );
        } else {
          const bId = db.nextBookingId || Date.now();
          newBookings = [
            ...newBookings,
            {
              id: bId,
              agendaId: selected.id,
              title: data.title,
              roomId: Number(data.roomId),
              date: data.date,
              start: data.start,
              end: data.end,
              organizerId: currentUser.id,
              participantIds: data.participantIds || [],
              note: data.objective || ""
            }
          ];
        }
      } else if (linkedBooking) {
        newBookings = newBookings.filter((b) => b.agendaId !== selected.id);
      }

      // ยิงแจ้งเตือนผู้เข้าร่วมประชุมทุกคน
      const newNotifs: any[] = [];
      if (data.participantIds && data.participantIds.length > 0) {
        data.participantIds.forEach((pId: number) => {
          if (pId !== currentUser.id) {
            newNotifs.push({
              id: Math.random().toString(36).substring(2, 9),
              userId: pId,
              title: "✏️ อัปเดตกำหนดการประชุม",
              message: `มีการแก้ไขรายละเอียดการประชุม "${data.title}" วันที่ ${formatDateBE(data.date)} เวลา ${data.start}-${data.end} น.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              linkMenu: "agenda",
              linkId: selected.id
            });
          }
        });
      }

      updateDB({
        ...db,
        agendas: (db.agendas || []).map((a) => (a.id === selected.id ? updatedAgenda : a)),
        bookings: newBookings,
        nextBookingId: db.nextBookingId + (linkedBooking ? 0 : 1),
        notifications: [...newNotifs, ...(db.notifications || [])]
      });

      showToast("บันทึกการแก้ไข Agenda สำเร็จ");
      setSelected(updatedAgenda);
      setView("detail");
    } else {
      /* Create new Agenda & companion Booking */
      const id = db.nextAgendaId || Date.now();
      const code = genAgendaCode(db);
      const newAgenda: AgendaType = {
        id,
        code,
        ...data,
        organizerId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let newBookings = db.bookings;
      let nextBookingId = db.nextBookingId;
      
      if (data.locationMode === "place" && data.roomId) {
        const bId = nextBookingId || Date.now();
        newBookings = [
          ...newBookings,
          {
            id: bId,
            agendaId: id,
            title: data.title,
            roomId: Number(data.roomId),
            date: data.date,
            start: data.start,
            end: data.end,
            organizerId: currentUser.id,
            participantIds: data.participantIds || [],
            note: data.objective || ""
          }
        ];
        nextBookingId = bId + 1;
      }

      // ยิงแจ้งเตือนผู้เข้าร่วมประชุมทุกคน
      const newNotifs: any[] = [];
      if (data.participantIds && data.participantIds.length > 0) {
        data.participantIds.forEach((pId: number) => {
          if (pId !== currentUser.id) {
            newNotifs.push({
              id: Math.random().toString(36).substring(2, 9),
              userId: pId,
              title: "📅 คำเชิญเข้าร่วมประชุมใหม่",
              message: `คุณได้รับคำเชิญเข้าร่วมการประชุม "${data.title}" วันที่ ${formatDateBE(data.date)} เวลา ${data.start}-${data.end} น.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              linkMenu: "agenda",
              linkId: id
            });
          }
        });
      }

      updateDB({
        ...db,
        agendas: [...(db.agendas || []), newAgenda],
        nextAgendaId: id + 1,
        bookings: newBookings,
        nextBookingId,
        notifications: [...newNotifs, ...(db.notifications || [])]
      });
      
      showToast(
        "สร้าง Agenda สำเร็จ" +
          (data.locationMode === "place" && data.roomId ? " — บันทึกการจองห้องอัตโนมัติแล้ว" : "")
      );
      setSelected(newAgenda);
      setView("detail");
    }
  };

  if (view === "form") {
    return (
      <AgendaForm
        db={db}
        currentUser={currentUser}
        initial={selected}
        onSave={saveAgenda}
        onCancel={selected ? () => setView("detail") : backToList}
        askConfirm={askConfirm}
        closeConfirm={closeConfirm}
      />
    );
  }

  if (view === "detail" && selected) {
    const fresh = (db.agendas || []).find((a) => a.id === selected.id) || selected;
    return (
      <AgendaDetail
        db={db}
        agenda={fresh}
        currentUser={currentUser}
        onBack={backToList}
        onEdit={() => setView("form")}
        updateDB={updateDB}
        showToast={showToast}
        askConfirm={askConfirm}
        closeConfirm={closeConfirm}
        onOpenMom={(id) => navigateMenu("mom", id)}
      />
    );
  }

  const visible = (db.agendas || [])
    .filter((a) => canSeeAgenda(a, currentUser))
    .filter((a) => !onlyMine || isInvolvedInAgenda(a, currentUser))
    .filter((a) => typeFilter === "all" || a.meetingType === typeFilter)
    .filter((a) => statusFilter === "all" || getAgendaStatus(a, db) === statusFilter)
    .filter((a) => !search || a.title.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));

  return (
    <div className="fu">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 16, flexWrap: "wrap" }}>
        <PageHeader title="บันทึกการประชุม" subtitle="สร้างและจัดการวาระการประชุม (Agenda) ทั้งหมด" />
        <BtnPri onClick={openCreate} icon="plus" style={{ width: "auto", padding: "0 22px", height: 44, flexShrink: 0 }}>
          สร้าง Agenda
        </BtnPri>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
            <Icon n="search" s={{ fontSize: 17, color: "var(--text-ghost)" }} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยรหัส Agenda หรือชื่อการประชุม…"
            style={{ ...IS_STYLE, paddingLeft: 42 }}
          />
        </div>
        <Select
          options={[
            { value: "all", label: "ทุกประเภท" },
            { value: "new", label: "การประชุมใหม่" },
            { value: "continued", label: "การประชุมต่อเนื่อง" }
          ]}
          value={typeFilter}
          onChange={(val) => setTypeFilter(val)}
          style={{ width: "auto", minWidth: 170 }}
        />
        <Select
          options={[
            { value: "all", label: "ทุกสถานะ" },
            ...Object.entries(AGENDA_STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))
          ]}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          style={{ width: "auto", minWidth: 180 }}
        />
        {isAdmin && (
          <button
            onClick={() => setOnlyMine((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              border: `1.5px solid ${onlyMine ? "var(--accent)" : "var(--border-2)"}`,
              borderRadius: 10,
              background: onlyMine ? "var(--accent-soft)" : "var(--surface)",
              color: onlyMine ? "var(--accent)" : "var(--text-mute)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            <Icon n="user-check" s={{ fontSize: 15, color: onlyMine ? "var(--accent)" : "var(--text-mute)" }} />
            เฉพาะที่ฉันเกี่ยวข้อง
          </button>
        )}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["จัดการ", "รหัส Agenda", "ชื่อการประชุม", "ประเภท", "สถานะ", "วันที่ / เวลา", "สถานที่", "ผู้สร้าง", "ผู้เข้าร่วม", "วาระ"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "11px 16px",
                      textAlign: "left",
                      color: "var(--text-mute)",
                      fontWeight: 600,
                      fontSize: 12,
                      borderBottom: "1px solid var(--border-soft)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const organizer = db.users.find((u) => u.id === a.organizerId);
                const involved = isInvolvedInAgenda(a, currentUser);
                const canEdit = canEditAgenda(a, currentUser);
                return (
                  <tr key={a.id} className="row-hover" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Tooltip label="ดูรายละเอียด" dir="t">
                          <button onClick={() => openView(a)} style={{ width: 32, height: 32, background: "var(--accent-soft)", border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Icon n="eye" s={{ fontSize: 15, color: "var(--accent)" }} />
                          </button>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip label="แก้ไข" dir="t">
                            <button onClick={() => openEdit(a)} style={{ width: 32, height: 32, background: "var(--surface-2)", border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Icon n="edit" s={{ fontSize: 15, color: "var(--text-mute)" }} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--text-sub)" }}>{a.code}</span>
                    </td>
                    <td style={TD}>
                      <p style={{ fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{a.title}</p>
                      {isAdmin && involved && (
                        <span style={{ fontSize: 10.5, color: "var(--accent)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          <Icon n="user-check" s={{ fontSize: 11, color: "var(--accent)" }} />คุณเกี่ยวข้อง
                        </span>
                      )}
                    </td>
                    <td style={TD}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: a.meetingType === "continued" ? "#FFF7ED" : "var(--accent-soft)",
                          color: a.meetingType === "continued" ? "#C2410C" : "var(--accent)"
                        }}
                      >
                        {a.meetingType === "continued" ? "ต่อเนื่อง" : "ใหม่"}
                      </span>
                    </td>
                    <td style={TD}>
                      {(() => {
                        const st = AGENDA_STATUS_META[getAgendaStatus(a, db)] || AGENDA_STATUS_META.upcoming;
                        return (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: st.bg,
                              color: st.color,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <Icon n={st.icon} s={{ fontSize: 11, color: st.color }} />
                            {st.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={TD}>
                      <p style={{ fontSize: 13, color: "var(--text-sub)", margin: 0 }}>{formatDateBE(a.date)}</p>
                      <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: 0 }}>
                        {a.start}-{a.end} น.
                      </p>
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{agendaLocationLabel(a, db)}</span>
                    </td>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar user={organizer} size={26} />
                        <span style={{ fontSize: 12.5, color: "var(--text-sub)", whiteSpace: "nowrap" }}>{organizer?.firstName || "—"}</span>
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{(a.participantIds || []).length} คน</span>
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{(a.items || []).length} วาระ</span>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "var(--text-ghost)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <Icon n="clipboard" s={{ fontSize: 36, color: "var(--text-ghost)" }} /> ยังไม่มี Agenda ที่ตรงกับเงื่อนไข
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 20px", fontSize: 12, color: "var(--text-faint)", borderTop: "1px solid var(--border-soft)", background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon n="clipboard" s={{ fontSize: 14, color: "var(--text-faint)" }} /> ทั้งหมด {visible.length} รายการ
        </div>
      </div>
    </div>
  );
};

/* ── AgendaExportButton ── */
interface ExportButtonProps {
  agenda: AgendaType;
  organizer: User | undefined;
  participants: User[];
  room: Room | null;
  statusMeta: { label: string; bg: string; color: string };
}

export const AgendaExportButton: React.FC<ExportButtonProps> = ({ agenda, organizer, participants, room, statusMeta }) => {
  const { showToast } = useApp();
  const [open, setOpen] = useState(false);
  
  const downloadPdf = () => {
    setOpen(false);
    const ok = exportAgendaPdf({ agenda, organizer, participants, room, statusMeta });
    showToast(
      ok ? "เปิดหน้าพิมพ์ PDF แล้ว กรุณาเลือก Save as PDF" : "ไม่สามารถเปิดหน้าพิมพ์ PDF ได้ กรุณาลองใหม่อีกครั้ง",
      ok ? "success" : "error"
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-sec"
        style={{
          height: 44,
          padding: "0 14px 0 16px",
          background: "var(--surface)",
          color: "var(--accent)",
          border: "1.5px solid var(--accent-soft2)",
          borderRadius: 11,
          fontSize: 14,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          boxShadow: "var(--shadow)"
        }}
      >
        <Icon n="download" s={{ fontSize: 17, color: "var(--accent)" }} />
        ดาวน์โหลด
        <Icon n="chevron-down" s={{ fontSize: 14, color: "var(--accent)" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 50,
            width: 230,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 14px 36px rgba(15,23,42,.16)",
            padding: 6,
            zIndex: 20
          }}
        >
          <button
            onClick={downloadPdf}
            className="row-hover"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              borderRadius: 9,
              padding: "10px 11px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#FEE2E2", color: "#B42318", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
              PDF
            </span>
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>ดาวน์โหลดเป็น PDF</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-faint)" }}>เอกสารพร้อมพิมพ์</span>
            </span>
          </button>
          <button
            disabled
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              borderRadius: 9,
              padding: "10px 11px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              textAlign: "left",
              opacity: 0.5,
              cursor: "not-allowed"
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#DCFCE7", color: "#15803D", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
              XLS
            </span>
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>ดาวน์โหลดเป็น Excel</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-faint)" }}>เตรียมไว้สำหรับอนาคต</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};



/* ── AgendaDetail ── */
interface DetailProps {
  db: any;
  agenda: AgendaType;
  currentUser: User | null;
  onBack: () => void;
  onEdit: () => void;
  updateDB: (newDb: any) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  askConfirm: (cfg: any) => void;
  closeConfirm: () => void;
  onOpenMom: (agendaId: number) => void;
}

const AgendaDetail: React.FC<DetailProps> = ({
  db,
  agenda,
  currentUser,
  onBack,
  onEdit,
  updateDB,
  showToast,
  askConfirm,
  closeConfirm,
  onOpenMom
}) => {
  const organizer = db.users.find((u: User) => u.id === agenda.organizerId);
  const parent = agenda.parentAgendaId ? (db.agendas || []).find((a: AgendaType) => a.id === agenda.parentAgendaId) : null;
  const continuations = (db.agendas || []).filter((a: AgendaType) => a.parentAgendaId === agenda.id);
  const participants = db.users.filter((u: User) => (agenda.participantIds || []).includes(u.id));
  const canEdit = canEditAgenda(agenda, currentUser);
  const room = agenda.roomId ? db.rooms.find((r: Room) => r.id === agenda.roomId) : null;

  const statusKey = getAgendaStatus(agenda, db);
  const statusMeta = AGENDA_STATUS_META[statusKey] || AGENDA_STATUS_META.upcoming;
  const canCancel = canEdit && statusKey !== "cancelled" && statusKey !== "done" && statusKey !== "done_continued";
  const linkedBooking = (db.bookings || []).find((b: Booking) => b.agendaId === agenda.id);

  const doCancel = () =>
    askConfirm({
      title: "ยกเลิกการประชุม",
      msg: `ยืนยันการยกเลิกการประชุม "${agenda.title}" (${agenda.code})? ผู้เข้าร่วมจะเห็นสถานะนี้ทันที และการจองห้องที่เกี่ยวข้องจะถูกลบออกจากปฏิทินด้วย`,
      icon: "ban",
      color: "#B42318",
      okLabel: "ยืนยันยกเลิก",
      onOk: () => {
        const nd = {
          ...db,
          agendas: (db.agendas || []).map((a: AgendaType) =>
            a.id === agenda.id ? { ...a, status: "cancelled", updatedAt: new Date().toISOString() } : a
          ),
          bookings: (db.bookings || []).filter((b: Booking) => b.agendaId !== agenda.id)
        };
        updateDB(nd);
        closeConfirm();
        showToast("ยกเลิกการประชุมแล้ว", "info");
      }
    });

  const doReactivate = () => {
    const nd = {
      ...db,
      agendas: (db.agendas || []).map((a: AgendaType) =>
        a.id === agenda.id ? { ...a, status: undefined, updatedAt: new Date().toISOString() } : a
      )
    };
    updateDB(nd);
    showToast("ยกเลิกการยกเลิก — นัดหมายกลับมาใช้งานได้ตามปกติ");
  };

  return (
    <div className="fu">
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-faint)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 13,
          padding: 0,
          marginBottom: 14
        }}
      >
        <Icon n="arrow-left" s={{ fontSize: 13, color: "var(--text-faint)" }} /> บันทึกการประชุม
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>{agenda.title}</h1>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: agenda.meetingType === "continued" ? "#FFF7ED" : "var(--accent-soft)",
                color: agenda.meetingType === "continued" ? "#C2410C" : "var(--accent)"
              }}
            >
              {agenda.meetingType === "continued" ? "การประชุมต่อเนื่อง" : "การประชุมใหม่"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
            รหัส {agenda.code} · สร้างโดย {organizer?.prefix}
            {organizer?.firstName} {organizer?.lastName}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <AgendaExportButton agenda={agenda} organizer={organizer} participants={participants} room={room} statusMeta={statusMeta} />
          {["done", "done_continued"].includes(statusKey) && (
            <BtnSec onClick={() => onOpenMom(agenda.id)} icon="file-text" style={{ width: "auto", padding: "0 18px", height: 44 }}>
              ดู/กรอก MOM
            </BtnSec>
          )}
          {canCancel && (
            <BtnSec onClick={doCancel} icon="ban" style={{ width: "auto", padding: "0 18px", height: 44, color: "#B42318", borderColor: "#FECACA", background: "#FFF7F7" }}>
              ยกเลิกการประชุม
            </BtnSec>
          )}
          {statusKey === "cancelled" && canEdit && (
            <BtnSec onClick={doReactivate} icon="reset" style={{ width: "auto", padding: "0 18px", height: 44 }}>
              ยกเลิกการยกเลิก
            </BtnSec>
          )}
          {canEdit && statusKey !== "cancelled" && (
            <BtnPri onClick={onEdit} icon="edit" style={{ width: "auto", padding: "0 22px", height: 44 }}>
              แก้ไข Agenda
            </BtnPri>
          )}
        </div>
      </div>

      {/* Status & Confidentiality banners */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 16px",
            borderRadius: 30,
            background: statusMeta.bg,
            color: statusMeta.color,
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <Icon n={statusMeta.icon} s={{ fontSize: 15, color: statusMeta.color }} /> {statusMeta.label}
        </div>

        {(() => {
          const conf = agenda.confidentiality || "ทั่วไป";
          let bg = "#E7F6EC"; // Green for Public
          let color = "#1A7F37";
          let icon = "eye";
          let label = "ระดับทั่วไป (Public)";
          let anim = "none";
          
          if (conf === "ลับภายใน") {
            bg = "#FFF7ED"; // Amber
            color = "#C2410C";
            icon = "lock";
            label = "ลับภายใน (Internal)";
          } else if (conf === "ลับเฉพาะ") {
            bg = "#FEE4E2"; // Red
            color = "#B42318";
            icon = "shield";
            label = "ลับเฉพาะ (Confidential)";
            anim = "pulse-red-soft 2s infinite";
          }

          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 16px",
                borderRadius: 30,
                background: bg,
                color: color,
                fontSize: 13,
                fontWeight: 700,
                animation: anim
              }}
            >
              <style>{`
                @keyframes pulse-red-soft {
                  0% { box-shadow: 0 0 0 0 rgba(180, 35, 24, 0.3); }
                  70% { box-shadow: 0 0 0 6px rgba(180, 35, 24, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(180, 35, 24, 0); }
                }
              `}</style>
              <Icon n={icon} s={{ fontSize: 15, color: color }} /> {label}
            </div>
          );
        })()}
      </div>

      {parent && <AlertBox type="info" msg={`การประชุมนี้ต่อเนื่องจาก ${parent.code} — ${parent.title}`} style={{ marginBottom: 18 }} />}
      {continuations.length > 0 && (
        <AlertBox
          type="info"
          style={{ marginBottom: 18 }}
          msg={`มีการประชุมต่อเนื่องจาก Agenda นี้: ${continuations.map((c: AgendaType) => `${c.code} (${c.title})`).join(", ")}`}
        />
      )}
      {linkedBooking && (
        <AlertBox
          type="success"
          style={{ marginBottom: 18 }}
          msg={`ห้อง ${room?.name || "—"} วันที่ ${formatDateBE(linkedBooking.date)} เวลา ${linkedBooking.start}-${linkedBooking.end} น. — บันทึกในปฏิทินจองห้องแล้วอัตโนมัติ`}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="info" title="ข้อมูลการประชุม" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <DetailField icon="calendar" label="วันที่" value={formatLongDateBE(agenda.date)} />
              <DetailField icon="clock" label="เวลา" value={`${agenda.start} - ${agenda.end} น.`} />
              <DetailField icon="map-pin" label="สถานที่" value={agenda.locationMode === "offsite" ? agenda.offsiteLocation : `${room?.name || "—"} (${agenda.place})`} />
              <DetailField icon="video" label="ลิงก์ออนไลน์" value={agenda.hasOnlineLink ? agenda.onlineLink : "ไม่มี"} />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 6, fontWeight: 600, margin: "0 0 6px" }}>วัตถุประสงค์การประชุม</p>
            <p style={{ fontSize: 13.5, color: "var(--text-sub)", lineHeight: 1.7, margin: 0 }}>{agenda.objective || "—"}</p>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="list" title="วาระการประชุม" />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {(agenda.items || []).map((it, idx) => (
                <div key={it.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: idx < agenda.items.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <p style={{ fontSize: 13.5, color: "var(--text-sub)", paddingTop: 3, margin: 0 }}>{it.detail}</p>
                </div>
              ))}
              {(!agenda.items || agenda.items.length === 0) && <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>ไม่มีวาระการประชุม</p>}
            </div>
          </div>

          {agenda.details && (
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
              <CardHead icon="file-text" title="รายละเอียดเพิ่มเติม" />
              <p style={{ fontSize: 13.5, color: "var(--text-sub)", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{agenda.details}</p>
            </div>
          )}

          {agenda.attachments && agenda.attachments.length > 0 && (
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
              <CardHead icon="clipboard" title="เอกสารแนบเตรียมการประชุม" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {agenda.attachments.map((file: any, idx: number) => {
                  const handleDownload = () => {
                    const link = document.createElement("a");
                    link.href = file.data;
                    link.download = file.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  };
                  return (
                    <button
                      key={idx}
                      onClick={handleDownload}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "1.5px solid var(--border-soft)",
                        background: "var(--surface-2)",
                        color: "var(--text-sub)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all .15s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-soft)";
                        e.currentTarget.style.color = "var(--text-sub)";
                      }}
                    >
                      <Icon n="download" s={{ fontSize: 15 }} />
                      <span>{file.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="users" title={`ผู้เข้าร่วม (${participants.length})`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {participants.map((u: User) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar user={u} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                      {u.prefix}
                      {u.firstName} {u.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0 }}>{u.department}</p>
                  </div>
                </div>
              ))}
              {participants.length === 0 && <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>ไม่มีผู้เข้าร่วม</p>}
            </div>
            {agenda.hasExternal && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6, margin: "0 0 6px" }}>ผู้เข้าร่วมภายนอก</p>
                <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{agenda.externalParticipants}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── AgendaForm ── */
interface FormProps {
  db: any;
  currentUser: User | null;
  initial?: AgendaType | null;
  onSave: (data: Omit<AgendaType, "id" | "code" | "organizerId" | "createdAt" | "updatedAt" | "status">) => void;
  onCancel: () => void;
  askConfirm: (cfg: any) => void;
  closeConfirm: () => void;
}

const AgendaForm: React.FC<FormProps> = ({
  db,
  currentUser,
  initial,
  onSave,
  onCancel,
  askConfirm,
  closeConfirm
}) => {
  const isEdit = !!initial;
  const activeRooms = (db.rooms || []).filter((r: Room) => r.status === "active");
  const places = [...new Set(activeRooms.map((r: Room) => r.place))] as string[];

  const [meetingType, setMeetingType] = useState(initial?.meetingType || "new");
  const [parentAgendaId, setParentId] = useState<string | number>(initial?.parentAgendaId || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [locationMode, setLocationMode] = useState(initial?.locationMode || "place");
  const [place, setPlace] = useState(initial?.place || places[0] || "");
  const [roomId, setRoomId] = useState<string | number>(initial?.roomId || "");
  const [offsiteLocation, setOffsite] = useState(initial?.offsiteLocation || "");
  const [hasOnlineLink, setHasLink] = useState(initial?.hasOnlineLink || false);
  const [onlineLink, setOnlineLink] = useState(initial?.onlineLink || "");
  const [date, setDate] = useState(initial?.date || "");
  const [start, setStart] = useState(initial?.start || "");
  const [end, setEnd] = useState(initial?.end || "");
  const [objective, setObjective] = useState(initial?.objective || "");
  const [items, setItems] = useState<AgendaItem[]>(
    initial?.items?.length ? initial.items : [{ id: 1, detail: "" }]
  );
  const [details, setDetails] = useState(initial?.details || "");
  const [participantIds, setParticipantIds] = useState<number[]>(
    initial?.participantIds?.length ? initial.participantIds : currentUser ? [currentUser.id] : []
  );
  const [hasExternal, setHasExternal] = useState(initial?.hasExternal || false);
  const [externalParticipants, setExternal] = useState(initial?.externalParticipants || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confidentiality, setConfidentiality] = useState(initial?.confidentiality || "ทั่วไป");
  const [attachments, setAttachments] = useState<{ name: string; data: string; type: string }[]>(initial?.attachments || []);
  const [pdfError, setPdfError] = useState("");

  /* participant picker (grouped by department, with search) */
  const [pSearch, setPSearch] = useState("");
  const [openDepts, setOpenDepts] = useState<Set<string>>(() => new Set());
  
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
  const selectableAgendas = (db.agendas || []).filter((a: AgendaType) => canSeeAgenda(a, currentUser) && a.id !== initial?.id);
  const roomsAtPlace = activeRooms.filter((r: Room) => r.place === place);

  const addItem = () => setItems((prev) => [...prev, { id: Date.now(), detail: "" }]);
  const removeItem = (id: number) => {
    const doRemove = () => setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
    const target = items.find((i) => i.id === id);
    if (target && target.detail.trim()) {
      askConfirm({
        title: "ลบวาระการประชุม",
        msg: `ยืนยันการลบวาระ "${target.detail.trim()}" ออกจากรายการ?`,
        icon: "x",
        color: "#B42318",
        okLabel: "ลบวาระ",
        onOk: () => {
          doRemove();
          closeConfirm();
        }
      });
    } else {
      doRemove();
    }
  };
  const updateItem = (id: number, val: string) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, detail: val } : i)));

  const validate = () => {
    const e: Record<string, string> = {};
    if (meetingType === "continued" && !parentAgendaId) e.parent = "กรุณาเลือกการประชุมที่ต่อเนื่อง";
    if (!title.trim()) e.title = "กรุณากรอกหัวข้อการประชุม";
    if (locationMode === "place" && !roomId) e.room = "กรุณาเลือกห้องประชุม";
    if (locationMode === "offsite" && !offsiteLocation.trim()) e.offsite = "กรุณาระบุสถานที่ประชุม";
    if (hasOnlineLink && !onlineLink.trim()) e.onlineLink = "กรุณาระบุลิงก์การประชุมออนไลน์";
    if (!date) e.date = "กรุณาเลือกวันที่ประชุม";
    if (!start || !end) e.time = "กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด";
    else if (toMin(end) <= toMin(start)) e.time = "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
    if (!objective.trim()) e.objective = "กรุณากรอกวัตถุประสงค์การประชุม";
    if (items.every((i) => !i.detail.trim())) e.items = "กรุณากรอกวาระการประชุมอย่างน้อย 1 วาระ";
    if (hasExternal && !externalParticipants.trim()) e.external = "กรุณาระบุรายชื่อผู้เข้าร่วมภายนอก";

    if (locationMode === "place" && roomId && date && start && end && !e.time) {
      const conflict = findRoomConflict(db, { roomId: Number(roomId), date, start, end }, initial?.id);
      if (conflict) {
        e.room =
          conflict.source === "booking"
            ? `ห้องนี้ถูกจองแล้วในช่วงเวลา ${conflict.start}-${conflict.end} น. ("${conflict.title}") กรุณาเลือกห้องหรือเวลาอื่น`
            : `ห้องนี้ถูกใช้ใน Agenda ${conflict.code} ("${conflict.title}") ช่วงเวลา ${conflict.start}-${conflict.end} น. กรุณาเลือกห้องหรือเวลาอื่น`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSubmit = () => {
    if (!validate()) return;
    onSave({
      meetingType,
      parentAgendaId: meetingType === "continued" ? Number(parentAgendaId) : null,
      title: title.trim(),
      locationMode,
      place: locationMode === "place" ? place : "",
      roomId: locationMode === "place" ? Number(roomId) : null,
      offsiteLocation: locationMode === "offsite" ? offsiteLocation.trim() : "",
      hasOnlineLink,
      onlineLink: hasOnlineLink ? onlineLink.trim() : "",
      date,
      start,
      end,
      objective: objective.trim(),
      items: items.filter((i) => i.detail.trim()).map((i) => ({ id: i.id, detail: i.detail.trim() })),
      details: details.trim(),
      participantIds,
      hasExternal,
      externalParticipants: hasExternal ? externalParticipants.trim() : "",
      confidentiality,
      attachments
    });
  };

  const selectedRoom = activeRooms.find((r: Room) => String(r.id) === String(roomId));
  const selectedParent = selectableAgendas.find((a: AgendaType) => String(a.id) === String(parentAgendaId));

  const roomConflict = useMemo(() => {
    if (locationMode !== "place" || !roomId || !date || !start || !end) return null;
    if (toMin(end) <= toMin(start)) return null;
    return findRoomConflict(db, { roomId: Number(roomId), date, start, end }, initial?.id);
  }, [locationMode, roomId, date, start, end, db.bookings, db.agendas, initial?.id]);

  return (
    <div className="fu">
      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-faint)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 13,
          padding: 0,
          marginBottom: 10
        }}
      >
        <Icon n="arrow-left" s={{ fontSize: 13, color: "var(--text-faint)" }} /> {isEdit ? "ย้อนกลับ" : "บันทึกการประชุม"}
      </button>
      <PageHeader title={isEdit ? "แก้ไข Agenda" : "สร้าง Agenda ใหม่"} subtitle={isEdit ? `กำลังแก้ไข ${initial?.code}` : "กรอกข้อมูลรายละเอียดการประชุมและจัดเรียงวาระ"} />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "flex-start" }}>
        <div>
          {/* ข้อมูลการประชุม */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="info" title="ข้อมูลการประชุม" />

            <FL label="ประเภทการประชุม *">
              <PillToggle
                options={[
                  { value: "new", label: "การประชุมใหม่", icon: "calendar-plus" },
                  { value: "continued", label: "การประชุมต่อเนื่อง", icon: "link" }
                ]}
                value={meetingType}
                onChange={setMeetingType}
              />
            </FL>
            {meetingType === "continued" && (
              <FL label="เลือกการประชุมที่ต่อเนื่องจาก *" error={errors.parent}>
                <ParentAgendaField agendas={selectableAgendas} value={parentAgendaId} onChange={setParentId} />
              </FL>
            )}

            <FL label="หัวข้อการประชุม *" error={errors.title}>
              <input style={IS_STYLE} placeholder="เช่น ประชุมทีมพัฒนา Sprint Planning" value={title} onChange={(e) => setTitle(e.target.value)} />
            </FL>

            <FL label="สถานที่ประชุม *">
              <PillToggle
                options={[...places.map((p) => ({ value: p, label: p, icon: "building" })), { value: "offsite", label: "นอกสถานที่", icon: "map-pin" }]}
                value={locationMode === "offsite" ? "offsite" : place}
                onChange={(v) => {
                  if (v === "offsite") {
                    setLocationMode("offsite");
                  } else {
                    setLocationMode("place");
                    setPlace(v);
                    setRoomId("");
                  }
                }}
              />
            </FL>
            {locationMode === "place" && (
              <FL label="เลือกห้องประชุม *" error={errors.room}>
                <RoomField rooms={roomsAtPlace} value={roomId} onChange={setRoomId} />
                {!errors.room && roomId && date && start && end && toMin(end) > toMin(start) && (
                  roomConflict ? (
                    <p style={{ fontSize: 12, color: "#B42318", display: "flex", alignItems: "center", gap: 5, marginTop: 7, margin: "7px 0 0" }}>
                      <Icon n="x-circle" s={{ fontSize: 13, color: "#B42318" }} />
                      ห้องไม่ว่างช่วงเวลานี้ — ชนกับ{roomConflict.source === "booking" ? "การจองห้อง" : "Agenda"} "{roomConflict.title}" ({roomConflict.start}-{roomConflict.end} น.)
                    </p>
                  ) : (
                    <p style={{ fontSize: 12, color: "#1A7F37", display: "flex", alignItems: "center", gap: 5, marginTop: 7, margin: "7px 0 0" }}>
                      <Icon n="check-circle" s={{ fontSize: 13, color: "#1A7F37" }} /> ห้องว่างในช่วงเวลานี้
                    </p>
                  )
                )}
              </FL>
            )}
            {locationMode === "offsite" && (
              <FL label="ระบุสถานที่ *" error={errors.offsite}>
                <input style={IS_STYLE} placeholder="เช่น โรงแรม หรือสถานที่จัดงาน" value={offsiteLocation} onChange={(e) => setOffsite(e.target.value)} />
              </FL>
            )}

            <FL label="ลิงก์การประชุมออนไลน์">
              <PillToggle
                options={[
                  { value: false, label: "ไม่มี", icon: "x" },
                  { value: true, label: "มี", icon: "video" }
                ]}
                value={hasOnlineLink}
                onChange={setHasLink}
              />
            </FL>
            {hasOnlineLink && (
              <FL label="ระบุลิงก์การประชุมออนไลน์ *" error={errors.onlineLink}>
                <input style={IS_STYLE} placeholder="เช่น Zoom / Google Meet / Microsoft Teams" value={onlineLink} onChange={(e) => setOnlineLink(e.target.value)} />
              </FL>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 14px" }}>
              <FL label="วันที่ประชุม *" error={errors.date}>
                <DateField value={date} onChange={setDate} />
              </FL>
              <FL label="เวลาเริ่มต้น *">
                <TimeField
                  value={start}
                  onChange={(t) => {
                    setStart(t);
                    if (end && end <= t) setEnd("");
                  }}
                />
              </FL>
              <FL label="เวลาสิ้นสุด *">
                <TimeField
                  value={end}
                  minTime={start}
                  onChange={setEnd}
                />
              </FL>
            </div>
            {errors.time && <AlertBox type="error" msg={errors.time} style={{ marginBottom: 16, marginTop: -4 }} />}
          </div>

          {/* Card 2: วัตถุประสงค์และวาระการประชุม */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "26px 28px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="list" title="เนื้อหาและระเบียบวาระ" />

            <FL label="วัตถุประสงค์การประชุม *" error={errors.objective}>
              <textarea
                style={{ ...IS_STYLE, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                placeholder="ระบุวัตถุประสงค์ของการประชุมนี้เพื่อเตรียมความพร้อมแก่ผู้เข้าร่วม..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </FL>

            <div style={{ margin: "20px 0 10px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", display: "block", marginBottom: 8 }}>
                ระเบียบวาระย่อย (Agenda Topics) *
              </span>
              {errors.items && <AlertBox type="error" msg={errors.items} style={{ marginBottom: 14 }} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {items.map((it, idx) => (
                  <div key={it.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 34, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 8, fontSize: 13, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <input
                      style={IS_STYLE}
                      placeholder={`รายละเอียดระเบียบวาระที่ ${idx + 1}`}
                      value={it.detail}
                      onChange={(e) => updateItem(it.id, e.target.value)}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        style={{ width: 38, height: 38, background: "#FEF2F2", border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 1, transition: "background .15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                      >
                        <Icon n="x" s={{ fontSize: 16, color: "#B42318" }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <BtnSec onClick={addItem} icon="plus" style={{ width: "auto", padding: "0 18px", height: 38, borderRadius: 10 }}>
                เพิ่มวาระย่อย
              </BtnSec>
            </div>

            <div style={{ marginTop: 20 }}>
              <FL label="รายละเอียดเพิ่มเติมหรือหมายเหตุ">
                <textarea
                  style={{ ...IS_STYLE, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
                  placeholder="กรอกรายละเอียดเพิ่มเติม ลิงก์แนบภายนอก หรือหมายเหตุอื่นๆ..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </FL>
            </div>
          </div>

          {/* Card 3: ความปลอดภัยและเอกสารแนบ */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "26px 28px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="shield" title="ความปลอดภัยและเอกสารแนบ" />

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", display: "block", marginBottom: 8 }}>
                ระดับชั้นความลับการประชุม
              </span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                {[
                  { value: "ทั่วไป", label: "ทั่วไป (Public)", icon: "eye", color: "#1A7F37", bg: "#E7F6EC" },
                  { value: "ลับภายใน", label: "ลับภายใน (Internal)", icon: "lock", color: "#C2410C", bg: "#FFF7ED" },
                  { value: "ลับเฉพาะ", label: "ลับเฉพาะ (Confidential)", icon: "shield", color: "#B42318", bg: "#FEE4E2" }
                ].map((opt) => {
                  const isSelected = confidentiality === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConfidentiality(opt.value)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 12,
                        border: isSelected ? `2px solid ${opt.color}` : "1.5px solid var(--border-2)",
                        background: isSelected ? opt.bg : "var(--surface)",
                        color: isSelected ? opt.color : "var(--text-sub)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all .15s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = opt.color;
                          e.currentTarget.style.background = opt.bg;
                          e.currentTarget.style.color = opt.color;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--border-2)";
                          e.currentTarget.style.background = "var(--surface)";
                          e.currentTarget.style.color = "var(--text-sub)";
                        }
                      }}
                    >
                      <Icon n={opt.icon} s={{ fontSize: 15, color: isSelected ? opt.color : "var(--text-mute)" }} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", display: "block", marginBottom: 6 }}>
                เอกสารแนบสำหรับเตรียมประชุม (เฉพาะไฟล์ PDF)
              </span>
              {pdfError && <AlertBox type="error" msg={pdfError} style={{ marginBottom: 12 }} />}
              <div
                style={{
                  border: "2px dashed var(--border-2)",
                  borderRadius: 12,
                  padding: "26px 16px",
                  textAlign: "center",
                  background: "var(--bg)",
                  cursor: "pointer",
                  position: "relative",
                  marginBottom: 12,
                  transition: "all .2s"
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    setPdfError("");
                    const validFiles: File[] = [];
                    
                    Array.from(files).forEach((file) => {
                      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                        setPdfError("แนบได้เฉพาะไฟล์สกุล PDF (.pdf) เท่านั้น");
                      } else {
                        validFiles.push(file);
                      }
                    });

                    validFiles.forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64Data = event.target?.result as string;
                        setAttachments((prev) => [
                          ...prev,
                          {
                            name: file.name,
                            data: base64Data,
                            type: file.type
                          }
                        ]);
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%"
                  }}
                />
                <Icon n="upload" s={{ fontSize: 30, color: "var(--accent)", marginBottom: 8 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", margin: "0 0 4px" }}>
                  ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่ออัปโหลด
                </p>
                <p style={{ fontSize: 11, color: "var(--text-mute)", margin: 0 }}>
                  รองรับเอกสารสกุล .pdf เท่านั้น
                </p>
              </div>

              {attachments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border-soft)",
                        transition: "all .15s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <Icon n="file-text" s={{ fontSize: 16, color: "var(--accent)" }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 6
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <Icon n="x" s={{ fontSize: 14, color: "#B42318" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Participants */}
        <div>
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <CardHead icon="users" title={`ผู้เข้าร่วม (${participantIds.length})`} />
              {participantIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setParticipantIds([])}
                  style={{ fontSize: 11.5, color: "#B42318", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  ล้าง
                </button>
              )}
            </div>

            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                <Icon n="search" s={{ fontSize: 15, color: "var(--text-ghost)" }} />
              </span>
              <input
                value={pSearch}
                onChange={(e) => setPSearch(e.target.value)}
                placeholder="ค้นหาชื่อ..."
                style={{ ...IS_STYLE, padding: "8px 10px 8px 32px", fontSize: 12.5 }}
              />
            </div>

            {selectedUsers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {selectedUsers.map((u: User) => (
                  <span
                    key={u.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "var(--accent-soft)",
                      color: "var(--accent-dark)",
                      borderRadius: 20,
                      padding: "3px 6px 3px 9px",
                      fontSize: 11.5,
                      fontWeight: 600
                    }}
                  >
                    {u.firstName}
                    <button
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      style={{
                        background: "var(--surface)",
                        border: "none",
                        borderRadius: "50%",
                        width: 14,
                        height: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      <Icon n="x" s={{ fontSize: 9, color: "var(--accent-dark)" }} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", maxHeight: 310, overflowY: "auto" }}>
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
                        padding: "9px 10px",
                        background: "var(--surface-2)",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: selCount > 0 ? "var(--accent)" : "#D1D5DB", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text-sub)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dept}</span>
                      <Icon n={isOpen ? "chevron-up" : "chevron-down"} s={{ fontSize: 12, color: "var(--text-ghost)", flexShrink: 0 }} />
                    </button>
                    {isOpen && (
                      <div style={{ padding: "4px 6px 6px" }}>
                        {members.length === 0 && <p style={{ fontSize: 11.5, color: "var(--text-ghost)", padding: "4px 8px", margin: 0 }}>ไม่มีพนักงาน</p>}
                        {members.map((u) => {
                          const checked = participantIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleUser(u.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 8px",
                                borderRadius: 8,
                                cursor: "pointer",
                                background: checked ? "var(--accent-soft)" : "transparent"
                              }}
                            >
                              <input type="checkbox" checked={checked} readOnly style={{ width: 14, height: 14, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                              <Avatar user={u} size={24} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                                  {u.prefix}
                                  {u.firstName} {u.lastName}
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

            <div style={{ borderTop: "1px solid var(--border-soft)", marginTop: 14, paddingTop: 14 }}>
              <FL label="ผู้เข้าร่วมภายนอก">
                <PillToggle
                  options={[
                    { value: false, label: "ไม่มี", icon: "x" },
                    { value: true, label: "มีผู้เข้าร่วมภายนอก", icon: "users" }
                  ]}
                  value={hasExternal}
                  onChange={setHasExternal}
                />
              </FL>
              {hasExternal && (
                <FL label="ระบุรายชื่อผู้เข้าร่วมภายนอก *" error={errors.external}>
                  <textarea
                    style={{ ...IS_STYLE, minHeight: 70, resize: "vertical", fontFamily: "inherit", fontSize: 12.5 }}
                    placeholder="ระบุชื่อและบริษัทของผู้เข้าร่วมประชุมภายนอก..."
                    value={externalParticipants}
                    onChange={(e) => setExternal(e.target.value)}
                  />
                </FL>
              )}
            </div>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, marginTop: 18, boxShadow: "var(--shadow)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>สรุปข้อมูล Agenda</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SummaryRow icon="file-text" label="ชื่อการประชุม" value={title || "—"} />
              <SummaryRow icon="calendar" label="วันที่" value={date || "—"} />
              <SummaryRow icon="clock" label="เวลา" value={start && end ? `${start} - ${end} น.` : "—"} />
              <SummaryRow icon="map-pin" label="สถานที่" value={locationMode === "offsite" ? offsiteLocation || "—" : selectedRoom ? `${selectedRoom.name} (${place})` : "—"} />
              <SummaryRow icon="list" label="จำนวนวาระ" value={`${items.filter((i) => i.detail.trim()).length} วาระ`} />
              <SummaryRow icon="users" label="ผู้เข้าร่วม" value={`${participantIds.length} คน`} />
              {meetingType === "continued" && <SummaryRow icon="link" label="ต่อเนื่องจาก" value={selectedParent ? selectedParent.code : "—"} />}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
            <BtnSec onClick={onCancel} icon="x">
              ยกเลิก
            </BtnSec>
            <BtnPri onClick={doSubmit} icon={isEdit ? "save" : "check"}>
              {isEdit ? "บันทึกแก้ไข" : "บันทึกนัดหมาย"}
            </BtnPri>
          </div>
        </div>
      </div>
    </div>
  );
};

const IS_STYLE = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid var(--border-2)",
  borderRadius: 10,
  fontSize: 14,
  color: "var(--text)",
  background: "var(--surface)",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit"
};

const TD = {
  padding: "12px 16px",
  color: "var(--text-sub)",
  verticalAlign: "middle"
};

export default Agenda;
