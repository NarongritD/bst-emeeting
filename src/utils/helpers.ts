export const DEPARTMENTS = [
  "Management Team",
  "Presales Engineer",
  "Senior System Engineer  / Senior Network Engineer",
  "Stock / Logistic / Service Team",
  "Accounting / Messenger",
  "Human Resource",
  "Purchasing",
  "Sales Director / Sales Manager",
  "Sales Team",
  "CMG Team",
  "Software & Developer",
  "Government Team"
];

export const PREFIXES = ["นาย", "นาง", "นางสาว", "อื่นๆ"];
export const ROLES = ["ผู้ใช้งาน", "รายงาน", "แอดมิน"];

export const DOW_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
export const DOW_TH_S = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
export const MONTH_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const addDays = (d: Date | string, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const addMonths = (d: Date | string, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};

export const startOfWeek = (d: Date | string) => {
  const x = new Date(d);
  return addDays(x, -x.getDay());
};

export const startOfMonth = (d: Date | string) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), 1);
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const beThaiYear = (d: Date | string) => {
  const x = new Date(d);
  return x.getFullYear() + 543;
};

export const beThaiYearShort = (d: Date | string) => {
  return String(beThaiYear(d)).slice(-2);
};

export const formatDateBE = (dateStr: string | Date | undefined | null) => {
  if (!dateStr) return "";
  let d: Date;
  if (typeof dateStr === "string" && !dateStr.includes("T")) {
    d = new Date(dateStr + "T00:00:00");
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return String(dateStr);
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

export const formatLongDateBE = (dateStr: string | Date | undefined | null) => {
  if (!dateStr) return "";
  let d: Date;
  if (typeof dateStr === "string" && !dateStr.includes("T")) {
    d = new Date(dateStr + "T00:00:00");
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const month = MONTH_TH[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

export const toMin = (tStr: string) => {
  if (!tStr) return 0;
  const [h, m] = tStr.split(":").map(Number);
  return h * 60 + m;
};

/* check overlap: s1-e1 overlaps s2-e2 */
export const timeRangesOverlap = (s1: string, e1: string, s2: string, e2: string) => {
  const start1 = toMin(s1);
  const end1 = toMin(e1);
  const start2 = toMin(s2);
  const end2 = toMin(e2);
  return start1 < end2 && start2 < end1;
};

/* find overlap in list of bookings */
export interface TimeRangeObj {
  id?: number | string;
  roomId: number;
  date: string;
  start: string;
  end: string;
  title: string;
}

export const findConflict = (list: TimeRangeObj[], target: Omit<TimeRangeObj, "title">, excludeId?: number | string | null) => {
  return list.find(b =>
    b.id !== excludeId &&
    b.roomId === target.roomId &&
    b.date === target.date &&
    timeRangesOverlap(b.start, b.end, target.start, target.end)
  );
};
