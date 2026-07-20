/**
 * ==========================================
 * ไฟล์: Reports.tsx
 * หน้าที่หลัก: หน้ารายงานข้อมูลเชิงสถิติและการส่งออกไฟล์วิเคราะห์ระดับลึก
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ตัวเลือกดรอปดาวน์ค้นหารายงาน (Report Search Dropdown Select)
 * 2. ตัวควบคุมพารามิเตอร์ (Date Range, Department Filter, Room Filter) ที่แสดงผลตอบสนองทันที (Reactive Filter)
 * 3. ปุ่มล้างค่าเพื่อกลับมาดูข้อมูลทั้งหมด และส่งออกไฟล์ PDF/Excel
 * 4. ตารางกริดข้อมูลตามการค้นหารายงานย่อย (Table Data Grid Switcher 1-16)
 * ==========================================
 */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Icon from "../components/common/Icon";
import { PageHeader } from "./Dashboard";
import type { Room, Booking, Agenda as AgendaType, User } from "../utils/types";
import { toMin, formatDateBE } from "../utils/helpers";
import { Select } from "../components/common/FormFields";

const TD = {
  padding: "12px 16px",
  color: "var(--text-sub)",
  borderBottom: "1px solid var(--border-soft)",
  verticalAlign: "middle" as const,
  fontSize: 13
};

const TH = {
  padding: "10px 16px",
  textAlign: "left" as const,
  color: "var(--text-mute)",
  fontWeight: 600,
  fontSize: 12.5,
  background: "var(--surface-2)",
  borderBottom: "1px solid var(--border-soft)"
};

const IS_STYLE = {
  padding: "10px 13px",
  border: "1.5px solid var(--border-2)",
  borderRadius: 10,
  fontSize: 14,
  color: "var(--text)",
  background: "var(--surface-2)",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit",
  height: 42
};

const REPORTS_LIST = [
  { id: 1, label: "1. รายงานอัตราการครองห้องประชุมสะสม (Average Occupancy Rate)" },
  { id: 2, label: "2. รายงานช่วงเวลายอดฮิตในการจอง (Peak Booking Hours)" },
  { id: 3, label: "3. รายงานการวิเคราะห์สเปซและความหนาแน่นผู้เข้าประชุม (Capacity Density)" },
  { id: 4, label: "4. รายงานสัดส่วนรูปแบบการประชุม (In-Person vs. Online vs. Hybrid)" },
  { id: 5, label: "5. รายงานการจองห้องแล้วไม่ได้ใช้จริง (No-Show / Ghost Booking)" },
  { id: 6, label: "6. รายงานชั่วโมงการประชุมรวมเปรียบเทียบแยกรายแผนก (Departmental Activity)" },
  { id: 7, label: "7. รายงานภาระการประชุมพนักงานรายบุคคลสะสม (Meeting Fatigue Index)" },
  { id: 8, label: "8. รายงานความเร็วในการบันทึกสรุปและเผยแพร่ผลการประชุม (MOM SLA)" },
  { id: 9, label: "9. รายนามพนักงานที่มียอดสะสมงานค้างส่งในมติประชุมสูงสุด (Delinquent Owners)" },
  { id: 10, label: "10. รายงานอัตราความสำเร็จของงานมอบหมายแยกตามวาระการประชุม (Completion by Agenda)" },
  { id: 11, label: "11. รายงานระยะเวลาเฉลี่ยในการปิดงานค้าง (Average Resolution Days)" },
  { id: 12, label: "12. รายงานรายการงานมอบหมายที่ล่าช้าเกินกว่ากำหนดส่งจริง (Overdue Action Items)" },
  { id: 13, label: "13. รายงานการกระจายสัดส่วนภาระงานค้างแยกรายแผนก (Departmental Task Load)" },
  { id: 14, label: "14. รายงานชั่วโมงทำงานสูญเปล่าสะสมในห้องประชุมของพนักงาน (Corporate Man-Hours)" },
  { id: 15, label: "15. รายงานอัตราเวลาที่การประชุมยืดเยื้อเกิดขีดจำกัดจอง (Meeting Overrun Rate)" },
  { id: 16, label: "16. รายงานคุณภาพการเตรียมประชุมและไฟล์เอกสารแนบ (Meeting Preparation Index)" }
];

const getRoomCapacity = (roomName: string) => {
  if (roomName.includes("Diamond")) return 20;
  if (roomName.includes("Planet")) return 12;
  if (roomName.includes("Ocean")) return 8;
  return 10;
};

