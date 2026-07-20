/**
 * ==========================================
 * ไฟล์: Profile.tsx
 * หน้าที่หลัก: หน้าการจัดการข้อมูลโปรไฟล์พนักงานส่วนบุคคล (User Profile & Security Settings)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ฟอร์มประวัติพนักงาน (Profile General Info): แก้ไขชื่อสกุล เบอร์โทรศัพท์ และคำนำหน้าชื่อตนเอง
 * 2. อัพโหลดรูปภาพโปรไฟล์ (Avatar Upload Widget): เปลี่ยนภาพตัวแทนสมาชิกและแปลงภาพเก็บลงในแบบ base64 ในเครื่อง
 * 3. ฟอร์มตั้งรหัสผ่านใหม่ (Change Password Form): เปลี่ยนรหัสผ่านความปลอดภัยของพนักงาน
 * ==========================================
 */
import React, { useState } from "react";
// ดึงคอนเท็กซ์ส่วนกลางเพื่ออ่านข้อมูลของตนเอง และแก้ไขข้อมูลผู้ใช้งาน
import { useApp, ROLE_STYLE } from "../context/AppContext";
// นำเข้าไอคอนแสดงผล
import Icon from "../components/common/Icon";
// นำเข้าอินพุตเลย์เอาท์
import { FL, Select } from "../components/common/FormFields";
// นำเข้าปุ่มแบบ Primary
import { BtnPri } from "../components/common/Buttons";
// นำเข้าคอมโพเนนต์ย่อยสำหรับอัปโหลดและอัปเดตรูปโปรไฟล์
import { AvatarUpload } from "../components/common/Avatar";
// นำเข้ากล่องคำแนะนำย่อ
import Tooltip from "../components/common/Tooltip";
// นำเข้า Page Header จากหน้าจอ Dashboard
import { PageHeader, CardHead } from "./Dashboard";
// นำเข้าโครงสร้างข้อมูลประเภทพนักงาน
import type { User } from "../utils/types";

// สไตล์ตกแต่งภายในสำหรับอินพุต
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

