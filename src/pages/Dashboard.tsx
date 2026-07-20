/**
 * ==========================================
 * ไฟล์: Dashboard.tsx
 * หน้าที่หลัก: หน้าหลักและแผงควบคุมสถิติระบบ (System Overview)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. การ์ดสถิติ (Statistics Cards): แสดงจำนวนรวมผู้ใช้ทั้งหมด, ห้องประชุมทั้งหมด และสิทธิ์ต่างๆ
 * 2. รายชื่อห้องประชุม (Rooms Status List): ตารางสรุปรายชื่อห้องประชุม สถานที่ตั้ง อุปกรณ์ และสเตตัสการเปิด/ปิดใช้แบบเรียลไทม์
 * ==========================================
 */
import React from "react";
// นำเข้าคอนเท็กซ์ส่วนกลางเพื่อดึงข้อมูลผู้ใช้งานและห้องประชุมมาคำนวณ
import { useApp } from "../context/AppContext";
// นำเข้าไอคอนย่อยสำหรับการวาดกราฟิกการ์ดสถิติ
import Icon from "../components/common/Icon";
// นำเข้าป้ายแสดงสเตตัสห้องประชุมจากหน้าหลัก
import { RoomStatusBadge } from "./Rooms";

// คอมโพเนนต์หัวเรื่องของเพจย่อย (แสดงชื่องานและคำบรรยายใต้ชื่อ)
export const PageHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* ชื่องานหน้าเพจ */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>{title}</h1>
      {/* คำบรรยายอธิบายเพจ */}
      <p style={{ color: "var(--text-faint)", fontSize: 14 }}>{subtitle}</p>
    </div>
  );
};

// คอมโพเนนต์ย่อยสำหรับเรนเดอร์หัวข้อของการ์ดข้อมูล
export const CardHead: React.FC<{ icon: string; title: string }> = ({ icon, title }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
      {/* บล็อกวงกลม/สี่เหลี่ยมโค้งบรรจุไอคอนประจำวาระ */}
      <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon n={icon} s={{ fontSize: 19, color: "var(--accent)" }} />
      </div>
      {/* ข้อความหัวข้อย่อย */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
    </div>
  );
};

