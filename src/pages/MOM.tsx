/**
 * ==========================================
 * ไฟล์: MOM.tsx
 * หน้าที่หลัก: ระบบรายงานบันทึกการประชุมและมติการประชุม (Minutes of Meeting - MOM)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ตารางรายชื่อสรุปการประชุม (MOM Table): รายการวาระการประชุมที่เสร็จสิ้น พร้อมแสดงไอคอนสัญลักษณ์ "ดูสรุป" (Eye) หรือ "กรอก/แก้ไข" (Edit/Plus) เคียงข้างกัน
 * 2. บันทึกผลการประชุมรายวาระ (MOM Agenda Results): คีย์บอร์ดข้อความสรุปหัวข้อวาระเป้าหมายที่ตกลงกันเสร็จเรียบร้อย
 * 3. รายการติดตามงานมอบหมาย (Action Items Checklist): สร้างรายการมอบหมายงาน มอบให้ผู้ใช้รับผิดชอบ และมีช่องเลือก "เสร็จ" (Checkbox) เพื่ออัปเดตสถิติติดตาม
 * 4. หน้าจอโหมดอ่านอย่างเดียว (Read-Only Mode): เมื่ออยู่ในสถานะอ่านทั่วไป ระบบจะซ่อนฟังก์ชันบันทึกและแสดงข้อมูลในรูปแบบตัวอักษรแทนอินพุต
 * ==========================================
 */
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import Icon from "../components/common/Icon";
import { AlertBox } from "../components/common/AlertBox";
import { BtnPri, BtnSec } from "../components/common/Buttons";
import { Avatar } from "../components/common/Avatar";
import Tooltip from "../components/common/Tooltip";
import { PageHeader, CardHead } from "./Dashboard";
import { TimeField, Select } from "../components/common/FormFields";
import {
  getAgendaStatus,
  canSeeAgenda,
  canEditAgenda,
  isInvolvedInAgenda,
  agendaLocationLabel,
  DetailField,
  AGENDA_STATUS_META
} from "./Agenda";
import type {
  User,
  Agenda as AgendaType,
  Minutes,
  Room,
  ActionItem
} from "../utils/types";
import { formatDateBE, formatLongDateBE } from "../utils/helpers";

// คอมโพเนนต์แสดงสถานะการบันทึกสรุปการประชุม (MOM Status Badge) พร้อมไอคอนบ่งชี้
export const MomStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // สเปคสีกราฟิกแสดงตามระดับความก้าวหน้าการรายงานประชุม
  const meta = {
    none: { label: "ยังไม่กรอก", bg: "#F1F5F9", color: "#64748B", icon: "info" },
    draft: { label: "ฉบับร่าง", bg: "#FFF7ED", color: "#C2410C", icon: "edit" },
    published: { label: "เผยแพร่แล้ว", bg: "#E7F6EC", color: "#1A7F37", icon: "check-circle" },
    waiting: { label: "รอการประชุมเสร็จสิ้น", bg: "#E2F0FD", color: "#0B4A8F", icon: "clock" },
    cancelled: { label: "ยกเลิกบันทึก MOM", bg: "#FEE4E2", color: "#B42318", icon: "x-circle" }
  }[status] || { label: "ยังไม่กรอก", bg: "#F1F5F9", color: "#64748B", icon: "info" };

  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        background: meta.bg,
        color: meta.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap"
      }}
    >
      <Icon n={meta.icon} s={{ fontSize: 11, color: meta.color }} />
      {meta.label}
    </span>
  );
};

// สังเคราะห์โครงร่างโมเดลบันทึกรายงานการประชุมเริ่มต้น (Empty MOM Template)
function emptyMomForAgenda(agenda: AgendaType): Minutes {
  return {
    agendaId: agenda.id,
    overview: "",
    // ลิงก์หัวข้อวาระเป้าหมายเริ่มต้น เพื่อใช้ผูกและบันทึกรายงานผลรายวาระย่อย
    agendaResults: (agenda.items || []).map((it) => ({ itemId: it.id, result: "" })),
    actionItems: [],
    status: "draft",
    actualAttendeeIds: agenda.participantIds || [],
    actualStart: agenda.start || "",
    actualEnd: agenda.end || "",
    recorderId: agenda.organizerId || "",
    signedBy: "",
    attachments: []
  };
}

// ฟังก์ชันปรับความเข้ากันได้ของโครงสร้างข้อมูล MOM (Normalize MOM structure)
function normalizeMom(mom: Minutes | undefined, agenda: AgendaType): Minutes {
  const base = mom || emptyMomForAgenda(agenda);
  // ผูกจัดเตรียมรายการวาระย่อยให้สอดคล้องกันเพื่อป้องกันปัญหาอ้างอิงช่องข้อมูลว่าง
  const agendaResults = (agenda.items || []).map((it) => {
    const existing = (base.agendaResults || []).find((r) => String(r.itemId) === String(it.id));
    return { itemId: it.id, result: existing?.result || "" };
  });
  return {
    ...base,
    agendaResults,
    actionItems: base.actionItems || [],
    status: base.status || "draft",
    actualAttendeeIds: base.actualAttendeeIds || agenda.participantIds || [],
    actualStart: base.actualStart || agenda.start || "",
    actualEnd: base.actualEnd || agenda.end || "",
    recorderId: base.recorderId !== undefined ? base.recorderId : (agenda.organizerId || ""),
    signedBy: base.signedBy || "",
    attachments: base.attachments || []
  };
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

// ฟังก์ชันกรองและถอดรหัสข้อความพิเศษป้องกันปัญหาการประมวลผล HTML (HTML Character Escape)
function htmlEscape(v: string | null | undefined): string {
  return String(v ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch] || ch));
}

