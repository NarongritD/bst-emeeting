/**
 * ==========================================
 * ไฟล์: MainFrame.tsx
 * หน้าที่หลัก: โครงสร้าง Layout หลักของแอปพลิเคชัน (Shell Layout)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. แถบเมนูด้านข้าง (Sidebar): ควบคุมเมนูย่อยและตรวจสอบระดับสิทธิ์การแสดงผลเมนูแอดมิน (จัดการห้อง/จัดการผู้ใช้)
 * 2. ส่วนหัวด้านบน (Header): แสดงชื่อเพจปัจจุบัน, สเตทการจองด่วน, ธีมเปลี่ยนสี (Light/Dark Mode Toggle) และข้อมูลย่อโปรไฟล์ผู้ใช้งาน
 * 3. พื้นที่เนื้อหาหลัก (Content Pane): ควบคุมการเปลี่ยนคอมโพเนนต์ตามเมนูนำทาง (`Dashboard`, `Booking`, `Agenda`, `MOM` ฯลฯ)
 * ==========================================
 */
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Icon from "../components/common/Icon";
import { Avatar } from "../components/common/Avatar";
import Dashboard from "./Dashboard";
import Users from "./Users";
import Rooms from "./Rooms";
import Booking from "./Booking";
import Agenda from "./Agenda";
import MOM from "./MOM";
import Reports from "./Reports";
import Profile from "./Profile";
import Modal from "../components/common/Modal"; // นำเข้า Modal ย่อยส่วนกลางสำหรับคู่มือ

