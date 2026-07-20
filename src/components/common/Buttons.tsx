import React from "react";
import Icon from "./Icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  children: React.ReactNode;
}

export const BtnPri: React.FC<ButtonProps> = ({ onClick, icon, children, style = {}, type = "button", ...rest }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="btn-pri"
      style={{
        width: "100%",
        height: 44,
        padding: "0 20px",
        background: "linear-gradient(135deg,var(--accent) 0%,var(--accent-grad2) 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 11,
        fontSize: 14,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: "0 2px 10px rgba(26,95,168,.28)",
        cursor: "pointer",
        ...style
      }}
      {...rest}
    >
      {icon && <Icon n={icon} s={{ fontSize: 17, color: "#fff" }} />}
      {children}
    </button>
  );
};

export const BtnSec: React.FC<ButtonProps> = ({ onClick, icon, children, style = {}, type = "button", ...rest }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="btn-sec"
      style={{
        height: 44,
        padding: "0 20px",
        background: "var(--surface)",
        color: "var(--text-sub)",
        border: "1.5px solid var(--border-2)",
        borderRadius: 11,
        fontSize: 14,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        ...style
      }}
      {...rest}
    >
      {icon && <Icon n={icon} s={{ fontSize: 17, color: "var(--text-mute)" }} />}
      {children}
    </button>
  );
};
