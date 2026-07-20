import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  User,
  Room,
  Booking,
  Agenda,
  Minutes,
  AppDatabase
} from "../utils/types";
import {
  ymd,
  addDays
} from "../utils/helpers";

/* ── Typings and Constants ── */
export const QUICK_LOGINS = [
  { label: "แอดมิน (ณรงค์ฤทธิ์)", email: "narongrit@dofservicedesk.in.th", role: "แอดมิน" },
  { label: "รายงาน (เฉลิมพงศ์)", email: "chaloemphong@bluesystem.co.th", role: "รายงาน" },
  { label: "ผู้ใช้งาน (ระวีพร)", email: "raweeporn@bluesystem.co.th", role: "ผู้ใช้งาน" }
];

export const ROLE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  "แอดมิน": { bg: "#EAF3DE", color: "#2D5A0E", icon: "shield" },
  "รายงาน": { bg: "#E6F1FB", color: "#0C447C", icon: "bar-chart" },
  "ผู้ใช้งาน": { bg: "#F1EFE8", color: "#555550", icon: "user" }
};

export function getAccessStatus(u: User) {
  if (u.status === "disabled") return { label: "ปิดใช้งาน", bg: "#FEE4E2", color: "#B42318" };
  if (u.isFirstLogin) return { label: "บังคับเปลี่ยนรหัสผ่าน", bg: "#FEF3E2", color: "#B54708" };
  return { label: "ปกติ", bg: "#E7F6EC", color: "#1A7F37" };
}