export const MainFrame: React.FC = () => {
  const {
    currentUser,
    sidebarOpen,
    setSidebarOpen,
    activeMenu,
    menuSeq,
    navigateMenu,
    handleLogout,
    mode,
    setMode,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications
  } = useApp();

  // ── สเตทการแจ้งเตือน (Notifications States) ──
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ปิดป๊อปอัพแจ้งเตือนเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // ── เมนูย่อยแบบพับเก็บได้ (Collapsible Submenus) ──
  const [meetingExpanded, setMeetingExpanded] = useState(true);
  const [settingExpanded, setSettingExpanded] = useState(true);
  // ตรวจจับหน้าจออุปกรณ์พกพา / มือถือ
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ── สเตทคู่มือการใช้งาน (User Manual Modal States) ──
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState("dashboard");

  // ฟังก์ชันเลือกเปลี่ยนหน้าเพจย่อย (และสั่งซ่อน Sidebar เมื่ออยู่บนมือถือ)
  const selectMenu = (menu: any) => {
    navigateMenu(menu);
    if (isMobile) setSidebarOpen(false);
  };

  // ตรวจจับขนาดหน้าต่างเบราว์เซอร์เพื่อปรับการแสดงผลแถบด้านข้างอัตโนมัติ
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // ซ่อนเมนูเริ่มต้นเมื่อเปิดด้วยมือถือ
      } else {
        setSidebarOpen(true);  // แสดงเมนูเริ่มต้นเมื่ออยู่บนเดสก์ท็อป
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // หากไม่มีผู้ใช้ลงชื่อเข้าใช้ในเซสชัน ให้ยกเลิกการแสดงผลโครงร่างหลัก
  if (!currentUser) return null;

  // ฟังก์ชันสลับธีมระหว่างสว่าง/มืด (Light Mode vs Dark Mode)
  const toggleTheme = () => setMode((m) => (m === "light" ? "dark" : "light"));

  // ฟังก์ชันเลือกคอมโพเนนต์เพจย่อยที่จะเรนเดอร์ตามเมนูนำทางที่กดเลือก
  const renderActiveComponent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard key={menuSeq} />;
      case "users":
        return <Users key={menuSeq} />;
      case "rooms":
        return <Rooms key={menuSeq} />;
      case "booking":
        return <Booking key={menuSeq} />;
      case "agenda":
        return <Agenda key={menuSeq} />;
      case "mom":
        return <MOM key={menuSeq} />;
      case "reports":
        return <Reports key={menuSeq} />;
      case "profile":
        return <Profile key={menuSeq} />;
      default:
        return <Dashboard key={menuSeq} />;
    }
  };

  // ดึงชื่อหัวข้อของหน้าเมนูปัจจุบันเป็นภาษาไทยสำหรับแสดงผลที่ Header
  const getMenuTitle = () => {
    switch (activeMenu) {
      case "dashboard":
        return "หน้าหลัก";
      case "agenda":
        return "บันทึกการประชุม";
      case "mom":
        return "สรุปการประชุม";
      case "reports":
        return "รายงาน";
      case "booking":
        return "จองห้องประชุม";
      case "users":
        return "ผู้ใช้งานระบบ";
      case "rooms":
        return "ห้องประชุม";
      case "profile":
        return "ข้อมูลส่วนตัว";
      default:
        return "หน้าหลัก";
    }
  };

  // ประกอบชื่อผู้ใช้เต็มรูปแบบ
  const userFullName = `${currentUser.firstName} ${currentUser.lastName}`;

  // ดึงตัวอักษรย่อภาษาไทยสำหรับแสดงผลโปรไฟล์ (เช่น สมชาย ใจดี -> สใจ)
  const getThaiInitials = () => {
    const f = currentUser.firstName.trim().charAt(0) || "";
    const l = currentUser.lastName.trim().charAt(0) || "";
    return `${f}${l}`;
  };

  // ข้อมูลแท็บคู่มือการใช้งานของแต่ละส่วนระบบ
  const helpTabs = [
    { id: "dashboard", label: "หน้าหลัก & แดชบอร์ด", icon: "home" },
    { id: "booking", label: "จองห้องประชุม", icon: "calendar-event" },
    { id: "agenda", label: "บันทึกการประชุม", icon: "clipboard-text" },
    { id: "mom", label: "สรุปการประชุม (MOM)", icon: "file-description" },
    { id: "reports", label: "รายงานและการวิเคราะห์", icon: "report-analytics" },
    { id: "users", label: "จัดการผู้ใช้งาน (แอดมิน)", icon: "users" },
    { id: "rooms", label: "จัดการห้องประชุม (แอดมิน)", icon: "building" },
  ];

  // ฟังก์ชันเรนเดอร์เนื้อหาคำอธิบายการใช้งานย่อยรายแท็บ
  const renderHelpContent = () => {
    switch (activeHelpTab) {
      case "dashboard":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>📊 เมนู หน้าหลัก & แดชบอร์ด (Overview Dashboard)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              แดชบอร์ดหลักสำหรับแสดงข้อมูลสรุปภาพรวมทั้งหมดของระบบแบบเรียลไทม์ เพื่อให้พนักงานและแอดมินเข้าใจสถิติการใช้งานได้ในพริบตาเดียว
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>คุณสมบัติเด่น:</h5>
            <ul style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li><strong>การ์ดสถิติสะสม:</strong> แสดงจำนวนผู้ใช้ทั้งหมดในระบบ, จำนวนห้องประชุมที่มี, จำนวนผู้ดูแลระบบ (Admin) และรายงานสถิติวิเคราะห์</li>
              <li><strong>ห้องประชุมในระบบ:</strong> แสดงรายชื่อห้องประชุมทั้งหมด พร้อมระบุสถานที่ ชั้นของตารางจัดตั้ง และป้ายกำกับสถานะความพร้อมใช้งานในปัจจุบัน (เช่น <span style={{ color: "#16A34A", fontWeight: 600 }}>● พร้อมใช้งาน</span>)</li>
              <li><strong>ทางลัดด่วน:</strong> สามารถคลิกที่แถบห้องประชุมเพื่อดูรายละเอียดหรือปฏิทินเวลาการจองของห้องนั้นได้โดยตรง</li>
            </ul>
          </div>
        );
      case "booking":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>📅 เมนู จองห้องประชุม (Meeting Room Booking)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              ระบบจองห้องประชุมอัจฉริยะ แสดงตารางเวลาปฏิทินของแต่ละห้องประชุม และมีระบบป้องกันความขัดแย้งด้านเวลาชนกันโดยอัตโนมัติ
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>ขั้นตอนการใช้งาน:</h5>
            <ol style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li>เลือกห้องประชุมและสลับมุมมองปฏิทิน (รายสัปดาห์ / รายเดือน / ตารางเวลา) ตามที่ต้องการ</li>
              <li>กดปุ่ม <strong>"จองห้องประชุมใหม่"</strong> หรือลากเมาส์คลุมช่วงเวลาว่างบนปฏิทินเพื่อเปิดฟอร์มจอง</li>
              <li>กรอกรายละเอียดให้ครบถ้วน: หัวข้อประชุม, วัตถุประสงค์, วันที่, และเวลาเริ่ม-สิ้นสุด</li>
              <li>ระบุสถานที่: รูปแบบ In-person (เลือกห้องประชุมในบริษัท) หรือรูปแบบ Online (ระบบจะสร้างช่องกรอกลิงก์การประชุมให้)</li>
              <li>เลือกพนักงานที่จะเชิญเข้าร่วมประชุม โดยระบบจะแสดงชื่อและแผนกให้อย่างชัดเจน</li>
              <li><strong>การตรวจสอบเวลาชน (Collision Prevention):</strong> หากเลือกห้องและช่วงเวลาที่ถูกผู้อื่นจองไว้ก่อนแล้ว ระบบจะแจ้งเตือนบล็อกปุ่มบันทึกทันที เพื่อป้องกันการจองทับซ้อน</li>
            </ol>
          </div>
        );
      case "agenda":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>📝 เมนู บันทึกการประชุม (Agenda & Invitations)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              หน้าจอสำหรับจัดการหัวข้อการประชุม, ตรวจสอบรายชื่อผู้มีสิทธิ์เข้าร่วม และดาวน์โหลดจดหมายเชิญประชุม PDF
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>คุณสมบัติหลัก:</h5>
            <ul style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li><strong>พิมพ์จดหมายเชิญประชุม:</strong> คลิกไอคอนรูปเครื่องพิมพ์ เพื่อดาวน์โหลดเอกสารจดหมายเชิญประชุมที่จัดเอกสารรูปแบบฟอร์มเป็นทางการของบริษัท (บันทึกข้อความ) ส่งให้พนักงานภายนอกหรือผู้ใหญ่ได้ทันที</li>
              <li><strong>จัดการเอกสารแนบ:</strong> ผู้จองประชุมสามารถเพิ่มหัวข้ออภิปรายย่อย (Agenda Items) หรือแนบลิงก์ไฟล์เอกสารประกอบวาระสำหรับการเตรียมตัวล่วงหน้าได้</li>
              <li><strong>ตรวจสอบรายละเอียดวาระ:</strong> แสดงประเภทการประชุม (ประชุมใหม่ / ประชุมต่อเนื่อง) และระดับชั้นความลับของข้อมูลการจอง</li>
            </ul>
          </div>
        );
      case "mom":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>🤝 เมนู สรุปการประชุม (MOM & Action Items)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              ฟังก์ชันบันทึกรายงานมติการประชุมและจ่ายงานติดตามผลแก่พนักงาน เพื่อให้เป้าหมายมีตัวชี้วัดความคืบหน้าต่อเนื่อง
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>วิธีการใช้งานและเงื่อนไขการทำงาน:</h5>
            <ul style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li><strong>เงื่อนไขการเขียนบันทึก:</strong> ผู้ใช้จะเริ่มกดปุ่ม <strong>"แก้ไข MOM"</strong> ได้ก็ต่อเมื่อเวลาการประชุมตามวาระนั้น **จบลงแล้วในอดีตเท่านั้น** (หากยังไม่เริ่มจะแสดงสัญลักษณ์ <span>● รอการประชุมเสร็จสิ้น</span> และล็อกฟังก์ชันไว้เพื่อความปลอดภัย)</li>
              <li><strong>บันทึกมติรายวาระย่อย:</strong> สามารถบันทึกหัวข้อข้อสรุปแยกตามวาระย่อยที่กำหนดไว้ในขั้นตอนสร้าง Agenda ได้</li>
              <li><strong>มอบหมายงานเพิ่มเติม (Action Items):</strong> ระบุชื่องาน, วันกำหนดส่ง, และเลือกพนักงานผู้รับผิดชอบงานนั้นๆ ได้ทันที</li>
              <li><strong>พิมพ์รายงานสรุปมติ:</strong> หลังจากบันทึกและเปลี่ยนสถานะเป็น "เผยแพร่แล้ว" ระบบจะเปิดให้กดดาวน์โหลดสรุป MOM เป็นไฟล์ PDF จัดหน้าสวยงามเรียบร้อย</li>
            </ul>
          </div>
        );
      case "reports":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>📈 เมนู รายงานและการวิเคราะห์ (Analytics Reports)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              ส่วนวิเคราะห์และประมวลผลข้อมูลการจองห้องประชุม แสดงผลเป็นกราฟแท่งสถิติสวยงามเพื่อวิเคราะห์การใช้ทรัพยากรขององค์กร
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>รายละเอียดสถิติ:</h5>
            <ul style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li><strong>กราฟชั่วโมงสะสมรายแผนก:</strong> แสดงผลกราฟแท่ง SVG แอนิเมชันสวยงาม ระบุผลรวมของเวลา (ชั่วโมง) ที่พนักงานแต่ละแผนกจองใช้บริการห้องประชุม</li>
              <li><strong>สลับช่วงเวลาคำนวณ:</strong> มีปุ่มฟิลเตอร์สลับดูสถิติในรูปแบบ **รายสัปดาห์ (Weekly)** หรือ **รายเดือน (Monthly)** เพื่อช่วยประเมินแผนการขยายห้องประชุมในอนาคต</li>
            </ul>
          </div>
        );
      case "users":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>👥 เมนู จัดการผู้ใช้งานระบบ (User Directory - เฉพาะแอดมิน)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              ฟังก์ชันควบคุมสิทธิ์ ข้อมูลพนักงาน และการกำหนดบทบาทในการจัดการแอปพลิเคชัน
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>หน้าที่ของแอดมิน:</h5>
            <ul style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li><strong>เพิ่มผู้ใช้แบบรายคน / นำเข้าไฟล์ (Import Excel):</strong> สามารถกรอกข้อมูลทีละคน หรือคลิกนำเข้าข้อมูลรายชื่อพนักงานจำนวนมากจากเทมเพลตไฟล์ Excel ได้ทันที</li>
              <li><strong>บล็อกการใช้งานชั่วคราว (Disable):</strong> หากพนักงานพ้นสภาพหรือสิ้นสุดสัญญาจ้าง สามารถกดปิดบัญชีนั้นได้เพื่อความปลอดภัยของระบบ</li>
              <li><strong>รีเซ็ทรหัสผ่านด่วน:</strong> กรณีพนักงานลืมรหัสผ่าน แอดมินสามารถกดปุ่ม "รีเซ็ทรหัสผ่าน" เพื่อให้ระบบตั้งค่ารหัสกลับเป็น `12345` และบังคับพนักงานตั้งรหัสผ่านใหม่ในการล็อกอินครั้งแรก</li>
            </ul>
          </div>
        );
      case "rooms":
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>🏢 เมนู จัดการห้องประชุม (Room Settings - เฉพาะแอดมิน)</h4>
            <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginBottom: 14 }}>
              ส่วนสำหรับเพิ่ม ลด หรือแก้ไขรายละเอียดคุณสมบัติทางกายภาพของห้องประชุมแต่ละห้อง
            </p>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>รายละเอียดการจัดการ:</h5>
            <ul style={{ paddingLeft: 18, fontSize: 12.5, color: "var(--text-sub)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
              <li><strong>ข้อมูลทั่วไปของห้อง:</strong> แอดมินระบุชื่อห้อง, พิกัดสถานที่, ชั้น และจำนวนความจุสูงสุดรองรับผู้เข้าร่วมประชุม</li>
              <li><strong>อุปกรณ์อำนวยความสะดวก:</strong> ติ๊กเลือกรายการอุปกรณ์ที่มีในห้องจริง เช่น จอโทรทัศน์, เครื่องเสียง, กระดานไวท์บอร์ด, หรือไมโครโฟน เพื่อใช้เป็นข้อมูลช่วยให้พนักงานใช้ตัดสินใจจองตามประเภทงาน</li>
              <li><strong>เปิด/ปิดห้องใช้บริการ:</strong> สามารถเปิด-ปิด ปิดปรับปรุงห้อง เพื่อระงับไม่ให้มีการจองชั่วคราวได้ในกรณีห้องชำรุด</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)", transition: "background .2s" }}>
      {/* Backdrop overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(4px)",
            zIndex: 199,
            animation: "fadeIn .2s ease"
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className="sidebar-glass"
        style={{
          width: isMobile ? 260 : (sidebarOpen ? 260 : 72),
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "transform .22s cubic-bezier(0.4, 0, 0.2, 1), width .22s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: isMobile ? 200 : 100,
          position: isMobile ? "fixed" : "relative",
          left: isMobile ? 0 : undefined,
          top: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
          boxShadow: isMobile && sidebarOpen ? "var(--shadow-lg)" : "none",
          flexShrink: 0
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            height: 64,
            padding: sidebarOpen ? "0 16px 0 20px" : "0",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "space-between" : "center",
            borderBottom: "1px solid var(--border-soft)",
            overflow: "hidden"
          }}
        >
          {sidebarOpen ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Logo block */}
                <img
                  src="/logo.png"
                  alt="BST Logo"
                  style={{
                    width: 42,
                    height: 42,
                    objectFit: "contain",
                    borderRadius: 8,
                    flexShrink: 0
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text)", lineHeight: "1.2" }}>
                    BST e-Meeting
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                    ระบบจัดการประชุม
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-soft)",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8,
                  color: "var(--text-sub)",
                  transition: "background .15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              >
                <Icon n="sidebar-collapse" s={{ fontSize: 15, color: "var(--text-sub)" }} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-soft)",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
                borderRadius: 8,
                color: "var(--text-sub)",
                transition: "background .15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            >
              <Icon n="sidebar-expand" s={{ fontSize: 15, color: "var(--text-sub)" }} />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
          {sidebarOpen ? (
            <>
              {/* Section 1: เมนูหลัก */}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", padding: "12px 12px 6px", letterSpacing: "0.03em" }}>
                เมนูหลัก
              </div>

              {/* 1.1 หน้าหลัก */}
              <button
                onClick={() => selectMenu("dashboard")}
                className={`row-hover ${activeMenu === "dashboard" ? "active-menu" : ""}`}
                style={{ ...MS, background: activeMenu === "dashboard" ? "var(--accent-soft)" : "transparent", color: activeMenu === "dashboard" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "dashboard" ? 700 : 500 }}
              >
                <Icon n="home" s={{ fontSize: 18, color: activeMenu === "dashboard" ? "var(--accent)" : "var(--text-mute)" }} />
                <span>หน้าหลัก</span>
              </button>

              {/* 1.2 การประชุม (Collapsible Parent) */}
              <div>
                <button
                  onClick={() => setMeetingExpanded(!meetingExpanded)}
                  className="row-hover"
                  style={{ ...MS, color: "var(--text-sub)", fontWeight: 500 }}
                >
                  <Icon n="calendar-event" s={{ fontSize: 18, color: "var(--text-mute)" }} />
                  <span style={{ flex: 1 }}>การประชุม</span>
                  <Icon n={meetingExpanded ? "chevron-up" : "chevron-down"} s={{ fontSize: 14, color: "var(--text-faint)" }} />
                </button>

                {meetingExpanded && (
                  <div style={SUB_CONTAINER}>
                    {/* บันทึกการประชุม (Agenda) */}
                    <button
                      onClick={() => selectMenu("agenda")}
                      className={`row-hover ${activeMenu === "agenda" ? "active-menu" : ""}`}
                      style={{ ...SUB_MS, color: activeMenu === "agenda" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "agenda" ? 700 : 500 }}
                    >
                      <Icon n="clipboard-text" s={{ fontSize: 16, color: activeMenu === "agenda" ? "var(--accent)" : "var(--text-mute)" }} />
                      <span>บันทึกการประชุม</span>
                    </button>

                    {/* สรุปการประชุม (MOM) */}
                    <button
                      onClick={() => selectMenu("mom")}
                      className={`row-hover ${activeMenu === "mom" ? "active-menu" : ""}`}
                      style={{ ...SUB_MS, color: activeMenu === "mom" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "mom" ? 700 : 500 }}
                    >
                      <Icon n="file-description" s={{ fontSize: 16, color: activeMenu === "mom" ? "var(--accent)" : "var(--text-mute)" }} />
                      <span>สรุปการประชุม</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 1.3 รายงาน */}
              <button
                onClick={() => selectMenu("reports")}
                className={`row-hover ${activeMenu === "reports" ? "active-menu" : ""}`}
                style={{ ...MS, background: activeMenu === "reports" ? "var(--accent-soft)" : "transparent", color: activeMenu === "reports" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "reports" ? 700 : 500 }}
              >
                <Icon n="report-analytics" s={{ fontSize: 18, color: activeMenu === "reports" ? "var(--accent)" : "var(--text-mute)" }} />
                <span>รายงาน</span>
              </button>

              {/* 1.4 จองห้องประชุม */}
              <button
                onClick={() => selectMenu("booking")}
                className={`row-hover ${activeMenu === "booking" ? "active-menu" : ""}`}
                style={{ ...MS, background: activeMenu === "booking" ? "var(--accent-soft)" : "transparent", color: activeMenu === "booking" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "booking" ? 700 : 500 }}
              >
                <Icon n="calendar-event" s={{ fontSize: 18, color: activeMenu === "booking" ? "var(--accent)" : "var(--text-mute)" }} />
                <span>จองห้องประชุม</span>
              </button>

              {/* Section 2: ตั้งค่า (Only show if has items or role admin) */}
              {currentUser.role === "แอดมิน" && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", padding: "18px 12px 6px", letterSpacing: "0.03em" }}>
                    ตั้งค่า
                  </div>

                  {/* 2.1 ตั้งค่า (Collapsible Parent) */}
                  <div>
                    <button
                      onClick={() => setSettingExpanded(!settingExpanded)}
                      className="row-hover"
                      style={{ ...MS, color: "var(--text-sub)", fontWeight: 500 }}
                    >
                      <Icon n="settings" s={{ fontSize: 18, color: "var(--text-mute)" }} />
                      <span style={{ flex: 1 }}>ตั้งค่า</span>
                      <Icon n={settingExpanded ? "chevron-up" : "chevron-down"} s={{ fontSize: 14, color: "var(--text-faint)" }} />
                    </button>

                    {settingExpanded && (
                      <div style={SUB_CONTAINER}>
                        {/* ผู้ใช้งานระบบ */}
                        <button
                          onClick={() => selectMenu("users")}
                          className={`row-hover ${activeMenu === "users" ? "active-menu" : ""}`}
                          style={{ ...SUB_MS, color: activeMenu === "users" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "users" ? 700 : 500 }}
                        >
                          <Icon n="users" s={{ fontSize: 16, color: activeMenu === "users" ? "var(--accent)" : "var(--text-mute)" }} />
                          <span>ผู้ใช้งานระบบ</span>
                        </button>

                        {/* ห้องประชุม */}
                        <button
                          onClick={() => selectMenu("rooms")}
                          className={`row-hover ${activeMenu === "rooms" ? "active-menu" : ""}`}
                          style={{ ...SUB_MS, color: activeMenu === "rooms" ? "var(--accent)" : "var(--text-sub)", fontWeight: activeMenu === "rooms" ? 700 : 500 }}
                        >
                          <Icon n="building" s={{ fontSize: 16, color: activeMenu === "rooms" ? "var(--accent)" : "var(--text-mute)" }} />
                          <span>ห้องประชุม</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Collapsed Sidebar Menu Icons (matches the mockup exactly) */
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", paddingTop: 8 }}>
              {/* Divider below collapse button */}
              <div style={{ width: 34, height: 1, background: "var(--border-soft)", marginBottom: 8 }} />

              {/* หน้าหลัก */}
              <button
                onClick={() => selectMenu("dashboard")}
                style={{
                  ...C_BUTTON,
                  background: activeMenu === "dashboard" ? "var(--accent-soft)" : "transparent"
                }}
                title="หน้าหลัก"
              >
                <Icon n="home" s={{ fontSize: 20, color: activeMenu === "dashboard" ? "var(--accent)" : "var(--text-mute)" }} />
              </button>

              {/* บันทึกการประชุม */}
              <button
                onClick={() => selectMenu("agenda")}
                style={{
                  ...C_BUTTON,
                  background: activeMenu === "agenda" ? "var(--accent-soft)" : "transparent"
                }}
                title="บันทึกการประชุม"
              >
                <Icon n="clipboard-text" s={{ fontSize: 20, color: activeMenu === "agenda" ? "var(--accent)" : "var(--text-mute)" }} />
              </button>

              {/* สรุปการประชุม */}
              <button
                onClick={() => selectMenu("mom")}
                style={{
                  ...C_BUTTON,
                  background: activeMenu === "mom" ? "var(--accent-soft)" : "transparent"
                }}
                title="สรุปการประชุม"
              >
                <Icon n="file-description" s={{ fontSize: 20, color: activeMenu === "mom" ? "var(--accent)" : "var(--text-mute)" }} />
              </button>

              {/* รายงาน */}
              <button
                onClick={() => selectMenu("reports")}
                style={{
                  ...C_BUTTON,
                  background: activeMenu === "reports" ? "var(--accent-soft)" : "transparent"
                }}
                title="รายงาน"
              >
                <Icon n="report-analytics" s={{ fontSize: 20, color: activeMenu === "reports" ? "var(--accent)" : "var(--text-mute)" }} />
              </button>

              {/* จองห้องประชุม */}
              <button
                onClick={() => selectMenu("booking")}
                style={{
                  ...C_BUTTON,
                  background: activeMenu === "booking" ? "var(--accent-soft)" : "transparent"
                }}
                title="จองห้องประชุม"
              >
                <Icon n="calendar-event" s={{ fontSize: 20, color: activeMenu === "booking" ? "var(--accent)" : "var(--text-mute)" }} />
              </button>

              {/* Divider and Admin settings (only for Admin role) */}
              {currentUser.role === "แอดมิน" && (
                <>
                  <div style={{ width: 34, height: 1, background: "var(--border-soft)", margin: "8px 0" }} />

                  {/* ผู้ใช้งานระบบ */}
                  <button
                    onClick={() => selectMenu("users")}
                    style={{
                      ...C_BUTTON,
                      background: activeMenu === "users" ? "var(--accent-soft)" : "transparent"
                    }}
                    title="ผู้ใช้งานระบบ"
                  >
                    <Icon n="users" s={{ fontSize: 20, color: activeMenu === "users" ? "var(--accent)" : "var(--text-mute)" }} />
                  </button>

                  {/* ห้องประชุม */}
                  <button
                    onClick={() => selectMenu("rooms")}
                    style={{
                      ...C_BUTTON,
                      background: activeMenu === "rooms" ? "var(--accent-soft)" : "transparent"
                    }}
                    title="ห้องประชุม"
                  >
                    <Icon n="building" s={{ fontSize: 20, color: activeMenu === "rooms" ? "var(--accent)" : "var(--text-mute)" }} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: sidebarOpen ? "14px 16px" : "14px 0",
            borderTop: "1px solid var(--border-soft)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            background: "var(--surface-2)"
          }}
        >
          {sidebarOpen ? (
            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
              {/* Soft initials badge avatar */}
              <div
                onClick={() => selectMenu("profile")}
                style={{
                  width: 38,
                  height: 38,
                  background: "var(--accent-soft2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "var(--accent)",
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                {getThaiInitials()}
              </div>

              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => selectMenu("profile")}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 1px" }}>
                  {userFullName}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                  {currentUser.role}
                </p>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Icon n="logout" s={{ fontSize: 16, color: "#B42318" }} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                onClick={() => selectMenu("profile")}
                style={{
                  width: 36,
                  height: 36,
                  background: "var(--accent-soft2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--accent)",
                  cursor: "pointer"
                }}
              >
                {getThaiInitials()}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Icon n="logout" s={{ fontSize: 16, color: "#B42318" }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top Header */}
        <header
          style={{
            height: 64,
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            zIndex: 90
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {isMobile && !sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8,
                  color: "var(--text)",
                  marginRight: 4
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Icon n="list" s={{ fontSize: 20, color: "var(--text)" }} />
              </button>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{getMenuTitle()}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* ปุ่มคู่มือการใช้งาน (User Manual Button) */}
            <button
              onClick={() => {
                // หากแท็บปัจจุบันเป็นหน้าจอแอดมิน แต่เข้าไม่ใช่สิทธิ์แอดมิน ให้เลือกแท็บแรกเริ่มต้นเพื่อความถูกต้องของสิทธิ์
                if ((activeMenu === "users" || activeMenu === "rooms") && currentUser.role !== "แอดมิน") {
                  setActiveHelpTab("dashboard");
                } else if (activeMenu === "profile") {
                  setActiveHelpTab("dashboard");
                } else {
                  setActiveHelpTab(activeMenu);
                }
                setShowHelpModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--surface-2)",
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--text-sub)",
                transition: "all .15s",
                height: 38
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-soft)";
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-sub)";
              }}
            >
              <Icon n="help-circle" s={{ fontSize: 15 }} />
              <span>คู่มือการใช้งาน</span>
            </button>

            {/* Header Theme Switcher */}
            <button
              onClick={toggleTheme}
              style={{
                width: 38,
                height: 38,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            >
              <Icon n={mode === "light" ? "moon" : "sun"} s={{ fontSize: 16, color: "var(--text-sub)" }} />
            </button>

            {/* Notification Bell */}
            {(() => {
              const myNotifications = notifications.filter(n => n.userId === currentUser.id);
              const unreadCount = myNotifications.filter(n => !n.isRead).length;

              return (
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    style={{
                      width: 38,
                      height: 38,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background .15s",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                    title="การแจ้งเตือน"
                  >
                    <Icon n="bell" s={{ fontSize: 16, color: "var(--text-sub)" }} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          background: "#EF4444",
                          color: "#FFFFFF",
                          borderRadius: "50%",
                          width: 17,
                          height: 17,
                          fontSize: 9.5,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1.5px solid var(--surface)"
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div
                      className="fu"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: 320,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        boxShadow: "0 10px 32px rgba(0,0,0,.15)",
                        zIndex: 1000,
                        padding: "12px 0"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px", borderBottom: "1px solid var(--border-soft)" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>การแจ้งเตือน ({myNotifications.length})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              markAllNotificationsAsRead();
                            }}
                            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                          >
                            อ่านแล้วทั้งหมด
                          </button>
                        )}
                      </div>
                      <div style={{ maxHeight: 280, overflowY: "auto" }}>
                        {myNotifications.length === 0 ? (
                          <div style={{ padding: "30px 16px", textAlign: "center" }}>
                            <Icon n="bell" s={{ fontSize: 28, color: "var(--text-ghost)", marginBottom: 8 }} />
                            <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: 0 }}>ไม่มีการแจ้งเตือนในขณะนี้</p>
                          </div>
                        ) : (
                          myNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.linkMenu) {
                                  navigateMenu(n.linkMenu, n.linkId);
                                }
                                setNotifOpen(false);
                              }}
                              style={{
                                padding: "11px 16px",
                                borderBottom: "1px solid var(--bg)",
                                cursor: "pointer",
                                background: n.isRead ? "transparent" : "var(--accent-soft2)",
                                transition: "background .15s",
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                textAlign: "left"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 12.5, fontWeight: n.isRead ? 600 : 700, color: "var(--text)" }}>{n.title}</span>
                                {!n.isRead && <span style={{ width: 6, height: 6, background: "var(--accent)", borderRadius: "50%", flexShrink: 0 }} />}
                              </div>
                              <span style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.4 }}>{n.message}</span>
                              <span style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>
                                {new Date(n.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} · {new Date(n.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      {myNotifications.length > 0 && (
                        <div style={{ padding: "10px 16px 0", borderTop: "1px solid var(--border-soft)", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              clearAllNotifications();
                            }}
                            style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                          >
                            ล้างทั้งหมด
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div
              onClick={() => selectMenu("profile")}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <Avatar user={currentUser} size={32} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sub)", display: "inline-block" }}>
                {currentUser.firstName}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>{renderActiveComponent()}</main>
      </div>

      {/* ── Modal คู่มือการใช้งานระบบแบบแท็บ (User Manual Pop-up Modal) ── */}
      {showHelpModal && (
        <Modal onClose={() => setShowHelpModal(false)} width={840}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n="help-circle" s={{ fontSize: 20, color: "var(--accent)" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>คู่มือการใช้งานระบบ</h3>
              <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: 0 }}>คำแนะนำการใช้งานอย่างย่อ ละเอียด เข้าใจง่าย แยกตามส่วนการทำงาน</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, height: 480, overflow: "hidden" }}>
            {/* แถบนำทางด้านข้างเมนูคู่มือ (Sidebar List Tabs) */}
            <div style={{ width: 220, borderRight: "1px solid var(--border-soft)", paddingRight: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {helpTabs
                // คัดกรองไม่แสดงคู่มือแอดมินหากพนักงานไม่มีสิทธิ์เข้าถึง (เพื่อความปลอดภัยและเรียบง่าย)
                .filter((t) => currentUser.role === "แอดมิน" || (!t.id.includes("users") && !t.id.includes("rooms")))
                .map((t) => {
                  const isActive = activeHelpTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveHelpTab(t.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: 8,
                        background: isActive ? "var(--accent-soft)" : "transparent",
                        color: isActive ? "var(--accent)" : "var(--text-sub)",
                        fontSize: 12.8,
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all .15s",
                        width: "100%"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "var(--surface-2)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Icon n={t.icon} s={{ fontSize: 14.5, color: isActive ? "var(--accent)" : "var(--text-mute)" }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                    </button>
                  );
                })}
            </div>

            {/* แผงแสดงผลคู่มือคำอธิบายการใช้งาน (Guide Info Content Panel) */}
            <div style={{ flex: 1, paddingLeft: 6, overflowY: "auto", paddingRight: 6 }}>
              {renderHelpContent()}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "#FFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity .15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Common Styles for navigation
const MS = {
  width: "100%",
  height: 42,
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "none",
  borderRadius: 10,
  fontSize: 13.5,
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "background .15s, color .15s",
  background: "transparent"
};

const SUB_MS = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "none",
  borderRadius: 8,
  fontSize: 12.8,
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "background .15s, color .15s",
  background: "transparent"
};

const SUB_CONTAINER = {
  marginLeft: 23,
  paddingLeft: 12,
  borderLeft: "1px solid var(--border-soft)",
  display: "flex",
  flexDirection: "column" as const,
  gap: 3,
  marginTop: 3,
  marginBottom: 6
};

const C_BUTTON = {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background .15s"
};

export default MainFrame;
