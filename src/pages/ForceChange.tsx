import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import Icon from "../components/common/Icon";
import { FL } from "../components/common/FormFields";
import { AlertBox } from "../components/common/AlertBox";
import { BtnPri, BtnSec } from "../components/common/Buttons";

/**
 * คอมโพเนนต์ ForceChange
 * ใช้สำหรับบังคับให้ผู้ใช้งานที่เข้าสู่ระบบครั้งแรก (หรือหลังจากแอดมินรีเซ็ทรหัสผ่านให้เป็น '12345')
 * ต้องตั้งรหัสผ่านใหม่ที่มีความปลอดภัยก่อนเข้าสู่หน้าหลักของระบบ
 */
export const ForceChange: React.FC = () => {
  // ดึงข้อมูลและฟังก์ชันจัดการจาก AppContext ส่วนกลาง
  const { currentUser, handleForceChange, handleForceChangeDone, askConfirm, closeConfirm } = useApp();

  // กำหนด State สำหรับเก็บค่ารหัสผ่านใหม่และการยืนยันรหัสผ่าน
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");

  // State สำหรับควบคุมการเปิด-ปิดตา (ดูรหัสผ่าน/ซ่อนรหัสผ่าน)
  const [showN, setShowN] = useState(false);
  const [showC, setShowC] = useState(false);

  // State สำหรับบันทึกข้อความแสดงข้อผิดพลาดเมื่อการกรอกรหัสผ่านไม่ผ่านเกณฑ์
  const [err, setErr] = useState("");

  /**
   * ฟังก์ชันตรวจสอบความถูกต้องของรหัสผ่าน (Validation)
   * 1. ต้องมีความยาวไม่ต่ำกว่า 6 ตัวอักษร
   * 2. ห้ามใช้รหัสผ่านเริ่มต้น '12345'
   * 3. รหัสผ่านใหม่กับช่องยืนยันรหัสต้องมีค่าตรงกัน
   */
  const validate = () => {
    setErr("");
    if (newPw.length < 6) {
      setErr("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return false;
    }
    if (newPw === "12345") {
      setErr("ไม่สามารถใช้รหัสผ่านเริ่มต้น '12345' ได้");
      return false;
    }
    if (newPw !== confirm) {
      setErr("รหัสผ่านที่ยืนยันไม่ตรงกัน");
      return false;
    }
    return true;
  };

  /**
   * ฟังก์ชันส่งข้อมูลฟอร์มเพื่อบันทึกรหัสผ่านใหม่
   */
  const doSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return; // หากไม่ผ่านเงื่อนไข ให้หยุดการทำงาน

    // แสดงหน้าต่างยืนยันการตั้งค่ารหัสผ่านใหม่ก่อนบันทึกจริง
    askConfirm({
      title: "เปลี่ยนรหัสผ่านเพื่อเริ่มต้นใช้งาน",
      msg: "ยืนยันการตั้งรหัสผ่านใหม่? หลังจากตกลง ระบบจะออกจากระบบเพื่อให้คุณเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่",
      icon: "lock",
      color: "var(--accent)",
      okLabel: "ยืนยัน เปลี่ยนรหัสผ่าน",
      onOk: () => {
        handleForceChange(newPw);     // อัปเดตรหัสใหม่ลงฐานข้อมูลจำลอง
        closeConfirm();               // ปิด Modal ยืนยัน
        handleForceChangeDone();      // จบขั้นตอนการบังคับเปลี่ยนรหัส และส่งตัวผู้ใช้ไปยังหน้าล็อกอิน
      }
    });
  };

  /**
   * ฟังก์ชันกรณีผู้ใช้ยกเลิกการตั้งรหัสผ่าน
   * ระบบจะเตือนว่าหากไม่ตั้งรหัสผ่านใหม่จะไม่สามารถใช้งานได้ และผู้ใช้จะต้องถูกล็อกเอาท์ออกทันที
   */
  const handleCancel = () => {
    askConfirm({
      title: "ยกเลิกการตั้งรหัสผ่าน",
      msg: "หากไม่ยอมเปลี่ยนรหัสผ่าน คุณจะไม่สามารถเข้าใช้งานระบบได้และจะถูกออกจากระบบโดยอัตโนมัติ ต้องการยกเลิกใช่หรือไม่?",
      icon: "logout",
      color: "#B42318",
      okLabel: "ออกจากระบบ",
      onOk: () => {
        closeConfirm();
        localStorage.removeItem("bst_emeeting_session"); // ล้างเซสชันผู้ใช้ออก
        window.location.reload();                       // โหลดหน้าใหม่เพื่อกลับไปหน้าล็อกอินหลัก
      }
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,var(--bg) 0%,var(--accent-soft) 100%)",
        padding: 20
      }}
    >
      {/* การ์ดคอนเทนเนอร์หลักของหน้าจอ */}
      <div
        className="fu"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          boxShadow: "0 20px 50px rgba(15,23,42,.08)",
          width: 440,
          maxWidth: "100%",
          padding: "40px 38px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* ส่วนหัวแสดงไอคอนล็อคและชื่อผู้ใช้งานที่โดนบังคับเปลี่ยนรหัส */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 58,
              height: 58,
              background: "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 24,
              fontWeight: 800,
              boxShadow: "0 10px 24px rgba(217,119,6,.3)",
              marginBottom: 16
            }}
          >
            <Icon n="lock" s={{ fontSize: 28, color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 4px", textAlign: "center" }}>
            เปลี่ยนรหัสผ่านเพื่อเริ่มต้นใช้งาน
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0, textAlign: "center" }}>
            สำหรับผู้ใช้ {currentUser?.prefix}
            {currentUser?.firstName} (รหัสพนักงาน: {currentUser?.empId})
          </p>
        </div>

        {/* กล่องแจ้งข้อมูลหลักสำหรับการใช้งานครั้งแรก */}
        <AlertBox
          type="info"
          msg="นี่คือการเข้าสู่ระบบครั้งแรกของคุณหรือรหัสผ่านถูกรีเซ็ท กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของข้อมูลบัญชี"
          style={{ marginBottom: 20 }}
        />

        {/* แสดงผลเตือนหากการตรวจสอบรหัสผ่านไม่ผ่าน (เช่น รหัสไม่ถึง 6 ตัวอักษร) */}
        {err && <AlertBox type="error" msg={err} style={{ marginBottom: 18 }} />}

        {/* ฟอร์มกรอกข้อมูลรหัสผ่านใหม่ */}
        <form onSubmit={doSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* ช่องใส่รหัสผ่านใหม่ */}
          <FL label="รหัสผ่านใหม่ *">
            <div style={{ position: "relative" }}>
              <input
                style={{ ...IS, paddingRight: 46 }}
                type={showN ? "text" : "password"}
                placeholder="กรอกรหัสผ่านใหม่"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              {/* ปุ่มสลับแสดง/ซ่อนรหัสผ่าน */}
              <button
                type="button"
                onClick={() => setShowN(!showN)}
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
                <Icon n={showN ? "eye-off" : "eye"} s={{ fontSize: 18, color: "var(--text-faint)" }} />
              </button>
            </div>
          </FL>

          {/* ช่องกรอกยืนยันรหัสผ่านใหม่ */}
          <FL label="ยืนยันรหัสผ่านใหม่ *">
            <div style={{ position: "relative" }}>
              <input
                style={{ ...IS, paddingRight: 46 }}
                type={showC ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {/* ปุ่มสลับแสดง/ซ่อนรหัสผ่านที่กดยืนยัน */}
              <button
                type="button"
                onClick={() => setShowC(!showC)}
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
                <Icon n={showC ? "eye-off" : "eye"} s={{ fontSize: 18, color: "var(--text-faint)" }} />
              </button>
            </div>
          </FL>

          {/* ปุ่มบันทึกและปุ่มยกเลิก */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <BtnSec onClick={handleCancel} icon="logout">
              ออกจากระบบ
            </BtnSec>
            <BtnPri type="submit" icon="shield">
              ยืนยันเปลี่ยนรหัส
            </BtnPri>
          </div>
        </form>
      </div>
    </div>
  );
};

// สไตล์ CSS พื้นฐานของช่องป้อนข้อมูลอินพุต
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

export default ForceChange;
