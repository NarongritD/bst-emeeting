/**
 * ==========================================
 * ไฟล์: Rooms.tsx
 * หน้าที่หลัก: หน้าสำหรับจัดการคุณสมบัติและสถานะของห้องประชุม (Meeting Room Administration)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ตารางห้องประชุม (Rooms Table): สรุปคุณสมบัติห้องทั้งหมด อุปกรณ์เสริม ระบุความจุผู้เข้าประชุม และสถานที่ตั้งของห้อง
 * 2. บันทึก/ปรับปรุงห้องประชุม (Add/Edit Room Form): หน้าต่างกรอกสเปคห้อง ระบุจำนวนที่นั่ง และสลับเลือกอุปกรณ์ (เช่น Projector, TV, Whiteboard)
 * 3. วิดเจ็ตสถานะห้องประชุม (Room Status Badge): การ์ดแสดงระดับสถานะการพร้อมใช้ (`"active"`, `"temp"`, `"closed"`) 
 * 4. สีประจำห้องประชุม (ROOM_ACCENT): กำหนดโทนสีเฉพาะสำหรับแต่ละห้องเพื่อนำไปเป็นรหัสสีในปฏิทินรวม
 * ==========================================
 */
import React, { useState } from "react";
// นำเข้า AppContext สำหรับจัดการดึงข้อมูลและอัปเดตสเตทฐานข้อมูลร่วมกัน
import { useApp } from "../context/AppContext";
// นำเข้า SVG Icon ส่วนกลาง
import Icon from "../components/common/Icon";
// นำเข้ากล่อง Modal หน้าต่างป๊อปอัป
import Modal from "../components/common/Modal";
// นำเข้าช่องฟิลด์โครงร่างอินพุตพื้นฐาน (Form Layout)
import { FL } from "../components/common/FormFields";
// นำเข้าดีไซน์ปุ่มกด Primary และ Secondary
import { BtnPri, BtnSec } from "../components/common/Buttons";
// นำเข้าส่วนหัวหน้าจอเพจ
import { PageHeader } from "./Dashboard";
// นำเข้ากล่อง Tooltip แสดงเมื่อชี้เมาส์
import Tooltip from "../components/common/Tooltip";
// นำเข้าโครงสร้างประเภทตัวแปรห้องประชุมจากประเภทประเภทข้อมูลส่วนกลาง
import type { Room } from "../utils/types";

// กำหนดสไตล์การจัดแต่ง สีพื้นหลัง สีฟอนต์ และไอคอน สำหรับสถานะห้องประชุมแบบต่างๆ
export const ROOM_STATUS: Record<string, { label: string; bg: string; color: string; icon: string; dot: string }> = {
  // สถานะพร้อมใช้งาน: สีเขียวสดใส
  active:   { label: "พร้อมใช้งาน", bg: "#ECFDF5", color: "#065F46", icon: "check-circle",  dot: "#10B981" },
  // สถานะปิดซ่อมบำรุง/ปิดชั่วคราว: สีส้มเตือนภัย
  temp:     { label: "ปิดชั่วคราว", bg: "#FFFBEB", color: "#92400E", icon: "alert-circle",  dot: "#F59E0B" },
  // สถานะยกเลิก/ปิดถาวร: สีแดง
  closed:   { label: "ปิดถาวร",     bg: "#FEF2F2", color: "#991B1B", icon: "x",             dot: "#EF4444" },
};

// ไล่ระดับสี (Gradient Palette) และรหัสสีอ่อนสำหรับห้องประชุมแต่ละลำดับ นำไปแสดงบนการ์ดและปฏิทินจอง
export const ROOM_ACCENT = [
  { grad: "linear-gradient(135deg,#1A5FA8,#114D8D)", soft: "var(--room-blue-soft)", text: "var(--room-blue-text)" }, // ห้อง 1 สีน้ำเงิน
  { grad: "linear-gradient(135deg,#0D9488,#0F766E)", soft: "var(--room-teal-soft)", text: "var(--room-teal-text)" },  // ห้อง 2 สีเขียวหัวเป็ด
  { grad: "linear-gradient(135deg,#6366F1,#4338CA)", soft: "var(--room-indigo-soft)", text: "var(--room-indigo-text)" }, // ห้อง 3 สีม่วงคราม
  { grad: "linear-gradient(135deg,#16A34A,#15803D)", soft: "var(--room-green-soft)", text: "var(--room-green-text)" },  // ห้อง 4 สีเขียวใบไม้
];

