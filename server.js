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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ── GET: ดึงข้อมูลฐานข้อมูลทั้งหมด ──
app.get("/api/db", async (req, res) => {
  // ยกเลิกแคชของบราวเซอร์โดยสมบูรณ์ เพื่อให้ซิงค์ข้อมูลเรียลไทม์เสมอ
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bst_emeeting_db?id=eq.1`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) {
        const rows = await response.json();
        if (rows && rows.length > 0) {
          console.log("Fetched database from Supabase cloud");
          return res.json(rows[0].data);
        }
      }
    } catch (supabaseErr) {
      console.error("Failed to read from Supabase, falling back to local file:", supabaseErr.message);
    }
  }

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
app.post("/api/db", async (req, res) => {
  const data = req.body;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Invalid database payload" });
  }

  let supabaseSuccess = false;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bst_emeeting_db`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({ id: 1, data })
      });
      if (response.ok) {
        console.log("Saved database to Supabase cloud");
        supabaseSuccess = true;
      } else {
        console.error("Supabase write status not OK:", response.status);
      }
    } catch (supabaseErr) {
      console.error("Failed to write to Supabase:", supabaseErr.message);
    }
  }

  fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Error writing database:", err);
      if (!supabaseSuccess) {
        return res.status(500).json({ error: "Failed to write database file" });
      }
    }
    console.log("Database updated successfully (Local file)");
    res.json({ success: true, cloudSynced: supabaseSuccess });
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
