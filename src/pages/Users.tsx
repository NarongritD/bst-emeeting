/**
 * ==========================================
 * ไฟล์: Users.tsx
 * หน้าที่หลัก: หน้าจัดการข้อมูลและบัญชีผู้ใช้งานระบบ (User Account Administration)
 * 
 * รายละเอียดส่วนประกอบ:
 * 1. ตารางรายชื่อผู้ใช้และระบบแบ่งหน้า (Users Table & Pagination): ตารางแสดงผล ค้นหาคีย์ลัด จัดเรียงแผนก พร้อมบาร์แบ่งหน้ายืดหยุ่นได้
 * 2. ฟอร์มเพิ่ม/แก้ไขพนักงาน (User Add/Edit Form): หน้าต่างกรอกสิทธิ์ข้อมูล รหัสพนักงาน เบอร์โทรศัพท์ และอีเมลผู้ใช้
 * 3. ปุ่มนำเข้าข้อมูลพนักงาน (Excel Import Panel): ดึงข้อมูลดิบจากไฟล์ Excel และแปลงข้อมูลพนักงานเข้าสู่ตารางอัตโนมัติ
 * 4. ปุ่มรีเซ็ทรหัสผ่านและเปิด/ปิดแบนผู้ใช้ (Admin Actions): จัดการรหัสผ่านเริ่มต้นเป็น '12345' และเปลี่ยนสเตตัสผู้ใช้งาน
 * ==========================================
 */
import React, { useState } from "react";
import { useApp, ROLE_STYLE, getAccessStatus } from "../context/AppContext";
import Icon from "../components/common/Icon";
import Modal from "../components/common/Modal";
import { FL, Select } from "../components/common/FormFields";
import { AlertBox } from "../components/common/AlertBox";
import { BtnPri, BtnSec } from "../components/common/Buttons";
import { Avatar, AvatarUpload } from "../components/common/Avatar";
import Tooltip from "../components/common/Tooltip";
import { PageHeader } from "./Dashboard";
import type { User, AppDatabase } from "../utils/types";
import { DEPARTMENTS, ROLES, PREFIXES } from "../utils/helpers";

/* ── format ISO date → Thai locale short ── */
function fmtDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

/* ── Pagination bar — ใช้ซ้ำได้ทั้งด้านบนและด้านล่างของตาราง ── */
interface UserPaginationProps {
  total: number;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  safePage: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  compact?: boolean;
}

