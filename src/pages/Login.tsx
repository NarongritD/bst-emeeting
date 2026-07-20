/**
 * ==========================================
 * ไฟล์: Login.tsx
 * หน้าที่หลัก: หน้าจอเข้าสู่ระบบของผู้ใช้งาน (Login Screen)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ฟอร์มลงชื่อเข้าใช้งาน: กรอกอีเมล (Username) และรหัสผ่าน พร้อมปุ่มสลับการมองเห็นรหัสผ่าน
 * 2. บัญชีทดลองด่วน (Quick Logins): ปุ่มลัดสำหรับให้กรรมการ แอดมิน หรือผู้ใช้งานทั่วไป เข้าสู่ระบบทดสอบระบบจำลองได้ทันทีโดยไม่ต้องป้อนรหัสผ่านเอง
 * 3. ระบบลืมรหัสผ่าน (Forgot Password Modal): ป๊อปอัปแจ้งวิธีรีเซ็ทรหัสผ่านผ่านแอดมินระบบ
 * ==========================================
 */
import React, { useState } from "react";
// นำเข้าคอนเท็กซ์หลัก และบัญชีล็อกอินด่วนจาก AppContext
import { useApp, QUICK_LOGINS } from "../context/AppContext";
// นำเข้าโมดูลไอคอนย่อย
import Icon from "../components/common/Icon";
// นำเข้า Modal ป๊อปอัปส่วนกลาง
import Modal from "../components/common/Modal";
// นำเข้าช่องป้อนข้อมูลอินพุตเลย์เอาท์
import { FL } from "../components/common/FormFields";
// นำเข้าแจ้งเตือนความผิดพลาด
import { AlertBox } from "../components/common/AlertBox";
// นำเข้าปุ่มสีหลัก (BtnPri) และปุ่มสีรอง (BtnSec)
import { BtnPri, BtnSec } from "../components/common/Buttons";
// นำเข้าโมเดลประเภทข้อมูลผู้ใช้
import type { User } from "../utils/types";

// สไตล์คลาสช่องป้อนข้อมูลอินพุต
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