/* ── Seeding Mock Data ── */
const INITIAL_USERS: User[] = [
  {"id": 1, "empId": "001", "prefix": "นาย", "firstName": "พรชัย", "lastName": "เอื้อนพคุณ", "email": "pornchai@bluesystem.co.th", "phone": "0810000001", "department": "Management Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 2, "empId": "002", "prefix": "นาย", "firstName": "ภาณุพงศ์", "lastName": "อาภาผล", "email": "panupong@bluesystem.co.th", "phone": "0810000002", "department": "Management Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 3, "empId": "003", "prefix": "นาย", "firstName": "เจริญชัย", "lastName": "งามสุคนธ์รัตนา", "email": "chalurnchai@bluesystem.co.th", "phone": "0810000003", "department": "Management Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 4, "empId": "004", "prefix": "นาย", "firstName": "เกษม", "lastName": "ทศศิริ", "email": "kasem@bluesystem.co.th", "phone": "0810000004", "department": "Management Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 5, "empId": "005", "prefix": "นาย", "firstName": "นวชน", "lastName": "วัฒนสุข", "email": "nawachon@bluesystem.co.th", "phone": "0810000005", "department": "Management Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 6, "empId": "006", "prefix": "นางสาว", "firstName": "ศริญญา", "lastName": "นาคสมบูรณ์", "email": "sarinya@bluesystem.co.th", "phone": "0810000006", "department": "Presales Engineer", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 7, "empId": "007", "prefix": "นาย", "firstName": "พิพัฒน์", "lastName": "ศรีเสฏฐสุนทร", "email": "pipat@bluesystem.co.th", "phone": "0810000007", "department": "Presales Engineer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 8, "empId": "008", "prefix": "นาย", "firstName": "พลพัฒน์", "lastName": "พรหมสุวรรณ", "email": "pollapat@bluesystem.co.th", "phone": "0810000008", "department": "Senior System Engineer  / Senior Network Engineer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 9, "empId": "009", "prefix": "นาย", "firstName": "เรืองยศ", "lastName": "สุรารักษ์", "email": "servicesupport@bluesystem.co.th", "phone": "0810000009", "department": "Senior System Engineer  / Senior Network Engineer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 10, "empId": "010", "prefix": "นาย", "firstName": "อภินัทธ์", "lastName": "พิทักษ์เผ่า", "email": "apinut@bluesystem.co.th", "phone": "0810000010", "department": "Senior System Engineer  / Senior Network Engineer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 11, "empId": "011", "prefix": "นาย", "firstName": "คฑาวุธ", "lastName": "พระสว่าง", "email": "katawut@bluesystem.co.th", "phone": "0810000011", "department": "Stock / Logistic / Service Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 12, "empId": "012", "prefix": "นาย", "firstName": "ณัฐพล", "lastName": "สิงห์ดวง", "email": "nuttapon@bluesystem.co.th", "phone": "0810000012", "department": "Stock / Logistic / Service Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 13, "empId": "013", "prefix": "นาย", "firstName": "ณัฐกรณ์", "lastName": "ยอดคีรี", "email": "nuttakorn@bluesystem.co.th", "phone": "0810000013", "department": "Stock / Logistic / Service Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 14, "empId": "014", "prefix": "นาย", "firstName": "ณัฐพงษ์", "lastName": "จันทร์ผ่อง", "email": "nattapong@bluesystem.co.th", "phone": "0810000014", "department": "Stock / Logistic / Service Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 15, "empId": "015", "prefix": "นาย", "firstName": "พิลายุ", "lastName": "วงศ์กระพันธ์", "email": "pilayu@bluesystem.co.th", "phone": "0810000015", "department": "Stock / Logistic / Service Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 16, "empId": "016", "prefix": "นาย", "firstName": "สุรพัศ", "lastName": "ฉิมชาญเวช", "email": "surapat@bluesystem.co.th", "phone": "0810000016", "department": "Stock / Logistic / Service Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 17, "empId": "017", "prefix": "นาย", "firstName": "พงศ์ศิริ", "lastName": "สดใส", "email": "pongsiri@bluesystem.co.th", "phone": "0810000017", "department": "Stock / Logistic / Service Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 18, "empId": "018", "prefix": "นาย", "firstName": "ธีรพัฒน์", "lastName": "ชาติทหาร", "email": "teerapat@bluesystem.co.th", "phone": "0810000018", "department": "Stock / Logistic / Service Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 19, "empId": "019", "prefix": "นางสาว", "firstName": "โรสมานี", "lastName": "เหมรา", "email": "rosemanee@bluesystem.co.th", "phone": "0810000019", "department": "Stock / Logistic / Service Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 20, "empId": "020", "prefix": "นาย", "firstName": "กันตภณ", "lastName": "วุฒิยา", "email": "kantapon@bluesystem.co.th", "phone": "0810000020", "department": "Stock / Logistic / Service Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 21, "empId": "021", "prefix": "นางสาว", "firstName": "แสงรวี", "lastName": "พุ่มลำใย", "email": "sangrawee@bluesystem.co.th", "phone": "0810000021", "department": "Accounting / Messenger", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 22, "empId": "022", "prefix": "นางสาว", "firstName": "ณัฐติชา", "lastName": "แก่นดี", "email": "nutticha@bluesystem.co.th", "phone": "0810000022", "department": "Accounting / Messenger", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 23, "empId": "023", "prefix": "นางสาว", "firstName": "กัญญารัตน์", "lastName": "เพิ่มเจริญ", "email": "kanyarut@bluesystem.co.th", "phone": "0810000023", "department": "Accounting / Messenger", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 24, "empId": "024", "prefix": "นาย", "firstName": "สรรพสิริ", "lastName": "เดชะดี", "email": "mackzeeD34@gmail.com", "phone": "0810000024", "department": "Accounting / Messenger", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 25, "empId": "025", "prefix": "นางสาว", "firstName": "ดนุดา", "lastName": "จิวรอนันสกุล", "email": "danuda@bluesystem.co.th", "phone": "0810000025", "department": "Human Resource", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 26, "empId": "026", "prefix": "นางสาว", "firstName": "ทิพย์รวี", "lastName": "จันทร์อรุณ", "email": "tiprawee@bluesystem.co.th", "phone": "0810000026", "department": "Human Resource", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 27, "empId": "027", "prefix": "นางสาว", "firstName": "ศิโรรัตน์", "lastName": "ทองประไพ", "email": "sirorat@bluesystem.co.th", "phone": "0810000027", "department": "Purchasing", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 28, "empId": "028", "prefix": "นาย", "firstName": "กรพรรณ", "lastName": "ปาลวัฒน์", "email": "korapan@bluesystem.co.th", "phone": "0810000028", "department": "Purchasing", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 29, "empId": "030", "prefix": "นาย", "firstName": "วีรวุฒิ", "lastName": "รื่นพิทักษ์", "email": "weerawut@bluesystem.co.th", "phone": "0810000029", "department": "Sales Director / Sales Manager", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 30, "empId": "031", "prefix": "นางสาว", "firstName": "ขนิษฐา", "lastName": "วิวัฒนวงค์", "email": "kanittha@bluesystem.co.th", "phone": "0810000030", "department": "Sales Director / Sales Manager", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 31, "empId": "032", "prefix": "นางสาว", "firstName": "รุจน์ตะวัน", "lastName": "อินสว่าง", "email": "ruttawan@bluesystem.co.th", "phone": "0810000031", "department": "Sales Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 32, "empId": "033", "prefix": "นางสาว", "firstName": "กรรณิภา", "lastName": "สิงห์คำป้อง", "email": "kannipa@bluesystem.co.th", "phone": "0810000032", "department": "Sales Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 33, "empId": "034", "prefix": "นางสาว", "firstName": "กาญจนา", "lastName": "อัศวเกรียงสิน", "email": "kanchana@bluesystem.co.th", "phone": "0810000033", "department": "Sales Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 34, "empId": "035", "prefix": "นางสาว", "firstName": "ปาณฑิรา", "lastName": "มู่ฮำหมัดอารี", "email": "pantira@bluesystem.co.th", "phone": "0810000034", "department": "Sales Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 35, "empId": "036", "prefix": "นางสาว", "firstName": "มณีรัตน์", "lastName": "ม่วงกรุง", "email": "maneerat@bluesystem.co.th", "phone": "0810000035", "department": "Sales Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 36, "empId": "037", "prefix": "นาย", "firstName": "ศศินท์", "lastName": "สังขพิทักษ์", "email": "sasin@bluesystem.co.th", "phone": "0810000036", "department": "Sales Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 37, "empId": "038", "prefix": "นางสาว", "firstName": "ณรัชรินทร์", "lastName": "ไชยสวัสดิ์", "email": "naratcharin@bluesystem.co.th", "phone": "0810000037", "department": "Sales Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 38, "empId": "039", "prefix": "นางสาว", "firstName": "รุ่งนภา", "lastName": "หวลคำ", "email": "rungnapa@bluesystem.co.th", "phone": "0810000038", "department": "CMG Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 39, "empId": "040", "prefix": "นาย", "firstName": "กนกศักดิ์", "lastName": "ญาณประภาส", "email": "kanoksak@bluesystem.co.th", "phone": "0810000039", "department": "CMG Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 40, "empId": "041", "prefix": "นาย", "firstName": "วัชระ", "lastName": "แก้วม่วง", "email": "watchara@bluesystem.co.th", "phone": "0810000040", "department": "CMG Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 41, "empId": "068", "prefix": "นางสาว", "firstName": "อภิปภา", "lastName": "แผลงศาสตรา", "email": "apipapha@bluesystem.co.th", "phone": "0810000041", "department": "CMG Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 42, "empId": "071", "prefix": "นาย", "firstName": "นัฐฏ์ภควัต", "lastName": "นันทนพงศ์", "email": "nattphakawat@bluesystem.co.th", "phone": "0810000042", "department": "Software & Developer", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 43, "empId": "072", "prefix": "นาย", "firstName": "สุรเชษฐ์", "lastName": "สุวรรณประทีป", "email": "surachet@bluesystem.co.th", "phone": "0810000043", "department": "Software & Developer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 44, "empId": "073", "prefix": "นางสาว", "firstName": "ธนวันต์", "lastName": "ทิฆัมพรทิพย์", "email": "tanawan@bluesystem.co.th", "phone": "0810000044", "department": "Software & Developer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 45, "empId": "074", "prefix": "นางสาว", "firstName": "สุนิษา", "lastName": "กองแก้ว", "email": "sunisa@bluesystem.co.th", "phone": "0810000045", "department": "Software & Developer", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 46, "empId": "075", "prefix": "นาย", "firstName": "นันทน์คณุฒน์", "lastName": "นิตยภาพสกุล", "email": "nankhanut@bluesystem.co.th", "phone": "0810000046", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 47, "empId": "076", "prefix": "นาย", "firstName": "เฉลิมพงศ์", "lastName": "ภานุวงค์", "email": "chaloemphong@bluesystem.co.th", "phone": "0810000047", "department": "Government Team", "role": "รายงาน", "isFirstLogin": false, "password": "12345", "status": "active"},
  {"id": 48, "empId": "077", "prefix": "นาย", "firstName": "สมชาย", "lastName": "แซ่ฮ้อ", "email": "somchai@bluesystem.co.th", "phone": "0810000048", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 49, "empId": "078", "prefix": "นาย", "firstName": "สหเดช", "lastName": "เจียวก๊ก", "email": "sahadat@bluesystem.co.th", "phone": "0810000049", "department": "Government Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 50, "empId": "079", "prefix": "นาย", "firstName": "ปนนท์", "lastName": "ศรีเกตุ", "email": "panon@bluesystem.co.th", "phone": "0810000050", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 51, "empId": "080", "prefix": "นาย", "firstName": "ธัญญพัทธ์", "lastName": "บุญสอด", "email": "thanyapat@bluesystem.co.th", "phone": "0810000051", "department": "Government Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 52, "empId": "081", "prefix": "นางสาว", "firstName": "อธิศา", "lastName": "นิธิโรจนพงศ์", "email": "atisa@bluesystem.co.th", "phone": "0810000052", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 53, "empId": "082", "prefix": "นาย", "firstName": "ณัฐภัทร", "lastName": "คูวุฒยากร", "email": "nattapat@bluesystem.co.th", "phone": "0810000053", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 54, "empId": "083", "prefix": "นาย", "firstName": "สันติ", "lastName": "สีหาชาติ", "email": "santi@bluesystem.co.th", "phone": "0810000054", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 55, "empId": "084", "prefix": "นางสาว", "firstName": "สิริการย์", "lastName": "เอี่ยมระหงษ์", "email": "sirikarn@bluesystem.co.th", "phone": "0810000055", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 56, "empId": "085", "prefix": "นาย", "firstName": "ธีระวัฒน์", "lastName": "ธีระวัฒนสุข", "email": "thirawat@bluesystem.co.th", "phone": "0810000056", "department": "Government Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 57, "empId": "086", "prefix": "นาย", "firstName": "อดิศร", "lastName": "กันตรี", "email": "adisorn@bluesystem.co.th", "phone": "0810000057", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 58, "empId": "087", "prefix": "นาย", "firstName": "กรกต", "lastName": "สีหาชาติ", "email": "korakot@bluesystem.co.th", "phone": "0810000058", "department": "Government Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 59, "empId": "088", "prefix": "นางสาว", "firstName": "นภัสนันท์", "lastName": "จิตรนันทิวัฒน์", "email": "napassanun@dofservicedesk.in.th", "phone": "0810000059", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 60, "empId": "089", "prefix": "นางสาว", "firstName": "ปัญญภานุช", "lastName": "กาญจนธาร", "email": "panyapanuch@dofservicedesk.in.th", "phone": "0810000060", "department": "Government Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 61, "empId": "090", "prefix": "นาย", "firstName": "นิรุติ", "lastName": "โอษะคลัง", "email": "nirut@bluesystem.co.th", "phone": "0810000061", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 62, "empId": "091", "prefix": "นาย", "firstName": "พงษ์ศักดิ์", "lastName": "ภารวงค์", "email": "pongsak@bluesystem.co.th", "phone": "0810000062", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 63, "empId": "092", "prefix": "นาย", "firstName": "ประสิทธิ์", "lastName": "ปทุมสูติ", "email": "prasit@dofservicedesk.in.th", "phone": "0810000063", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 64, "empId": "093", "prefix": "นาย", "firstName": "โสภณ", "lastName": "เพชรนิล", "email": "sopon@dofservicedesk.in.th", "phone": "0810000064", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 65, "empId": "094", "prefix": "นาย", "firstName": "ประภวิษณุ์", "lastName": "คำมี", "email": "prapawit@dofservicedesk.in.th", "phone": "0810000065", "department": "Government Team", "role": "รายงาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 66, "empId": "095", "prefix": "นาย", "firstName": "ณรงค์ฤทธิ์", "lastName": "ดีอ่อน", "email": "narongrit@dofservicedesk.in.th", "phone": "0810000066", "department": "Government Team", "role": "แอดมิน", "isFirstLogin": false, "password": "12345", "status": "active"},
  {"id": 67, "empId": "096", "prefix": "นาย", "firstName": "ทรงศักดิ์", "lastName": "จันทร์ภูริ", "email": "songsak@bluesystem.co.th", "phone": "0810000067", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 68, "empId": "097", "prefix": "นาย", "firstName": "สุรพศ", "lastName": "ทองมอญ", "email": "surapos@bluesystem.co.th", "phone": "0810000068", "department": "Government Team", "role": "แอดมิน", "isFirstLogin": true, "password": "12345", "status": "active"},
  {"id": 69, "empId": "069", "prefix": "นางสาว", "firstName": "ระวีพร", "lastName": "สังข์สร", "email": "raweeporn@bluesystem.co.th", "phone": "0810000069", "department": "Government Team", "role": "ผู้ใช้งาน", "isFirstLogin": false, "password": "12345", "status": "active"}
];

