import React, { useState, useRef } from "react";

interface TooltipProps {
  label: string;
  dir?: "r" | "l" | "t" | "b";
  block?: boolean;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ label, dir = "r", block = false, children }) => {
  const [pos, setPos] = useState<{ x: number; y: number; dir: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  if (!label) return <>{children}</>;

  const show = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const GAP = 10;
    let x = 0;
    let y = 0;
    if (dir === "r") {
      x = r.right + GAP;
      y = r.top + r.height / 2;
    } else if (dir === "l") {
      x = r.left - GAP;
      y = r.top + r.height / 2;
    } else if (dir === "t") {
      x = r.left + r.width / 2;
      y = r.top - GAP;
    } else {
      x = r.left + r.width / 2;
      y = r.bottom + GAP;
    }
    setPos({ x, y, dir });
  };

  const hide = () => setPos(null);

  const tipStyle = () => {
    if (!pos) return {};
    if (pos.dir === "r") return { left: pos.x, top: pos.y, transform: "translateY(-50%)" };
    if (pos.dir === "l") return { left: pos.x, top: pos.y, transform: "translate(-100%,-50%)" };
    if (pos.dir === "t") return { left: pos.x, top: pos.y, transform: "translate(-50%,-100%)" };
    return { left: pos.x, top: pos.y, transform: "translateX(-50%)" };
  };

  return (
    <>
      <div
        ref={ref}
        style={{ display: block ? "block" : "inline-flex" }}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      {pos && (
        <div
          style={{
            position: "fixed",
            ...tipStyle(),
            background: "#1E293B",
            color: "#fff",
            padding: "5px 10px",
            borderRadius: 7,
            fontSize: 12,
            fontFamily: "'Sarabun','Segoe UI',sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 99999,
            lineHeight: 1.4,
            boxShadow: "0 2px 8px rgba(0,0,0,.25)",
            ...tipStyle()
          }}
        >
          {label}
        </div>
      )}
    </>
  );
};

interface SideTipProps {
  label: string;
  off?: boolean;
  children: React.ReactNode;
}

export const SideTip: React.FC<SideTipProps> = ({ label, children, off }) => {
  if (off) return <>{children}</>;
  return (
    <Tooltip label={label} dir="r" block>
      {children}
    </Tooltip>
  );
};

export default Tooltip;