// ── สังเคราะห์รายงานมติการประชุม (MOM) และดาวน์โหลดเป็นไฟล์ PDF ทันที ──
export function exportMomPdf({
  agenda,
  minutes,
  organizer,
  recorder,
  attendees,
  room,
  db
}: {
  agenda: AgendaType;
  minutes: Minutes;
  organizer: User | undefined;
  recorder: User | undefined;
  attendees: User[];
  room: Room | null;
  db: any;
}): boolean {
  const safeFile = `MOM-${agenda.code || "meeting"}`.replace(/[^\w-]+/g, "-");
  const location = agenda.locationMode === "offsite" ? agenda.offsiteLocation : `${room?.name || "-"} (${agenda.place || "-"})`;

  // สร้างแถวข้อมูลมติของวาระการประชุมแต่ละข้อ
  const agendaResultsRows = (agenda.items || []).map((it, idx) => {
    const resultObj = (minutes.agendaResults || []).find((r) => String(r.itemId) === String(it.id));
    const resultText = resultObj?.result || "ไม่มีบันทึกมติที่ประชุมในวาระนี้";
    return `
      <div class="agenda-item" style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px dashed #E5E7EB; break-inside: avoid;">
        <h3 style="font-size: 13.5px; margin: 0 0 6px; color: #1E293B;">วาระที่ ${idx + 1}: ${htmlEscape(it.detail)}</h3>
        <div style="padding-left: 16px; border-left: 3px solid #1A5FA8; color: #475569; font-size: 13px; white-space: pre-wrap;">${htmlEscape(resultText)}</div>
      </div>
    `;
  }).join("") || `<p class="empty">ไม่มีบันทึกวาระการประชุม</p>`;

  // สร้างแถวข้อมูลตารางติดตามงานมอบหมาย (Action Items)
  const actionItemsRows = (minutes.actionItems || []).map((it, idx) => {
    const owner = (db.users || []).find((u: User) => u.id === it.ownerId);
    const ownerName = owner ? `${owner.prefix || ""}${owner.firstName} ${owner.lastName}` : "ไม่ระบุ";
    const statusText = it.done ? "<span style='color:#15803D; font-weight:bold;'>เสร็จสิ้น</span>" : "<span style='color:#B42318; font-weight:bold;'>ค้างส่ง</span>";
    return `
      <tr>
        <td class="num">${idx + 1}</td>
        <td>${htmlEscape(it.task)}</td>
        <td>${htmlEscape(ownerName)}</td>
        <td>${htmlEscape(it.dueDate || "-")}</td>
        <td style="text-align: center;">${statusText}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5" class="empty">ไม่มีรายการติดตามงาน (Action Items)</td></tr>`;

  // รายชื่อผู้เข้าร่วมประชุมจริง
  const participantList = attendees.map((u) => htmlEscape(`${u.prefix || ""}${u.firstName} ${u.lastName} (${u.department || "-"})`)).join(", ") || "ไม่มีผู้เข้าร่วมประชุม";

  // โครงร่างเทมเพลต HTML ในการทำหน้ารายงาน PDF
  const html = `
  <style>
    .section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .agenda-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    th {
      background: #F1F5F9;
      color: #334155;
      text-align: left;
      font-size: 12px;
      padding: 9px 10px;
      border-bottom: 1.5px solid #E2E8F0;
    }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid #EEF2F7;
      vertical-align: top;
      font-size: 12px;
      line-height: 1.5;
    }
    tr {
      /* ป้องกันการใส่ page-break-inside หลีกเลี่ยงบั๊กซ้อนทับกันของ html2canvas */
    }
    .num {
      width: 36px;
      text-align: center;
      color: #1A5FA8;
      font-weight: 700;
    }
    .empty {
      text-align: center;
      color: #94A3B8;
      padding: 18px;
    }
    .footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  </style>
  <div class="doc" style="max-width:740px; font-family:'Sarabun','Tahoma','Arial',sans-serif; color:#1E293B; line-height:1.6; font-size:13px; margin:0 auto; padding:20px; background:#fff;">
    <div class="brand" style="display:flex; align-items:center; border-bottom:3px solid #1A5FA8; padding-bottom:14px; margin-bottom:16px;">
      <div class="logo" style="width:44px; height:44px; border-radius:12px; background:#1A5FA8; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; margin-right:12px;">BST</div>
      <div>
        <h1 style="font-size:20px; margin:0; color:#0F172A;">รายงานการประชุม (Minutes of Meeting)</h1>
        <p style="margin:2px 0 0; color:#64748B; font-size:11.5px;">BST e-Meeting Portal • เอกสารสรุปมติที่ประชุมองค์กร</p>
      </div>
    </div>
    
    <div class="title-block" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
      <div>
        <h2 style="font-size:18px; margin:0 0 4px; color:#0F172A;">${htmlEscape(agenda.title)}</h2>
        <div class="meta" style="color:#64748B; font-size:12px;">รหัสอ้างอิง ${htmlEscape(agenda.code)} • ผู้จดบันทึก: ${htmlEscape(recorder ? `${recorder.prefix || ""}${recorder.firstName} ${recorder.lastName}` : "-")}</div>
      </div>
      <span class="status-badge" style="display:inline-block; border-radius:999px; background:#E7F6EC; color:#1A7F37; padding:5px 12px; font-weight:700; font-size:11.5px;">เผยแพร่แล้ว</span>
    </div>

    <div class="section" style="border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; margin-bottom:14px;">
      <h2 style="font-size:14px; margin:0 0 12px; color:#0F172A; border-bottom:1.5px solid #F1F5F9; padding-bottom:6px;">ข้อมูลกำหนดการประชุมจริง</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="width:50%; border:0; padding:4px 0;"><span style="color:#64748B; font-weight:bold;">วันที่ประชุม:</span> ${htmlEscape(formatLongDateBE(agenda.date) || "-")}</td>
          <td style="width:50%; border:0; padding:4px 0;"><span style="color:#64748B; font-weight:bold;">เวลาดำเนินการจริง:</span> ${htmlEscape(`${minutes.actualStart || "-"} - ${minutes.actualEnd || "-"} น.`)}</td>
        </tr>
        <tr>
          <td style="width:50%; border:0; padding:4px 0;"><span style="color:#64748B; font-weight:bold;">สถานที่:</span> ${htmlEscape(location || "-")}</td>
          <td style="width:50%; border:0; padding:4px 0;"><span style="color:#64748B; font-weight:bold;">ผู้จัดวาระการประชุม:</span> ${htmlEscape(organizer ? `${organizer.prefix || ""}${organizer.firstName} ${organizer.lastName}` : "-")}</td>
        </tr>
      </table>
      <div class="field" style="margin-top:12px; border-top:1px solid #F1F5F9; padding-top:8px;">
        <label style="display:block; font-size:11px; color:#64748B; font-weight:700; margin-bottom:2px;">รายชื่อผู้เข้าร่วมประชุมทั้งหมด</label>
        <div style="font-weight:normal; color:#475569; font-size:12.5px;">${participantList}</div>
      </div>
    </div>

    <div class="section" style="border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; margin-bottom:14px;">
      <h2 style="font-size:14px; margin:0 0 12px; color:#0F172A; border-bottom:1.5px solid #F1F5F9; padding-bottom:6px;">สรุปภาพรวมการประชุม (Executive Summary)</h2>
      <p class="pre" style="font-size:13px; line-height:1.6; color:#334155; white-space:pre-wrap; margin:0;">${htmlEscape(minutes.overview || "ไม่มีบันทึกข้อมูลสรุปภาพรวม")}</p>
    </div>

    <div class="section" style="border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; margin-bottom:14px;">
      <h2 style="font-size:14px; margin:0 0 12px; color:#0F172A; border-bottom:1.5px solid #F1F5F9; padding-bottom:6px;">รายละเอียดและมติที่ประชุมในแต่ละวาระ</h2>
      ${agendaResultsRows}
    </div>

    <div class="section" style="border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; margin-bottom:14px;">
      <h2 style="font-size:14px; margin:0 0 12px; color:#0F172A; border-bottom:1.5px solid #F1F5F9; padding-bottom:6px;">รายการติดตามงานมอบหมาย (Action Items)</h2>
      <table style="width:100%; border-collapse:collapse; margin-top:6px;">
        <thead>
          <tr style="background:#F1F5F9;">
            <th style="width:36px; padding:8px 10px; border-bottom:1.5px solid #E2E8F0; text-align:left;">#</th>
            <th style="padding:8px 10px; border-bottom:1.5px solid #E2E8F0; text-align:left;">งานที่มอบหมาย (Task)</th>
            <th style="padding:8px 10px; border-bottom:1.5px solid #E2E8F0; text-align:left;">ผู้รับผิดชอบ (Owner)</th>
            <th style="width:110px; padding:8px 10px; border-bottom:1.5px solid #E2E8F0; text-align:left;">กำหนดส่ง (Due)</th>
            <th style="width:100px; padding:8px 10px; border-bottom:1.5px solid #E2E8F0; text-align:center;">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          ${actionItemsRows}
        </tbody>
      </table>
    </div>

    <div class="footer" style="margin-top:32px; display:grid; grid-template-columns:1fr 1fr; gap:40px; color:#64748B; font-size:12.5px;">
      <div class="sign" style="border-top:1px solid #CBD5E1; padding-top:8px; margin-top:48px; text-align:center;">ผู้บันทึกรายงานการประชุม<br/>(${htmlEscape(recorder ? `${recorder.prefix || ""}${recorder.firstName} ${recorder.lastName}` : "—")})</div>
      <div class="sign" style="border-top:1px solid #CBD5E1; padding-top:8px; margin-top:48px; text-align:center;">ผู้ตรวจสอบและอนุมัติรายงาน<br/>(${htmlEscape(organizer ? `${organizer.prefix || ""}${organizer.firstName} ${organizer.lastName}` : "—")})</div>
    </div>
  </div>`;

  // เรียกใช้คำสั่งดาวน์โหลดไฟล์ PDF โดยตรง
  loadHtml2Pdf().then((html2pdf) => {
    if (!html2pdf) return;
    const element = document.createElement("div");
    element.innerHTML = html;
    
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

export const MOM: React.FC = () => {
  const { db, updateDB, currentUser, showToast, deepLinkAgendaId, navigateMenu } = useApp();

  const deepLinked = deepLinkAgendaId
    ? (db.agendas || []).find((a) => a.id === deepLinkAgendaId && ["done", "done_continued"].includes(getAgendaStatus(a, db)))
    : null;

  const [view, setView] = useState<"list" | "detail">(deepLinked ? "detail" : "list");
  const [selected, setSelected] = useState<AgendaType | null>(deepLinked || null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [momFilter, setMomFilter] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);

  const isAdmin = currentUser?.role === "แอดมิน";

  const [initEditMode, setInitEditMode] = useState(false);

  const openView = (agenda: AgendaType, editMode = false) => {
    setSelected(agenda);
    setInitEditMode(editMode);
    setView("detail");
  };
  
  const backToList = () => {
    setSelected(null);
    setView("list");
  };

  const saveMom = (agenda: AgendaType, data: Minutes) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const oldMinutes = db.minutes || [];
    const existing = oldMinutes.find((m) => m.agendaId === agenda.id);
    
    const nextMom = {
      ...(existing || { agendaId: agenda.id, createdAt: now }),
      ...data,
      agendaId: agenda.id,
      updatedBy: currentUser.id,
      updatedAt: now
    };

    // อัปเดตตารางฐานข้อมูลส่วนกลางด้วยชุดข้อมูลรายงานบันทึกการประชุมเวอร์ชันใหม่
    updateDB({
      ...db,
      minutes: existing
        ? oldMinutes.map((m) => (m.agendaId === agenda.id ? nextMom : m))
        : [...oldMinutes, nextMom]
    });

    showToast(data.status === "published" ? "เผยแพร่ MOM แล้ว" : "บันทึกฉบับร่าง MOM แล้ว");
  };

  // หากอยู่ในหน้าดูรายละเอียด ให้นำเสนอคอมโพเนนต์ MomDetail
  if (view === "detail" && selected) {
    const fresh = (db.agendas || []).find((a) => a.id === selected.id) || selected;
    return (
      <MomDetail
        db={db}
        agenda={fresh}
        currentUser={currentUser}
        onBack={backToList}
        onSave={saveMom}
        onOpenAgenda={(id) => navigateMenu("agenda", id)}
        initialEditMode={initEditMode}
      />
    );
  }

  // ── คัดกรองกรองและจัดเรียงวาระการประชุมที่เสร็จสิ้นแล้วเพื่อแสดงผล (Filtering & Sorting) ──
  const visible = (db.agendas || [])
    // กรองเอาเฉพาะวาระที่สิทธิ์ผู้ใช้งานมีสิทธิ์อ่าน
    .filter((a) => canSeeAgenda(a, currentUser))
    // กรองตามแผนก/ฝ่าย "เฉพาะงานของฉัน"
    .filter((a) => !onlyMine || isInvolvedInAgenda(a, currentUser))
    // กรองตามประเภทของวาระ (ทั้งหมด / วาระใหม่ / วาระสืบเนื่อง)
    .filter((a) => typeFilter === "all" || a.meetingType === typeFilter)
    // กรองตามสถานะการเขียนรายงานการประชุม (ทั้งหมด / ฉบับร่าง / เผยแพร่แล้ว / ยังไม่จดบันทึก / รอการประชุมเสร็จสิ้น / ยกเลิก)
    .filter((a) => {
      const stKey = getAgendaStatus(a, db);
      let displayMomStatus = "none";
      if (stKey === "upcoming" || stKey === "ongoing") displayMomStatus = "waiting";
      else if (stKey === "cancelled") displayMomStatus = "cancelled";
      else {
        const mom = (db.minutes || []).find((m) => m.agendaId === a.id);
        displayMomStatus = mom ? mom.status : "none";
      }
      return momFilter === "all" || displayMomStatus === momFilter;
    })
    // ค้นหาตามคีย์เวิร์ดชื่อหรือรหัสวาระ
    .filter((a) => !search || a.title.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()))
    // เรียงตามวันที่ล่าสุดขึ้นก่อน
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));

  return (
    <div className="fu">
      <PageHeader title="สรุปการประชุม" subtitle="แสดง Agenda ที่เสร็จสิ้นแล้ว และบันทึก Minutes of Meeting แยกจากข้อมูล Agenda" />

      <div style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-soft2)",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "var(--accent)",
        fontSize: 12.5,
        fontWeight: 500
      }}>
        <Icon n="info" s={{ fontSize: 16, color: "var(--accent)" }} />
        <span>ระบบจะแสดงวาระการประชุมที่ <strong>เสร็จสิ้นแล้วตามกำหนดเวลาเท่านั้น</strong> เพื่อนำข้อมูลมาเริ่มเขียนและรายงานมติสรุปการประชุม (MOM)</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
            <Icon n="search" s={{ fontSize: 17, color: "var(--text-ghost)" }} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยรหัส Agenda หรือชื่อการประชุม..."
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
            { value: "all", label: "ทุกสถานะ MOM" },
            { value: "waiting", label: "รอการประชุมเสร็จสิ้น" },
            { value: "none", label: "ยังไม่กรอก" },
            { value: "draft", label: "ฉบับร่าง" },
            { value: "published", label: "เผยแพร่แล้ว" },
            { value: "cancelled", label: "ยกเลิกบันทึก MOM" }
          ]}
          value={momFilter}
          onChange={(val) => setMomFilter(val)}
          style={{ width: "auto", minWidth: 170 }}
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
                {["จัดการ", "รหัส Agenda", "ชื่อการประชุม", "ประเภท", "สถานะ Agenda", "สถานะ MOM", "วันที่ / เวลา", "สถานที่", "ผู้สร้าง", "Action Items"].map((h) => (
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
                const mom = (db.minutes || []).find((m) => m.agendaId === a.id);
                
                const agendaStatusKey = getAgendaStatus(a, db);
                const canEdit = canEditAgenda(a, currentUser) && ["done", "done_continued"].includes(agendaStatusKey);
                const st = AGENDA_STATUS_META[agendaStatusKey] || AGENDA_STATUS_META.upcoming;
                
                let displayMomStatus = "none";
                if (agendaStatusKey === "upcoming" || agendaStatusKey === "ongoing") {
                  displayMomStatus = "waiting";
                } else if (agendaStatusKey === "cancelled") {
                  displayMomStatus = "cancelled";
                } else {
                  displayMomStatus = mom ? mom.status : "none";
                }
                
                const actionDone = (mom?.actionItems || []).filter((x) => x.done).length;
                const isActionDisabled = displayMomStatus === "waiting" || displayMomStatus === "cancelled";

                return (
                  <tr key={a.id} className="row-hover" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Tooltip label={isActionDisabled ? "ยังไม่ถึงเวลาจดบันทึกรายงานการประชุม" : "ดูสรุปการประชุม (MOM)"} dir="t">
                          <button 
                            disabled={isActionDisabled}
                            onClick={() => !isActionDisabled && openView(a, false)} 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              background: "var(--accent-soft)", 
                              border: "none", 
                              borderRadius: 8, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: isActionDisabled ? "not-allowed" : "pointer",
                              opacity: isActionDisabled ? 0.4 : 1
                            }}
                          >
                            <Icon n="eye" s={{ fontSize: 15, color: "var(--accent)" }} />
                          </button>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip label={displayMomStatus === "published" ? "แก้ไขสรุปการประชุม" : displayMomStatus === "draft" ? "แก้ไขฉบับร่าง MOM" : "กรอกสรุปการประชุม (MOM)"} dir="t">
                            <button onClick={() => openView(a, true)} style={{ width: 32, height: 32, background: "var(--surface-2)", border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Icon n={displayMomStatus === "none" ? "plus" : "edit"} s={{ fontSize: 15, color: "var(--text-mute)" }} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--text-sub)" }}>{a.code}</span>
                    </td>
                    <td style={TD}>
                      <p style={{ fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{a.title}</p>
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
                    </td>
                    <td style={TD}>
                      <MomStatusBadge status={displayMomStatus} />
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
                      <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{mom ? `${actionDone}/${(mom.actionItems || []).length} เสร็จ` : "—"}</span>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "var(--text-ghost)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <Icon n="file-text" s={{ fontSize: 36, color: "var(--text-ghost)" }} />
                      <span>ยังไม่มี Agenda ที่เสร็จสิ้นตรงกับเงื่อนไข</span>
                      <span style={{ fontSize: 12 }}>หน้านี้จะแสดงเฉพาะ Agenda สถานะเสร็จสิ้น หรือเสร็จสิ้น (ต่อเนื่อง)</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 20px", fontSize: 12, color: "var(--text-faint)", borderTop: "1px solid var(--border-soft)", background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon n="file-text" s={{ fontSize: 14, color: "var(--text-faint)" }} /> ทั้งหมด {visible.length} รายการ
        </div>
      </div>
    </div>
  );
};

/* ── MomDetail Component ── */
interface MomDetailProps {
  db: any;
  agenda: AgendaType;
  currentUser: User | null;
  onBack: () => void;
  onSave: (agenda: AgendaType, data: Minutes) => void;
  onOpenAgenda: (id: number) => void;
  initialEditMode?: boolean;
}

const MomDetail: React.FC<MomDetailProps> = ({
  db,
  agenda,
  currentUser,
  onBack,
  onSave,
  onOpenAgenda,
  initialEditMode
}) => {
  // ค้นหาข้อมูลรายงานสรุปการประชุมของวาระนี้
  const savedMom = (db.minutes || []).find((m: Minutes) => m.agendaId === agenda.id);
  const agendaStatusKey = getAgendaStatus(agenda, db);
  const canEdit = canEditAgenda(agenda, currentUser) && ["done", "done_continued"].includes(agendaStatusKey);

  // สเตทเก็บโครงสร้างข้อมูลฟอร์ม MOM ปัจจุบัน
  const [form, setForm] = useState<Minutes>(() => normalizeMom(savedMom, agenda));
  // สเตทระบุสถานะกำลังพิมพ์/แก้ไขงาน (แก้ไขได้เฉพาะแอดมินหรือผู้สร้างวาระ)
  const [isEditing, setIsEditing] = useState(() => {
    if (!canEdit) return false;
    if (initialEditMode !== undefined) return initialEditMode;
    return !savedMom;
  });
  
  const organizer = db.users.find((u: User) => u.id === agenda.organizerId);
  const room = agenda.roomId ? db.rooms.find((r: Room) => r.id === agenda.roomId) : null;
  const participants = db.users.filter((u: User) => (agenda.participantIds || []).includes(u.id));
  const disabled = !canEdit || !isEditing;

  // ฟังก์ชันแก้ไขข้อความสรุปมติการประชุมรายหัวข้อวาระย่อย
  const setAgendaResult = (itemId: number, result: string) =>
    setForm((f) => ({
      ...f,
      agendaResults: (f.agendaResults || []).map((r) => (String(r.itemId) === String(itemId) ? { ...r, result } : r))
    }));

  // ฟังก์ชันเพิ่มแถวรายการ Action Item (งานที่มอบหมายเพิ่มเติม)
  const addAction = () =>
    setForm((f) => ({
      ...f,
      actionItems: [...(f.actionItems || []), { id: Date.now(), task: "", ownerId: "", dueDate: "", done: false }]
    }));

  // ฟังก์ชันแก้ไขข้อมูล Action Item แถวใดแถวหนึ่ง (เช่น ชื่อผู้รับผิดชอบ, กำหนดส่ง)
  const updateAction = (id: number, patch: Partial<ActionItem>) =>
    setForm((f) => ({
      ...f,
      actionItems: (f.actionItems || []).map((a) => (a.id === id ? { ...a, ...patch } : a))
    }));

  // ฟังก์ชันลบแถวรายการ Action Item
  const removeAction = (id: number) =>
    setForm((f) => ({
      ...f,
      actionItems: (f.actionItems || []).filter((a) => a.id !== id)
    }));

  // ฟังก์ชันบันทึกและส่งข้อมูล MOM ทั้งหมดลงฐานข้อมูลจำลอง
  const doSave = () => {
    // ใช้ Regex ตรวจสอบความถูกต้องของรูปแบบเวลา 24 ชม.
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (form.actualStart && !timeRegex.test(form.actualStart)) {
      alert("กรุณากรอกเวลาเริ่มต้นจริงให้ถูกต้องในรูปแบบ 24 ชม. (เช่น 09:30)");
      return;
    }
    if (form.actualEnd && !timeRegex.test(form.actualEnd)) {
      alert("กรุณากรอกเวลาสิ้นสุดจริงให้ถูกต้องในรูปแบบ 24 ชม. (เช่น 11:45)");
      return;
    }
    // ดำเนินการยิงฟังก์ชันบันทึกที่ส่งมาจากระดับเพจหลัก
    onSave(agenda, form);
    setIsEditing(false);
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
        <Icon n="arrow-left" s={{ fontSize: 13, color: "var(--text-faint)" }} /> สรุปการประชุม
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>{agenda.title}</h1>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
            รหัส {agenda.code} · สร้างโดย {organizer?.prefix}
            {organizer?.firstName} {organizer?.lastName}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MomStatusBadge status={savedMom ? form.status : "none"} />
          <BtnSec onClick={() => onOpenAgenda(agenda.id)} icon="clipboard" style={{ width: "auto", padding: "0 18px", height: 44 }}>
            ดู Agenda
          </BtnSec>
          {savedMom && savedMom.status === "published" && (
            <BtnSec
              onClick={() => {
                const rec = db.users.find((u: User) => u.id === form.recorderId);
                const att = db.users.filter((u: User) => (form.actualAttendeeIds || []).includes(u.id));
                exportMomPdf({
                  agenda,
                  minutes: form,
                  organizer,
                  recorder: rec,
                  attendees: att,
                  room,
                  db
                });
              }}
              icon="printer"
              style={{ width: "auto", padding: "0 18px", height: 44 }}
            >
              พิมพ์รายงาน MOM
            </BtnSec>
          )}
          {canEdit && (
            <>
              {!isEditing ? (
                <BtnPri onClick={() => setIsEditing(true)} icon="edit" style={{ width: "auto", padding: "0 22px", height: 44 }}>
                  แก้ไข MOM
                </BtnPri>
              ) : (
                <>
                  {savedMom && (
                    <BtnSec
                      onClick={() => {
                        setForm(normalizeMom(savedMom, agenda));
                        setIsEditing(false);
                      }}
                      icon="x"
                      style={{ width: "auto", padding: "0 18px", height: 44 }}
                    >
                      ยกเลิก
                    </BtnSec>
                  )}
                  <BtnPri onClick={doSave} icon="save" style={{ width: "auto", padding: "0 22px", height: 44 }}>
                    บันทึก MOM
                  </BtnPri>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {!canEdit && (
        <AlertBox 
          type="info" 
          msg={
            !["done", "done_continued"].includes(agendaStatusKey)
              ? "การประชุมยังไม่เสร็จสิ้นตามกำหนดการ จึงยังไม่เปิดให้กรอกบันทึกรายงานการประชุม (MOM) ครับ"
              : "คุณมีสิทธิ์ดู MOM ได้อย่างเดียว เฉพาะผู้สร้าง Agenda หรือแอดมินเท่านั้นที่แก้ไข MOM ได้"
          } 
          style={{ marginBottom: 18 }} 
        />
      )}

      {canEdit && !isEditing && (
        <div style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-soft)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 18,
          fontSize: 12.5,
          color: "var(--text-sub)",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <Icon n="info" s={{ fontSize: 16, color: "var(--text-mute)" }} />
          <span>ท่านสามารถกรอกข้อมูลสรุปมติการประชุมและงานมอบหมายได้โดยการกดปุ่ม <strong>"แก้ไข MOM"</strong> ด้านบนขวาครับ</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="info" title="ข้อมูล Agenda (อ่านอย่างเดียว)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <DetailField icon="calendar" label="วันที่" value={formatLongDateBE(agenda.date)} />
              <DetailField icon="clock" label="เวลา" value={`${agenda.start} - ${agenda.end} น.`} />
              <DetailField icon="map-pin" label="สถานที่" value={agenda.locationMode === "offsite" ? agenda.offsiteLocation : `${room?.name || "—"} (${agenda.place})`} />
              <DetailField icon="video" label="ลิงก์ออนไลน์" value={agenda.hasOnlineLink ? agenda.onlineLink : "ไม่มี"} />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 6, fontWeight: 600, margin: "0 0 6px" }}>วัตถุประสงค์การประชุม</p>
            <p style={{ fontSize: 13.5, color: "var(--text-sub)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{agenda.objective || "—"}</p>
            {agenda.details && (
              <>
                <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "16px 0 6px", fontWeight: 600 }}>รายละเอียดเพิ่มเติม</p>
                <p style={{ fontSize: 13.5, color: "var(--text-sub)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{agenda.details}</p>
              </>
            )}
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="file-text" title="สรุปภาพรวมการประชุม" />
            <textarea
              value={form.overview || ""}
              disabled={disabled}
              onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
              placeholder="กรอกสรุปภาพรวมการประชุม..."
              style={{ ...IS_STYLE, minHeight: 110, resize: "vertical", lineHeight: 1.6, background: disabled ? "var(--surface-2)" : "var(--input-bg)" }}
            />
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="list" title="ผลการประชุมแยกตามวาระ" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(agenda.items || []).map((it, idx) => {
                const result = (form.agendaResults || []).find((r) => String(r.itemId) === String(it.id))?.result || "";
                return (
                  <div key={it.id} style={{ paddingBottom: 14, borderBottom: idx < agenda.items.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-sub)", paddingTop: 3, margin: 0 }}>{it.detail}</p>
                    </div>
                    <textarea
                      value={result}
                      disabled={disabled}
                      onChange={(e) => setAgendaResult(it.id, e.target.value)}
                      placeholder="กรอกผลการประชุมของวาระนี้..."
                      style={{ ...IS_STYLE, minHeight: 82, resize: "vertical", lineHeight: 1.6, background: disabled ? "var(--surface-2)" : "var(--input-bg)" }}
                    />
                  </div>
                );
              })}
              {(!agenda.items || agenda.items.length === 0) && <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>ไม่มีวาระการประชุม</p>}
            </div>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <CardHead icon="check-circle" title="Action Items" />
              {!disabled && (
                <BtnSec onClick={addAction} icon="plus" style={{ width: "auto", padding: "0 14px", height: 36 }}>
                  เพิ่มงาน
                </BtnSec>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(form.actionItems || []).map((a, idx) => (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.7fr) minmax(160px,1fr) 150px 78px 36px", gap: 10, alignItems: "center" }}>
                  <input
                    value={a.task || ""}
                    disabled={disabled}
                    onChange={(e) => updateAction(a.id, { task: e.target.value })}
                    placeholder={`งานที่ต้องทำ #${idx + 1}`}
                    style={{ ...IS_STYLE, background: disabled ? "var(--surface-2)" : "var(--input-bg)" }}
                  />
                  <Select
                    options={participants.map((u: User) => ({
                      value: u.id,
                      label: `${u.prefix}${u.firstName} ${u.lastName}`
                    }))}
                    value={a.ownerId || ""}
                    disabled={disabled}
                    onChange={(val) => updateAction(a.id, { ownerId: val ? Number(val) : "" })}
                    placeholder="ผู้รับผิดชอบ"
                  />
                  <input
                    type="date"
                    value={a.dueDate || ""}
                    disabled={disabled}
                    onChange={(e) => updateAction(a.id, { dueDate: e.target.value })}
                    style={{ ...IS_STYLE, background: disabled ? "var(--surface-2)" : "var(--input-bg)" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-sub)", cursor: disabled ? "default" : "pointer" }}>
                    <input type="checkbox" checked={!!a.done} disabled={disabled} onChange={(e) => updateAction(a.id, { done: e.target.checked })} /> เสร็จ
                  </label>
                  {!disabled ? (
                    <button
                      onClick={() => removeAction(a.id)}
                      style={{ width: 34, height: 34, border: "none", borderRadius: 8, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <Icon n="x" s={{ fontSize: 15, color: "#B42318" }} />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
              {(form.actionItems || []).length === 0 && <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>ยังไม่มี Action Items</p>}
            </div>
          </div>
        </div>

        <div>
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="settings" title="สถานะ MOM" />
            <Select
              options={[
                { value: "draft", label: "ฉบับร่าง" },
                { value: "published", label: "เผยแพร่แล้ว" }
              ]}
              value={form.status || "draft"}
              disabled={disabled}
              onChange={(val) => setForm((f) => ({ ...f, status: val }))}
            />
          </div>

          {/* MOM Record Details */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="clipboard" title="รายละเอียดการบันทึก MOM" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-mute)", marginBottom: 6 }}>
                  เวลาเริ่ม-สิ้นสุดจริง
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {disabled ? (
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-sub)" }}>
                      {form.actualStart && form.actualEnd
                        ? `${form.actualStart} น. - ${form.actualEnd} น.`
                        : `${form.actualStart || "—"} - ${form.actualEnd || "—"}`}
                    </span>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <TimeField
                          value={form.actualStart || ""}
                          onChange={(t) => setForm((f) => ({
                            ...f,
                            actualStart: t,
                            actualEnd: f.actualEnd && f.actualEnd <= t ? "" : f.actualEnd
                          }))}
                        />
                      </div>
                      <span style={{ color: "var(--text-mute)", fontSize: 12 }}>ถึง</span>
                      <div style={{ flex: 1 }}>
                        <TimeField
                          value={form.actualEnd || ""}
                          minTime={form.actualStart}
                          onChange={(t) => setForm((f) => ({ ...f, actualEnd: t }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-mute)", marginBottom: 6 }}>
                  ผู้จดบันทึกรายงานการประชุม
                </label>
                <Select
                  options={participants.map((u: User) => ({
                    value: u.id,
                    label: `${u.prefix}${u.firstName} ${u.lastName}`
                  }))}
                  value={form.recorderId !== undefined ? form.recorderId : ""}
                  disabled={disabled}
                  onChange={(val) => setForm((f) => ({ ...f, recorderId: val ? Number(val) : "" }))}
                  placeholder="-- เลือกผู้บันทึก --"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-mute)", marginBottom: 6 }}>
                  ประธาน / ผู้รับรองรายงาน
                </label>
                <Select
                  options={db.users.filter((u: User) => u.role === "แอดมิน" || u.role === "ผู้ใช้งาน").map((u: User) => ({
                    value: u.id,
                    label: `${u.prefix}${u.firstName} ${u.lastName} (${u.role})`
                  }))}
                  value={form.signedBy || ""}
                  disabled={disabled}
                  onChange={(val) => setForm((f) => ({ ...f, signedBy: val ? Number(val) : "" }))}
                  placeholder="-- เลือกประธานผู้รับรอง --"
                />
              </div>
            </div>
          </div>

          {/* Actual Attendees List */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="users" title={`รายชื่อผู้เข้าร่วมประชุม (${participants.length} คน)`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {participants.map((u: User) => {
                const attended = (form.actualAttendeeIds || []).includes(u.id);
                return (
                  <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: disabled ? "default" : "pointer" }}>
                    <input
                      type="checkbox"
                      checked={attended}
                      disabled={disabled}
                      onChange={() => {
                        const current = form.actualAttendeeIds || [];
                        const next = current.includes(u.id)
                          ? current.filter((id) => id !== u.id)
                          : [...current, u.id];
                        setForm((f) => ({ ...f, actualAttendeeIds: next }));
                      }}
                      style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: disabled ? "default" : "pointer" }}
                    />
                    <Avatar user={u} size={32} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: attended ? "var(--text)" : "var(--text-mute)", textDecoration: attended ? "none" : "line-through", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                        {u.prefix}{u.firstName} {u.lastName}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0 }}>
                        {u.department} · {attended ? "เข้าร่วม" : "ไม่เข้าร่วม/ลา"}
                      </p>
                    </div>
                  </label>
                );
              })}
              {participants.length === 0 && <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>ไม่มีผู้เข้าร่วม</p>}
            </div>
            {agenda.hasExternal && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6, margin: "0 0 6px" }}>ผู้เข้าร่วมภายนอก</p>
                <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{agenda.externalParticipants}</p>
              </div>
            )}
          </div>

          {/* MOM Attachments Card */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 22, marginBottom: 18, boxShadow: "var(--shadow)" }}>
            <CardHead icon="paperclip" title="เอกสารแนบสรุปการประชุม" />
            
            {/* File Dropzone */}
            {!disabled && (
              <div
                style={{
                  border: "2px dashed var(--border-2)",
                  borderRadius: 10,
                  padding: "16px 10px",
                  textAlign: "center",
                  background: "var(--bg)",
                  cursor: "pointer",
                  position: "relative",
                  marginBottom: 12,
                  transition: "all .2s"
                }}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    
                    Array.from(files).forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64Data = event.target?.result as string;
                        setForm((f) => ({
                          ...f,
                          attachments: [
                            ...(f.attachments || []),
                            { name: file.name, data: base64Data, type: file.type }
                          ]
                        }));
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
                <Icon n="upload" s={{ fontSize: 22, color: "var(--accent)", marginBottom: 6 }} />
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-sub)", margin: "0 0 2px" }}>
                  อัปโหลดไฟล์สรุป/รูปภาพ
                </p>
                <p style={{ fontSize: 10, color: "var(--text-mute)", margin: 0 }}>
                  รองรับ PDF และไฟล์รูปภาพ
                </p>
              </div>
            )}

              {/* Attachments List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(form.attachments || []).map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--bg)",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border-soft)"
                    }}
                  >
                    <Icon
                      n={file.type.includes("pdf") ? "file-text" : "image"}
                      s={{ fontSize: 16, color: file.type.includes("pdf") ? "#B42318" : "#027A48" }}
                    />
                    <a
                      href={file.data}
                      download={file.name}
                      style={{
                        flex: 1,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--accent)",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {file.name}
                    </a>
                    {!disabled && (
                      <button
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            attachments: (f.attachments || []).filter((_, i) => i !== idx)
                          }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          padding: 0
                        }}
                      >
                        <Icon n="x" s={{ fontSize: 13, color: "#B42318" }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
  background: "var(--surface-2)",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit"
};

const TD = {
  padding: "12px 16px",
  color: "var(--text-sub)",
  verticalAlign: "middle"
};

export default MOM;