// คอมโพเนนต์ย่อยสำหรับเรนเดอร์แถบป้ายแสดงสถานะห้องประชุม (Status Badge Component)
export const RoomStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // ดึงค่าการจัดสไตล์ตามสถานะ หากไม่มีให้เลือกเป็นสถานะพร้อมใช้งาน (active) เป็นค่าเริ่มต้น
  const s = ROOM_STATUS[status] || ROOM_STATUS.active;
  return (
    <span
      style={{
        fontSize: 12,
        background: s.bg,
        color: s.color,
        padding: "4px 10px",
        borderRadius: 20,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }}
    >
      {/* วาดจุดกลมสีบ่งชี้สถานะด้านหน้าตัวอักษร */}
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block", flexShrink: 0 }} />
      {/* แสดงข้อความสถานะ */}
      {s.label}
    </span>
  );
};

// คอมโพเนนต์หลักในการจัดการห้องประชุม
export const Rooms: React.FC = () => {
  // เรียกใช้งานสถานะ Database และฟังก์ชันส่วนกลางจาก Context Store
  const { db, updateDB, showToast, askConfirm, closeConfirm } = useApp();
  
  // สถานะ State ควบคุมการแสดงผล Modal ป๊อปอัปสำหรับ "เพิ่มห้องประชุมใหม่"
  const [showAdd, setShowAdd] = useState(false);
  
  // สถานะ State เก็บข้อมูลห้องประชุมที่กำลังแก้ไข (ถ้าเป็น null แสดงว่าไม่ได้กำลังเปิดหน้าจอแก้ไขอยู่)
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  // ฟังก์ชันดำเนินการเพิ่มข้อมูลห้องประชุมใหม่ลงฐานข้อมูลจำลอง
  const doAdd = (data: Omit<Room, "id">) => {
    // คำนวณหา ID ของห้องประชุมใหม่โดยอ้างอิงลำดับรหัสถัดไปจากระบบ
    const id = db.nextRoomId;
    // ประกอบโครงสร้างข้อมูลห้องประชุมใหม่
    const newRoom: Room = { id, ...data };
    
    // บันทึกและอัปเดตลงฐานข้อมูล พร้อมบวกเลขรหัสถัดไปรอไว้
    updateDB({
      ...db,
      rooms: [...db.rooms, newRoom],
      nextRoomId: id + 1
    });
    
    // แจ้งเตือนความสำเร็จและปิดหน้าต่างป๊อปอัปกรอกข้อมูล
    showToast("เพิ่มห้องประชุมสำเร็จ");
    setShowAdd(false);
  };

  // ฟังก์ชันดำเนินการแก้ไขปรับปรุงข้อมูลห้องประชุม
  const doEdit = (data: Omit<Room, "id">) => {
    // ตรวจสอบความปลอดภัยว่ามีข้อมูลห้องประชุมที่จะแก้ไขถูกเลือกอยู่จริง
    if (!editRoom) return;
    
    // วนลูปค้นหา ID ห้องประชุมเป้าหมาย และเขียนค่าทับลงตารางฐานข้อมูล
    updateDB({
      ...db,
      rooms: db.rooms.map((r) => (r.id === editRoom.id ? { ...r, ...data } : r))
    });
    
    // แจ้งเตือนความสำเร็จและปิดหน้าต่างป๊อปอัปแก้ไขข้อมูล
    showToast("แก้ไขข้อมูลห้องประชุมสำเร็จ");
    setEditRoom(null);
  };

  // ฟังก์ชันถามคำถามยืนยันการลบห้องประชุมออกจากระบบ
  const confirmDelete = (room: Room) => {
    askConfirm({
      title: "ลบห้องประชุม",
      msg: `ยืนยันการลบห้องประชุม "${room.name}"? การดำเนินการนี้จะลบห้องออกจากระบบถาวร`,
      icon: "x",
      color: "#B42318",
      okLabel: "ยืนยัน ลบ",
      onOk: () => {
        // คัดกรองกรองเอาห้องที่ถูกลบออกจากตารางห้องประชุมหลัก
        updateDB({
          ...db,
          rooms: db.rooms.filter((r) => r.id !== room.id)
        });
        // แจ้งเตือนแจ้งผู้ใช้และสั่งปิดหน้าป๊อปอัปยืนยันการทำรายการ
        showToast("ลบห้องประชุมสำเร็จ", "info");
        closeConfirm();
      }
    });
  };

  return (
    <div className="fu">
      {/* ส่วนหัวหน้าจอและปุ่มดำเนินการเพิ่มห้องประชุม */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {/* หน้าจอนำหัวข้อหลักและคำบรรยาย */}
        <PageHeader title="ห้องประชุมองค์กร" subtitle="เพิ่ม ลบ และจัดการสถานะห้องประชุมทั้งหมด" />
        {/* ปุ่มสร้างห้องประชุมใหม่ */}
        <BtnPri onClick={() => setShowAdd(true)} icon="plus" style={{ width: "auto", padding: "0 22px", height: 44 }}>
          เพิ่มห้องประชุม
        </BtnPri>
      </div>

      {/* แผงกริดแสดงผลการ์ดห้องประชุมแต่ละห้อง */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 20 }}>
        {db.rooms.map((r, i) => {
          // สลับโทนสีประจำห้องประชุมวนซ้ำตามอาร์เรย์สี ROOM_ACCENT
          const ac = ROOM_ACCENT[i % ROOM_ACCENT.length];
          return (
            <div
              key={r.id}
              style={{
                background: "var(--surface)",
                borderRadius: 18,
                border: "1px solid var(--border)",
                boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* ส่วนหัวการ์ดแสดงสีไล่ระดับและไอคอนประจำห้องประชุม */}
              <div
                style={{
                  height: 64,
                  background: ac.grad,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon n="door" s={{ fontSize: 20, color: "#fff" }} />
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 15.5 }}>{r.name}</span>
                </div>
              </div>

              {/* ส่วนแสดงเนื้อหารายละเอียดของห้อง */}
              <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {/* แสดงข้อมูลสถานที่/อาคาร */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>อาคาร / สถานที่</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-sub)" }}>{r.place}</span>
                  </div>
                  {/* แสดงข้อมูลชั้น */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>ชั้น</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-sub)" }}>ชั้น {r.floor}</span>
                  </div>
                  {/* แสดงสถานะปัจจุบันของห้องประชุม */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>สถานะการใช้งาน</span>
                    <RoomStatusBadge status={r.status} />
                  </div>
                </div>

                {/* ปุ่มจัดการแก้ไขหรือลบห้องประชุม */}
                <div style={{ display: "flex", gap: 8 }}>
                  {/* ปุ่มแก้ไขรายละเอียดห้อง */}
                  <button
                    onClick={() => setEditRoom(r)}
                    style={{
                      flex: 1,
                      height: 36,
                      background: "var(--accent-soft)",
                      border: "none",
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--accent)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Icon n="user-cog" s={{ fontSize: 15, color: "var(--accent)" }} /> แก้ไข
                  </button>
                  {/* ปุ่มกดสั่งลบ พร้อม Tooltip ช่วยเตือน */}
                  <Tooltip label="ลบห้องประชุม" dir="t">
                    <button
                      onClick={() => confirmDelete(r)}
                      style={{
                        width: 36,
                        height: 36,
                        background: "#FEF2F2",
                        border: "none",
                        borderRadius: 9,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Icon n="x" s={{ fontSize: 16, color: "#B42318" }} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ควบคุมการเปิด Modal สำหรับป้อนข้อมูลเพิ่มห้องประชุมใหม่ */}
      {showAdd && (
        <RoomModal
          onSave={doAdd}
          onClose={() => setShowAdd(false)}
          title="เพิ่มห้องประชุม"
        />
      )}
      {/* ควบคุมการเปิด Modal สำหรับการแก้ไขข้อมูลห้องประชุม */}
      {editRoom && (
        <RoomModal
          onSave={doEdit}
          onClose={() => setEditRoom(null)}
          title="แก้ไขห้องประชุม"
          initial={editRoom}
        />
      )}
    </div>
  );
};

// อินเตอร์เฟสโครงสร้าง Property ของป๊อปอัปหน้าต่างบันทึก/แก้ไขห้องประชุม
interface RoomModalProps {
  title: string;
  initial?: Room;
  onSave: (data: Omit<Room, "id">) => void;
  onClose: () => void;
}

// คอมโพเนนต์ฟอร์มป๊อปอัปจัดบันทึกข้อมูลห้องประชุม
const RoomModal: React.FC<RoomModalProps> = ({ title, initial, onSave, onClose }) => {
  // สเตทฟอร์มดึงข้อมูลขึ้นมาแสดง หากอยู่ในกรณีแก้ไขข้อมูลเดิมจะนำข้อมูลเริ่มต้น (initial) มาใส่ในฟิลด์
  const [form, setForm] = useState({
    name: initial?.name || "",
    place: initial?.place || "",
    floor: initial?.floor || "",
    status: initial?.status || "active"
  });
  // สเตทบันทึกข้อความผิดพลาดรายช่อง (Field-specific errors)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ฟังก์ชันตรวจสอบการกรอกข้อมูลที่จำเป็น
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "กรุณากรอกชื่อห้องประชุม";
    if (!form.place.trim()) e.place = "กรุณากรอกสถานที่";
    if (!form.floor.trim()) e.floor = "กรุณากรอกชั้น";
    setErrors(e);
    // หากออบเจ็กต์ว่างแสดงว่าผ่านเงื่อนไข (ไม่มีข้อผิดพลาด)
    return Object.keys(e).length === 0;
  };

  // ฟังก์ชันส่งฟอร์มข้อมูลเพื่อทำการดำเนินการบันทึกข้อมูลหลัก
  const doSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  // ตัวแปรเช็คว่าเป็นโหมด "แก้ไข" หรือ "สร้างใหม่"
  const isEdit = !!initial;

  return (
    <Modal onClose={onClose}>
      {/* ส่วนหัว Modal */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
        <div
          style={{
            width: 46,
            height: 46,
            background: isEdit ? "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))" : "linear-gradient(135deg,#EAF3DE,#C8E6C9)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Icon n={isEdit ? "user-cog" : "building"} s={{ fontSize: 22, color: isEdit ? "var(--accent)" : "#2E9E5B" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{title}</h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>{isEdit ? "แก้ไขข้อมูลห้องประชุม" : "กรอกข้อมูลห้องประชุมใหม่"}</p>
        </div>
      </div>

      {/* ช่องป้อนข้อมูล: ชื่อห้องประชุม */}
      <FL label="ชื่อห้องประชุม *" error={errors.name}>
        <input
          style={IS_STYLE}
          placeholder="เช่น Blue Diamond, Conference A"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FL>

      {/* กล่องกริดแนวนอนแบ่งช่อง สถานที่ตั้ง และ ชั้น */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        {/* ช่องป้อนข้อมูล: สถานที่/อาคาร */}
        <FL label="สถานที่ / อาคาร *" error={errors.place}>
          <input
            style={IS_STYLE}
            placeholder="เช่น อาคาร A, Tower 1"
            value={form.place}
            onChange={(e) => setForm({ ...form, place: e.target.value })}
          />
        </FL>
        {/* ช่องป้อนข้อมูล: ชั้น */}
        <FL label="ชั้น *" error={errors.floor}>
          <input
            style={IS_STYLE}
            placeholder="เช่น 3, G, B1"
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: e.target.value })}
          />
        </FL>
      </div>

      {/* ส่วนเลือกสถานะห้องประชุมพร้อมตัวเลือกปุ่มกดสามรูปแบบ */}
      <div style={{ marginBottom: 24 }}>
        <label style={LS_STYLE}>สถานะ</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {Object.entries(ROOM_STATUS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setForm({ ...form, status: key })}
              style={{
                padding: "10px 8px",
                borderRadius: 10,
                cursor: "pointer",
                // ถ้าสปริงเกอร์เลือกรุ่นนี้ จะวาดเส้นกรอบหนาและสีตามขอบเขตสถานะ
                border: form.status === key ? `2px solid ${s.color}` : "1.5px solid var(--border-2)",
                background: form.status === key ? s.bg : "var(--surface-2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                transition: "all .15s"
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.dot }} />
              <span style={{ fontSize: 12, fontWeight: form.status === key ? 700 : 400, color: form.status === key ? s.color : "var(--text-mute)" }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* แถบปุ่มบันทึกดำเนินการ และ ปุ่มปิดยกเลิกหน้าจอ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
        <BtnSec onClick={onClose} icon="x" style={{ width: "100%", justifyContent: "center" }}>
          ยกเลิก
        </BtnSec>
        <BtnPri
          onClick={doSubmit}
          icon={isEdit ? "save" : "plus"}
          style={{ background: isEdit ? "linear-gradient(135deg,var(--accent),var(--accent-dark))" : "linear-gradient(135deg,#2E9E5B,#1B7A48)" }}
        >
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มห้องประชุม"}
        </BtnPri>
      </div>
    </Modal>
  );
};

// สไตล์ CSS พื้นฐานของอินพุตใน Modal
const IS_STYLE = {
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

// สไตล์ CSS ของข้อความ Label ในหน้า Modal
const LS_STYLE = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-sub)",
  marginBottom: 7
};

export default Rooms;