// คอมโพเนนต์หลักล็อกอินเข้าสู่ระบบ
export const Login: React.FC = () => {
  // ดึงฐานข้อมูลจำลองส่วนกลาง และฟังก์ชันการล็อกอินจากคอนเท็กซ์
  const { db, updateDB, handleLogin, showToast } = useApp();
  // สเตทสำหรับรับค่านำเข้าอีเมลและรหัสผ่านจากพนักงาน
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // สเตทสลับการซ่อน/แสดงรหัสผ่านในฟิลด์อินพุต
  const [showPw, setShowPw] = useState(false);
  // สเตทเก็บข้อมูลความผิดพลาดการตรวจสอบล็อกอิน
  const [err, setErr] = useState("");

  // ── สเตทการตรวจสอบบอทอัตโนมัติ (CAPTCHA "I'm Not a Robot") ──
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [validatedUser, setValidatedUser] = useState<User | null>(null);

  const resetCaptcha = () => {
    setShowCaptcha(false);
    setCaptchaChecked(false);
    setValidatedUser(null);
  };

  // ── สเตทการจัดการเรื่องลืมรหัสผ่าน (Forgot Password Modal) ──
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmpId, setForgotEmpId] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // ฟังก์ชันดำเนินการตรวจสอบข้อมูลล็อกอินหลักเมื่อกดปุ่ม Submit ฟอร์ม
  const doLogin = (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าจอเบราว์เซอร์
    setErr("");
    
    // ตรวจสอบค่าว่างของช่องนำเข้าข้อมูล
    if (!email.trim() || !password.trim()) {
      setErr("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    // ทำการค้นหาผู้ใช้ที่ระบุอีเมลตรงกันในระบบฐานข้อมูล
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      setErr("อีเมลไม่ถูกต้อง");
      resetCaptcha();
      return;
    }
    
    // ตรวจสอบสถานะบัญชีว่าถูกบล็อกหรือพ้นสภาพการทำงาน (disabled) หรือไม่
    if (user.status === "disabled") {
      setErr("บัญชีนี้ถูกปิดใช้งานชั่วคราว กรุณาติดต่อแอดมิน");
      resetCaptcha();
      return;
    }

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    if (user.password !== password) {
      setErr("รหัสผ่านไม่ถูกต้อง");
      resetCaptcha();
      return;
    }

    // หากตรวจสอบ Username/Password ถูกต้องเรียบร้อยแล้ว
    if (!showCaptcha) {
      // แสดงปุ่มติ๊กเลือก CAPTCHA I'm Not a Robot (เงื่อนไข 1.1 และ 1.2)
      setValidatedUser(user);
      setShowCaptcha(true);
      return;
    }

    // หากขึ้นช่อง CAPTCHA แล้วแต่ผู้ใช้ยังไม่ได้ติ๊กเลือก
    if (!captchaChecked) {
      setErr("กรุณาติ๊กช่อง I'm Not a Robot เพื่อเข้าสู่ระบบ");
      return;
    }

    // อนุญาตให้เข้าสู่ระบบได้หลังจากผ่านการตรวจสอบและติ๊ก CAPTCHA ครบถ้วน (เงื่อนไข 1.3)
    handleLogin(user);
  };

  // ฟังก์ชันการเข้าสู่ระบบด่วนพิเศษ (Quick Login) สำหรับการทดลองในเครื่องจำลอง
  const doQuickLogin = (roleEmail: string) => {
    const user = db.users.find((u) => u.email === roleEmail);
    if (user) {
      // ตรวจสอบบัญชีว่าโดนระงับใช้งานอยู่หรือไม่
      if (user.status === "disabled") {
        showToast("บัญชีนี้ถูกปิดใช้งานอยู่", "error");
        return;
      }
      // ข้ามหน้าจอให้ตั้งรหัสใหม่ในการล็อกอินด่วนเพื่อให้ผู้ดูแลระบบตรวจสอบโปรแกรมง่ายขึ้น
      handleLogin({ ...user, isFirstLogin: false });
      showToast(`เข้าสู่ระบบด่วนสำเร็จในฐานะ: ${user.role}`);
    }
  };

  // ฟังก์ชันยื่นขอความช่วยเหลือรีเซ็ทรหัสผ่านผู้ใช้งาน
  const doResetPassword = () => {
    setForgotErr("");
    
    // ตรวจเช็ครหัสพนักงานและข้อจำกัดการกรอกข้อมูล
    if (!forgotEmpId.trim()) {
      setForgotErr("กรุณากรอกรหัสพนักงาน");
      return;
    }
    if (!/^\d+$/.test(forgotEmpId)) {
      setForgotErr("รหัสพนักงานต้องเป็นตัวเลขเท่านั้น");
      return;
    }
    if (forgotEmpId.length > 3) {
      setForgotErr("รหัสพนักงานไม่เกิน 3 หลัก");
      return;
    }
    if (!forgotEmail.trim()) {
      setForgotErr("กรุณากรอกอีเมล");
      return;
    }

    // ตรวจสอบความถูกต้องของคู่ข้อมูลรหัสพนักงานกับอีเมลของพนักงานคนนั้นๆ
    const user = db.users.find(
      (u) =>
        u.empId === forgotEmpId.trim().padStart(3, "0") &&
        u.email.toLowerCase() === forgotEmail.trim().toLowerCase()
    );

    if (!user) {
      setForgotErr("รหัสพนักงานหรืออีเมลไม่ตรงกับข้อมูลในระบบ");
      return;
    }

    if (user.status === "disabled") {
      setForgotErr("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อแอดมิน");
      return;
    }

    // ทำการรีเซ็ทรหัสผ่านกลับไปเป็นรหัสตั้งต้น '12345' และบังคับเปลี่ยนเมื่อล็อกอินครั้งแรก
    const now = new Date().toISOString();
    updateDB({
      ...db,
      users: db.users.map((u) =>
        u.id === user.id ? { ...u, password: "12345", isFirstLogin: true, lastPasswordChange: now } : u
      )
    });

    setForgotSuccess(true);
    showToast("รีเซ็ทรหัสผ่านสำเร็จ");
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
      {/* คอนเทนเนอร์ฟอร์มล็อกอิน */}
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
        {/* แสดงส่วนหัวแบรนด์โลโก้องค์กร */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <img
            src="/logo.png"
            alt="Blue System Technology Logo"
            style={{
              width: 280,
              height: 110,
              objectFit: "contain",
              marginBottom: 16
            }}
          />
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "var(--text)", margin: "0 0 4px", textAlign: "center" }}>
            ระบบจองห้องประชุมองค์กร
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0, textAlign: "center" }}>
            BST e-Meeting portal
          </p>
        </div>

        {/* แสดงส่วนข้อความแจ้งตระหนักหากมีความผิดพลาดในการกรอกข้อมูล */}
        {err && <AlertBox type="error" msg={err} style={{ marginBottom: 18 }} />}

        {/* ฟอร์มนำข้อมูลเข้าสู่ระบบ */}
        <form onSubmit={doLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* ฟิลด์กรอกข้อมูลอีเมลผู้ใช้ */}
          <FL label="อีเมล *">
            <div style={{ position: "relative" }}>
              <input
                style={{ ...IS, paddingLeft: 42 }}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (showCaptcha) resetCaptcha();
                }}
              />
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                <Icon n="user" s={{ fontSize: 16, color: "var(--text-ghost)" }} />
              </span>
            </div>
          </FL>

          {/* ฟิลด์กรอกข้อมูลรหัสผ่าน พร้อมไอคอนเปิด/ปิดตาเพื่อส่องรหัส */}
          <FL label="รหัสผ่าน *">
            <div style={{ position: "relative" }}>
              <input
                style={{ ...IS, paddingLeft: 42, paddingRight: 46 }}
                type={showPw ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (showCaptcha) resetCaptcha();
                }}
              />
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                <Icon n="lock" s={{ fontSize: 16, color: "var(--text-ghost)" }} />
              </span>
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
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
                <Icon n={showPw ? "eye-off" : "eye"} s={{ fontSize: 18, color: "var(--text-faint)" }} />
              </button>
            </div>
          </FL>

          {/* ลิงก์สำหรับกดเปิด Modal สื่อสารระบบลืมรหัสผ่าน */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6 }}>
            <button
              type="button"
              onClick={() => {
                setForgotOpen(true);
                setForgotEmpId("");
                setForgotEmail("");
                setForgotErr("");
                setForgotSuccess(false);
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: 12.5,
                color: "var(--accent)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0
              }}
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          {/* แผงแสดงผลกล่อง CAPTCHA "I'm Not a Robot" ในสไตล์กูเกิลคลาสสิก */}
          {showCaptcha && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--surface-2)",
                border: "1.5px solid var(--border-2)",
                borderRadius: 10,
                padding: "12px 14px",
                marginTop: 6,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  disabled={captchaChecked || captchaLoading}
                  onClick={() => {
                    setCaptchaLoading(true);
                    setTimeout(() => {
                      setCaptchaLoading(false);
                      setCaptchaChecked(true);
                      if (validatedUser) {
                        setTimeout(() => {
                          handleLogin(validatedUser);
                        }, 400);
                      }
                    }, 800);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: captchaChecked ? "none" : "2px solid #C3C3C3",
                    background: captchaChecked ? "#15803D" : "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: captchaChecked ? "default" : "pointer",
                    padding: 0,
                    outline: "none"
                  }}
                >
                  {captchaLoading ? (
                    <Icon n="loader" s={{ fontSize: 14, color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                  ) : captchaChecked ? (
                    <Icon n="check" s={{ fontSize: 16, color: "#FFF", fontWeight: "bold" }} />
                  ) : null}
                </button>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-sub)", userSelect: "none" }}>
                  I'm not a robot (ฉันไม่ใช่โปรแกรมอัตโนมัติ)
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <img
                  src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                  alt="reCAPTCHA"
                  style={{ width: 24, height: 24, opacity: 0.8 }}
                />
                <span style={{ fontSize: 8, color: "var(--text-ghost)", fontWeight: 600 }}>reCAPTCHA</span>
              </div>
            </div>
          )}

          {/* ปุ่มบันทึกส่งล็อกอิน */}
          <BtnPri
            type="submit"
            icon="login"
            style={{
              marginTop: 6,
              height: 46,
              opacity: showCaptcha && !captchaChecked ? 0.65 : 1,
              cursor: showCaptcha && !captchaChecked ? "not-allowed" : "pointer"
            }}
          >
            เข้าสู่ระบบ
          </BtnPri>
        </form>

        {/* แผงล็อกอินด่วนพิเศษสำหรับการสาธิต (Quick Login Grid) */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--border-soft)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", textAlign: "center", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
            เข้าสู่ระบบด่วน (Quick Login)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {QUICK_LOGINS.map((q) => (
              <button
                key={q.label}
                onClick={() => doQuickLogin(q.email)}
                style={{
                  padding: "9px 6px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border-2)",
                  background: "var(--surface-2)",
                  color: "var(--text-sub)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transition: "all .12s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-2)")}
              >
                <Icon n={q.label === "แอดมิน" ? "shield" : q.label === "รายงาน" ? "bar-chart" : "user"} s={{ fontSize: 14, color: "var(--accent)" }} />
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* บล็อกสำหรับเรนเดอร์หน้าต่างลืมรหัสผ่าน (Forgot Password Modal Popup) */}
      {forgotOpen && (
        <Modal onClose={() => setForgotOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n="key" s={{ fontSize: 20, color: "var(--accent)" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 2, margin: "0 0 2px" }}>ลืมรหัสผ่าน</h3>
              <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>กรอกรหัสพนักงานและอีเมลเพื่อรีเซ็ทรหัสผ่าน</p>
            </div>
          </div>

          {/* เงื่อนไขแสดงผลข้อความยืนยันความสำเร็จกรณีรีเซ็ทรหัสเสร็จสิ้น */}
          {forgotSuccess ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 6px" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ECFDF5", color: "#15803D", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon n="check" s={{ fontSize: 24, color: "#15803D" }} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4, margin: "0 0 4px" }}>รีเซ็ทรหัสผ่านสำเร็จ</h4>
              <p style={{ fontSize: 13.5, color: "var(--text-sub)", textAlign: "center", lineHeight: 1.6, marginBottom: 20, margin: "0 0 20px" }}>
                รหัสผ่านของคุณถูกตั้งค่าเป็น <strong style={{ color: "var(--accent)", fontSize: 14 }}>12345</strong> เรียบร้อยแล้ว
                <br />
                กรุณาเข้าสู่ระบบด้วยรหัสนี้และทำตามขั้นตอนตั้งรหัสใหม่
              </p>
              <BtnPri onClick={() => setForgotOpen(false)}>
                ตกลง เข้าสู่ระบบ
              </BtnPri>
            </div>
          ) : (
            // แสดงฟอร์มรับรหัสพนักงานเพื่อใช้เปรียบเทียบข้อมูลในการขอเปลี่ยนรหัส
            <div>
              {forgotErr && <AlertBox type="error" msg={forgotErr} style={{ marginBottom: 16 }} />}

              <FL label="รหัสพนักงาน *" error={forgotErr.includes("พนักงาน") ? " " : undefined}>
                <input
                  style={IS}
                  placeholder="เช่น 001"
                  maxLength={3}
                  value={forgotEmpId}
                  onChange={(e) => setForgotEmpId(e.target.value.replace(/\D/g, ""))}
                />
              </FL>

              <FL label="อีเมลบัญชี *" error={forgotErr.includes("เมล") ? " " : undefined}>
                <input
                  style={IS}
                  type="email"
                  placeholder="email@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </FL>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <BtnSec onClick={() => setForgotOpen(false)} icon="x">
                  ยกเลิก
                </BtnSec>
                <BtnPri onClick={doResetPassword} icon="key">
                  รีเซ็ทรหัสผ่าน
                </BtnPri>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Login;
