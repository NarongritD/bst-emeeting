/**
 * ==========================================
 * ไฟล์: App.tsx
 * หน้าที่หลัก: จุดเริ่มต้นในการเรนเดอร์โครงสร้าง UI หลักของแอปพลิเคชัน
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. Toast: คอมโพเนนต์แสดงกล่องข้อความแจ้งเตือนมุมบนขวา (เช่น "บันทึกสำเร็จ", "เข้าสู่ระบบล้มเหลว")
 * 2. ConfirmModal: คอมโพเนนต์แสดงกล่องยืนยันการทำรายการแบบป๊อปอัปกลางหน้าจอ (เช่น ยืนยันการลบ, ออกจากระบบ)
 * 3. AppContent: ส่วนเลือกระหว่างหน้า Login, ForceChange (บังคับเปลี่ยนรหัสผ่าน), และ MainFrame (หน้าจอกระดานควบคุมหลัก)
 * 4. App: จุดห่อหุ้ม AppProvider เพื่อส่งต่อสเตทฐานข้อมูลจำลองส่วนกลางไปยังคอมโพเนนต์ลูก
 * ==========================================
 */
import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Login from "./pages/Login";
import ForceChange from "./pages/ForceChange";
import MainFrame from "./pages/MainFrame";
import Icon from "./components/common/Icon";
import { BtnSec } from "./components/common/Buttons";

const Toast: React.FC<{ msg: string; type: "success" | "error" | "info" }> = ({ msg, type }) => {
  const T = {
    success: { bg: "#166534", ic: "check-circle" },
    error: { bg: "#991B1B", ic: "alert-circle" },
    info: { bg: "#1E3A8A", ic: "info" }
  }[type] || { bg: "#1E3A8A", ic: "info" };

  return (
    <div
      className="fu"
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: T.bg,
        color: "#fff",
        padding: "12px 18px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 6px 28px rgba(0,0,0,.22)"
      }}
    >
      <Icon n={T.ic} s={{ fontSize: 19, color: "#fff" }} />
      {msg}
    </div>
  );
};

const ConfirmModal: React.FC<{
  title: string;
  msg: string;
  icon?: string;
  color?: string;
  okLabel?: string;
  onOk: () => void;
  onClose: () => void;
}> = ({ title, msg, icon, color, okLabel, onOk, onClose }) => {
  const c = color || "var(--accent)";
  const softBg = c === "#B42318" ? "#FFF2F2" : c === "#C2410C" ? "#FFF7ED" : "var(--accent-soft)";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,20,35,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 20,
        animation: "fadeIn .18s ease"
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fu"
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: "32px",
          width: 400,
          maxWidth: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,.18)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: softBg,
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16
            }}
          >
            <Icon n={icon || "alert-circle"} s={{ fontSize: 28, color: c }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</h3>
          <p style={{ fontSize: 14, color: "var(--text-mute)", lineHeight: 1.6, margin: 0 }}>{msg}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnSec onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>
            ยกเลิก
          </BtnSec>
          <button
            className="btn-pri"
            onClick={onOk}
            style={{
              flex: 1,
              height: 44,
              background: c,
              border: "none",
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            {okLabel || "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
};

// คอมโพเนนต์หลักที่ทำหน้าที่คัดเลือกหน้าจอ (Router Switcher) และแสดงผลกล่องเตือน (Alert Overlay)
const AppContent: React.FC = () => {
  // ดึงค่าเพจปัจจุบันและข้อความเตือนจากคอนเท็กซ์หลัก
  const { page, toast, confirm, closeConfirm } = useApp();

  return (
    <div
      style={{
        fontFamily: "'Sarabun','Segoe UI',sans-serif",
        minHeight: "100vh",
        background: "var(--bg)",
        transition: "background .2s"
      }}
    >
      {/* โหลดฟอนต์ภาษาไทย Sarabun จาก Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {/* แสดง Toast แจ้งเตือนมุมขวาบนเมื่อได้รับสเตทคำสั่ง */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {/* แสดงป๊อปอัปยืนยันการทำรายการทับหน้าจอปกติ */}
      {confirm && <ConfirmModal {...confirm} onClose={closeConfirm} />}

      {/* เลือกแสดงผลหน้าจอตามสถานะเพจปัจจุบัน */}
      {page === "login" && <Login />}
      {page === "force-change" && <ForceChange />}
      {page === "main" && <MainFrame />}
    </div>
  );
};

// จุดเริ่มต้นสูงสุดของแอปพลิเคชัน (Application Root) ทำหน้าที่ครอบ Provider ข้อมูล
export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
