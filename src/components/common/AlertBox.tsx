import React from "react";
import Icon from "./Icon";

interface AlertBoxProps {
  type: "error" | "success" | "info";
  msg: string;
  style?: React.CSSProperties;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ type, msg, style = {} }) => {
  const config = {
    error: { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", ic: "alert-circle" },
    success: { bg: "#F0FDF4", color: "#14532D", border: "#BBF7D0", ic: "check-circle" },
    info: { bg: "#EFF6FF", color: "#1E3A8A", border: "#BFDBFE", ic: "info" }
  }[type] || { bg: "#F3F4F6", color: "var(--text-sub)", border: "var(--border-2)", ic: "info" };

  return (
    <div
      className="fu"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 10,
        padding: "11px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        ...style
      }}
    >
      <Icon n={config.ic} s={{ fontSize: 16, color: config.color, marginTop: 1, flexShrink: 0 }} />
      <p style={{ fontSize: 13, color: config.color, lineHeight: 1.55, margin: 0 }}>{msg}</p>
    </div>
  );
};

interface ErrMsgProps {
  children: React.ReactNode;
}

export const ErrMsg: React.FC<ErrMsgProps> = ({ children }) => {
  return (
    <p style={{ color: "#B42318", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4, margin: "4px 0 0" }}>
      <Icon n="alert-circle" s={{ fontSize: 12, color: "#B42318" }} />
      {children}
    </p>
  );
};

interface GreenBadgeProps {
  children: React.ReactNode;
}

export const GreenBadge: React.FC<GreenBadgeProps> = ({ children }) => {
  return (
    <span
      style={{
        fontSize: 12,
        background: "#ECFDF5",
        color: "#065F46",
        padding: "5px 12px",
        borderRadius: 20,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }}
    >
      <Icon n="check-circle" s={{ fontSize: 12, color: "#065F46" }} />
      {children}
    </span>
  );
};