const INITIAL_ROOMS: Room[] = [
  { id: 1, name: "Blue Diamond", floor: "3", place: "BST (The9)", status: "active" },
  { id: 2, name: "Blue Planet", floor: "5", place: "BST (The9)", status: "active" },
  { id: 3, name: "Blue Ocean", floor: "2", place: "BST (JAS)", status: "active" }
];

/* standalone sample bookings */
function getSampleBookings(agendas: Agenda[]): Booking[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = addDays(today, -dow);

  const fromAgendas: Booking[] = agendas
    .filter((a) => a.locationMode === "place" && a.roomId)
    .map((a, i) => ({
      id: 100 + i,
      agendaId: a.id,
      title: a.title,
      roomId: a.roomId!,
      date: a.date,
      start: a.start,
      end: a.end,
      organizerId: a.organizerId,
      participantIds: a.participantIds || [],
      note: a.objective || ""
    }));

  const standalone: Booking[] = [
    { id: 1, title: "Workshop ทีมขาย", roomId: 2, date: ymd(addDays(monday, 0)), start: "08:00", end: "14:00", organizerId: 3, participantIds: [3], note: "" },
    { id: 2, title: "Update Product", roomId: 2, date: ymd(addDays(monday, 1)), start: "11:00", end: "12:30", organizerId: 3, participantIds: [3, 4], note: "" },
    { id: 3, title: "Call Customer Meeting", roomId: 1, date: ymd(addDays(monday, 1)), start: "13:45", end: "17:30", organizerId: 1, participantIds: [1, 5], note: "" },
    { id: 4, title: "นโยบายและทบทวนเทคนิค", roomId: 2, date: ymd(addDays(monday, 2)), start: "13:30", end: "17:30", organizerId: 2, participantIds: [2], note: "" },
    { id: 5, title: "Customer Meeting", roomId: 1, date: ymd(addDays(monday, 5)), start: "09:45", end: "12:30", organizerId: 1, participantIds: [1, 3, 4], note: "" },
    { id: 6, title: "Operation Team Meeting", roomId: 1, date: ymd(addDays(monday, 4)), start: "14:00", end: "17:30", organizerId: 4, participantIds: [4, 5], note: "" },
    { id: 7, title: "ประชุมด่วนข้ามไทม์โซน", roomId: 1, date: ymd(addDays(monday, 2)), start: "05:00", end: "06:30", organizerId: 1, participantIds: [1], note: "" },
    { id: 8, title: "ปิดงานประจำวัน", roomId: 2, date: ymd(addDays(monday, 3)), start: "22:00", end: "23:30", organizerId: 2, participantIds: [2], note: "" }
  ];

  return [...standalone, ...fromAgendas];
}

