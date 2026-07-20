import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import { ErrMsg } from "./AlertBox";
import {
  pad2,
  ymd,
  addDays,
  addMonths,
  startOfWeek,
  startOfMonth,
  isSameDay,
  beThaiYear,
  MONTH_TH,
  DOW_TH_S
} from "../../utils/helpers";

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

const LS = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-sub)",
  marginBottom: 7
};

/* ── Form Label component ── */
interface FLProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

export const FL: React.FC<FLProps> = ({ label, error, children, right }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
        <label style={{ ...LS, marginBottom: 0 }}>{label}</label>
        {right}
      </div>
      {children}
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  );
};

/* ── Pill/Segmented Toggle ── */
interface PillOption {
  value: any;
  label: string;
  icon?: string;
}

interface PillToggleProps {
  options: PillOption[];
  value: any;
  onChange: (val: any) => void;
}

export const PillToggle: React.FC<PillToggleProps> = ({ options, value, onChange }) => {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: `1.5px solid ${sel ? "var(--accent)" : "var(--border-2)"}`,
              background: sel ? "var(--accent-soft)" : "var(--surface)",
              color: sel ? "var(--accent)" : "var(--text-sub)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7
            }}
          >
            {o.icon && <Icon n={o.icon} s={{ fontSize: 14, color: sel ? "var(--accent)" : "var(--text-faint)" }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

/* ── DateField ── */
interface DateFieldProps {
  value: string;
  onChange: (d: string) => void;
}

export const DateField: React.FC<DateFieldProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(value ? new Date(value + "T00:00:00") : new Date())
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const gridStart = startOfWeek(startOfMonth(viewMonth));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  const display = selectedDate
    ? `${selectedDate.getDate()} ${MONTH_TH[selectedDate.getMonth()]} ${beThaiYear(selectedDate)}`
    : "เลือกวันที่";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ ...IS, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
      >
        <span style={{ color: value ? "var(--text)" : "var(--text-faint)" }}>{display}</span>
        <Icon n="calendar" s={{ fontSize: 16, color: "var(--text-faint)" }} />
      </div>
      {open && (
        <div
          className="fu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 500,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 10px 32px rgba(0,0,0,.14)",
            padding: 14,
            width: 280
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              {MONTH_TH[viewMonth.getMonth()]} {beThaiYear(viewMonth)}
            </h4>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                style={{ width: 24, height: 24, border: "none", background: "var(--bg)", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon n="arrow-left" s={{ fontSize: 12, color: "var(--text-mute)" }} />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                style={{ width: 24, height: 24, border: "none", background: "var(--bg)", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon n="arrow-left" s={{ fontSize: 12, color: "var(--text-mute)", transform: "rotate(180deg)" }} />
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {DOW_TH_S.map((d) => (
              <div key={d} style={{ fontSize: 10.5, color: "var(--text-ghost)", textAlign: "center", fontWeight: 600, padding: "4px 0" }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {days.map((d, i) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isToday = isSameDay(d, today);
              const isSel = selectedDate && isSameDay(d, selectedDate);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(ymd(d));
                    setOpen(false);
                  }}
                  style={{
                    aspectRatio: "1",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSel ? "var(--accent)" : isToday ? "var(--accent-soft)" : "transparent",
                    color: isSel ? "var(--surface)" : !inMonth ? "#D1D5DB" : isToday ? "var(--accent)" : "var(--text-sub)",
                    fontWeight: isToday || isSel ? 700 : 400,
                    fontSize: 12.5
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(ymd(today));
              setViewMonth(startOfMonth(today));
              setOpen(false);
            }}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "8px 0",
              background: "var(--bg)",
              border: "none",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--accent)",
              cursor: "pointer"
            }}
          >
            วันนี้
          </button>
        </div>
      )}
    </div>
  );
};

/* ── TimeField ── */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${pad2(Math.floor(i / 2))}:${i % 2 === 0 ? "00" : "30"}`);

interface TimeFieldProps {
  value: string;
  onChange: (t: string) => void;
  minTime?: string;
}

export const TimeField: React.FC<TimeFieldProps> = ({ value, onChange, minTime }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const selEl = listRef.current.querySelector('[data-selected="true"]');
      if (selEl) selEl.scrollIntoView({ block: "center" });
    }
  }, [open]);

  const filteredOptions = minTime !== undefined
    ? [...TIME_OPTIONS, "24:00"].filter((t) => !minTime || t > minTime)
    : TIME_OPTIONS;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ ...IS, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
      >
        <span style={{ color: value ? "var(--text)" : "var(--text-faint)" }}>{value ? `${value} น.` : "เลือกเวลา"}</span>
        <Icon n={open ? "chevron-up" : "chevron-down"} s={{ fontSize: 14, color: "var(--text-faint)" }} />
      </div>
      {open && (
        <div
          ref={listRef}
          className="fu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 500,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 32px rgba(0,0,0,.14)",
            maxHeight: 220,
            overflowY: "auto",
            padding: 6
          }}
        >
          {filteredOptions.map((t) => {
            const isSel = t === value;
            return (
              <button
                key={t}
                type="button"
                className="custom-select-item"
                data-selected={isSel}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isSel ? "var(--accent-soft)" : "transparent",
                  color: isSel ? "var(--accent)" : "var(--text-sub)",
                  fontWeight: isSel ? 700 : 400,
                  fontSize: 13
                }}
              >
                {t} น.
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── RoomField ── */
interface Room {
  id: number;
  name: string;
  place: string;
  floor: string;
  status: string;
}

interface RoomFieldProps {
  rooms: Room[];
  value: string | number;
  onChange: (id: number) => void;
}

export const RoomField: React.FC<RoomFieldProps> = ({ rooms, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = rooms.find((r) => String(r.id) === String(value));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => rooms.length > 0 && setOpen((o) => !o)}
        style={{ ...IS, cursor: rooms.length > 0 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
      >
        <span style={{ color: selected ? "var(--text)" : "var(--text-faint)" }}>
          {selected ? `${selected.name} (${selected.place})` : rooms.length === 0 ? "— ไม่มีห้องที่พร้อมใช้งาน —" : "— เลือกห้องประชุม —"}
        </span>
        <Icon n={open ? "chevron-up" : "chevron-down"} s={{ fontSize: 14, color: "var(--text-faint)" }} />
      </div>
      {open && rooms.length > 0 && (
        <div
          className="fu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 500,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 32px rgba(0,0,0,.14)",
            maxHeight: 220,
            overflowY: "auto",
            padding: 6
          }}
        >
          {rooms.map((r) => {
            const isSel = String(r.id) === String(value);
            return (
              <button
                key={r.id}
                type="button"
                className="custom-select-item"
                data-selected={isSel}
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isSel ? "var(--accent-soft)" : "transparent",
                  color: isSel ? "var(--accent)" : "var(--text-sub)",
                  fontWeight: isSel ? 700 : 400,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <Icon n="door" s={{ fontSize: 14, color: isSel ? "var(--accent)" : "var(--text-faint)" }} />
                {r.name} ({r.place})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── ParentAgendaField (cross-linking agendas) ── */
interface Agenda {
  id: number;
  code: string;
  title: string;
}

interface ParentAgendaFieldProps {
  agendas: Agenda[];
  value: string | number;
  onChange: (id: number) => void;
}

export const ParentAgendaField: React.FC<ParentAgendaFieldProps> = ({ agendas, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = agendas.find((a) => String(a.id) === String(value));
  const filtered = agendas.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  const openDropdown = () => {
    if (agendas.length === 0) return;
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {open ? (
        <input
          ref={inputRef}
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="พิมพ์ค้นหารหัส Agenda หรือชื่อการประชุม…"
          style={IS}
        />
      ) : (
        <div
          onClick={openDropdown}
          style={{ ...IS, cursor: agendas.length > 0 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
        >
          <span style={{ color: selected ? "var(--text)" : "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? `${selected.code} — ${selected.title}` : agendas.length === 0 ? "— ไม่มีการประชุมให้เลือก —" : "— เลือกการประชุม —"}
          </span>
          <Icon n="chevron-down" s={{ fontSize: 14, color: "var(--text-faint)" }} />
        </div>
      )}
      {open && agendas.length > 0 && (
        <div
          className="fu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 500,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 32px rgba(0,0,0,.14)",
            maxHeight: 240,
            overflowY: "auto",
            padding: 6
          }}
        >
          {filtered.length === 0 && <p style={{ fontSize: 12.5, color: "var(--text-ghost)", padding: "10px 12px" }}>ไม่พบการประชุมที่ตรงกับคำค้นหา</p>}
          {filtered.map((a) => {
            const isSel = String(a.id) === String(value);
            return (
              <button
                key={a.id}
                type="button"
                className="custom-select-item"
                onClick={() => {
                  onChange(a.id);
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isSel ? "var(--accent-soft)" : "transparent",
                  color: isSel ? "var(--accent)" : "var(--text-sub)",
                  fontSize: 13
                }}
              >
                <span style={{ fontWeight: 700 }}>{a.code}</span> — {a.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Generic Select Dropdown Component ── */
interface SelectProps {
  options: string[] | { value: string | number; label: string }[];
  value: string | number;
  onChange: (val: any) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({ options, value, onChange, placeholder = "— เลือก —", disabled = false, style }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const parsedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selected = parsedOptions.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", ...style }}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          ...IS,
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none",
          opacity: disabled ? 0.6 : 1,
          borderColor: open ? "var(--accent)" : "var(--border-2)"
        }}
      >
        <span style={{ color: selected ? "var(--text)" : "var(--text-faint)" }}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon n={open ? "chevron-up" : "chevron-down"} s={{ fontSize: 14, color: "var(--text-faint)" }} />
      </div>
      {open && (
        <div
          className="fu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 32px rgba(0,0,0,.14)",
            maxHeight: 220,
            overflowY: "auto",
            padding: 6
          }}
        >
          {parsedOptions.map((o) => {
            const isSel = String(o.value) === String(value);
            return (
              <button
                key={String(o.value)}
                type="button"
                className="custom-select-item"
                data-selected={isSel}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isSel ? "var(--accent-soft)" : "transparent",
                  color: isSel ? "var(--accent)" : "var(--text-sub)",
                  fontWeight: isSel ? 700 : 400,
                  fontSize: 13
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
