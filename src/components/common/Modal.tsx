import React from "react";
import Icon from "./Icon";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  width?: string | number;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose, wide = false, width }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,20,35,.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
        animation: "fadeIn .18s ease"
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fu"
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: "30px 32px",
          width: width !== undefined ? width : (wide ? 630 : 440),
          maxWidth: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,.18)"
        }}
      >
        <button
          onClick={onClose}
          className="btn-sec"
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            background: "var(--bg)",
            border: "none",
            borderRadius: 9,
            width: 34,
            height: 34,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <Icon n="x" s={{ fontSize: 17, color: "var(--text-mute)" }} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
