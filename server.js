import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// คำนวณ __dirname สำหรับ ES Modules (เนื่องจากใช้ "type": "module" ใน package.json)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// พอร์ตใช้งานของโปรดักชันเซิร์ฟเวอร์ (ดึงจากตัวแปรคลาวด์ หรือใช้พอร์ต 5000 เป็นค่าเริ่มต้น)
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, "db.json");

// รองรับการแลกเปลี่ยนข้อมูลต่างพอร์ต (CORS) และตั้งค่าขีดจำกัดขนาดข้อมูล 50MB (สำหรับภาพถ่ายโปรไฟล์หรือไฟล์แนบ)
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ── GET: ดึงข้อมูลฐานข้อมูลทั้งหมด ──
app.get("/api/db", (req, res) => {
  // ยกเลิกแคชของบราวเซอร์โดยสมบูรณ์ เพื่อให้ซิงค์ข้อมูลเรียลไทม์เสมอ
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  fs.readFile(DB_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading database:", err);
      return res.status(500).json({ error: "Failed to read database file" });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error("Corrupted database file:", parseErr);
      res.status(500).json({ error: "Database file is corrupted" });
    }
  });
});

// ── POST: อัปเดตข้อมูลฐานข้อมูลทั้งหมด ──
app.post("/api/db", (req, res) => {
  const data = req.body;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Invalid database payload" });
  }

  fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Error writing database:", err);
      return res.status(500).json({ error: "Failed to write database file" });
    }
    console.log("Database updated successfully");
    res.json({ success: true });
  });
});

// ── บริการไฟล์สถิติต่างๆ จากฝั่งไคลเอนต์ (React Dist Folder) ──
app.use(express.static(path.join(__dirname, "dist")));

// ── SPA Routing Fallback ──
// หากผู้ใช้พิมพ์ URL หรือกดรีเฟรชหน้าบราวเซอร์ตรงๆ ให้ชี้กลับไปส่งหน้า index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// เริ่มเปิดบริการเว็บแอปพลิเคชันจริง
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 BST e-Meeting production server is now active!`);
  console.log(`➜ Local: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