// คอมโพเนนต์แสดงผลหน้าแดชบอร์ดหลัก
export const Dashboard: React.FC = () => {
  // ดึงค่าข้อมูลจาก Context (db = database ของระบบทั้งหมด)
  const { db } = useApp();

  // กำหนดสเปคสำหรับการ์ดแสดงจำนวนสรุปรายสิทธิ์และจำนวนห้องประชุม
  const stats = [
    // ดึงจำนวนพนักงานทั้งหมดใน db.users
    { label: "ผู้ใช้งานทั้งหมด", value: db.users.length, icon: "users", accent: "var(--accent)", bg: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))" },
    // ดึงจำนวนห้องทั้งหมดใน db.rooms
    { label: "ห้องประชุม", value: db.rooms.length, icon: "building", accent: "#2E9E5B", bg: "linear-gradient(135deg,#E8F5E9,#C8E6C9)" },
    // กรองเอาจำนวนแอดมินทั้งหมด
    { label: "แอดมิน", value: db.users.filter(u => u.role === "แอดมิน").length, icon: "shield", accent: "#7C3AED", bg: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" },
    // กรองเอาจำนวนบัญชีผู้เขียนรายงาน
    { label: "ระดับรายงาน", value: db.users.filter(u => u.role === "รายงาน").length, icon: "bar-chart", accent: "#0891B2", bg: "linear-gradient(135deg,#E0F7FA,#B2EBF2)" }
  ];

  // ── คำนวณข้อมูลสถิติการใช้งานห้องประชุม (Donut Chart) ──
  const totalBookings = db.bookings.length || 1;
  const diamondCount = db.bookings.filter(b => b.roomId === 1).length;
  const planetCount = db.bookings.filter(b => b.roomId === 2).length;
  const oceanCount = db.bookings.filter(b => b.roomId === 3).length;

  const diamondPct = Math.round((diamondCount / totalBookings) * 100) || 0;
  const planetPct = Math.round((planetCount / totalBookings) * 100) || 0;
  const oceanPct = Math.round((oceanCount / totalBookings) * 100) || 0;

  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74
  const diamondStroke = (diamondCount / totalBookings) * circumference;
  const planetStroke = (planetCount / totalBookings) * circumference;
  const oceanStroke = (oceanCount / totalBookings) * circumference;

  // ── คำนวณการใช้งานแยกตามแผนก (Top 5 Departments for Bar Chart) ──
  const deptCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    db.bookings.forEach((b) => {
      const organizer = db.users.find((u) => u.id === b.organizerId);
      const dept = organizer ? organizer.department : "ไม่ระบุแผนก";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [db.bookings, db.users]);

  const maxDeptCount = Math.max(...deptCounts.map(d => d.count), 1);

  return (
    <div className="fu">
      {/* แสดงหัวกระดาษหน้าหลัก */}
      <PageHeader title="หน้าหลัก" subtitle="ภาพรวมระบบ BST e-Meeting" />
      
      {/* แสดงแถบการ์ดสถิติสรุปแบ่งเป็น 4 คอลัมน์ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "20px 20px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            {/* แสดงไอคอนประจำสถิตินั้นๆ */}
            <div style={{ width: 46, height: 46, background: s.bg, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon n={s.icon} s={{ fontSize: 23, color: s.accent }} />
            </div>
            {/* ค่าตัวเลขสรุป */}
            <p style={{ fontSize: 30, fontWeight: 700, marginBottom: 4, color: "var(--text)", lineHeight: 1 }}>{s.value}</p>
            {/* ชื่อป้ายชื่อกำกับสถิติ */}
            <p style={{ fontSize: 13, color: "var(--text-mute)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* แบ่งคอลัมน์ซ้าย-ขวา */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, alignItems: "start" }}>
        
        {/* คอลัมน์ซ้าย: รายชื่อตารางห้องประชุม */}
        <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n="building" s={{ fontSize: 18, color: "var(--accent)" }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>ห้องประชุมในระบบ</h3>
          </div>
          {db.rooms.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < db.rooms.length - 1 ? "1px solid var(--bg)" : "none" }}>
              <div style={{ width: 42, height: 42, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon n="door" s={{ fontSize: 20, color: "var(--accent)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 3 }}>{r.name}</p>
                <p style={{ fontSize: 12, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon n="building" s={{ fontSize: 12, color: "var(--text-faint)" }} />{r.place}
                  <span style={{ color: "#D1D5DB" }}>·</span>
                  <Icon n="map-pin" s={{ fontSize: 12, color: "var(--text-faint)" }} />ชั้น {r.floor}
                </p>
              </div>
              <RoomStatusBadge status={r.status} />
            </div>
          ))}
        </div>

        {/* คอลัมน์ขวา: กราฟสถิติ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* กราฟ 1: Donut Chart การใช้ห้อง */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n="chart-donut" s={{ fontSize: 18, color: "var(--accent)" }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>สัดส่วนการจองห้องประชุม (%)</h3>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--surface-2)" strokeWidth="12" />
                  {diamondCount > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="#0C447C"
                      strokeWidth="12"
                      strokeDasharray={`${diamondStroke} ${circumference}`}
                      strokeDashoffset={0}
                    />
                  )}
                  {planetCount > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="#2E9E5B"
                      strokeWidth="12"
                      strokeDasharray={`${planetStroke} ${circumference}`}
                      strokeDashoffset={-diamondStroke}
                    />
                  )}
                  {oceanCount > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="#7C3AED"
                      strokeWidth="12"
                      strokeDasharray={`${oceanStroke} ${circumference}`}
                      strokeDashoffset={-(diamondStroke + planetStroke)}
                    />
                  )}
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", margin: 0 }}>{db.bookings.length}</p>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", margin: 0 }}>ครั้งจอง</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 150 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0C447C", flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "var(--text-sub)", fontWeight: 500 }}>Blue Diamond</span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{diamondPct}% ({diamondCount})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2E9E5B", flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "var(--text-sub)", fontWeight: 500 }}>Blue Planet</span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{planetPct}% ({planetCount})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#7C3AED", flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "var(--text-sub)", fontWeight: 500 }}>Blue Ocean</span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{oceanPct}% ({oceanCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* กราฟ 2: Bar Chart แยกตามแผนก */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n="bar-chart" s={{ fontSize: 18, color: "var(--accent)" }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>การจองห้องสูงสุด 5 แผนกแรก (ครั้ง)</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {deptCounts.map((dept, idx) => {
                const widthPct = (dept.count / maxDeptCount) * 100;
                const colors = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
                const color = colors[idx % colors.length];

                return (
                  <div key={dept.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }} title={dept.name}>
                        {dept.name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{dept.count} ครั้ง</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${widthPct}%`,
                          height: "100%",
                          background: color,
                          borderRadius: 4,
                          transition: "width 0.8s ease"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
