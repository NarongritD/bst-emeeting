export interface User {
  id: number;
  empId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: string; // แอดมิน, รายงาน, ผู้ใช้งาน
  isFirstLogin: boolean;
  password: string;
  status: string; // active, disabled
  lastLogin?: string;
  lastPasswordChange?: string;
  photo?: string;
}

export interface Room {
  id: number;
  name: string;
  floor: string;
  place: string;
  status: string;
}

export interface Booking {
  id: number;
  agendaId?: number;
  title: string;
  roomId: number;
  date: string;
  start: string;
  end: string;
  organizerId: number;
  participantIds: number[];
  note: string;
}

export interface AgendaItem {
  id: number;
  detail: string;
}

export interface Agenda {
  id: number;
  code: string;
  meetingType: string; // new | continued
  parentAgendaId: number | null;
  title: string;
  locationMode: string; // place | offsite
  place: string;
  roomId: number | null;
  offsiteLocation: string;
  hasOnlineLink: boolean;
  onlineLink: string;
  date: string;
  start: string;
  end: string;
  objective: string;
  items: AgendaItem[];
  details: string;
  participantIds: number[];
  hasExternal: boolean;
  externalParticipants: string;
  organizerId: number;
  createdAt: string;
  updatedAt: string;
  status?: string; // e.g. cancelled
  confidentiality?: string; // ทั่วไป, ลับภายใน, ลับเฉพาะ
  attachments?: { name: string; data: string; type: string }[];
}

export interface AgendaResult {
  itemId: number;
  result: string;
}

export interface ActionItem {
  id: number;
  task: string;
  ownerId: number | "";
  dueDate: string;
  done: boolean;
}

export interface Minutes {
  agendaId: number;
  overview: string;
  agendaResults: AgendaResult[];
  actionItems: ActionItem[];
  status: string; // draft | published
  actualAttendeeIds?: number[]; // list of user IDs who actually attended
  actualStart?: string; // actual start time
  actualEnd?: string; // actual end time
  recorderId?: number | ""; // recorder user ID
  signedBy?: number | ""; // chairman/approver user ID
  attachments?: { name: string; data: string; type: string }[]; // MOM attachments with base64 data
  updatedBy?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface AppDatabase {
  users: User[];
  rooms: Room[];
  nextRoomId: number;
  bookings: Booking[];
  nextBookingId: number;
  agendas: Agenda[];
  nextAgendaId: number;
  minutes: Minutes[];
  dbVersion?: number;
  notifications?: any[];
}