function getSampleAgendas(): Agenda[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = addDays(today, -dow);
  const yr = today.getFullYear();
  const code = (n: number) => `AGD-${yr}-${String(n).padStart(4, "0")}`;
  const now = new Date().toISOString();

  return [
    {
      id: 1,
      code: code(1),
      meetingType: "new",
      parentAgendaId: null,
      title: "ประชุมทีมพัฒนา Sprint Planning",
      locationMode: "place",
      place: "BST (The9)",
      roomId: 1,
      offsiteLocation: "",
      hasOnlineLink: false,
      onlineLink: "",
      date: ymd(addDays(monday, 0)),
      start: "10:00",
      end: "12:00",
      objective: "วางแผนงาน Sprint รอบใหม่และจัดลำดับความสำคัญของงาน",
      items: [
        { id: 1, detail: "ทบทวนผลงาน Sprint ที่ผ่านมา" },
        { id: 2, detail: "จัดลำดับความสำคัญ Backlog" },
        { id: 3, detail: "แบ่งงานและประเมินเวลา" }
      ],
      details: "นำ Backlog ที่จัดลำดับไว้แล้วมาหารือร่วมกันในที่ประชุม",
      participantIds: [1, 3],
      hasExternal: false,
      externalParticipants: "",
      organizerId: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 2,
      code: code(2),
      meetingType: "continued",
      parentAgendaId: 1,
      title: "ติดตามผล Sprint Planning (ครั้งที่ 2)",
      locationMode: "place",
      place: "BST (The9)",
      roomId: 1,
      offsiteLocation: "",
      hasOnlineLink: true,
      onlineLink: "https://meet.bst.co.th/sprint-followup",
      date: ymd(addDays(monday, 4)),
      start: "14:00",
      end: "15:00",
      objective: "ติดตามความคืบหน้าของงานที่มอบหมายในรอบก่อนหน้า",
      items: [
        { id: 1, detail: "รายงานความคืบหน้าของแต่ละทีม" },
        { id: 2, detail: "หารือปัญหาที่พบและแนวทางแก้ไข" }
      ],
      details: "",
      participantIds: [1, 3, 4],
      hasExternal: false,
      externalParticipants: "",
      organizerId: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 3,
      code: code(3),
      meetingType: "new",
      parentAgendaId: null,
      title: "สัมมนาประจำปี ทบทวนกลยุทธ์องค์กร",
      locationMode: "offsite",
      place: "",
      roomId: null,
      offsiteLocation: "โรงแรมแกรนด์ เซ็นทรัล กรุงเทพฯ",
      hasOnlineLink: false,
      onlineLink: "",
      date: ymd(addDays(monday, -3)),
      start: "09:00",
      end: "16:00",
      objective: "ทบทวนผลการดำเนินงานปีที่ผ่านมาและกำหนดกลยุทธ์ปีถัดไป",
      items: [
        { id: 1, detail: "สรุปผลการดำเนินงานประจำปี" },
        { id: 2, detail: "กำหนดเป้าหมายและกลยุทธ์ปีถัดไป" },
        { id: 3, detail: "ระดมความคิดเห็นจากหัวหน้าแผนก" }
      ],
      details: "กรุณาเตรียมสรุปผลงานของแผนกมาด้วยในวันงาน",
      participantIds: [2, 4, 5],
      hasExternal: true,
      externalParticipants: "คุณสมชาย ใจดี — ที่ปรึกษากลยุทธ์ บริษัท ABC Consulting",
      organizerId: 2,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 4,
      code: code(4),
      meetingType: "new",
      parentAgendaId: null,
      title: "ประชุมจัดซื้อร่วมกับผู้ขาย",
      locationMode: "place",
      place: "BST (JAS)",
      roomId: 3,
      offsiteLocation: "",
      hasOnlineLink: true,
      onlineLink: "Google Meet: meet.google.com/abc-defg-hij",
      date: ymd(addDays(monday, 6)),
      start: "13:00",
      end: "14:30",
      objective: "เจรจาเงื่อนไขการจัดซื้อวัสดุประจำไตรมาส",
      items: [
        { id: 1, detail: "นำเสนอใบเสนอราคาจากผู้ขาย" },
        { id: 2, detail: "เจรจาเงื่อนไขการชำระเงินและการส่งมอบ" }
      ],
      details: "",
      participantIds: [3],
      hasExternal: true,
      externalParticipants: "คุณวิภาดา รุ่งเรือง — ฝ่ายขาย บริษัท ผู้จัดจำหน่ายวัสดุ จำกัด",
      organizerId: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 5,
      code: code(5),
      meetingType: "new",
      parentAgendaId: null,
      title: "ประชุมคณะกรรมการบริหารเทคโนโลยีสารสนเทศ (IT Steering Committee)",
      locationMode: "place",
      place: "BST (The9)",
      roomId: 2,
      offsiteLocation: "",
      hasOnlineLink: true,
      onlineLink: "https://teams.microsoft.com/l/meetup-join/it-steering",
      date: ymd(addDays(monday, 2)),
      start: "09:30",
      end: "11:30",
      objective: "พิจารณาอนุมัติงบประมาณจัดซื้อระบบ Cloud ERP และแนวทางการปรับปรุงระบบ Cybersecurity",
      items: [
        { id: 1, detail: "รายงานผลการใช้งานระบบเดิมและปัญหาคอขวด" },
        { id: 2, detail: "พิจารณาข้อเสนอและขอบเขตงานระบบ Cloud ERP ใหม่" },
        { id: 3, detail: "แผนการอบรมพนักงานเรื่อง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)" }
      ],
      details: "เอกสารนำเสนอประกอบแนบอยู่ในระบบ Agenda",
      participantIds: [1, 2, 5],
      hasExternal: false,
      externalParticipants: "",
      organizerId: 1,
      createdAt: now,
      updatedAt: now
    }
  ];
}