const UserPagination: React.FC<UserPaginationProps> = ({
  total,
  pageSize,
  setPageSize,
  safePage,
  setPage,
  totalPages,
  compact = false
}) => {
  return (
    <div
      style={{
        padding: compact ? "10px 20px" : "12px 20px",
        borderTop: compact ? "none" : "1px solid var(--bg)",
        borderBottom: compact ? "1px solid var(--bg)" : "none",
        background: "var(--surface-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10
      }}
    >
      {/* Left: count + page size selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon n="users" s={{ fontSize: 14, color: "var(--text-faint)" }} />
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>ทั้งหมด {total} รายการ</span>
        <span style={{ color: "var(--border-2)", fontSize: 12 }}>|</span>
        <span style={{ fontSize: 12, color: "var(--text-mute)" }}>แสดง</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          style={{
            height: 30,
            padding: "0 8px",
            border: "1.5px solid var(--border-2)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text-sub)",
            background: "var(--surface)",
            cursor: "pointer",
            outline: "none"
          }}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} รายการ
            </option>
          ))}
        </select>
      </div>

      {/* Right: page navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Prev */}
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          style={{
            width: 30,
            height: 30,
            border: "1.5px solid var(--border-2)",
            borderRadius: 8,
            background: safePage === 1 ? "var(--surface-3)" : "var(--surface)",
            cursor: safePage === 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: safePage === 1 ? "#D1D5DB" : "var(--text-sub)"
          }}
        >
          <Icon n="arrow-left" s={{ fontSize: 14, color: safePage === 1 ? "#D1D5DB" : "var(--text-sub)" }} />
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
          .reduce<(number | string)[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={"e" + i} style={{ width: 30, textAlign: "center", fontSize: 12, color: "var(--text-faint)" }}>
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                style={{
                  width: 30,
                  height: 30,
                  border: `1.5px solid ${safePage === p ? "var(--accent)" : "var(--border-2)"}`,
                  borderRadius: 8,
                  background: safePage === p ? "var(--accent)" : "var(--surface)",
                  color: safePage === p ? "var(--surface)" : "var(--text-sub)",
                  fontSize: 12,
                  fontWeight: safePage === p ? 700 : 400,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {p}
              </button>
            )
          )}

        {/* ปุ่มเลื่อนไปหน้าถัดไป */}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          style={{
            width: 30,
            height: 30,
            border: "1.5px solid var(--border-2)",
            borderRadius: 8,
            background: safePage === totalPages ? "var(--surface-3)" : "var(--surface)",
            cursor: safePage === totalPages ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon n="chevron-right" s={{ fontSize: 14, color: safePage === totalPages ? "#D1D5DB" : "var(--text-sub)" }} />
        </button>
      </div>
    </div>
  );
};

export const Users: React.FC = () => {
  // ดึงข้อมูลผู้ใช้งาน สิทธิ์การปรับปรุง ข้อมูลผู้ใช้ล็อกอินหลักจาก Context
  const { db, updateDB, showToast, askConfirm, closeConfirm, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // ค้นหารายการสมาชิกในตารางผ่านชื่อ ชื่อสกุล อีเมล และรหัสพนักงาน
  const filtered = db.users.filter(
    (u) =>
      u.firstName.includes(search) ||
      u.lastName.includes(search) ||
      u.email.includes(search) ||
      u.empId.includes(search)
  );

  // คำนวณขอบเขตสเตจแบ่งหน้าเพจเพื่อตัดส่วนข้อมูลมาแสดง
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ดำเนินการรีเซ็ทรหัสผ่านผู้ใช้เป้าหมายให้กลับไปเป็นรหัสเริ่มต้น '12345'
  const confirmReset = (user: User) =>
    askConfirm({
      title: "รีเซ็ทรหัสผ่าน",
      msg: `รหัสผ่านของ ${user.firstName} ${user.lastName} จะถูกเปลี่ยนเป็น "12345" และต้องตั้งรหัสใหม่เมื่อเข้าสู่ระบบ`,
      icon: "key",
      color: "#C2410C",
      okLabel: "ยืนยัน รีเซ็ท",
      onOk: () => {
        const now = new Date().toISOString();
        const nd = {
          ...db,
          users: db.users.map((u) =>
            u.id === user.id ? { ...u, password: "12345", isFirstLogin: true, lastPasswordChange: now } : u
          )
        };
        updateDB(nd);
        showToast(`รีเซ็ทรหัสผ่านของ ${user.firstName} สำเร็จ`);
        closeConfirm();
      }
    });

  // บล็อกระงับการใช้งานบัญชี (Ban/Disable User) หรือปลดบล็อกเพื่อให้ล็อกอินใช้งานได้ใหม่
  const confirmToggleStatus = (user: User) => {
    const willDisable = user.status !== "disabled";
    askConfirm({
      title: willDisable ? "ปิดใช้งานบัญชี" : "เปิดใช้งานบัญชี",
      msg: willDisable
        ? `บัญชีของ ${user.prefix}${user.firstName} ${user.lastName} จะถูกปิดใช้งาน ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้ (ใช้สำหรับพนักงานที่ลาออก)`
        : `เปิดใช้งานบัญชีของ ${user.prefix}${user.firstName} ${user.lastName} อีกครั้ง ผู้ใช้จะสามารถเข้าสู่ระบบได้ตามปกติ`,
      icon: willDisable ? "ban" : "user-check",
      color: willDisable ? "#B42318" : "#1A7F37",
      okLabel: willDisable ? "ยืนยัน ปิดใช้งาน" : "ยืนยัน เปิดใช้งาน",
      onOk: () => {
        const nd = {
          ...db,
          users: db.users.map((u) => (u.id === user.id ? { ...u, status: willDisable ? "disabled" : "active" } : u))
        };
        updateDB(nd);
        showToast(
          willDisable ? `ปิดใช้งานบัญชีของ ${user.firstName} แล้ว` : `เปิดใช้งานบัญชีของ ${user.firstName} แล้ว`,
          willDisable ? "info" : "success"
        );
        closeConfirm();
      }
    });
  };

  const doAdd = (data: Omit<User, "id" | "isFirstLogin" | "password" | "status">) => {
    const now = new Date().toISOString();
    updateDB({
      ...db,
      users: [
        ...db.users,
        {
          ...data,
          id: Date.now(),
          isFirstLogin: true,
          password: "12345",
          lastPasswordChange: now,
          status: "active"
        }
      ]
    });
    showToast("เพิ่มผู้ใช้งานสำเร็จ");
    setShowAdd(false);
  };

  const doEdit = (data: Partial<User>) => {
    if (!editUser) return;
    updateDB({
      ...db,
      users: db.users.map((u) => (u.id === editUser.id ? { ...u, ...data } : u))
    });
    showToast("แก้ไขข้อมูลผู้ใช้งานสำเร็จ");
    setEditUser(null);
  };

  const COLS = ["#", "รหัสพนักงาน", "ชื่อ-นามสกุล", "อีเมล", "เบอร์โทร", "แผนก", "บทบาท", "สิทธิ์การเข้าใช้", "จัดการ"];

  return (
    <div className="fu">
      <PageHeader title="ผู้ใช้งานระบบ" subtitle="จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ" />
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)"
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            borderBottom: "1px solid var(--bg)",
            background: "var(--surface-2)"
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
              <Icon n="search" s={{ fontSize: 17, color: "var(--text-ghost)" }} />
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อ อีเมล หรือรหัสพนักงาน…"
              style={{ ...IS, paddingLeft: 42 }}
            />
          </div>
          <BtnPri onClick={() => setShowAdd(true)} icon="user-plus" style={{ width: "auto", padding: "0 20px", height: 42, whiteSpace: "nowrap" }}>
            เพิ่มผู้ใช้งาน
          </BtnPri>
        </div>

        {/* Pagination header */}
        <UserPagination
          total={filtered.length}
          pageSize={pageSize}
          setPageSize={setPageSize}
          safePage={safePage}
          setPage={setPage}
          totalPages={totalPages}
          compact
        />

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--surface-3)" }}>
                {COLS.map((h) => (
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
              {paginated.map((u, i) => {
                const rs = ROLE_STYLE[u.role] || { bg: "#F1EFE8", color: "#555550", icon: "user" };
                const as = getAccessStatus(u);
                const isDisabled = u.status === "disabled";
                const lastLoginDate = fmtDate(u.lastLogin);
                const lastPwChangeDate = fmtDate(u.lastPasswordChange);
                return (
                  <tr
                    key={u.id}
                    className="row-hover"
                    style={{ borderBottom: "1px solid var(--bg)", opacity: isDisabled ? 0.55 : 1 }}
                  >
                    {/* # */}
                    <td style={TD}>
                      <span style={{ color: "var(--text-ghost)", fontSize: 12, fontWeight: 500 }}>
                        {(safePage - 1) * pageSize + i + 1}
                      </span>
                    </td>
                    {/* รหัสพนักงาน */}
                    <td style={TD}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          background: "var(--bg)",
                          padding: "3px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "var(--text-sub)",
                          fontWeight: 600
                        }}
                      >
                        {u.empId}
                      </span>
                    </td>
                    {/* ชื่อ-นามสกุล */}
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar user={u} size={32} />
                        <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>
                          {u.prefix}
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    {/* อีเมล */}
                    <td style={{ ...TD, color: "var(--text-sub)", fontSize: 13 }}>{u.email}</td>
                    {/* เบอร์โทร */}
                    <td style={{ ...TD, color: "var(--text-sub)", fontSize: 13 }}>{u.phone || "—"}</td>
                    {/* แผนก */}
                    <td style={{ ...TD, color: "var(--text-mute)", fontSize: 12 }}>{u.department}</td>
                    {/* บทบาท */}
                    <td style={TD}>
                      <span
                        style={{
                          fontSize: 12,
                          background: rs.bg,
                          color: rs.color,
                          padding: "4px 11px",
                          borderRadius: 20,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}
                      >
                        <Icon n={rs.icon} s={{ fontSize: 12, color: rs.color }} />
                        {u.role}
                      </span>
                    </td>
                    {/* สิทธิ์การเข้าใช้ */}
                    <td style={TD}>
                      <span
                        style={{
                          fontSize: 12,
                          background: as.bg,
                          color: as.color,
                          padding: "4px 11px",
                          borderRadius: 20,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          display: "inline-block"
                        }}
                      >
                        {as.label}
                      </span>
                      {!u.isFirstLogin && u.status !== "disabled" && (lastLoginDate || lastPwChangeDate) && (
                        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                          {lastLoginDate && (
                            <Tooltip label="เข้าใช้งานล่าสุด" dir="t">
                              <p style={{ fontSize: 10.5, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4, cursor: "default", margin: 0 }}>
                                <Icon n="clock" s={{ fontSize: 11, color: "var(--text-ghost)" }} />
                                {lastLoginDate}
                              </p>
                            </Tooltip>
                          )}
                          {lastPwChangeDate && (
                            <Tooltip label="เปลี่ยนรหัสผ่านล่าสุด" dir="t">
                              <p style={{ fontSize: 10.5, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4, cursor: "default", margin: 0 }}>
                                <Icon n="key" s={{ fontSize: 11, color: "var(--text-ghost)" }} />
                                {lastPwChangeDate}
                              </p>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </td>
                    {/* จัดการ */}
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Tooltip label="รีเซ็ทรหัสผ่าน" dir="t">
                          <button
                            onClick={() => confirmReset(u)}
                            style={{
                              width: 32,
                              height: 32,
                              background: "#FFF7ED",
                              border: "1.5px solid #FED7AA",
                              borderRadius: 8,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Icon n="key" s={{ fontSize: 15, color: "#C2410C" }} />
                          </button>
                        </Tooltip>
                        <Tooltip label="แก้ไขข้อมูล" dir="t">
                          <button
                            onClick={() => setEditUser(u)}
                            style={{
                              width: 32,
                              height: 32,
                              background: "var(--accent-soft)",
                              border: "1.5px solid #BFDBFE",
                              borderRadius: 8,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Icon n="user-cog" s={{ fontSize: 15, color: "var(--accent)" }} />
                          </button>
                        </Tooltip>
                        {currentUser?.id !== u.id && (
                          <Tooltip label={isDisabled ? "เปิดใช้งานบัญชี" : "ปิดใช้งานบัญชี (พนักงานลาออก)"} dir="t">
                            <button
                              onClick={() => confirmToggleStatus(u)}
                              style={{
                                width: 32,
                                height: 32,
                                background: isDisabled ? "#E7F6EC" : "#FEF2F2",
                                border: `1.5px solid ${isDisabled ? "#A6E3B8" : "#FECACA"}`,
                                borderRadius: 8,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <Icon n={isDisabled ? "user-check" : "ban"} s={{ fontSize: 15, color: isDisabled ? "#1A7F37" : "#B42318" }} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "var(--text-ghost)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <Icon n="search-off" s={{ fontSize: 36, color: "var(--text-ghost)" }} /> ไม่พบผู้ใช้งาน
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <UserPagination
          total={filtered.length}
          pageSize={pageSize}
          setPageSize={setPageSize}
          safePage={safePage}
          setPage={setPage}
          totalPages={totalPages}
        />
      </div>

      {showAdd && <AddUserModal db={db} onAdd={doAdd} onClose={() => setShowAdd(false)} />}
      {editUser && <EditUserModal db={db} user={editUser} onEdit={doEdit} onClose={() => setEditUser(null)} />}
    </div>
  );
};

/* ── AddUserModal ── */
interface AddUserModalProps {
  db: AppDatabase;
  onAdd: (data: Omit<User, "id" | "isFirstLogin" | "password" | "status">) => void;
  onClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ db, onAdd, onClose }) => {
  const [form, setForm] = useState({
    empId: "",
    prefix: "นาย",
    prefixCustom: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    role: "ผู้ใช้งาน",
    photo: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const thaiRx = /^[ก-๙\s]+$/;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const onThaiInput = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^ก-๙\s]/g, "");
    setForm((f) => ({ ...f, [field]: v }));
  };

  const onEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\x00-\x7F]/g, "");
    setForm((f) => ({ ...f, email: v }));
  };

  const onPhotoUpload = (photo: string) => setForm((f) => ({ ...f, photo }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.empId) e.empId = "กรุณากรอกรหัสพนักงาน";
    else if (!/^\d+$/.test(form.empId)) e.empId = "กรอกได้เฉพาะตัวเลข";
    else if (form.empId.length > 3) e.empId = "ไม่เกิน 3 หลัก";
    else if (db.users.find((u: User) => u.empId === form.empId)) e.empId = "รหัสพนักงานนี้มีในระบบแล้ว";

    if (form.prefix === "อื่นๆ" && !form.prefixCustom) e.prefixCustom = "กรุณาระบุคำนำหน้า";
    if (!form.firstName) e.firstName = "กรุณากรอกชื่อจริง";
    else if (!thaiRx.test(form.firstName)) e.firstName = "กรอกภาษาไทยเท่านั้น";

    if (!form.lastName) e.lastName = "กรุณากรอกนามสกุล";
    else if (!thaiRx.test(form.lastName)) e.lastName = "กรอกภาษาไทยเท่านั้น";

    if (!form.email) e.email = "กรุณากรอกอีเมล";
    else if (!emailRx.test(form.email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    else if (db.users.find((u: User) => u.email === form.email)) e.email = "อีเมลนี้มีในระบบแล้ว";

    if (form.phone && (!/^\d+$/.test(form.phone) || form.phone.length > 10)) e.phone = "ตัวเลขไม่เกิน 10 หลัก";
    if (!form.department) e.department = "กรุณาเลือกแผนก";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSubmit = () => {
    if (!validate()) return;
    const prefix = form.prefix === "อื่นๆ" ? form.prefixCustom : form.prefix;
    onAdd({
      empId: form.empId,
      prefix,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      department: form.department,
      role: form.role,
      photo: form.photo
    });
  };

  const avatarUser = { photo: form.photo, firstName: form.firstName, lastName: form.lastName };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
        <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon n="user-plus" s={{ fontSize: 24, color: "var(--accent)" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>เพิ่มผู้ใช้งานระบบ</h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>กรอกข้อมูลผู้ใช้งานใหม่ทุกช่องที่มีเครื่องหมาย *</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <AvatarUpload user={avatarUser} size={72} onUpload={onPhotoUpload} />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>ข้อมูลบัญชี</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <FL label="รหัสพนักงาน *" error={errors.empId}>
          <input
            style={IS}
            placeholder="001"
            maxLength={3}
            value={form.empId}
            onChange={(e) => setForm({ ...form, empId: e.target.value.replace(/\D/g, "") })}
          />
        </FL>
        <FL label="บทบาท *">
          <Select
            options={ROLES}
            value={form.role}
            onChange={(val) => setForm({ ...form, role: val })}
          />
        </FL>
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>ข้อมูลส่วนตัว</p>
      <div style={{ display: "grid", gridTemplateColumns: form.prefix === "อื่นๆ" ? "1fr 1fr" : "1fr", gap: "0 20px" }}>
        <FL label="คำนำหน้า *">
          <Select
            options={PREFIXES}
            value={form.prefix}
            onChange={(val) => setForm({ ...form, prefix: val })}
          />
        </FL>
        {form.prefix === "อื่นๆ" && (
          <FL label="ระบุคำนำหน้า *" error={errors.prefixCustom}>
            <input
              style={IS}
              placeholder="เช่น ดร., พ.ต.ท."
              value={form.prefixCustom}
              onChange={(e) => setForm({ ...form, prefixCustom: e.target.value })}
            />
          </FL>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <FL label="ชื่อจริง * (ภาษาไทย)" error={errors.firstName}>
          <input
            style={IS}
            placeholder="ภาษาไทยเท่านั้น"
            value={form.firstName}
            onChange={onThaiInput("firstName")}
            onKeyDown={(e) => {
              if (e.key.length === 1 && !/[ก-๙\s]/.test(e.key)) e.preventDefault();
            }}
          />
        </FL>
        <FL label="นามสกุล * (ภาษาไทย)" error={errors.lastName}>
          <input
            style={IS}
            placeholder="ภาษาไทยเท่านั้น"
            value={form.lastName}
            onChange={onThaiInput("lastName")}
            onKeyDown={(e) => {
              if (e.key.length === 1 && !/[ก-๙\s]/.test(e.key)) e.preventDefault();
            }}
          />
        </FL>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <FL label="อีเมล * (ภาษาอังกฤษ)" error={errors.email}>
          <input
            style={IS}
            placeholder="email@company.com"
            value={form.email}
            onChange={onEmailInput}
            onKeyDown={(e) => {
              if (e.key.length === 1 && e.key.charCodeAt(0) > 127) e.preventDefault();
            }}
          />
        </FL>
        <FL label="เบอร์โทรศัพท์" error={errors.phone}>
          <input
            style={IS}
            placeholder="0812345678"
            maxLength={10}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
          />
        </FL>
      </div>

      <FL label="แผนก *" error={errors.department}>
        <Select
          options={DEPARTMENTS}
          value={form.department}
          onChange={(val) => setForm({ ...form, department: val })}
          placeholder="— เลือกแผนก —"
        />
      </FL>

      <AlertBox type="info" msg='รหัสผ่านเริ่มต้นจะเป็น "12345" ผู้ใช้งานจะถูกบังคับให้ตั้งรหัสใหม่เมื่อเข้าสู่ระบบครั้งแรก' style={{ margin: "4px 0 20px" }} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
        <BtnSec onClick={onClose} icon="x">
          ยกเลิก
        </BtnSec>
        <BtnPri onClick={doSubmit} icon="user-plus" style={{ width: "auto", padding: "0 28px" }}>
          เพิ่มผู้ใช้งาน
        </BtnPri>
      </div>
    </Modal>
  );
};

/* ── EditUserModal ── */
interface EditUserModalProps {
  db: AppDatabase;
  user: User;
  onEdit: (data: Partial<User>) => void;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ db, user, onEdit, onClose }) => {
  const [form, setForm] = useState({
    empId: user.empId,
    prefix: ["นาย", "นาง", "นางสาว"].includes(user.prefix) ? user.prefix : "อื่นๆ",
    prefixCustom: ["นาย", "นาง", "นางสาว"].includes(user.prefix) ? "" : user.prefix,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    department: user.department,
    role: user.role,
    photo: user.photo || ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const thaiRx = /^[ก-๙\s]+$/;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName || !thaiRx.test(form.firstName)) e.firstName = "กรอกภาษาไทยเท่านั้น";
    if (!form.lastName || !thaiRx.test(form.lastName)) e.lastName = "กรอกภาษาไทยเท่านั้น";
    if (!form.email || !emailRx.test(form.email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    else if (db.users.find((u: User) => u.email === form.email && u.id !== user.id)) e.email = "อีเมลนี้มีในระบบแล้ว";
    if (form.phone && (!/^\d+$/.test(form.phone) || form.phone.length > 10)) e.phone = "ตัวเลขไม่เกิน 10 หลัก";
    if (form.prefix === "อื่นๆ" && !form.prefixCustom) e.prefixCustom = "กรุณาระบุคำนำหน้า";
    if (!form.department) e.department = "กรุณาเลือกแผนก";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSubmit = () => {
    if (!validate()) return;
    const prefix = form.prefix === "อื่นๆ" ? form.prefixCustom : form.prefix;
    onEdit({
      prefix,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      department: form.department,
      role: form.role,
      photo: form.photo
    });
  };

  const onPhotoUpload = (photo: string) => setForm((f) => ({ ...f, photo }));

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
        <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon n="user-cog" s={{ fontSize: 24, color: "var(--accent)" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>แก้ไขข้อมูลผู้ใช้งาน</h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
            {user.prefix}
            {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <AvatarUpload user={{ photo: form.photo, firstName: form.firstName, lastName: form.lastName }} size={72} onUpload={onPhotoUpload} />
      </div>

      <FL label="รหัสพนักงาน">
        <div style={{ position: "relative" }}>
          <input style={READONLY_IS} value={form.empId} readOnly />
          <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
            <Icon n="lock" s={{ fontSize: 14, color: "var(--text-ghost)" }} />
          </span>
        </div>
      </FL>

      <div style={{ display: "grid", gridTemplateColumns: form.prefix === "อื่นๆ" ? "1fr 1fr" : "1fr", gap: "0 16px" }}>
        <FL label="คำนำหน้า *">
          <Select
            options={PREFIXES}
            value={form.prefix}
            onChange={(val) => setForm({ ...form, prefix: val })}
          />
        </FL>
        {form.prefix === "อื่นๆ" && (
          <FL label="ระบุคำนำหน้า *" error={errors.prefixCustom}>
            <input
              style={IS}
              placeholder="เช่น ดร."
              value={form.prefixCustom}
              onChange={(e) => setForm({ ...form, prefixCustom: e.target.value })}
            />
          </FL>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FL label="ชื่อจริง * (ภาษาไทย)" error={errors.firstName}>
          <input
            style={IS}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value.replace(/[^ก-๙\s]/g, "") })}
          />
        </FL>
        <FL label="นามสกุล * (ภาษาไทย)" error={errors.lastName}>
          <input
            style={IS}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value.replace(/[^ก-๙\s]/g, "") })}
          />
        </FL>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FL label="อีเมล *" error={errors.email}>
          <input
            style={IS}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value.replace(/[^\x00-\x7F]/g, "") })}
          />
        </FL>
        <FL label="เบอร์โทรศัพท์" error={errors.phone}>
          <input
            style={IS}
            placeholder="0812345678"
            maxLength={10}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
          />
        </FL>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FL label="แผนก *" error={errors.department}>
          <Select
            options={DEPARTMENTS}
            value={form.department}
            onChange={(val) => setForm({ ...form, department: val })}
            placeholder="— เลือกแผนก —"
          />
        </FL>
        <FL label="บทบาท *">
          <Select
            options={ROLES}
            value={form.role}
            onChange={(val) => setForm({ ...form, role: val })}
          />
        </FL>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
        <BtnSec onClick={onClose} icon="x" style={{ justifyContent: "center" }}>
          ยกเลิก
        </BtnSec>
        <BtnPri onClick={doSubmit} icon="save">
          บันทึกการแก้ไข
        </BtnPri>
      </div>
    </Modal>
  );
};

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

const READONLY_IS = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid var(--border-soft)",
  borderRadius: 10,
  fontSize: 14,
  color: "var(--text-mute)",
  background: "var(--surface-3)",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit",
  cursor: "not-allowed"
};

const TD = {
  padding: "12px 16px",
  color: "var(--text-sub)",
  verticalAlign: "middle"
};

export default Users;