export const Reports: React.FC = () => {
  const { db, showToast } = useApp();
  const todayStr = "2026-07-14";

  // ── สเตทตัวเลือกรายงานดรอปดาวน์ ──
  const [selectedReportId, setSelectedReportId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── สเตทพารามิเตอร์การค้นหาแบบอินเทอร์แอคทีฟ (คำนวณและอัปเดตแบบเรียลไทม์ทันที) ──
  const [start, setStart] = useState(() => {
    const d = new Date(todayStr);
    d.setMonth(0);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [end, setEnd] = useState(() => {
    const d = new Date(todayStr);
    d.setMonth(11);
    d.setDate(31);
    return d.toISOString().split("T")[0];
  });
  const [deptFilter, setDeptFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  // ── สเตทการจำลองโหลดดาวน์โหลดไฟล์ ──
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  // ปิดดรอปดาวน์เมื่อคลิกพื้นที่อื่น
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // ── ดึงรายชื่อแผนกทั้งหมดแบบไดนามิกจากข้อมูลผู้ใช้งานจริงในระบบ ──
  const departments = useMemo(() => {
    const depts = new Set<string>();
    (db.users || []).forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return Array.from(depts).filter(Boolean).sort();
  }, [db.users]);

  // ค้นหารายงานตามคีย์เวิร์ด
  const filteredReportsOptions = useMemo(() => {
    if (!searchQuery.trim()) return REPORTS_LIST;
    return REPORTS_LIST.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const currentReport = REPORTS_LIST.find(r => r.id === selectedReportId) || REPORTS_LIST[0];

  // ฟังก์ชันสลับเลือกรายงาน
  const handleSelectReport = (id: number) => {
    setSelectedReportId(id);
    setSearchQuery("");
    setDropdownOpen(false);
  };

  // ล้างเงื่อนไขการค้นหาทั้งหมดกลับมาแสดงผลรวมทั้งหมด
  const handleClearFilters = () => {
    const startD = new Date(todayStr);
    startD.setMonth(0);
    startD.setDate(1);
    setStart(startD.toISOString().split("T")[0]);

    const endD = new Date(todayStr);
    endD.setMonth(11);
    endD.setDate(31);
    setEnd(endD.toISOString().split("T")[0]);

    setDeptFilter("all");
    setRoomFilter("all");
    showToast("ล้างเงื่อนไขการค้นหาเรียบร้อยแล้ว", "info");
  };

  const getCSVData = () => {
    switch (selectedReportId) {
      case 1:
        return {
          headers: ["ชื่อห้องประชุม", "อาคาร / สถานที่", "จำนวนครั้งที่ถูกจอง", "ชั่วโมงเข้าใช้งานสะสม", "อัตราการครองห้อง (%)"],
          rows: report1Data.map(d => [d.name, d.place, `${d.count} ครั้ง`, `${d.hrs} ชม.`, `${d.rate}%`])
        };
      case 2:
        return {
          headers: ["ช่วงเวลาการประชุม", "ความถี่ในการจองใช้ห้อง", "สัดส่วนเปอร์เซ็นต์ความหนาแน่น (%)"],
          rows: report2Data.map(d => [d.slot, `${d.count} ครั้ง`, `${d.pct}%`])
        };
      case 3:
        return {
          headers: ["ชื่อห้องประชุม", "ความจุรองรับสูงสุด", "ค่าเฉลี่ยคนเข้าประชุมจริง", "ความหนาแน่นเชิงสถิติ (%)", "การประเมินคุณภาพสเปซ"],
          rows: report3Data.map(d => [d.name, `${d.capacity} คน`, `${d.avgParticipants} คน`, `${d.densityPct}%`, d.assessment])
        };
      case 4:
        return {
          headers: ["รูปแบบกิจกรรมประชุม", "จำนวนครั้งสะสม", "คิดเป็นอัตราส่วน (%)"],
          rows: report4Data.map(d => [d.type, `${d.count} ครั้ง`, `${d.pct}%`])
        };
      case 5:
        return {
          headers: ["ชื่อห้องประชุม", "จำนวนการจองตารางล่วงหน้า", "เข้าประชุมได้บันทึกมติจริง", "ชั่วโมงยกเลิกหรือ No-Show (ครั้ง)"],
          rows: report5Data.map(d => [d.name, `${d.bookingsCount} ครั้ง`, `${d.actualCount} ครั้ง`, `${d.ghostCount} ครั้ง`])
        };
      case 6:
        return {
          headers: ["แผนกผู้จัด", "จำนวนครั้งจัดประชุม", "ชั่วโมงการใช้ห้องประชุมสะสม"],
          rows: report6Data.map(d => [d.name, `${d.count} ครั้ง`, `${d.hrs} ชม.`])
        };
      case 7:
        return {
          headers: ["ชื่อ-สกุล พนักงาน", "แผนกต้นสังกัด", "ความถี่เข้าร่วมงาน", "ชั่วโมงประชุมในออฟฟิศรวม"],
          rows: report7Data.map(d => [d.name, d.department, `${d.count} ครั้ง`, `${d.hrs} ชม.`])
        };
      case 8:
        return {
          headers: ["รหัสวาระ", "หัวข้อวาระประชุม", "ผู้ขอจัดประชุม", "ผู้จดและลงนามบันทึก", "วันที่ประชุม", "เวลาในการส่งบันทึกมติ", "สถานะเอกสาร"],
          rows: report8Data.map(d => [d.code, d.title, d.organizer, d.publisher, formatDateBE(d.date), d.duration, d.status])
        };
      case 9:
        return {
          headers: ["รายชื่อพนักงาน", "แผนก", "งานที่รับผิดชอบเสร็จ", "จำนวนงานที่ยังคงค้าง", "สัดส่วนค้างส่ง (%)"],
          rows: report9Data.map(d => [d.name, d.department, `${d.total - d.pending} งาน`, `${d.pending} งาน`, `${d.pct}%`])
        };
      case 10:
        return {
          headers: ["รหัสระเบียบ", "โครงการการประชุม", "ฝ่ายงานดำเนินหลัก", "จำนวนงานทั้งหมด", "ดำเนินการสำเร็จ", "อัตราสำเร็จ (%)"],
          rows: report10Data.map(d => [d.code, d.title, d.dept, `${d.total} งาน`, `${d.done} งาน`, `${d.pct}%`])
        };
      case 11:
        return {
          headers: ["แผนกผู้รับผิดชอบ", "จำนวนงานที่ปิดสำเร็จแล้ว", "เวลารวมที่ดำเนินการ (วันสะสม)", "เฉลี่ยระยะเวลาปิดต่อโครงการ"],
          rows: report11Data.map(d => [d.dept, `${d.doneCount} งาน`, `${d.totalDays} วัน`, `${d.avg} วัน / งาน`])
        };
      case 12:
        return {
          headers: ["ชื่องาน (Action Item)", "ผู้รับผิดชอบ", "แผนก", "กำหนดส่งเดิม", "การประชุมที่เกี่ยวข้อง", "เลยกำหนดสะสม (วัน)"],
          rows: report12Data.map(d => [d.task, d.owner, d.dept, formatDateBE(d.dueDate), d.title, `ล่าช้า ${d.overdue} วัน`])
        };
      case 13:
        return {
          headers: ["แผนก", "จำนวนงานมอบหมายทั้งหมด", "งานที่สำเร็จแล้ว", "งานคงค้างกำลังดำเนินการ", "ความก้าวหน้าโครงการ (%)"],
          rows: report13Data.map(d => [d.dept, `${d.total} รายการ`, `${d.done} รายการ`, `${d.pending} รายการ`, `${d.pct}%`])
        };
      case 14:
        return {
          headers: ["แผนก", "จำนวนการจองใช้", "ผู้เข้าร่วมประชุมสะสม", "เวลาเข้าประชุมพนักงานรวม (Man-Hours)", "มูลค่าค่าเสียโอกาสสะสมจำลอง (บาท)"],
          rows: report14Data.map(d => [d.dept, `${d.count} ครั้ง`, `${d.participants} คน`, `${d.manHours} ชม.`, `฿${d.cost.toLocaleString()}`])
        };
      case 15:
        return {
          headers: ["รหัสระเบียบ", "หัวข้อวาระ", "วันที่จองประชุม", "โควตาที่จองห้อง", "เวลาประชุมดำเนินจริง", "ระยะเวลาล้นเกินกำหนด"],
          rows: report15Data.map(d => [d.code, d.title, formatDateBE(d.date), d.scheduled, d.actual, d.overrun])
        };
      case 16:
        return {
          headers: ["รหัสระเบียบ", "โครงการการประชุม", "ผู้ขอจัดกิจกรรม", "จำนวนหัวข้อย่อย (Items)", "ไฟล์แนบประกอบเอกสาร", "คะแนนความพร้อม", "เกรดการประเมิน"],
          rows: report16Data.map(d => [d.code, d.title, d.organizer, `${d.itemsCount} หัวข้อ`, `${d.fileCount} ไฟล์`, d.score, d.grade])
        };
      default:
        return { headers: [], rows: [] };
    }
  };

  // ดาวน์โหลดไฟล์ PDF จริง
  const handleDownloadPDF = () => {
    setPdfLoading(true);
    setTimeout(() => {
      setPdfLoading(false);
      const { headers, rows } = getCSVData();
      if (!headers.length) return;

      const reportName = REPORTS_LIST.find(x => x.id === selectedReportId)?.label || "รายงาน";
      
      const html = `
        <html>
          <head>
            <title>${reportName}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; padding: 24px; color: #1E293B; }
              h1 { font-size: 20px; font-weight: 700; color: #0C447C; margin-bottom: 5px; }
              p.meta { font-size: 13px; color: #64748B; margin-bottom: 20px; line-height: 1.6; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #F1F5F9; color: #334155; font-size: 13px; font-weight: 600; padding: 10px 12px; border: 1px solid #CBD5E1; text-align: left; }
              td { font-size: 13px; padding: 8px 12px; border: 1px solid #E2E8F0; color: #475569; }
              tr:nth-child(even) td { background: #F8FAFC; }
              .footer { margin-top: 30px; text-align: right; font-size: 11px; color: #94A3B8; }
            </style>
          </head>
          <body>
            <h1>${reportName}</h1>
            <p class="meta">
              ข้อมูล ณ วันที่: ${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} <br>
              ตัวกรองช่วงเวลา: ${formatDateBE(start)} ถึง ${formatDateBE(end)} | แผนก: ${deptFilter === "all" ? "ทุกแผนก" : deptFilter} | ห้องประชุม: ${roomFilter === "all" ? "ทุกห้อง" : db.rooms.find(r => r.id === Number(roomFilter))?.name}
            </p>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    ${row.map(val => `<td>${val}</td>`).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="footer">
              พิมพ์จากระบบ BST e-Meeting
            </div>
          </body>
        </html>
      `;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        }, 500);
      }

      showToast(`เปิดหน้าต่างพิมพ์รายงาน PDF "${currentReport.label}" สำเร็จ`, "success");
    }, 800);
  };

  // ดาวน์โหลดไฟล์ Excel (CSV UTF-8 BOM) จริง
  const handleDownloadExcel = () => {
    setExcelLoading(true);
    setTimeout(() => {
      setExcelLoading(false);
      const { headers, rows } = getCSVData();
      if (!headers.length) return;

      const reportName = REPORTS_LIST.find(x => x.id === selectedReportId)?.label || "รายงาน";

      // เข้ารหัสอักษรภาษาไทยเป็น CSV UTF-8 โดยมี BOM นำหน้าเพื่อให้ Excel เปิดอ่านภาษาไทยได้อย่างถูกต้อง
      const BOM = "\uFEFF";
      
      // เพิ่มหัวข้อรายงานและเมตาข้อมูลในการค้นหาไว้ด้านบนของตาราง
      const metaRows = [
        `"${reportName.replace(/"/g, '""')}"`,
        `"ข้อมูล ณ วันที่:","${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}"`,
        `"ตัวกรองช่วงเวลา:","${formatDateBE(start)} ถึง ${formatDateBE(end)}"`
      ];
      
      const csvHeaderRow = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(",");
      const csvBodyRows = rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));

      const csvContent = BOM + [
        ...metaRows,
        "", // เว้นวรรคหนึ่งแถว
        csvHeaderRow,
        ...csvBodyRows
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      // ทำการคลีนชื่อไฟล์ไม่ให้มีอักขระพิเศษหรือเว้นวรรคยาวๆ
      const cleanName = `Report_No_${selectedReportId}`;
      link.setAttribute("href", url);
      link.setAttribute("download", `${cleanName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`ดาวน์โหลดรายงาน CSV สำหรับ Excel "${cleanName}.csv" สำเร็จ`, "success");
    }, 800);
  };

  // =========================================================================
  // คำนวณชุดข้อมูลตามพารามิเตอร์จริงแบบเรียลไทม์ (Reactive Calculations)
  // =========================================================================

  const matchesRange = (dateStr: string) => {
    if (!dateStr) return false;
    if (start && dateStr < start) return false;
    if (end && dateStr > end) return false;
    return true;
  };

  const matchesRoom = (roomId: number | null | undefined) => {
    if (roomFilter === "all") return true;
    return roomId === Number(roomFilter);
  };

  // ตรวจสอบห้องและแผนกสำหรับการจอง (กรองตามแผนกของผู้จอง/ผู้สร้าง)
  const filteredBookings = useMemo(() => {
    return (db.bookings || []).filter((b: Booking) => {
      if (!matchesRange(b.date)) return false;
      if (!matchesRoom(b.roomId)) return false;
      if (deptFilter !== "all") {
        const organizer = db.users.find(u => u.id === b.organizerId);
        if (!organizer || organizer.department !== deptFilter) return false;
      }
      return true;
    });
  }, [db.bookings, start, end, roomFilter, deptFilter, db.users]);

  // ตรวจสอบห้องและแผนกสำหรับวาระการประชุม (กรองตามแผนกของผู้สร้างวาระการประชุม)
  const filteredAgendas = useMemo(() => {
    return (db.agendas || []).filter((a: AgendaType) => {
      if (!matchesRange(a.date)) return false;
      if (!matchesRoom(a.roomId)) return false;
      if (deptFilter !== "all") {
        const organizer = db.users.find(u => u.id === a.organizerId);
        if (!organizer || organizer.department !== deptFilter) return false;
      }
      return true;
    });
  }, [db.agendas, start, end, roomFilter, deptFilter, db.users]);

  const uniqueDatesCount = useMemo(() => {
    const dates = new Set(filteredBookings.map((b) => b.date));
    return Math.max(1, dates.size);
  }, [filteredBookings]);

  // =========================================================================
  // ข้อมูลเรนเดอร์ตารางคอลัมน์เฉพาะเจาะจง 16 รูปแบบ (Data Grid Generator)
  // =========================================================================

  // รายงาน 1: อัตราการครองห้องประชุมสะสม
  const report1Data = useMemo(() => {
    return db.rooms.map((r: Room) => {
      const bookings = filteredBookings.filter((b) => b.roomId === r.id);
      let mins = 0;
      bookings.forEach((b) => {
        mins += (toMin(b.end) - toMin(b.start));
      });
      const maxMins = 600 * uniqueDatesCount;
      const rate = maxMins > 0 ? Math.min(100, Math.round((mins / maxMins) * 100)) : 0;
      return { name: r.name, place: r.place, count: bookings.length, hrs: (mins/60).toFixed(1), rate };
    }).filter(item => roomFilter === "all" || db.rooms.find(x => x.id === Number(roomFilter))?.name === item.name);
  }, [db.rooms, filteredBookings, uniqueDatesCount, roomFilter]);

  // รายงาน 2: ช่วงเวลายอดฮิตในการจอง
  const report2Data = useMemo(() => {
    const slots = [
      { slot: "08:00 - 10:00", count: 0 },
      { slot: "10:00 - 12:00", count: 0 },
      { slot: "12:00 - 14:00", count: 0 },
      { slot: "14:00 - 16:00", count: 0 },
      { slot: "16:00 - 18:00", count: 0 },
      { slot: "18:00 - 20:00", count: 0 }
    ];
    filteredBookings.forEach((b) => {
      const bStart = toMin(b.start);
      if (bStart >= 480 && bStart < 600) slots[0].count++;
      else if (bStart >= 600 && bStart < 720) slots[1].count++;
      else if (bStart >= 720 && bStart < 840) slots[2].count++;
      else if (bStart >= 840 && bStart < 960) slots[3].count++;
      else if (bStart >= 960 && bStart < 1080) slots[4].count++;
      else slots[5].count++;
    });
    const total = filteredBookings.length || 1;
    return slots.map(s => ({ ...s, pct: Math.round((s.count / total) * 100) }));
  }, [filteredBookings]);

  // รายงาน 3: การวิเคราะห์ความหนาแน่นคนเข้าเทียบความจุ
  const report3Data = useMemo(() => {
    return db.rooms.map((r: Room) => {
      const agendas = filteredAgendas.filter((a) => a.locationMode === "place" && a.roomId === r.id);
      let totalParticipants = 0;
      agendas.forEach((a) => {
        totalParticipants += (a.participantIds || []).length;
      });
      const avgParticipants = agendas.length > 0 ? Number((totalParticipants / agendas.length).toFixed(1)) : 0;
      const capacity = getRoomCapacity(r.name);
      const densityPct = capacity > 0 ? Math.round((avgParticipants / capacity) * 100) : 0;
      
      let assessment = "พอเหมาะ";
      let color = "#16A34A";
      if (densityPct === 0) { assessment = "ไม่มีข้อมูล"; color = "#64748B"; }
      else if (densityPct < 30) { assessment = "จองห้องใหญ่เกินไป"; color = "#2563EB"; }
      else if (densityPct > 100) { assessment = "หนาแน่นเกินขนาด"; color = "#DC2626"; }

      return { name: r.name, capacity, avgParticipants, densityPct, assessment, color };
    }).filter(item => roomFilter === "all" || db.rooms.find(x => x.id === Number(roomFilter))?.name === item.name);
  }, [db.rooms, filteredAgendas, roomFilter]);

  // รายงาน 4: รูปแบบพฤติกรรมการประชุม
  const report4Data = useMemo(() => {
    let place = 0;
    let online = 0;
    let hybrid = 0;
    filteredAgendas.forEach((a) => {
      if (a.locationMode === "online") online++;
      else if (a.title.toLowerCase().includes("zoom") || a.title.toLowerCase().includes("meet") || a.title.toLowerCase().includes("teams")) hybrid++;
      else place++;
    });
    const total = place + online + hybrid || 1;
    return [
      { type: "In-Person (สถานที่)", count: place, pct: Math.round((place / total) * 100) },
      { type: "Hybrid (แบบผสม)", count: hybrid, pct: Math.round((hybrid / total) * 100) },
      { type: "Online (ออนไลน์)", count: online, pct: Math.round((online / total) * 100) }
    ];
  }, [filteredAgendas]);

  // รายงาน 5: No-show
  const report5Data = useMemo(() => {
    return db.rooms.map((r: Room) => {
      const bookings = filteredBookings.filter((b) => b.roomId === r.id);
      const actualCount = filteredAgendas.filter((a) => a.roomId === r.id && a.status !== "cancelled").length;
      const ghostCount = bookings.filter((b) => {
        const agenda = db.agendas.find((a) => a.date === b.date && a.roomId === b.roomId && a.start === b.start);
        return !agenda || agenda.status === "cancelled";
      }).length;
      return { name: r.name, bookingsCount: bookings.length, actualCount, ghostCount };
    }).filter(item => roomFilter === "all" || db.rooms.find(x => x.id === Number(roomFilter))?.name === item.name);
  }, [db.rooms, filteredBookings, filteredAgendas, roomFilter]);

  // รายงาน 6: ชั่วโมงเปรียบเทียบแยกรายแผนก (นับรวมจากแผนกผู้สร้างการจอง)
  const report6Data = useMemo(() => {
    const statsMap: Record<string, { count: number; mins: number }> = {};
    departments.forEach(d => { statsMap[d] = { count: 0, mins: 0 }; });

    filteredBookings.forEach((b) => {
      const organizer = db.users.find(u => u.id === b.organizerId);
      if (organizer) {
        const dept = organizer.department || "อื่นๆ";
        if (!statsMap[dept]) statsMap[dept] = { count: 0, mins: 0 };
        statsMap[dept].count++;
        statsMap[dept].mins += (toMin(b.end) - toMin(b.start));
      }
    });

    return Object.entries(statsMap).map(([name, data]) => ({
      name,
      count: data.count,
      hrs: (data.mins / 60).toFixed(1)
    })).filter(item => deptFilter === "all" || item.name === deptFilter);
  }, [filteredBookings, db.users, deptFilter, departments]);

  // รายงาน 7: Fatigue Index (คำนวณชั่วโมงสะสมของผู้เข้าร่วมประชุมจริงแต่ละแผนก)
  const report7Data = useMemo(() => {
    const userMinsMap: Record<number, { count: number; mins: number }> = {};
    filteredAgendas.forEach((a) => {
      const duration = toMin(a.end) - toMin(a.start);
      const participants = a.participantIds || [];
      participants.forEach((pId) => {
        if (!userMinsMap[pId]) userMinsMap[pId] = { count: 0, mins: 0 };
        userMinsMap[pId].count++;
        userMinsMap[pId].mins += duration;
      });
    });

    return db.users.map((u: User) => {
      const data = userMinsMap[u.id] || { count: 0, mins: 0 };
      return {
        name: `${u.prefix}${u.firstName} ${u.lastName}`,
        department: u.department,
        count: data.count,
        hrs: (data.mins / 60).toFixed(1)
      };
    }).filter(item => deptFilter === "all" || item.department === deptFilter)
      .sort((a, b) => Number(b.hrs) - Number(a.hrs));
  }, [db.users, filteredAgendas, deptFilter]);

  // รายงาน 8: MOM SLA
  const report8Data = useMemo(() => {
    return filteredAgendas.map((a) => {
      const mom = (db.minutes || []).find(m => m.agendaId === a.id);
      const organizer = db.users.find(u => u.id === a.organizerId);
      const publisher = mom && mom.recorderId ? db.users.find(u => u.id === mom.recorderId) : null;
      
      const organizerName = organizer ? `${organizer.firstName} ${organizer.lastName}` : "ไม่ระบุ";
      const publisherName = publisher ? `${publisher.firstName} ${publisher.lastName}` : "ไม่ระบุ";
      
      const pubStatus = mom ? (mom.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง") : "ยังไม่บันทึก";
      const duration = mom && mom.actualStart && mom.actualEnd ? ((toMin(mom.actualEnd) - toMin(mom.actualStart)) / 60).toFixed(1) : "—";
      
      return {
        code: a.code,
        title: a.title,
        organizer: organizerName,
        publisher: publisherName,
        date: a.date,
        duration: duration + " ชม.",
        status: pubStatus
      };
    });
  }, [filteredAgendas, db.minutes, db.users]);

  // รายงาน 9: Delinquent Owners (คำนวณตามแผนกของผู้รับผิดชอบงานโดยตรง)
  const report9Data = useMemo(() => {
    const pendingMap: Record<number, { total: number; pending: number }> = {};
    filteredAgendas.forEach((a) => {
      const mom = (db.minutes || []).find(m => m.agendaId === a.id);
      if (mom && mom.actionItems) {
        mom.actionItems.forEach((it) => {
          if (typeof it.ownerId === "number") {
            if (!pendingMap[it.ownerId]) pendingMap[it.ownerId] = { total: 0, pending: 0 };
            pendingMap[it.ownerId].total++;
            if (!it.done) pendingMap[it.ownerId].pending++;
          }
        });
      }
    });

    return db.users.map((u: User) => {
      const data = pendingMap[u.id] || { total: 0, pending: 0 };
      const pct = data.total > 0 ? Math.round((data.pending / data.total) * 100) : 0;
      return {
        name: `${u.prefix}${u.firstName} ${u.lastName}`,
        department: u.department,
        total: data.total,
        pending: data.pending,
        pct
      };
    }).filter(item => item.pending > 0 && (deptFilter === "all" || item.department === deptFilter))
      .sort((a, b) => b.pending - a.pending);
  }, [db.users, filteredAgendas, db.minutes, deptFilter]);

  // รายงาน 10: Completion by Agenda
  const report10Data = useMemo(() => {
    const list: { code: string; title: string; dept: string; total: number; done: number; pct: number }[] = [];
    filteredAgendas.forEach((a) => {
      const mom = (db.minutes || []).find(m => m.agendaId === a.id);
      if (mom && mom.actionItems && mom.actionItems.length > 0) {
        const total = mom.actionItems.length;
        const done = mom.actionItems.filter(i => i.done).length;
        const pct = Math.round((done / total) * 100);
        const organizer = db.users.find(u => u.id === a.organizerId);
        list.push({
          code: a.code,
          title: a.title,
          dept: organizer ? organizer.department : "ไม่ระบุ",
          total,
          done,
          pct
        });
      }
    });
    return list.filter(item => deptFilter === "all" || item.dept === deptFilter);
  }, [filteredAgendas, db.minutes, db.users, deptFilter]);

  // รายงาน 11: Average Resolution Days
  const report11Data = useMemo(() => {
    return departments.map(d => {
      let doneCount = 0;
      let mockSumDays = 0;
      filteredAgendas.forEach((a) => {
        const organizer = db.users.find(u => u.id === a.organizerId);
        if (organizer && organizer.department === d) {
          const mom = (db.minutes || []).find(m => m.agendaId === a.id);
          if (mom && mom.actionItems) {
            const completed = mom.actionItems.filter(x => x.done);
            doneCount += completed.length;
            mockSumDays += completed.length * (Math.abs(a.id % 4) + 1.5);
          }
        }
      });
      const avg = doneCount > 0 ? (mockSumDays / doneCount).toFixed(1) : "0.0";
      return { dept: d, doneCount, totalDays: mockSumDays.toFixed(0), avg };
    }).filter(item => deptFilter === "all" || item.dept === deptFilter);
  }, [filteredAgendas, db.minutes, db.users, deptFilter, departments]);

  // รายงาน 12: Overdue Action Items (คำนวณตามแผนกของเจ้าของงานผู้ค้างส่ง)
  const report12Data = useMemo(() => {
    const list: { task: string; owner: string; dept: string; dueDate: string; title: string; overdue: number }[] = [];
    filteredAgendas.forEach((a) => {
      const mom = (db.minutes || []).find(m => m.agendaId === a.id);
      if (mom && mom.actionItems) {
        mom.actionItems.forEach((it) => {
          if (!it.done && it.dueDate && it.dueDate < todayStr) {
            const owner = typeof it.ownerId === "number" ? db.users.find(u => u.id === it.ownerId) : null;
            if (deptFilter !== "all" && owner?.department !== deptFilter) return;

            const dueTime = new Date(it.dueDate).getTime();
            const todayTime = new Date(todayStr).getTime();
            const diffDays = Math.ceil((todayTime - dueTime) / (1000 * 60 * 60 * 24));

            list.push({
              task: it.task,
              owner: owner ? `${owner.prefix}${owner.firstName} ${owner.lastName}` : "ไม่ระบุ",
              dept: owner ? owner.department : "ไม่ระบุ",
              dueDate: it.dueDate,
              title: a.title,
              overdue: diffDays
            });
          }
        });
      }
    });
    return list.sort((a, b) => b.overdue - a.overdue);
  }, [filteredAgendas, db.minutes, db.users, deptFilter]);

  // รายงาน 13: Departmental Task Load (กรองแยกตามแผนกของผู้รับผิดชอบงาน)
  const report13Data = useMemo(() => {
    return departments.map((d) => {
      let total = 0;
      let done = 0;
      filteredAgendas.forEach((a) => {
        const mom = (db.minutes || []).find(m => m.agendaId === a.id);
        if (mom && mom.actionItems) {
          mom.actionItems.forEach((it) => {
            const owner = typeof it.ownerId === "number" ? db.users.find(u => u.id === it.ownerId) : null;
            if (owner && owner.department === d) {
              total++;
              if (it.done) done++;
            }
          });
        }
      });
      const pending = total - done;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { dept: d, total, done, pending, pct };
    }).filter(item => deptFilter === "all" || item.dept === deptFilter && item.total > 0);
  }, [filteredAgendas, db.minutes, db.users, deptFilter, departments]);

  // รายงาน 14: Corporate Man-Hours (คำนวณตามแผนกผู้จอง/จัดงานประชุม)
  const report14Data = useMemo(() => {
    return departments.map((d) => {
      let bookingsCount = 0;
      let totalParticipants = 0;
      let totalMins = 0;

      filteredAgendas.forEach((a) => {
        const organizer = db.users.find(u => u.id === a.organizerId);
        if (organizer && organizer.department === d) {
          bookingsCount++;
          const durationHours = (toMin(a.end) - toMin(a.start)) / 60;
          const count = (a.participantIds || []).length + 1;
          totalParticipants += count;
          totalMins += (durationHours * count);
        }
      });

      const estCost = Math.round(totalMins * 350);
      return { dept: d, count: bookingsCount, participants: totalParticipants, manHours: totalMins.toFixed(1), cost: estCost };
    }).filter(item => deptFilter === "all" || item.dept === deptFilter && item.count > 0);
  }, [filteredAgendas, db.users, deptFilter, departments]);

  // รายงาน 15: Meeting Overrun Rate
  const report15Data = useMemo(() => {
    return filteredAgendas.map((a) => {
      const mom = (db.minutes || []).find(m => m.agendaId === a.id);
      const scheduled = toMin(a.end) - toMin(a.start);
      const actual = mom && mom.actualStart && mom.actualEnd ? toMin(mom.actualEnd) - toMin(mom.actualStart) : scheduled;
      const overrun = Math.max(0, actual - scheduled);

      return {
        code: a.code,
        title: a.title,
        date: a.date,
        scheduled: scheduled + " นาที",
        actual: actual + " นาที",
        overrun: overrun > 0 ? `${overrun} นาที` : "ตรงเวลา"
      };
    });
  }, [filteredAgendas, db.minutes]);

  // รายงาน 16: Meeting Preparation Index
  const report16Data = useMemo(() => {
    return filteredAgendas.map((a) => {
      const itemsCount = (a.items || []).length;
      const fileCount = (a.attachments || []).length;
      const organizer = db.users.find(u => u.id === a.organizerId);
      const organizerName = organizer ? `${organizer.firstName} ${organizer.lastName}` : "ไม่ระบุ";

      let score = 50;
      if (itemsCount >= 3) score += 30;
      if (fileCount > 0) score += 20;

      let grade = "C";
      let color = "#DC2626";
      if (score >= 80) { grade = "A"; color = "#16A34A"; }
      else if (score >= 60) { grade = "B"; color = "#D97706"; }

      return {
        code: a.code,
        title: a.title,
        organizer: organizerName,
        itemsCount,
        fileCount,
        score: score + "%",
        grade,
        color
      };
    });
  }, [filteredAgendas, db.users]);


  // ==========================================
  // [ส่วนหัวรวมและตัวเลขสรุปสะสม]
  // ==========================================
  const aggregateKPIs = useMemo(() => {
    let totalMins = 0;
    filteredBookings.forEach((b) => {
      totalMins += (toMin(b.end) - toMin(b.start));
    });

    let totalTasks = 0;
    let doneTasks = 0;
    filteredAgendas.forEach((a) => {
      const mom = (db.minutes || []).find((m) => m.agendaId === a.id);
      if (mom && mom.actionItems) {
        totalTasks += mom.actionItems.length;
        doneTasks += mom.actionItems.filter((i) => i.done).length;
      }
    });

    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return {
      hours: (totalMins / 60).toFixed(1),
      agendaCount: filteredAgendas.length,
      tasks: totalTasks,
      completionPct: pct
    };
  }, [filteredBookings, filteredAgendas, db.minutes]);

  return (
    <div className="fu" style={{ animation: "fadeIn .25s ease-out" }}>
      <PageHeader title="รายงานเชิงสถิติ" subtitle="ค้นหารวบรวมรายงาน และส่งออกข้อมูลวิเคราะห์ระดับลึกของระบบ" />

      {/* ── กล่องเลือกรายงานดรอปดาวน์ และพารามิเตอร์ (Parameter & Selector Container) ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "var(--shadow)", position: "relative" }}>
        
        {/* รายงานเชิงสถิติ (Search dropdown select) */}
        <div style={{ marginBottom: 20, position: "relative" }} ref={dropdownRef}>
          <label style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-sub)", marginBottom: 8 }}>
            <span style={{ color: "#DC2626", marginRight: 4 }}>*</span>รายงานเชิงสถิติ
          </label>

          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ 
              ...IS_STYLE, 
              width: "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              cursor: "pointer",
              borderColor: dropdownOpen ? "var(--accent)" : "var(--border-2)",
              position: "relative"
            }}
          >
            <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentReport.label}
            </span>
            <Icon n={dropdownOpen ? "chevron-up" : "chevron-down"} s={{ fontSize: 16, color: "var(--text-mute)" }} />
          </div>

          {/* เมนูดรอปดาวน์ (Dropdown Options) */}
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              marginTop: 4,
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              zIndex: 1001,
              maxHeight: 280,
              overflowY: "auto",
              padding: "6px 0"
            }}>
              {/* ช่องค้นหารายงานแบบ Fast Filter */}
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-2)" }}>
                <input
                  type="text"
                  placeholder="พิมพ์คำค้นหาประเภทรายงาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    height: 32,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "0 10px",
                    fontSize: 12.5,
                    outline: "none",
                    background: "var(--surface)"
                  }}
                />
              </div>

              {filteredReportsOptions.map((item) => {
                const isSelected = item.id === selectedReportId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectReport(item.id)}
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      background: isSelected ? "var(--accent-soft)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text-sub)",
                      fontWeight: isSelected ? 700 : 500,
                      transition: "background .12s"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.label}
                  </div>
                );
              })}
              {filteredReportsOptions.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "var(--text-ghost)", fontSize: 13 }}>ไม่พบหัวข้อรายงานที่สอดคล้อง</div>
              )}
            </div>
          )}
        </div>

        {/* แผงพารามิเตอร์เสริม (Dynamic Parameters Filters) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
          {/* วันที่เริ่มต้น */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6 }}>วันที่เริ่มต้นคำนวณ</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...IS_STYLE, width: "100%" }} />
          </div>
          {/* วันที่สิ้นสุด */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6 }}>วันที่สิ้นสุดคำนวณ</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...IS_STYLE, width: "100%" }} />
          </div>
          {/* แผนก */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6 }}>แผนก</label>
            <Select
              options={[
                { value: "all", label: "ทุกแผนก" },
                ...departments.map((d) => ({ value: d, label: d }))
              ]}
              value={deptFilter}
              onChange={(val) => setDeptFilter(val)}
            />
          </div>
          {/* ห้องประชุม */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6 }}>ห้องประชุม</label>
            <Select
              options={[
                { value: "all", label: "ทุกห้องประชุม" },
                ...db.rooms.map((r) => ({ value: r.id, label: r.name }))
              ]}
              value={roomFilter}
              onChange={(val) => setRoomFilter(val)}
            />
          </div>
        </div>

        {/* แผงปุ่มค้นหาและดาวน์โหลดรายงาน (Search & Export Buttons Bar) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: "1px solid var(--border-soft)", paddingTop: 20 }}>
          {/* ฝั่งซ้าย: ปุ่มล้างเงื่อนไขการค้นหา */}
          <button
            onClick={handleClearFilters}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "1.5px solid var(--border-2)",
              background: "var(--surface)",
              color: "var(--text-sub)",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all .12s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--border-2)";
            }}
          >
            <Icon n="reset" s={{ fontSize: 13.5, color: "var(--text-mute)" }} />
            <span>ล้างเงื่อนไขการค้นหา</span>
          </button>

          {/* ฝั่งขวา: ปุ่มดาวน์โหลดไฟล์ PDF / Excel */}
          <div style={{ display: "flex", gap: 10 }}>
            {/* ดาวน์โหลด PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#DC2626",
                color: "#FFF",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: pdfLoading ? 0.75 : 1
              }}
            >
              {pdfLoading ? (
                <span style={{ width: 13, height: 13, border: "2px solid #FFF", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <Icon n="pdf" s={{ fontSize: 14, color: "#FFF" }} />
              )}
              <span>{pdfLoading ? "กำลังแปลงไฟล์..." : "ดาวน์โหลด PDF"}</span>
            </button>

            {/* ดาวน์โหลด Excel */}
            <button
              onClick={handleDownloadExcel}
              disabled={excelLoading}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#16A34A",
                color: "#FFF",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: excelLoading ? 0.75 : 1
              }}
            >
              {excelLoading ? (
                <span style={{ width: 13, height: 13, border: "2px solid #FFF", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <Icon n="excel" s={{ fontSize: 14, color: "#FFF" }} />
              )}
              <span>{excelLoading ? "กำลังเขียนตาราง..." : "ดาวน์โหลด Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* การ์ดสถิติไฮไลต์สะสม 4 ใบด้านบน (แสดงข้อมูลอัปเดตตอบสนองทันที) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "ชั่วโมงการใช้ห้องประชุม", value: `${aggregateKPIs.hours} ชม.`, icon: "clock", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", color: "#1E40AF" },
          { label: "วาระการประชุมสะสม", value: `${aggregateKPIs.agendaCount} วาระ`, icon: "clipboard", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", color: "#065F46" },
          { label: "ภาระงานที่มอบหมาย", value: `${aggregateKPIs.tasks} งาน`, icon: "check-circle", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", color: "#6D28D9" },
          { label: "อัตรางานสำเร็จ (MOM)", value: `${aggregateKPIs.completionPct}%`, icon: "bar-chart", bg: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", color: "#C2410C" }
        ].map((c) => (
          <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={c.icon} s={{ fontSize: 18, color: c.color }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 1px", lineHeight: 1 }}>{c.value}</p>
              <p style={{ fontSize: 12, color: "var(--text-mute)", margin: 0 }}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ตารางแสดงผลรายงานเชิงลึก (Live Reports Data Grid Panel) ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 26px", boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "var(--accent-soft)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n="clipboard" s={{ fontSize: 16, color: "var(--accent)" }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              ตารางข้อมูล: {REPORTS_LIST.find(x => x.id === selectedReportId)?.label}
            </h3>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-mute)" }}>
            คำนวณพบ {
              selectedReportId === 1 ? report1Data.length :
              selectedReportId === 2 ? report2Data.length :
              selectedReportId === 3 ? report3Data.length :
              selectedReportId === 4 ? report4Data.length :
              selectedReportId === 5 ? report5Data.length :
              selectedReportId === 6 ? report6Data.length :
              selectedReportId === 7 ? report7Data.length :
              selectedReportId === 8 ? report8Data.length :
              selectedReportId === 9 ? report9Data.length :
              selectedReportId === 10 ? report10Data.length :
              selectedReportId === 11 ? report11Data.length :
              selectedReportId === 12 ? report12Data.length :
              selectedReportId === 13 ? report13Data.length :
              selectedReportId === 14 ? report14Data.length :
              selectedReportId === 15 ? report15Data.length :
              report16Data.length
            } แถวข้อมูล
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            
            {/* 1. รายงานอัตราการครองห้องประชุมสะสม */}
            {selectedReportId === 1 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>ชื่อห้องประชุม</th>
                    <th style={TH}>อาคาร / สถานที่</th>
                    <th style={TH}>จำนวนครั้งที่ถูกจอง</th>
                    <th style={TH}>ชั่วโมงเข้าใช้งานสะสม</th>
                    <th style={TH}>อัตราการครองห้อง (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report1Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.name}</td>
                      <td style={TD}>{d.place}</td>
                      <td style={TD}>{d.count} ครั้ง</td>
                      <td style={TD}>{d.hrs} ชม.</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 2. รายงานช่วงเวลายอดฮิตในการจอง */}
            {selectedReportId === 2 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>ช่วงเวลาการประชุม</th>
                    <th style={TH}>ความถี่ในการจองใช้ห้อง</th>
                    <th style={TH}>สัดส่วนเปอร์เซ็นต์ความหนาแน่น (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report2Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.slot}</td>
                      <td style={TD}>{d.count} ครั้ง</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 3. รายงานการวิเคราะห์ความหนาแน่นคนเข้าประชุม */}
            {selectedReportId === 3 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>ชื่อห้องประชุม</th>
                    <th style={TH}>ความจุรองรับสูงสุด</th>
                    <th style={TH}>ค่าเฉลี่ยคนเข้าประชุมจริง</th>
                    <th style={TH}>ความหนาแน่นเชิงสถิติ (%)</th>
                    <th style={TH}>การประเมินคุณภาพสเปซ</th>
                  </tr>
                </thead>
                <tbody>
                  {report3Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.name}</td>
                      <td style={TD}>{d.capacity} คน</td>
                      <td style={TD}>{d.avgParticipants} คน</td>
                      <td style={{ ...TD, fontWeight: 700, color: d.color }}>{d.densityPct}%</td>
                      <td style={{ ...TD, fontWeight: 700, color: d.color }}>{d.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 4. รายงานรูปแบบสัดส่วนการประชุม */}
            {selectedReportId === 4 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>รูปแบบกิจกรรมประชุม</th>
                    <th style={TH}>จำนวนครั้งสะสม</th>
                    <th style={TH}>คิดเป็นอัตราส่วน (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report4Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.type}</td>
                      <td style={TD}>{d.count} ครั้ง</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 5. รายงาน No-show */}
            {selectedReportId === 5 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>ชื่อห้องประชุม</th>
                    <th style={TH}>จำนวนการจองตารางล่วงหน้า</th>
                    <th style={TH}>เข้าประชุมได้บันทึกมติจริง</th>
                    <th style={TH}>ชั่วโมงยกเลิกหรือ No-Show (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody>
                  {report5Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.name}</td>
                      <td style={TD}>{d.bookingsCount} ครั้ง</td>
                      <td style={TD}>{d.actualCount} ครั้ง</td>
                      <td style={{ ...TD, fontWeight: 700, color: d.ghostCount > 0 ? "#DC2626" : "#16A34A" }}>{d.ghostCount} ครั้ง</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 6. รายงานเปรียบเทียบแยกรายแผนก */}
            {selectedReportId === 6 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>แผนกผู้จัด</th>
                    <th style={TH}>จำนวนครั้งจัดประชุม</th>
                    <th style={TH}>ชั่วโมงการใช้ห้องประชุมสะสม</th>
                  </tr>
                </thead>
                <tbody>
                  {report6Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.name}</td>
                      <td style={TD}>{d.count} ครั้ง</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.hrs} ชม.</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 7. รายงาน Meeting Fatigue */}
            {selectedReportId === 7 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>ชื่อ-สกุล พนักงาน</th>
                    <th style={TH}>แผนกต้นสังกัด</th>
                    <th style={TH}>ความถี่เข้าร่วมงาน</th>
                    <th style={TH}>ชั่วโมงประชุมในออฟฟิศรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {report7Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.name}</td>
                      <td style={TD}>{d.department}</td>
                      <td style={TD}>{d.count} ครั้ง</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.hrs} ชม.</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 8. รายงานสรุปความเร็วในการส่งมติ MOM SLA */}
            {selectedReportId === 8 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>รหัสวาระ</th>
                    <th style={TH}>หัวข้อวาระประชุม</th>
                    <th style={TH}>ผู้ขอจัดประชุม</th>
                    <th style={TH}>ผู้จดและลงนามบันทึก</th>
                    <th style={TH}>วันที่ประชุม</th>
                    <th style={TH}>เวลาในการส่งบันทึกมติ</th>
                    <th style={TH}>สถานะเอกสาร</th>
                  </tr>
                </thead>
                <tbody>
                  {report8Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.code}</td>
                      <td style={TD}>{d.title}</td>
                      <td style={TD}>{d.organizer}</td>
                      <td style={TD}>{d.publisher}</td>
                      <td style={TD}>{formatDateBE(d.date)}</td>
                      <td style={TD}>{d.duration}</td>
                      <td style={{ ...TD, fontWeight: 700, color: d.status.includes("เผยแพร่") ? "#16A34A" : "#D97706" }}>{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 9. รายนามผู้ค้างส่งงานมอบหมายสูงสุด */}
            {selectedReportId === 9 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>รายชื่อพนักงาน</th>
                    <th style={TH}>แผนก</th>
                    <th style={TH}>งานที่รับผิดชอบเสร็จ</th>
                    <th style={TH}>จำนวนงานที่ยังคงค้าง</th>
                    <th style={TH}>สัดส่วนค้างส่ง (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report9Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.name}</td>
                      <td style={TD}>{d.department}</td>
                      <td style={TD}>{d.total - d.pending} งาน</td>
                      <td style={{ ...TD, fontWeight: 700, color: "#DC2626" }}>{d.pending} งาน</td>
                      <td style={{ ...TD, fontWeight: 700, color: "#DC2626" }}>{d.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 10. อัตราความสำเร็จงานแยกตามวาระประชุม */}
            {selectedReportId === 10 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>รหัสระเบียบ</th>
                    <th style={TH}>โครงการการประชุม</th>
                    <th style={TH}>ฝ่ายงานดำเนินหลัก</th>
                    <th style={TH}>จำนวนงานทั้งหมด</th>
                    <th style={TH}>ดำเนินการสำเร็จ</th>
                    <th style={TH}>อัตราสำเร็จ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report10Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.code}</td>
                      <td style={TD}>{d.title}</td>
                      <td style={TD}>{d.dept}</td>
                      <td style={TD}>{d.total} งาน</td>
                      <td style={TD}>{d.done} งาน</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 11. ระยะเวลาเฉลี่ยในการปิดงานค้าง */}
            {selectedReportId === 11 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>แผนกผู้รับผิดชอบ</th>
                    <th style={TH}>จำนวนงานที่ปิดสำเร็จแล้ว</th>
                    <th style={TH}>เวลารวมที่ดำเนินการ (วันสะสม)</th>
                    <th style={TH}>เฉลี่ยระยะเวลาปิดต่อโครงการ</th>
                  </tr>
                </thead>
                <tbody>
                  {report11Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.dept}</td>
                      <td style={TD}>{d.doneCount} งาน</td>
                      <td style={TD}>{d.totalDays} วัน</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.avg} วัน / งาน</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 12. รายการงานมอบหมายล่าช้าเกินกำหนดส่ง */}
            {selectedReportId === 12 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>ชื่องาน (Action Item)</th>
                    <th style={TH}>ผู้รับผิดชอบ</th>
                    <th style={TH}>แผนก</th>
                    <th style={TH}>กำหนดส่งเดิม</th>
                    <th style={TH}>การประชุมที่เกี่ยวข้อง</th>
                    <th style={TH}>เลยกำหนดสะสม (วัน)</th>
                  </tr>
                </thead>
                <tbody>
                  {report12Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.task}</td>
                      <td style={TD}>{d.owner}</td>
                      <td style={TD}>{d.dept}</td>
                      <td style={TD}>{formatDateBE(d.dueDate)}</td>
                      <td style={TD}>{d.title}</td>
                      <td style={{ ...TD, fontWeight: 700, color: "#DC2626" }}>ล่าช้า {d.overdue} วัน</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 13. การกระจายภาระงานรายแผนก */}
            {selectedReportId === 13 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>แผนก</th>
                    <th style={TH}>จำนวนงานมอบหมายทั้งหมด</th>
                    <th style={TH}>งานที่สำเร็จแล้ว</th>
                    <th style={TH}>งานคงค้างกำลังดำเนินการ</th>
                    <th style={TH}>ความก้าวหน้าโครงการ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report13Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.dept}</td>
                      <td style={TD}>{d.total} รายการ</td>
                      <td style={TD}>{d.done} รายการ</td>
                      <td style={TD}>{d.pending} รายการ</td>
                      <td style={{ ...TD, fontWeight: 700, color: "var(--accent)" }}>{d.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 14. ชั่วโมงทำงานสูญเปล่าสะสม (Man-Hours) */}
            {selectedReportId === 14 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>แผนก</th>
                    <th style={TH}>จำนวนการจองใช้</th>
                    <th style={TH}>ผู้เข้าร่วมประชุมสะสม</th>
                    <th style={TH}>เวลาเข้าประชุมพนักงานรวม (Man-Hours)</th>
                    <th style={TH}>มูลค่าค่าเสียโอกาสสะสมจำลอง (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {report14Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.dept}</td>
                      <td style={TD}>{d.count} ครั้ง</td>
                      <td style={TD}>{d.participants} คน</td>
                      <td style={TD}>{d.manHours} ชม.</td>
                      <td style={{ ...TD, fontWeight: 700, color: "#DC2626" }}>฿{d.cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 15. อัตราการประชุมยืดเยื้อเกินกำหนด */}
            {selectedReportId === 15 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>รหัสระเบียบ</th>
                    <th style={TH}>หัวข้อวาระ</th>
                    <th style={TH}>วันที่จองประชุม</th>
                    <th style={TH}>โควตาที่จองห้อง</th>
                    <th style={TH}>เวลาประชุมดำเนินจริง</th>
                    <th style={TH}>ระยะเวลาล้นเกินกำหนด</th>
                  </tr>
                </thead>
                <tbody>
                  {report15Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.code}</td>
                      <td style={TD}>{d.title}</td>
                      <td style={TD}>{formatDateBE(d.date)}</td>
                      <td style={TD}>{d.scheduled}</td>
                      <td style={TD}>{d.actual}</td>
                      <td style={{ ...TD, fontWeight: 700, color: d.overrun.includes("นาที") ? "#DC2626" : "#16A34A" }}>{d.overrun}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 16. ดัชนีการวางแผนประชุม */}
            {selectedReportId === 16 && (
              <>
                <thead>
                  <tr>
                    <th style={TH}>รหัสระเบียบ</th>
                    <th style={TH}>โครงการการประชุม</th>
                    <th style={TH}>ผู้ขอจัดกิจกรรม</th>
                    <th style={TH}>จำนวนหัวข้อย่อย (Items)</th>
                    <th style={TH}>ไฟล์แนบประกอบเอกสาร</th>
                    <th style={TH}>คะแนนความพร้อม</th>
                    <th style={TH}>เกรดการประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {report16Data.map((d, i) => (
                    <tr key={i} className="row-hover">
                      <td style={{ ...TD, fontWeight: 700, color: "var(--text)" }}>{d.code}</td>
                      <td style={TD}>{d.title}</td>
                      <td style={TD}>{d.organizer}</td>
                      <td style={TD}>{d.itemsCount} หัวข้อ</td>
                      <td style={TD}>{d.fileCount} ไฟล์</td>
                      <td style={TD}>{d.score}</td>
                      <td style={{ ...TD, fontWeight: 900, color: d.color }}>{d.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

          </table>

          {/* กรณีไม่มีข้อมูลการคำนวณ */}
          {((selectedReportId === 1 && report1Data.length === 0) ||
            (selectedReportId === 2 && report2Data.length === 0) ||
            (selectedReportId === 3 && report3Data.length === 0) ||
            (selectedReportId === 4 && report4Data.length === 0) ||
            (selectedReportId === 5 && report5Data.length === 0) ||
            (selectedReportId === 6 && report6Data.length === 0) ||
            (selectedReportId === 7 && report7Data.length === 0) ||
            (selectedReportId === 8 && report8Data.length === 0) ||
            (selectedReportId === 9 && report9Data.length === 0) ||
            (selectedReportId === 10 && report10Data.length === 0) ||
            (selectedReportId === 11 && report11Data.length === 0) ||
            (selectedReportId === 12 && report12Data.length === 0) ||
            (selectedReportId === 13 && report13Data.length === 0) ||
            (selectedReportId === 14 && report14Data.length === 0) ||
            (selectedReportId === 15 && report15Data.length === 0) ||
            (selectedReportId === 16 && report16Data.length === 0)) && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-ghost)" }}>
                <Icon n="alert-circle" s={{ fontSize: 28, color: "var(--text-mute)", marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 14 }}>ไม่พบข้อมูลสถิติตามขอบเขตพารามิเตอร์ที่คุณเลือก</p>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Reports;