const buildSeedDB = (): AppDatabase => {
  const agendas = getSampleAgendas();
  const bookings = getSampleBookings(agendas);
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = addDays(today, -dow);

  const minutes: Minutes[] = [
    {
      agendaId: 1,
      overview: "การประชุมเริ่มต้นด้วยการทบทวนผลงานของทีมในรอบ Sprint ที่ผ่านมา ทีมพัฒนาสามารถปิดงานได้ตามแผนร้อยละ 85 ปัญหาที่พบคือระบบฐานข้อมูลมีการตอบสนองล่าช้าในชั่วโมงเร่งด่วน ประธานขอให้ทีมดำเนินการจัดลำดับความสำคัญ Backlog และกระจายงานรอบถัดไปทันที",
      agendaResults: [
        { itemId: 1, result: "ทีมงานสามารถส่งมอบงานหลักได้ครบถ้วน แต่ยังมีบั๊กค้างอยู่ในส่วนของ Report Module ซึ่งจะถูกย้ายเข้าสู่ Sprint ถัดไป" },
        { itemId: 2, result: "จัดลำดับความสำคัญของฟีเจอร์การชำระเงินออนไลน์ขึ้นมาเป็นอันดับสูงสุด เพื่อรองรับระบบจองที่อัปเกรด" },
        { itemId: 3, result: "กระจายงานให้วิชัยรับผิดชอบส่วน API และประสิทธิ์รับผิดชอบส่วนหน้าบ้าน (UI)" }
      ],
      actionItems: [
        { id: 101, task: "แก้ไขบั๊กใน Report Module ที่ค้างจาก Sprint ที่แล้ว", ownerId: 3, dueDate: ymd(addDays(monday, 5)), done: true },
        { id: 102, task: "ออกแบบและเชื่อมต่อ API ชำระเงินรองรับระบบใหม่", ownerId: 3, dueDate: ymd(addDays(monday, 12)), done: false }
      ],
      status: "published",
      actualAttendeeIds: [1, 3],
      actualStart: "10:05",
      actualEnd: "12:00",
      recorderId: 1,
      signedBy: 2,
      attachments: [
        { name: "Sprint_Retrospective_Notes.pdf", data: "data:application/pdf;base64,JVBERi0xLjQK...", type: "application/pdf" }
      ]
    },
    {
      agendaId: 2,
      overview: "ประชุมติดตามงานแบบด่วนเพื่อดูความคืบหน้าของฟีเจอร์ชำระเงินที่กฤษณะทำ และหารือแนวทางการทดสอบร่วมกับหน่วยงานภายนอก",
      agendaResults: [
        { itemId: 1, result: "งานพัฒนา API เสร็จไปแล้วร้อยละ 60 อยู่ระหว่างการเตรียมเชื่อม Sandbox" },
        { itemId: 2, result: "พบข้อจำกัดเรื่องอัตราการเรียกใช้ API ของผู้ให้บริการ ซึ่งจะต้องขอขยายโควตาเพิ่ม" }
      ],
      actionItems: [
        { id: 201, task: "ติดต่อผู้ให้บริการเพื่อขยายโควตาการเรียกใช้งาน API", ownerId: 1, dueDate: ymd(addDays(monday, 8)), done: false }
      ],
      status: "draft",
      actualAttendeeIds: [1, 3],
      actualStart: "14:00",
      actualEnd: "14:45",
      recorderId: 3,
      signedBy: "",
      attachments: []
    },
    {
      agendaId: 3,
      overview: "สัมมนาทบทวนผลการดำเนินงานและระดมสมองเพื่อกำหนดกลยุทธ์ขององค์กรในระยะ 3 ปีข้างหน้า มีการวิเคราะห์จุดแข็ง จุดอ่อน โอกาส และอุปสรรค (SWOT Analysis) รวมถึงการระบุตลาดเป้าหมายใหม่ของบริษัท",
      agendaResults: [
        { itemId: 1, result: "สรุปรายได้ปีที่ผ่านมาเติบโตขึ้นร้อยละ 15 จากกลุ่มลูกค้าราชการเป็นหลัก" },
        { itemId: 2, result: "กำหนดกลยุทธ์เน้นการเข้าสู่ตลาด B2B ภาคเอกชน และการพัฒนาระบบประชุมอิเล็กทรอนิกส์ E-Meeting แบบ SaaS" },
        { itemId: 3, result: "หัวหน้าทุกแผนกตกลงร่วมกันที่จะลดงบประมาณการประชาสัมพันธ์ออฟไลน์ลงร้อยละ 20 เพื่อนำมาจัดสรรในการพัฒนาระบบดิจิทัล" }
      ],
      actionItems: [
        { id: 301, task: "จัดทำแผนธุรกิจและโครงสร้างราคาสำหรับ E-Meeting SaaS", ownerId: 3, dueDate: ymd(addDays(monday, 15)), done: true },
        { id: 302, task: "สรุปรายงาน SWOT Analysis และจัดพิมพ์เอกสารแผนยุทธศาสตร์", ownerId: 2, dueDate: ymd(addDays(monday, 20)), done: true },
        { id: 303, task: "จัดส่งรายงานสรุปให้ที่ประชุมผู้ถือหุ้นอนุมัติงบประมาณ", ownerId: 2, dueDate: ymd(addDays(monday, 30)), done: false }
      ],
      status: "published",
      actualAttendeeIds: [2, 4, 5],
      actualStart: "09:15",
      actualEnd: "15:45",
      recorderId: 2,
      signedBy: 1,
      attachments: [
        { name: "Strategic_Plan_Draft_v1.pdf", data: "data:application/pdf;base64,JVBERi0xLjQK...", type: "application/pdf" }
      ]
    },
    {
      agendaId: 5,
      overview: "ที่ประชุมคณะกรรมการรับฟังรายงานงบประมาณสำหรับระบบ Cloud ERP ปีงบประมาณ 2569 และพิจารณาความพร้อมด้านความมั่นคงปลอดภัยสารสนเทศตามข้อบังคับของ PDPA เพื่อป้องกันข้อมูลรั่วไหล",
      agendaResults: [
        { itemId: 1, result: "ระบบ ERP เดิมทำงานล่าช้า มีข้อมูลซ้ำซ้อนกันระหว่างแผนกจัดซื้อและวางแผน ต้องรีบปรับปรุงด่วน" },
        { itemId: 2, result: "อนุมัติหลักการในการจัดซื้อระบบ Cloud ERP งบประมาณไม่เกิน 5 ล้านบาท โดยให้เตรียมเปรียบเทียบผู้ให้บริการ 3 ราย" },
        { itemId: 3, result: "จัดอบรมระดับพนักงานเพื่อทำความเข้าใจเรื่อง PDPA และการจำกัดสิทธิ์การเข้าถึงข้อมูลระบบ ERP" }
      ],
      actionItems: [
        { id: 501, task: "จัดส่งข้อกำหนดขอบเขตงาน (TOR) ระบบ ERP ให้ผู้บริการเสนอราคา", ownerId: 5, dueDate: ymd(addDays(monday, 10)), done: false },
        { id: 502, task: "ประสานงานแผนกทรัพยากรบุคคลเพื่อกำหนดตารางอบรม PDPA ทั่วทั้งองค์กร", ownerId: 2, dueDate: ymd(addDays(monday, 14)), done: false }
      ],
      status: "published",
      actualAttendeeIds: [1, 5],
      actualStart: "09:30",
      actualEnd: "11:45",
      recorderId: 5,
      signedBy: 1,
      attachments: [
        { name: "ERP_Migration_Plan.pdf", data: "data:application/pdf;base64,JVBERi0xLjQK...", type: "application/pdf" },
        { name: "PDPA_Staff_Training_Outline.pdf", data: "data:application/pdf;base64,JVBERi0xLjQK...", type: "application/pdf" }
      ]
    }
  ];

  return {
    users: INITIAL_USERS,
    rooms: INITIAL_ROOMS,
    nextRoomId: INITIAL_ROOMS.length + 1,
    bookings: bookings,
    nextBookingId: bookings.length + 1,
    agendas: agendas,
    nextAgendaId: agendas.length + 1,
    minutes: minutes,
    dbVersion: 2
  };
};