// คอมโพเนนต์การจัดการข้อมูลประวัติตนเอง
export const Profile: React.FC = () => {
  // เรียกเชื่อมโยงฟังก์ชันบันทึกข้อมูลส่วนกลาง
  const { currentUser, db, updateDB, setCurrentUser, showToast, askConfirm, closeConfirm } = useApp();

  // กำหนดคำนำหน้าชื่อมาตรฐานสำหรับเลือก
  const stdPfx = ["นาย", "นาง", "นางสาว"];
  
  // ตรวจจับคำนำหน้าปัจจุบัน หากเป็นค่าว่างให้ตั้งเป็น "นาย"
  const currentPrefix = currentUser?.prefix || "นาย";
  
  // สเตทฟอร์มประวัติส่วนบุคคล
  const [form, setForm] = useState({
    prefix: stdPfx.includes(currentPrefix) ? currentPrefix : "อื่นๆ",
    prefixCustom: stdPfx.includes(currentPrefix) ? "" : currentPrefix,
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || ""
  });

  // สเตทฟอร์มแก้ไขรหัสผ่านใหม่
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  // เก็บฟิลด์แจ้งเตือนประวัติส่วนตัว
  const [errors, setErrors] = useState<Record<string, string>>({});
  // เก็บฟิลด์แจ้งเตือนความถูกต้องรหัสผ่าน
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  
  // ควบคุมการเปิดปิดตาสลับการแสดงรหัสผ่านแต่ละช่อง
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showF, setShowF] = useState(false);
  
  // ควบคุมการเปิด/ปิด สปอยเลอร์ส่วนเปลี่ยนรหัสผ่าน
  const [pwOpen, setPwOpen] = useState(false);

  // กำหนด RegEx ให้กรอกเฉพาะตัวอักษรภาษาไทยเท่านั้น
  const thaiRx = /^[ก-๙\s]+$/;

  // หากไม่มีผู้ใช้ลงชื่อเข้าใช้ ให้ยุติการประมวลผล
  if (!currentUser) return null;

  // ดำเนินการตรวจสอบและกดบันทึกข้อมูลส่วนตัวใหม่
  const confirmSave = () => {
    const e: Record<string, string> = {};
    if (form.prefix === "อื่นๆ" && !form.prefixCustom) e.prefixCustom = "กรุณาระบุคำนำหน้า";
    if (!form.firstName || !thaiRx.test(form.firstName)) e.firstName = "กรอกภาษาไทยเท่านั้น";
    if (!form.lastName || !thaiRx.test(form.lastName)) e.lastName = "กรอกภาษาไทยเท่านั้น";
    if (form.phone && (!/^\d+$/.test(form.phone) || form.phone.length > 10)) e.phone = "ตัวเลขไม่เกิน 10 หลัก";
    
    setErrors(e);
    if (Object.keys(e).length > 0) return; // หากพบปัญหาให้หยุดทำงาน

    // แสดงป๊อปอัปถามยืนยันการตั้งค่าแก้ไข
    askConfirm({
      title: "บันทึกข้อมูลส่วนตัว",
      msg: "คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลส่วนตัวใช่หรือไม่?",
      icon: "save",
      color: "var(--accent)",
      okLabel: "บันทึก",
      onOk: () => {
        // ประมวลผลดึงคำนำหน้าชื่อที่ถูกต้อง
        const prefix = form.prefix === "อื่นๆ" ? form.prefixCustom : form.prefix;
        const updated: User = {
          ...currentUser,
          prefix,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone
        };
        // จัดเก็บลงฐานข้อมูลและ Session เครื่องผู้ใช้งาน
        updateDB({
          ...db,
          users: db.users.map((u) => (u.id === currentUser.id ? updated : u))
        });
        setCurrentUser(updated);
        localStorage.setItem("bst_emeeting_session", JSON.stringify(updated));
        closeConfirm();
        showToast("บันทึกข้อมูลส่วนตัวสำเร็จ");
      }
    });
  };

  // ดำเนินการตรวจสอบและเปลี่ยนรหัสผ่านผู้ใช้
  const confirmPw = () => {
    const e: Record<string, string> = {};
    if (pwForm.current !== currentUser.password) e.current = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
    if (pwForm.newPw.length < 6) e.newPw = "อย่างน้อย 6 ตัวอักษร";
    if (pwForm.newPw === "12345") e.newPw = "ไม่สามารถใช้รหัสผ่านเริ่มต้นได้";
    if (pwForm.newPw !== pwForm.confirm) e.confirm = "รหัสผ่านไม่ตรงกัน";

    setPwErrors(e);
    if (Object.keys(e).length > 0) return;

    // แสดง Modal ยืนยันการตั้งรหัสใหม่
    askConfirm({
      title: "เปลี่ยนรหัสผ่าน",
      msg: "คุณต้องการเปลี่ยนรหัสผ่านใช่หรือไม่?",
      icon: "lock",
      color: "var(--accent)",
      okLabel: "เปลี่ยนรหัสผ่าน",
      onOk: () => {
        const now = new Date().toISOString();
        const updated: User = { ...currentUser, password: pwForm.newPw, lastPasswordChange: now };
        // เซฟลง Database
        updateDB({
          ...db,
          users: db.users.map((u) => (u.id === currentUser.id ? updated : u))
        });
        setCurrentUser(updated);
        localStorage.setItem("bst_emeeting_session", JSON.stringify(updated));
        setPwForm({ current: "", newPw: "", confirm: "" });
        closeConfirm();
        showToast("เปลี่ยนรหัสผ่านสำเร็จ");
      }
    });
  };

  // คอมโพเนนต์ย่อยเรนเดอร์ช่องกรอกรหัสผ่านแต่ละประเภทพร้อมปุ่มเปิด/ปิดการมองเห็น
  const PwF: React.FC<{
    label: string;
    val: string;
    setVal: (v: string) => void;
    show: boolean;
    setShow: (v: boolean) => void;
    error?: string;
  }> = ({ label, val, setVal, show, setShow, error }) => (
    <FL label={label} error={error}>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...IS, paddingRight: 46 }}
          type={show ? "text" : "password"}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <Tooltip label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} dir="l">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow(!show)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <Icon n={show ? "eye-off" : "eye"} s={{ fontSize: 18, color: "var(--text-faint)" }} />
          </button>
        </Tooltip>
      </div>
    </FL>
  );

  // ดึงระดับความสำคัญและสไตล์ของสิทธิ์การใช้งานพนักงานคนปัจจุบัน
  const rs = ROLE_STYLE[currentUser.role] || { bg: "#F1EFE8", color: "#555550", icon: "user" };
  const fullName = `${currentUser.prefix}${currentUser.firstName} ${currentUser.lastName}`;
  const profileMeta = [
    { icon: "key", label: "รหัสพนักงาน", value: currentUser.empId },
    { icon: "user", label: "บทบาท", value: currentUser.role },
    { icon: "building", label: "แผนก", value: currentUser.department }
  ];

  return (
    <div className="fu" style={{ maxWidth: 1120, margin: "0 auto" }}>
      {/* ส่วนหัวหน้าโปรไฟล์ */}
      <PageHeader title="ข้อมูลส่วนตัว" subtitle="จัดการข้อมูลบัญชี โปรไฟล์ และความปลอดภัยของคุณ" />

      {/* บล็อก Hero แสดงรูปพนักงานและข้อมูลเบื้องต้น */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 20,
          background: "linear-gradient(135deg,var(--surface) 0%,var(--accent-soft) 100%)",
          borderRadius: 18,
          border: "1px solid var(--border)",
          padding: "28px 32px",
          boxShadow: "var(--shadow)",
          overflow: "hidden",
          position: "relative",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "absolute", right: -60, top: -80, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.4)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 60, bottom: -90, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.25)", pointerEvents: "none" }} />
        {/* วิดเจ็ตสลับรูปประจำตัวพนักงาน พร้อมแปลงภาพเก็บลงในฐานข้อมูล */}
        <AvatarUpload
          user={currentUser}
          size={84}
          onUpload={(photo) => {
            const updated = { ...currentUser, photo };
            // เซฟภาพโปรไฟล์ใหม่ลงฐานข้อมูลจำลอง
            updateDB({
              ...db,
              users: db.users.map((u) => (u.id === currentUser.id ? updated : u))
            });
            // อัปเดตข้อมูลผู้ใช้ใน Session ประจำแอปพลิเคชัน
            setCurrentUser(updated);
            localStorage.setItem("bst_emeeting_session", JSON.stringify(updated));
            showToast("เปลี่ยนรูปโปรไฟล์สำเร็จ");
          }}
        />
        <div style={{ flex: 1, minWidth: 200, zIndex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{fullName}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: rs.bg, color: rs.color, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon n={rs.icon} s={{ fontSize: 13, color: rs.color }} /> {currentUser.role}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-mute)" }}>{currentUser.email}</span>
          </div>
        </div>
      </div>

      {/* ส่วนกริด 2 คอลัมน์ คอลัมน์ซ้ายเป็นข้อมูลประวัติ คอลัมน์ขวาเป็นเปลี่ยนรหัสผ่าน */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "start" }}>
        
        {/* การ์ดฟอร์มประวัติพนักงาน */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "26px 28px", boxShadow: "var(--shadow)" }}>
          <CardHead icon="user" title="รายละเอียดข้อมูลพนักงาน" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* วงเล็บเลือกคำนำหน้าชื่อ */}
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
              <FL label="คำนำหน้า *">
                <Select
                  options={["นาย", "นาง", "นางสาว", "อื่นๆ"]}
                  value={form.prefix}
                  onChange={(val) => setForm({ ...form, prefix: val })}
                />
              </FL>
              {form.prefix === "อื่นๆ" && (
                <FL label="ระบุคำนำหน้า *" error={errors.prefixCustom}>
                  <input
                    style={IS}
                    placeholder="เช่น ดร., พญ."
                    value={form.prefixCustom}
                    onChange={(e) => setForm({ ...form, prefixCustom: e.target.value })}
                  />
                </FL>
              )}
            </div>

            {/* ช่องกรอกชื่อและนามสกุล */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FL label="ชื่อจริง (ภาษาไทย) *" error={errors.firstName}>
                <input
                  style={IS}
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </FL>
              <FL label="นามสกุล (ภาษาไทย) *" error={errors.lastName}>
                <input
                  style={IS}
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </FL>
            </div>

            {/* ช่องกรอกเบอร์โทรศัพท์ */}
            <FL label="เบอร์โทรศัพท์มือถือ" error={errors.phone}>
              <input
                style={IS}
                placeholder="เช่น 0812345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FL>

            {/* ปุ่มบันทึกแก้ไขข้อมูลส่วนตัว */}
            <div style={{ marginTop: 8 }}>
              <BtnPri onClick={confirmSave} icon="save" style={{ width: "auto", padding: "0 24px" }}>
                บันทึกการเปลี่ยนแปลง
              </BtnPri>
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: การ์ดเปลี่ยนรหัสผ่านและความปลอดภัย */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* ข้อมูลสิทธิ์ผู้ใช้อ้างอิง */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>รายละเอียดบัญชีผู้ใช้</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {profileMeta.map((pm) => (
                <div key={pm.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: "var(--text-faint)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon n={pm.icon} s={{ fontSize: 13.5, color: "var(--text-faint)" }} /> {pm.label}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--text-sub)" }}>{pm.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* การ์ดความปลอดภัย - แก้ไขรหัสผ่าน */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "26px 28px", boxShadow: "var(--shadow)" }}>
            <CardHead icon="shield" title="รหัสผ่านและความปลอดภัย" />
            
            {/* ปุ่มกดเปิดสปอยเลอร์กรอกรหัสใหม่ */}
            {!pwOpen ? (
              <button
                onClick={() => setPwOpen(true)}
                style={{
                  width: "100%",
                  height: 42,
                  background: "var(--surface-2)",
                  border: "1.5px dashed var(--border-2)",
                  borderRadius: 11,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-sub)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7
                }}
              >
                <Icon n="lock" s={{ fontSize: 14, color: "var(--text-sub)" }} /> ต้องการเปลี่ยนรหัสผ่านใหม่?
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* อินพุตรหัสปัจจุบัน */}
                <PwF label="รหัสผ่านปัจจุบัน *" val={pwForm.current} setVal={(v) => setPwForm({ ...pwForm, current: v })} show={showC} setShow={setShowC} error={pwErrors.current} />
                {/* อินพุตรหัสผ่านใหม่ */}
                <PwF label="รหัสผ่านใหม่ *" val={pwForm.newPw} setVal={(v) => setPwForm({ ...pwForm, newPw: v })} show={showN} setShow={setShowN} error={pwErrors.newPw} />
                {/* ยืนยันรหัสผ่านใหม่ */}
                <PwF label="ยืนยันรหัสผ่านใหม่ *" val={pwForm.confirm} setVal={(v) => setPwForm({ ...pwForm, confirm: v })} show={showF} setShow={setShowF} error={pwErrors.confirm} />
                
                {/* แถบปุ่มดำเนินการรหัสผ่าน */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => { setPwOpen(false); setPwForm({ current: "", newPw: "", confirm: "" }); setPwErrors({}); }} style={{ flex: 1, height: 38, background: "var(--surface-2)", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: "var(--text-sub)", cursor: "pointer" }}>
                    ยกเลิก
                  </button>
                  <button onClick={confirmPw} style={{ flex: 1.5, height: 38, background: "var(--accent)", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                    ยืนยันเปลี่ยนรหัส
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
