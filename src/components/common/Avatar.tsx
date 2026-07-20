import React, { useState, useRef } from "react";
import Icon from "./Icon";

export interface AvatarUser {
  photo?: string;
  firstName?: string;
  lastName?: string;
}

interface AvatarProps {
  user: AvatarUser | null | undefined;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ user, size = 34 }) => {
  if (user?.photo) {
    return (
      <img
        src={user.photo}
        alt={user.firstName || "avatar"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          objectFit: "cover",
          border: `${size > 40 ? 3 : 2}px solid var(--accent-soft)`
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "linear-gradient(135deg, var(--accent-soft2), var(--accent-soft))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "var(--text)",
        border: `${size > 40 ? 3 : 2}px solid var(--accent-soft)`
      }}
    >
      {user?.firstName?.[0] || ""}
      {user?.lastName?.[0] || ""}
    </div>
  );
};

interface AvatarUploadProps {
  user: AvatarUser | null | undefined;
  size?: number;
  onUpload: (base64: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ user, size = 72, onUpload }) => {
  const [hover, setHover] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("รองรับเฉพาะไฟล์รูปภาพ");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr("ขนาดไฟล์ต้องไม่เกิน 10 MB");
      return;
    }
    setErr("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && typeof ev.target.result === "string") {
        onUpload(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar user={user} size={size} />
        {/* overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(0,0,0,.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            opacity: hover ? 1 : 0,
            transition: "opacity .18s",
            cursor: "pointer"
          }}
        >
          <Icon n="save" s={{ fontSize: 18, color: "#fff" }} />
          <span style={{ fontSize: 9, color: "#fff", fontWeight: 600, letterSpacing: ".04em" }}>เปลี่ยนรูป</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      {err && <p style={{ fontSize: 11, color: "#B42318", margin: 0 }}>{err}</p>}
      {!err && <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0 }}>คลิกที่รูปเพื่อเปลี่ยน · ไม่เกิน 10 MB</p>}
    </div>
  );
};