/* ── Context Definition ── */
export type PageType = "login" | "force-change" | "main";
export type MenuType = "dashboard" | "users" | "rooms" | "agenda" | "mom" | "reports" | "booking" | "profile";

export interface ConfirmConfig {
  title: string;
  msg: string;
  icon?: string;
  color?: string;
  okLabel?: string;
  onOk: () => void;
}

export interface ToastConfig {
  msg: string;
  type: "success" | "error" | "info";
}

export interface AppNotification {
  id: string;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  linkMenu?: MenuType;
  linkId?: number | null;
}

interface AppContextType {
  db: AppDatabase;
  page: PageType;
  currentUser: User | null;
  sidebarOpen: boolean;
  activeMenu: MenuType;
  menuSeq: number;
  deepLinkAgendaId: number | null;
  toast: ToastConfig | null;
  confirm: ConfirmConfig | null;
  mode: "light" | "dark";
  notifications: AppNotification[];

  updateDB: (newDb: AppDatabase) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  askConfirm: (cfg: ConfirmConfig) => void;
  closeConfirm: () => void;
  navigateMenu: (menu: MenuType, deepLinkId?: number | null) => void;
  handleLogin: (user: User) => void;
  handleLogout: () => void;
  handleForceChange: (password: string) => void;
  handleForceChangeDone: () => void;
  addNotification: (userId: number, title: string, message: string, linkMenu?: MenuType, linkId?: number | null) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setMode: React.Dispatch<React.SetStateAction<"light" | "dark">>;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// ==========================================
// คอนเท็กซ์หลักสำหรับควบคุมและจัดเก็บข้อมูลส่วนกลาง (Global Context Store)
// ==========================================
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── ฐานข้อมูลจำลอง (Mock Database State) ──
  // โหลดข้อมูลเริ่มต้นจาก localStorage หรือทำการสร้างข้อมูลจำลอง (Seed DB) ใหม่หากไม่มีข้อมูลหรือเวอร์ชันเก่า
  const [db, setDb] = useState<AppDatabase>(() => {
    const saved = localStorage.getItem("bst_emeeting_db");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // ตรวจสอบโครงสร้างและความปลอดภัยฐานข้อมูล (Self-healing & Migration Check)
        // เพื่อป้องกันกรณีข้อมูลผู้ใช้หล่นหาย หรือฐานข้อมูลเก่ากว่าเวอร์ชัน 2
        const dbVersion = parsed.dbVersion || 0;
        const hasNarongrit = parsed.users && parsed.users.some((u: any) => u.email === "narongrit@dofservicedesk.in.th");
        if (hasNarongrit && dbVersion >= 2) {
          return parsed; // ใช้ฐานข้อมูลเดิมในเครื่องผู้ใช้ต่อได้เลย
        }
      } catch (e) {
        // ข้ามข้อผิดพลาดไปสร้างฐานข้อมูลจำลองใหม่
      }
    }
    // หากไม่มีข้อมูลเดิม หรือตรวจพบโครงสร้างเก่าเกินไป -> ทำการ Seed ข้อมูลเวอร์ชันล่าสุด
    const seeded = buildSeedDB();
    localStorage.setItem("bst_emeeting_db", JSON.stringify(seeded));
    // ล้างเซสชันผู้ใช้ออกเพื่อป้องกันการแคชสิทธิ์บัญชีเก่า
    localStorage.removeItem("bst_emeeting_session");
    return seeded;
  });

  // UI state
  const [page, setPage] = useState<PageType>(() => {
    const savedUser = localStorage.getItem("bst_emeeting_session");
    return savedUser ? "main" : "login";
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("bst_emeeting_session");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<MenuType>("dashboard");
  const [menuSeq, setMenuSeq] = useState(0);
  const [deepLinkAgendaId, setDeepLinkAgendaId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [mode, setMode] = useState<"light" | "dark">("light");

  // Keep body data-theme synchronized
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // ซิงค์ฐานข้อมูลระยะไกลจาก mock API เพื่อรองรับการทดสอบพร้อมกันหลายเบราว์เซอร์ (Multi-browser sync: Chrome + Edge)
  useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const res = await fetch(`/api/db?t=${Date.now()}`);
        if (res.ok) {
          const remoteDb = await res.json();
          if (active) {
            setDb(remoteDb);
            localStorage.setItem("bst_emeeting_db", JSON.stringify(remoteDb));
          }
        } else if (res.status === 404) {
          // หากพบคลาส 404 (ยังไม่สร้าง db.json) ให้ส่งสเตทปัจจุบันจำลองขึ้นไปสร้างไฟล์ทันที
          const currentLocal = localStorage.getItem("bst_emeeting_db");
          if (currentLocal) {
            await fetch("/api/db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: currentLocal
            });
          }
        }
      } catch (e) {
        // ข้ามข้อผิดพลาดกรณีเซิร์ฟเวอร์ไม่ได้เปิดใช้งาน
      }
    };
    sync();
    const timer = setInterval(sync, 3000); // ดึงข้อมูลใหม่ทุก 3 วินาที
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const notifications = db.notifications || [];

  const addNotification = (userId: number, title: string, message: string, linkMenu?: MenuType, linkId?: number | null) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkMenu,
      linkId
    };
    updateDB({
      ...db,
      notifications: [newNotif, ...(db.notifications || [])]
    });
  };

  const markNotificationAsRead = (id: string) => {
    updateDB({
      ...db,
      notifications: (db.notifications || []).map((n) => (n.id === id ? { ...n, isRead: true } : n))
    });
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    updateDB({
      ...db,
      notifications: (db.notifications || []).map((n) => (n.userId === currentUser.id ? { ...n, isRead: true } : n))
    });
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;
    updateDB({
      ...db,
      notifications: (db.notifications || []).filter((n) => n.userId !== currentUser.id)
    });
  };

  const updateDB = (newDb: AppDatabase) => {
    localStorage.setItem("bst_emeeting_db", JSON.stringify(newDb));
    setDb(newDb);
    // ส่งข้อมูลบันทึกไปเซิร์ฟเวอร์ด้วยเพื่อแชร์ข้อมูลข้ามเบราว์เซอร์
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDb)
    }).catch(() => {});
  };

  // แสดงป๊อปอัปข้อความแจ้งเตือนส่วนกลาง (Toast Notification)
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200); // หายไปอัตโนมัติหลังผ่านไป 3.2 วินาที
  };

  // ควบคุมป๊อปอัปยืนยันการทำรายการส่วนกลาง (Confirmation Dialog)
  const askConfirm = (cfg: ConfirmConfig) => setConfirm(cfg);
  const closeConfirm = () => setConfirm(null);

  // สลับหน้าเมนูของระบบ และรองรับการทำ Deep Link (เช่น กดดูรายงานการประชุมของ Agenda นั้นๆ โดยตรง)
  const navigateMenu = (menu: MenuType, deepLinkId: number | null = null) => {
    setActiveMenu(menu);
    setDeepLinkAgendaId(deepLinkId);
    setMenuSeq((seq) => seq + 1); // บังคับให้คอมโพเนนต์ภายในโหลดข้อมูลใหม่
  };

  // จัดการการเข้าระบบ อัปเดตเวลาการล็อกอิน และนำทางไปยังหน้าจอที่เหมาะสม
  const handleLogin = (user: User) => {
    const now = new Date().toISOString();
    const updated: User = { ...user, lastLogin: now };
    const newDb = {
      ...db,
      users: db.users.map((u) => (u.id === user.id ? updated : u))
    };
    updateDB(newDb);
    setCurrentUser(updated);
    localStorage.setItem("bst_emeeting_session", JSON.stringify(updated));

    // หากบัญชีถูกตั้งค่าล็อกอินครั้งแรก (isFirstLogin === true) บังคับให้ย้ายไปหน้าเปลี่ยนรหัสผ่านก่อน
    if (updated.isFirstLogin) {
      setPage("force-change");
    } else {
      setPage("main");
      setActiveMenu("dashboard");
    }
  };

  // บันทึกออกจากระบบ ลบเซสชันในเครื่อง และถามยืนยันผู้ใช้งาน
  const handleLogout = () => {
    askConfirm({
      title: "ออกจากระบบ",
      msg: "คุณต้องการออกจากระบบใช่หรือไม่?",
      icon: "logout",
      color: "#B42318",
      okLabel: "ออกจากระบบ",
      onOk: () => {
        setCurrentUser(null);
        localStorage.removeItem("bst_emeeting_session");
        setPage("login");
        closeConfirm();
      }
    });
  };

  // ดำเนินการอัปเดตรหัสผ่านใหม่ลงในฐานข้อมูลจำลอง (ตารางผู้ใช้) สำหรับผู้ใช้ที่มีการเข้าสู่ระบบครั้งแรก
  const handleForceChange = (password: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated: User = {
      ...currentUser,
      password,
      isFirstLogin: false, // เคลียร์สถานะการล็อกอินครั้งแรกออก
      lastPasswordChange: now
    };
    const newDb = {
      ...db,
      users: db.users.map((u) => (u.id === currentUser.id ? updated : u))
    };
    updateDB(newDb);
  };

  // ดำเนินการล็อกเอาท์เซสชันและผลักผู้ใช้กลับไปล็อกอินใหม่หลังจากเปลี่ยนรหัสผ่านเสร็จสิ้น
  const handleForceChangeDone = () => {
    setCurrentUser(null);
    localStorage.removeItem("bst_emeeting_session"); // ลบประวัติคุกกี้/เซสชันเดิมออก
    setPage("login"); // นำทางผู้ใช้กลับไปหน้า Login
    showToast("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่");
  };

  return (
    <AppContext.Provider
      value={{
        db,
        page,
        currentUser,
        sidebarOpen,
        activeMenu,
        menuSeq,
        deepLinkAgendaId,
        toast,
        confirm,
        mode,
        notifications,
        updateDB,
        showToast,
        askConfirm,
        closeConfirm,
        navigateMenu,
        handleLogin,
        handleLogout,
        handleForceChange,
        handleForceChangeDone,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        setCurrentUser,
        setMode,
        setSidebarOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
