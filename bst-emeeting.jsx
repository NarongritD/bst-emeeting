import { useState, useRef, useMemo, useEffect } from "react";

/* ─── SVG Icon Library (inline, no CDN needed) ─── */
const ICONS = {
  "calendar":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>,
  "home":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  "meeting":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  "clipboard":       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  "file-text":       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  "bar-chart":       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  "calendar-plus":   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  "settings":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  "users":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  "door":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4H3v18h18V9l-5-5H7M13 4v5h5"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>,
  "user":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  "user-cog":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/><path d="M20 21v-2a4 4 0 00-3-3.87M4 21v-2a4 4 0 014-4h4"/></svg>,
  "user-plus":       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
  "logout":          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  "shield":          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  "lock":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  "lock-open":       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>,
  "key":             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>,
  "clock":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>,
  "eye":             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  "eye-off":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  "search":          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  "plus":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  "x":               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  "check":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  "check-circle":    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  "alert-circle":    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  "info":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  "bolt":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  "map-pin":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  "building":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><path d="M3 17a4 4 0 004 4h3"/></svg>,
  "save":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  "arrow-left":      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  "chevron-down":    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  "chevron-up":      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  "chevron-right":   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  "sidebar-collapse":<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="15 8 12 11 15 14"/></svg>,
  "sidebar-expand":  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="12 8 15 11 12 14"/></svg>,
  "tools":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  "search-off":      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="8" x2="14" y2="14"/></svg>,
  "login":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  "reset":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  "power":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  "ban":             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/></svg>,
  "loader":          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  "x-circle":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  "user-check":      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  "sun":             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  "moon":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  "link":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  "video":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  "list":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  "edit":            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  "download":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

function Icon({ n, s = {} }) {
  const name = typeof n === "string"
    ? n.replace(/^ti-?/, "")
    : null;
  const svgMap = {
    "home-2": "home", "home": "home",
    "calendar-event": "calendar", "calendar-week": "meeting", "calendar-plus": "calendar-plus",
    "clipboard-text": "clipboard", "file-description": "file-text",
    "report-analytics": "bar-chart", "chart-dots-2": "bar-chart", "chart-bar": "bar-chart",
    "adjustments-horizontal": "settings", "settings": "settings",
    "users-group": "users", "users": "users",
    "door-enter": "door",
    "user": "user", "user-cog": "user-cog", "user-plus": "user-plus",
    "logout-2": "logout", "logout": "logout",
    "shield-check": "shield", "shield-lock": "lock", "shield": "shield",
    "lock": "lock", "lock-open-off": "lock-open", "lock-password": "lock",
    "key": "key",
    "eye": "eye", "eye-off": "eye-off",
    "search": "search", "search-off": "search-off",
    "plus": "plus",
    "x": "x",
    "check": "check", "circle-check": "check-circle",
    "alert-circle": "alert-circle", "alert-triangle": "alert-circle",
    "info-circle": "info",
    "bolt": "bolt",
    "map-pin": "map-pin",
    "building-estate": "building", "building": "building",
    "device-floppy": "save",
    "arrow-left": "arrow-left",
    "chevron-down": "chevron-down", "chevron-up": "chevron-up", "chevron-right": "chevron-right",
    "sidebar-collapse": "sidebar-collapse", "sidebar-expand": "sidebar-expand",
    "layout-sidebar-left-collapse": "sidebar-collapse", "layout-sidebar-right-collapse": "sidebar-expand",
    "tools": "tools",
    "download": "download", "file-download": "download",
  };

  const resolved = typeof n === "string" ? (svgMap[name] || name) : null;
  const svg = resolved ? ICONS[resolved] : null;

  if (!svg) return <span style={{ display:"inline-block", width:"1em", height:"1em", ...s }}/>;

  const { fontSize = 18, color = "currentColor", ...rest } = s;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
      width: fontSize, height: fontSize, color, flexShrink:0, ...rest }}>
      {svg}
    </span>
  );
}

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const INITIAL_DB = {
  users: [
    { id:1, empId:"001", prefix:"นาย",    firstName:"สมชาย",    lastName:"ใจดี",    email:"somchai@bst.co.th",  phone:"0812345678", department:"Software & Development",    role:"แอดมิน",    isFirstLogin:false, password:"hashed_admin"  , status:"active" },
    { id:2, empId:"002", prefix:"นางสาว", firstName:"สมหญิง",   lastName:"รักดี",   email:"somying@bst.co.th",  phone:"0898765432", department:"Human Resource Department", role:"รายงาน",   isFirstLogin:false, password:"hashed_report" , status:"active" },
    { id:3, empId:"003", prefix:"นาย",    firstName:"วิชัย",    lastName:"มีสุข",   email:"wichai@bst.co.th",   phone:"0856781234", department:"Sale Department",           role:"ผู้ใช้งาน", isFirstLogin:false, password:"hashed_user"   , status:"active" },
    { id:4, empId:"004", prefix:"นาง",    firstName:"มาลี",     lastName:"สุขใจ",   email:"malee@bst.co.th",    phone:"0823456789", department:"Accounting Department",     role:"ผู้ใช้งาน", isFirstLogin:false, password:"hashed_user2"  , status:"active" },
    { id:5, empId:"005", prefix:"นาย",    firstName:"ประสิทธิ์", lastName:"ดีงาม",   email:"prasit@bst.co.th",   phone:"0867890123", department:"GOV Project Department",    role:"ผู้ใช้งาน", isFirstLogin:false, password:"hashed_user3"  , status:"active" },
    { id:6, empId:"006", prefix:"นาย", firstName:"วิรัตน์", lastName:"แก้วใส", email:"user6@bst.co.th", phone:"0810000822", department:"GOV Project Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:7, empId:"007", prefix:"นางสาว", firstName:"อุไรวรรณ", lastName:"เจริญสุข", email:"user7@bst.co.th", phone:"0810000959", department:"GOV Project Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:8, empId:"008", prefix:"นาย", firstName:"ทินกร", lastName:"รุ่งเรือง", email:"user8@bst.co.th", phone:"0810001096", department:"GOV Project Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:9, empId:"009", prefix:"นางสาว", firstName:"เบญจมาศ", lastName:"อยู่ดี", email:"user9@bst.co.th", phone:"0810001233", department:"GOV Project Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:10, empId:"010", prefix:"นาย", firstName:"อนุชา", lastName:"คงทน", email:"user10@bst.co.th", phone:"0810001370", department:"GOV Project Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:11, empId:"011", prefix:"นางสาว", firstName:"สุภาพร", lastName:"ทองดี", email:"user11@bst.co.th", phone:"0810001507", department:"GOV Project Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:12, empId:"012", prefix:"นาย", firstName:"ภานุวัฒน์", lastName:"ใจซื่อ", email:"user12@bst.co.th", phone:"0810001644", department:"GOV Project Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:13, empId:"013", prefix:"นางสาว", firstName:"นิภาพร", lastName:"นิลพันธ์", email:"user13@bst.co.th", phone:"0810001781", department:"GOV Project Department", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:14, empId:"014", prefix:"นาย", firstName:"กฤษณะ", lastName:"สมบูรณ์", email:"user14@bst.co.th", phone:"0810001918", department:"GOV Project Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:15, empId:"015", prefix:"นาง", firstName:"กัญญา", lastName:"สมบูรณ์", email:"user15@bst.co.th", phone:"0810003046", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:16, empId:"016", prefix:"นาย", firstName:"ทินกร", lastName:"วงศ์ใหญ่", email:"user16@bst.co.th", phone:"0810003183", department:"Warehouse & Logistic", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:17, empId:"017", prefix:"นางสาว", firstName:"ปราณี", lastName:"สว่างวงศ์", email:"user17@bst.co.th", phone:"0810003320", department:"Warehouse & Logistic", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:18, empId:"018", prefix:"นาย", firstName:"อนุชา", lastName:"วัฒนกุล", email:"user18@bst.co.th", phone:"0810003457", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:19, empId:"019", prefix:"นางสาว", firstName:"ชนิดา", lastName:"สุขสันต์", email:"user19@bst.co.th", phone:"0810003594", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:20, empId:"020", prefix:"นาย", firstName:"ภานุวัฒน์", lastName:"ชัยมงคล", email:"user20@bst.co.th", phone:"0810003731", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:21, empId:"021", prefix:"นางสาว", firstName:"นันทนา", lastName:"พงษ์ไพร", email:"user21@bst.co.th", phone:"0810003868", department:"Warehouse & Logistic", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:22, empId:"022", prefix:"นาย", firstName:"กฤษณะ", lastName:"ไพศาล", email:"user22@bst.co.th", phone:"0810004005", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:23, empId:"023", prefix:"นางสาว", firstName:"ลัดดา", lastName:"พูลสวัสดิ์", email:"user23@bst.co.th", phone:"0810004142", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:24, empId:"024", prefix:"นาย", firstName:"จักรพันธ์", lastName:"ศรีสวัสดิ์", email:"user24@bst.co.th", phone:"0810004279", department:"Warehouse & Logistic", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:25, empId:"025", prefix:"นาง", firstName:"อรทัย", lastName:"บุญมา", email:"user25@bst.co.th", phone:"0810005407", department:"Sale Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:26, empId:"026", prefix:"นาย", firstName:"อนุชา", lastName:"ปัญญาดี", email:"user26@bst.co.th", phone:"0810005544", department:"Sale Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:27, empId:"027", prefix:"นางสาว", firstName:"สุดารัตน์", lastName:"ทรัพย์มาก", email:"user27@bst.co.th", phone:"0810005681", department:"Sale Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:28, empId:"028", prefix:"นาย", firstName:"ภานุวัฒน์", lastName:"แสงทอง", email:"user28@bst.co.th", phone:"0810005818", department:"Sale Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:29, empId:"029", prefix:"นางสาว", firstName:"พัชรินทร์", lastName:"มั่งมี", email:"user29@bst.co.th", phone:"0810005955", department:"Sale Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:30, empId:"030", prefix:"นาย", firstName:"กฤษณะ", lastName:"แก้วใส", email:"user30@bst.co.th", phone:"0810006092", department:"Sale Department", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:31, empId:"031", prefix:"นางสาว", firstName:"จันทร์เพ็ญ", lastName:"เจริญสุข", email:"user31@bst.co.th", phone:"0810006229", department:"Sale Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:32, empId:"032", prefix:"นาย", firstName:"จักรพันธ์", lastName:"รุ่งเรือง", email:"user32@bst.co.th", phone:"0810006366", department:"Sale Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:33, empId:"033", prefix:"นางสาว", firstName:"อัญชลี", lastName:"อยู่ดี", email:"user33@bst.co.th", phone:"0810006503", department:"Sale Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:34, empId:"034", prefix:"นาย", firstName:"อนุชา", lastName:"อยู่ดี", email:"user34@bst.co.th", phone:"0810007631", department:"Purchase Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:35, empId:"035", prefix:"นาง", firstName:"ศิริพร", lastName:"คงทน", email:"user35@bst.co.th", phone:"0810007768", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:36, empId:"036", prefix:"นาย", firstName:"ภานุวัฒน์", lastName:"ทองดี", email:"user36@bst.co.th", phone:"0810007905", department:"Purchase Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:37, empId:"037", prefix:"นางสาว", firstName:"กนกวรรณ", lastName:"ใจซื่อ", email:"user37@bst.co.th", phone:"0810008042", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:38, empId:"038", prefix:"นาย", firstName:"กฤษณะ", lastName:"นิลพันธ์", email:"user38@bst.co.th", phone:"0810008179", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:39, empId:"039", prefix:"นางสาว", firstName:"มยุรี", lastName:"สมบูรณ์", email:"user39@bst.co.th", phone:"0810008316", department:"Purchase Department", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:40, empId:"040", prefix:"นาย", firstName:"จักรพันธ์", lastName:"วงศ์ใหญ่", email:"user40@bst.co.th", phone:"0810008453", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:41, empId:"041", prefix:"นางสาว", firstName:"พรทิพย์", lastName:"สว่างวงศ์", email:"user41@bst.co.th", phone:"0810008590", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:42, empId:"042", prefix:"นาย", firstName:"พิชัย", lastName:"วัฒนกุล", email:"user42@bst.co.th", phone:"0810008727", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:43, empId:"043", prefix:"นางสาว", firstName:"สมหญิง", lastName:"สุขสันต์", email:"user43@bst.co.th", phone:"0810008864", department:"Purchase Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:44, empId:"044", prefix:"นาย", firstName:"ภานุวัฒน์", lastName:"ไพศาล", email:"user44@bst.co.th", phone:"0810009992", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:45, empId:"045", prefix:"นาง", firstName:"วรรณา", lastName:"พูลสวัสดิ์", email:"user45@bst.co.th", phone:"0810010129", department:"Team CMG", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:46, empId:"046", prefix:"นาย", firstName:"กฤษณะ", lastName:"ศรีสวัสดิ์", email:"user46@bst.co.th", phone:"0810010266", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:47, empId:"047", prefix:"นางสาว", firstName:"ดวงใจ", lastName:"กิตติคุณ", email:"user47@bst.co.th", phone:"0810010403", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:48, empId:"048", prefix:"นาย", firstName:"จักรพันธ์", lastName:"ศรีทอง", email:"user48@bst.co.th", phone:"0810010540", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:49, empId:"049", prefix:"นางสาว", firstName:"สายใจ", lastName:"บุญมา", email:"user49@bst.co.th", phone:"0810010677", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:50, empId:"050", prefix:"นาย", firstName:"พิชัย", lastName:"ปัญญาดี", email:"user50@bst.co.th", phone:"0810010814", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:51, empId:"051", prefix:"นางสาว", firstName:"รัตนา", lastName:"ทรัพย์มาก", email:"user51@bst.co.th", phone:"0810010951", department:"Team CMG", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:52, empId:"052", prefix:"นาย", firstName:"อาทิตย์", lastName:"แสงทอง", email:"user52@bst.co.th", phone:"0810011088", department:"Team CMG", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:53, empId:"053", prefix:"นางสาว", firstName:"วาสนา", lastName:"มั่งมี", email:"user53@bst.co.th", phone:"0810011225", department:"Team CMG", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:54, empId:"054", prefix:"นาย", firstName:"กฤษณะ", lastName:"รุ่งเรือง", email:"user54@bst.co.th", phone:"0810012353", department:"Software & Development", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:55, empId:"055", prefix:"นาง", firstName:"สุภาพร", lastName:"อยู่ดี", email:"user55@bst.co.th", phone:"0810012490", department:"Software & Development", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:56, empId:"056", prefix:"นาย", firstName:"จักรพันธ์", lastName:"คงทน", email:"user56@bst.co.th", phone:"0810012627", department:"Software & Development", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:57, empId:"057", prefix:"นางสาว", firstName:"นิภาพร", lastName:"ทองดี", email:"user57@bst.co.th", phone:"0810012764", department:"Software & Development", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:58, empId:"058", prefix:"นาย", firstName:"พิชัย", lastName:"ใจซื่อ", email:"user58@bst.co.th", phone:"0810012901", department:"Software & Development", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:59, empId:"059", prefix:"นางสาว", firstName:"ปาริชาต", lastName:"นิลพันธ์", email:"user59@bst.co.th", phone:"0810013038", department:"Software & Development", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:60, empId:"060", prefix:"นาย", firstName:"อาทิตย์", lastName:"สมบูรณ์", email:"user60@bst.co.th", phone:"0810013175", department:"Software & Development", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:61, empId:"061", prefix:"นางสาว", firstName:"อุไรวรรณ", lastName:"วงศ์ใหญ่", email:"user61@bst.co.th", phone:"0810013312", department:"Software & Development", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:62, empId:"062", prefix:"นาย", firstName:"ธนวัฒน์", lastName:"สว่างวงศ์", email:"user62@bst.co.th", phone:"0810013449", department:"Software & Development", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:63, empId:"063", prefix:"นางสาว", firstName:"ชนิดา", lastName:"สว่างวงศ์", email:"user63@bst.co.th", phone:"0810014577", department:"Human Resource Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:64, empId:"064", prefix:"นาย", firstName:"จักรพันธ์", lastName:"วัฒนกุล", email:"user64@bst.co.th", phone:"0810014714", department:"Human Resource Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:65, empId:"065", prefix:"นาง", firstName:"นันทนา", lastName:"สุขสันต์", email:"user65@bst.co.th", phone:"0810014851", department:"Human Resource Department", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:66, empId:"066", prefix:"นาย", firstName:"พิชัย", lastName:"ชัยมงคล", email:"user66@bst.co.th", phone:"0810014988", department:"Human Resource Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:67, empId:"067", prefix:"นางสาว", firstName:"ลัดดา", lastName:"พงษ์ไพร", email:"user67@bst.co.th", phone:"0810015125", department:"Human Resource Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:68, empId:"068", prefix:"นาย", firstName:"อาทิตย์", lastName:"ไพศาล", email:"user68@bst.co.th", phone:"0810015262", department:"Human Resource Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:69, empId:"069", prefix:"นางสาว", firstName:"กัญญา", lastName:"พูลสวัสดิ์", email:"user69@bst.co.th", phone:"0810015399", department:"Human Resource Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:70, empId:"070", prefix:"นาย", firstName:"ธนวัฒน์", lastName:"ศรีสวัสดิ์", email:"user70@bst.co.th", phone:"0810015536", department:"Human Resource Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:71, empId:"071", prefix:"นางสาว", firstName:"ปราณี", lastName:"กิตติคุณ", email:"user71@bst.co.th", phone:"0810015673", department:"Human Resource Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:72, empId:"072", prefix:"นาย", firstName:"จักรพันธ์", lastName:"กิตติคุณ", email:"user72@bst.co.th", phone:"0810016801", department:"Accounting Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:73, empId:"073", prefix:"นางสาว", firstName:"พัชรินทร์", lastName:"ศรีทอง", email:"user73@bst.co.th", phone:"0810016938", department:"Accounting Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:74, empId:"074", prefix:"นาย", firstName:"พิชัย", lastName:"บุญมา", email:"user74@bst.co.th", phone:"0810017075", department:"Accounting Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:75, empId:"075", prefix:"นาง", firstName:"จันทร์เพ็ญ", lastName:"ปัญญาดี", email:"user75@bst.co.th", phone:"0810017212", department:"Accounting Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:76, empId:"076", prefix:"นาย", firstName:"อาทิตย์", lastName:"ทรัพย์มาก", email:"user76@bst.co.th", phone:"0810017349", department:"Accounting Department", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:77, empId:"077", prefix:"นางสาว", firstName:"อัญชลี", lastName:"แสงทอง", email:"user77@bst.co.th", phone:"0810017486", department:"Accounting Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:78, empId:"078", prefix:"นาย", firstName:"ธนวัฒน์", lastName:"มั่งมี", email:"user78@bst.co.th", phone:"0810017623", department:"Accounting Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:79, empId:"079", prefix:"นางสาว", firstName:"อรทัย", lastName:"แก้วใส", email:"user79@bst.co.th", phone:"0810017760", department:"Accounting Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:80, empId:"080", prefix:"นาย", firstName:"อภิชัย", lastName:"เจริญสุข", email:"user80@bst.co.th", phone:"0810017897", department:"Accounting Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:81, empId:"081", prefix:"นางสาว", firstName:"กนกวรรณ", lastName:"เจริญสุข", email:"user81@bst.co.th", phone:"0810019025", department:"Service Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:82, empId:"082", prefix:"นาย", firstName:"พิชัย", lastName:"รุ่งเรือง", email:"user82@bst.co.th", phone:"0810019162", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:83, empId:"083", prefix:"นางสาว", firstName:"มยุรี", lastName:"อยู่ดี", email:"user83@bst.co.th", phone:"0810019299", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:84, empId:"084", prefix:"นาย", firstName:"อาทิตย์", lastName:"คงทน", email:"user84@bst.co.th", phone:"0810019436", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:85, empId:"085", prefix:"นาง", firstName:"พรทิพย์", lastName:"ทองดี", email:"user85@bst.co.th", phone:"0810019573", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:86, empId:"086", prefix:"นาย", firstName:"ธนวัฒน์", lastName:"ใจซื่อ", email:"user86@bst.co.th", phone:"0810019710", department:"Service Department", role:"รายงาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:87, empId:"087", prefix:"นางสาว", firstName:"สมหญิง", lastName:"นิลพันธ์", email:"user87@bst.co.th", phone:"0810019847", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:88, empId:"088", prefix:"นาย", firstName:"อภิชัย", lastName:"สมบูรณ์", email:"user88@bst.co.th", phone:"0810019984", department:"Service Department", role:"แอดมิน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:89, empId:"089", prefix:"นางสาว", firstName:"ศิริพร", lastName:"วงศ์ใหญ่", email:"user89@bst.co.th", phone:"0810020121", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
    { id:90, empId:"090", prefix:"นาย", firstName:"ชาญชัย", lastName:"สว่างวงศ์", email:"user90@bst.co.th", phone:"0810020258", department:"Service Department", role:"ผู้ใช้งาน", isFirstLogin:true, password:"12345" , status:"active" },
  ],
  rooms: [
    { id:1, name:"Blue Diamond", floor:"3", place:"BST (The9)", status:"active" },
    { id:2, name:"Blue Planet",  floor:"5", place:"BST (The9)", status:"active" },
    { id:3, name:"Blue Ocean",   floor:"2", place:"BST (JAS)",  status:"active" },
  ],
  nextRoomId: 4,
  bookings: [], // populated below via genSampleBookings()
  nextBookingId: 1,
  agendas: [], // populated below via genSampleAgendas()
  nextAgendaId: 1,
  minutes: [],
};

/* generate a few realistic sample bookings anchored to "today" so the calendar always has content */
function genSampleBookings(agendas){
  const today = new Date();
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const dow = (today.getDay()+6)%7;
  const monday = addDays(today, -dow);

  /* 1. สร้าง booking จาก agenda ที่มีห้องทุกตัว (เป็น source of truth) */
  const fromAgendas = (agendas||[])
    .filter(a => a.locationMode==="place" && a.roomId)
    .map((a, i) => ({
      id: 100 + i,
      agendaId: a.id,
      title: a.title,
      roomId: a.roomId,
      date: a.date,
      start: a.start,
      end: a.end,
      organizerId: a.organizerId,
      participantIds: a.participantIds || [],
      note: a.objective || "",
    }));

  /* 2. booking standalone ที่ไม่ได้มาจาก agenda */
  const standalone = [
    { id:1, title:"Workshop ทีมขาย",       roomId:2, date:ymd(addDays(monday,0)), start:"08:00", end:"14:00", organizerId:3, participantIds:[3], note:"" },
    { id:2, title:"Update Product",        roomId:2, date:ymd(addDays(monday,1)), start:"11:00", end:"12:30", organizerId:3, participantIds:[3,4], note:"" },
    { id:3, title:"Call Customer Meeting", roomId:1, date:ymd(addDays(monday,1)), start:"13:45", end:"17:30", organizerId:1, participantIds:[1,5], note:"" },
    { id:4, title:"นโยบายและทบทวนเทคนิค", roomId:2, date:ymd(addDays(monday,2)), start:"13:30", end:"17:30", organizerId:2, participantIds:[2], note:"" },
    { id:5, title:"Customer Meeting",      roomId:1, date:ymd(addDays(monday,5)), start:"09:45", end:"12:30", organizerId:1, participantIds:[1,3,4], note:"" },
    { id:6, title:"Operation Team Meeting",roomId:1, date:ymd(addDays(monday,4)), start:"14:00", end:"17:30", organizerId:4, participantIds:[4,5], note:"" },
    { id:7, title:"ประชุมด่วนข้ามไทม์โซน", roomId:1, date:ymd(addDays(monday,2)), start:"05:00", end:"06:30", organizerId:1, participantIds:[1], note:"" },
    { id:8, title:"ปิดงานประจำวัน",         roomId:2, date:ymd(addDays(monday,3)), start:"22:00", end:"23:30", organizerId:2, participantIds:[2], note:"" },
  ];

  return [...standalone, ...fromAgendas];
}

function genSampleAgendas(){
  const today = new Date();
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const dow = (today.getDay()+6)%7;
  const monday = addDays(today, -dow);
  const yr = today.getFullYear();
  const code = n => `AGD-${yr}-${String(n).padStart(4,"0")}`;
  const now = new Date().toISOString();

  return [
    { id:1, code:code(1), meetingType:"new", parentAgendaId:null,
      title:"ประชุมทีมพัฒนา Sprint Planning",
      locationMode:"place", place:"BST (The9)", roomId:1, offsiteLocation:"",
      hasOnlineLink:false, onlineLink:"",
      date:ymd(addDays(monday,0)), start:"10:00", end:"12:00",
      objective:"วางแผนงาน Sprint รอบใหม่และจัดลำดับความสำคัญของงาน",
      items:[
        {id:1,detail:"ทบทวนผลงาน Sprint ที่ผ่านมา"},
        {id:2,detail:"จัดลำดับความสำคัญ Backlog"},
        {id:3,detail:"แบ่งงานและประเมินเวลา"},
      ],
      details:"นำ Backlog ที่จัดลำดับไว้แล้วมาหารือร่วมกันในที่ประชุม",
      participantIds:[1,3], hasExternal:false, externalParticipants:"",
      organizerId:1, createdAt:now, updatedAt:now },

    { id:2, code:code(2), meetingType:"continued", parentAgendaId:1,
      title:"ติดตามผล Sprint Planning (ครั้งที่ 2)",
      locationMode:"place", place:"BST (The9)", roomId:1, offsiteLocation:"",
      hasOnlineLink:true, onlineLink:"https://meet.bst.co.th/sprint-followup",
      date:ymd(addDays(monday,4)), start:"14:00", end:"15:00",
      objective:"ติดตามความคืบหน้าของงานที่มอบหมายในรอบก่อนหน้า",
      items:[
        {id:1,detail:"รายงานความคืบหน้าของแต่ละทีม"},
        {id:2,detail:"หารือปัญหาที่พบและแนวทางแก้ไข"},
      ],
      details:"", participantIds:[1,3,4], hasExternal:false, externalParticipants:"",
      organizerId:1, createdAt:now, updatedAt:now },

    { id:3, code:code(3), meetingType:"new", parentAgendaId:null,
      title:"สัมมนาประจำปี ทบทวนกลยุทธ์องค์กร",
      locationMode:"offsite", place:"", roomId:null, offsiteLocation:"โรงแรมแกรนด์ เซ็นทรัล กรุงเทพฯ",
      hasOnlineLink:false, onlineLink:"",
      date:ymd(addDays(monday,8)), start:"09:00", end:"16:00",
      objective:"ทบทวนผลการดำเนินงานปีที่ผ่านมาและกำหนดกลยุทธ์ปีถัดไป",
      items:[
        {id:1,detail:"สรุปผลการดำเนินงานประจำปี"},
        {id:2,detail:"กำหนดเป้าหมายและกลยุทธ์ปีถัดไป"},
        {id:3,detail:"ระดมความคิดเห็นจากหัวหน้าแผนก"},
      ],
      details:"กรุณาเตรียมสรุปผลงานของแผนกมาด้วยในวันงาน",
      participantIds:[2,4,5], hasExternal:true, externalParticipants:"คุณสมชาย ใจดี — ที่ปรึกษากลยุทธ์ บริษัท ABC Consulting",
      organizerId:2, createdAt:now, updatedAt:now },

    { id:4, code:code(4), meetingType:"new", parentAgendaId:null,
      title:"ประชุมจัดซื้อร่วมกับผู้ขาย",
      locationMode:"place", place:"BST (JAS)", roomId:3, offsiteLocation:"",
      hasOnlineLink:true, onlineLink:"Google Meet: meet.google.com/abc-defg-hij",
      date:ymd(addDays(monday,6)), start:"13:00", end:"14:30",
      objective:"เจรจาเงื่อนไขการจัดซื้อวัสดุประจำไตรมาส",
      items:[
        {id:1,detail:"นำเสนอใบเสนอราคาจากผู้ขาย"},
        {id:2,detail:"เจรจาเงื่อนไขการชำระเงินและการส่งมอบ"},
      ],
      details:"", participantIds:[3], hasExternal:true, externalParticipants:"คุณวิภาดา รุ่งเรือง — ฝ่ายขาย บริษัท ผู้จัดจำหน่ายวัสดุ จำกัด",
      organizerId:3, createdAt:now, updatedAt:now },
  ];
}

INITIAL_DB.agendas = genSampleAgendas();
INITIAL_DB.nextAgendaId = INITIAL_DB.agendas.length + 1;
INITIAL_DB.minutes = []; // MOM records keyed by agendaId
INITIAL_DB.bookings = genSampleBookings(INITIAL_DB.agendas);
INITIAL_DB.nextBookingId = INITIAL_DB.bookings.length + 1;

const DEPARTMENTS = ["GOV Project Department","Warehouse & Logistic","Sale Department","Purchase Department","Team CMG","Software & Development","Human Resource Department","Accounting Department","Service Department"];
const ROLES    = ["ผู้ใช้งาน","รายงาน","แอดมิน"];
const PREFIXES = ["นาย","นาง","นางสาว","อื่นๆ"];
const QUICK_LOGINS = [
  { label:"ผู้ใช้งาน", email:"wichai@bst.co.th",  role:"ผู้ใช้งาน" },
  { label:"รายงาน",   email:"somying@bst.co.th", role:"รายงาน"   },
  { label:"แอดมิน",   email:"somchai@bst.co.th", role:"แอดมิน"   },
];
const ROLE_STYLE = {
  "แอดมิน":    { bg:"#EAF3DE", color:"#2D5A0E", icon:"shield"   },
  "รายงาน":   { bg:"#E6F1FB", color:"#0C447C",  icon:"bar-chart" },
  "ผู้ใช้งาน": { bg:"#F1EFE8", color:"#555550",  icon:"user"      },
};

/* "สิทธิ์การเข้าใช้" — สรุปจาก isFirstLogin + status เป็น badge เดียวให้ดูง่าย */
function getAccessStatus(u){
  if(u.status==="disabled") return { label:"ปิดใช้งาน",            bg:"#FEE4E2", color:"#B42318" };
  if(u.isFirstLogin)        return { label:"บังคับเปลี่ยนรหัสผ่าน", bg:"#FEF3E2", color:"#B54708" };
  return                          { label:"ปกติ",                 bg:"#E7F6EC", color:"#1A7F37" };
}

/* In-memory store (replaces localStorage, which artifacts sandboxes don't support).
   Data persists for the session only and resets on reload. */
let _memDB = null;
function getDB()  { return _memDB ? JSON.parse(JSON.stringify(_memDB)) : JSON.parse(JSON.stringify(INITIAL_DB)); }
function saveDB(d){ _memDB = JSON.parse(JSON.stringify(d)); }
function initDB() { if(!_memDB) saveDB(INITIAL_DB); }

/* ═══════════════════════════ ROOT ═══════════════════════════ */
/* ── Theme presets: accent color system ── */
/* ── Fixed brand accent color (เดิมเลือกได้หลายธีม ตอนนี้ fix เป็นสีฟ้าเดียว) ── */
const BRAND_ACCENT = { accent:"#1A5FA8", soft:"#EBF3FF", soft2:"#D9EAFF", dark:"#0C447C", grad2:"#2563EB" };

/* ── Light / Dark neutral token sets (gray-charcoal dark, not pure black) ── */
const NEUTRAL_TOKENS = {
  light: {
    bg:        "#F4F6FA",   // app background
    surface:   "#FFFFFF",   // cards/modals
    surface2:  "#FAFBFC",   // toolbars/table head
    surface3:  "#F9FAFB",
    surfaceHover:"#F7F9FC",
    border:    "#EAECF0",
    border2:   "#E5E7EB",
    borderSoft:"#F0F2F5",
    text:      "#141414",
    textSub:   "#374151",
    textMute:  "#6B7280",
    textFaint: "#9CA3AF",
    textGhost: "#C0C8D8",
    inputBg:   "#FAFBFC",
    shadow:    "0 1px 4px rgba(0,0,0,.04)",
    shadowLg:  "0 20px 60px rgba(0,0,0,.18)",
    overlay:   "rgba(15,20,35,.48)",
  },
  dark: {
    bg:        "#15171C",   // app background — charcoal, not pure black
    surface:   "#1E2127",   // cards/modals
    surface2:  "#21242B",   // toolbars/table head
    surface3:  "#23262D",
    surfaceHover:"#2A2E36",
    border:    "#33373F",
    border2:   "#3A3F47",
    borderSoft:"#2A2E36",
    text:      "#F1F2F4",
    textSub:   "#D1D5DB",
    textMute:  "#9CA3AF",
    textFaint: "#7B8290",
    textGhost: "#5B616C",
    inputBg:   "#23262D",
    shadow:    "0 1px 4px rgba(0,0,0,.25)",
    shadowLg:  "0 20px 60px rgba(0,0,0,.55)",
    overlay:   "rgba(0,0,0,.6)",
  },
};

function getThemeCSSVars(mode){
  const t = BRAND_ACCENT;
  const n = NEUTRAL_TOKENS[mode] || NEUTRAL_TOKENS.light;
  return `:root{
    --accent:${t.accent}; --accent-soft:${t.soft}; --accent-soft2:${t.soft2};
    --accent-dark:${t.dark}; --accent-grad2:${t.grad2};

    --bg:${n.bg}; --surface:${n.surface}; --surface-2:${n.surface2}; --surface-3:${n.surface3};
    --surface-hover:${n.surfaceHover};
    --border:${n.border}; --border-2:${n.border2}; --border-soft:${n.borderSoft};
    --text:${n.text}; --text-sub:${n.textSub}; --text-mute:${n.textMute};
    --text-faint:${n.textFaint}; --text-ghost:${n.textGhost};
    --input-bg:${n.inputBg};
    --shadow:${n.shadow}; --shadow-lg:${n.shadowLg}; --overlay:${n.overlay};
  }`;
}

export default function App() {
  const [db,          setDb]          = useState(()=>{ initDB(); return getDB(); });
  const [page,        setPage]        = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu,  setActiveMenu]  = useState("dashboard");
  const [menuSeq,     setMenuSeq]     = useState(0);
  const [deepLinkAgendaId, setDeepLinkAgendaId] = useState(null); // cross-nav: open this agenda's detail directly on Agenda/MOM pages
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [userDrop,    setUserDrop]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [confirm,     setConfirm]     = useState(null);
  const [mode,        setMode]        = useState("light");

  const updateDB    = d => { saveDB(d); setDb(d); };
  const showToast   = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const askConfirm  = cfg => setConfirm(cfg);
  const closeConfirm= () => setConfirm(null);
  const navigateMenu = (menu, deepLinkId=null) => {
    setActiveMenu(menu);
    setDeepLinkAgendaId(deepLinkId);
    setMenuSeq(seq=>seq+1);
  };
  const goToAgendaMom    = agendaId => navigateMenu("mom", agendaId);
  const goToAgendaDetail = agendaId => navigateMenu("agenda", agendaId);

  const handleLogin = user => {
    const now = new Date().toISOString();
    const updated = {...user, lastLogin: now};
    const nd = {...db, users: db.users.map(u=>u.id===user.id ? updated : u)};
    updateDB(nd);
    setCurrentUser(updated);
    if (updated.isFirstLogin) setPage("force-change");
    else { setPage("main"); setActiveMenu("dashboard"); }
  };
  const handleLogout = () => askConfirm({
    title:"ออกจากระบบ", msg:"คุณต้องการออกจากระบบใช่หรือไม่?",
    icon:"logout", color:"#B42318", okLabel:"ออกจากระบบ",
    onOk:()=>{ setCurrentUser(null); setPage("login"); setUserDrop(false); closeConfirm(); }
  });
  const handleForceChange = pw => {
    const now = new Date().toISOString();
    const nd={...db,users:db.users.map(u=>u.id===currentUser.id
      ?{...u,password:pw,isFirstLogin:false,lastPasswordChange:now}:u)};
    updateDB(nd); // persist the new password right away; navigation happens after the success message is shown
  };
  const handleForceChangeDone = () => {
    setCurrentUser(null);
    setPage("login");
    showToast("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่");
  };

  return (
    <div style={{fontFamily:"'Sarabun','Segoe UI',sans-serif",minHeight:"100vh",background:"var(--bg)",transition:"background .2s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{getThemeCSSVars(mode)}</style>
      <style>{CSS}</style>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmModal {...confirm} onClose={closeConfirm}/>}
      {page==="login"        && <LoginPage db={db} onLogin={handleLogin} mode={mode}/>}
      {page==="force-change" && <ForceChangePage onSubmit={handleForceChange} onDone={handleForceChangeDone} mode={mode}/>}
      {page==="main" && (
        <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}
            activeMenu={activeMenu} setActiveMenu={navigateMenu}
            meetingOpen={meetingOpen} setMeetingOpen={setMeetingOpen}
            settingOpen={settingOpen} setSettingOpen={setSettingOpen}
            currentUser={currentUser} onLogout={handleLogout}
            userDrop={userDrop} setUserDrop={setUserDrop}
            mode={mode} setMode={setMode}/>
          <main style={{flex:1,padding:"32px 36px",overflowY:"auto",overflowX:"hidden",minWidth:0,height:"100vh"}}>
            {activeMenu==="dashboard" && <DashboardPage key={menuSeq} db={db}/>}
            {activeMenu==="users"     && <UsersPage key={menuSeq} db={db} updateDB={updateDB} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm} currentUser={currentUser}/>}
            {activeMenu==="rooms"     && <RoomsPage key={menuSeq} db={db} updateDB={updateDB} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm}/>}
            {activeMenu==="agenda"    && <AgendaPage key={menuSeq} db={db} updateDB={updateDB} currentUser={currentUser} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm} openAgendaId={deepLinkAgendaId} onOpenMom={goToAgendaMom}/>}
            {activeMenu==="mom"       && <MomPage key={menuSeq} db={db} updateDB={updateDB} currentUser={currentUser} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm} openAgendaId={deepLinkAgendaId} onOpenAgenda={goToAgendaDetail}/>}
            {activeMenu==="reports"   && <ReportsPage key={menuSeq} db={db}/>}
            {activeMenu==="booking"   && <BookingPage key={menuSeq} db={db} updateDB={updateDB} currentUser={currentUser} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm}/>}
            {activeMenu==="profile"   && <ProfilePage key={menuSeq} currentUser={currentUser} db={db} updateDB={updateDB} setCurrentUser={setCurrentUser} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm}/>}
          </main>
        </div>
      )}
    </div>
  );
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sarabun','Segoe UI',sans-serif;background:var(--bg);}
  input,select,button{font-family:inherit;}
  input:focus,select:focus{outline:none!important;border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-soft)!important;}
  .row-hover:hover{background:var(--surface-hover)!important;}
  .btn-pri{transition:opacity .15s,transform .1s;} .btn-pri:hover{opacity:.9;} .btn-pri:active{transform:scale(.97);}
  .btn-sec:hover{background:var(--surface-hover)!important;}
  .si:hover{background:var(--surface-hover)!important;}
  .si-active{background:var(--accent-soft)!important;}

  /* ── Tooltip system ── */
  .tt{position:relative;display:inline-flex;}
  .tt::after{
    content:attr(data-tip);
    position:absolute;
    background:#1E293B;color:#fff;
    padding:5px 10px;border-radius:7px;
    font-size:12px;font-family:'Sarabun','Segoe UI',sans-serif;
    white-space:nowrap;pointer-events:none;
    opacity:0;transition:opacity .15s .1s;z-index:9000;
    line-height:1.4;
  }
  /* arrow shared */
  .tt::before{
    content:"";position:absolute;
    border:5px solid transparent;
    pointer-events:none;opacity:0;
    transition:opacity .15s .1s;z-index:9001;
  }
  .tt:hover::after,.tt:hover::before{opacity:1;}

  /* right (default — sidebar icons) */
  .tt-r::after{left:calc(100% + 9px);top:50%;transform:translateY(-50%);}
  .tt-r::before{left:calc(100% + 0px);top:50%;transform:translateY(-50%);border-right-color:#1E293B;}

  /* top */
  .tt-t::after{bottom:calc(100% + 9px);left:50%;transform:translateX(-50%);}
  .tt-t::before{bottom:calc(100% + 0px);left:50%;transform:translateX(-50%);border-top-color:#1E293B;}

  /* bottom */
  .tt-b::after{top:calc(100% + 9px);left:50%;transform:translateX(-50%);}
  .tt-b::before{top:calc(100% + 0px);left:50%;transform:translateX(-50%);border-bottom-color:#1E293B;}

  /* left */
  .tt-l::after{right:calc(100% + 9px);top:50%;transform:translateY(-50%);}
  .tt-l::before{right:calc(100% + 0px);top:50%;transform:translateY(-50%);border-left-color:#1E293B;}

  /* sidebar legacy */
  .tip-wrap{position:relative;display:block;}
  .tip{position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);background:#1E293B;color:#fff;
    padding:4px 9px;border-radius:6px;font-size:12px;white-space:nowrap;pointer-events:none;
    opacity:0;transition:opacity .15s;z-index:600;}
  .tip-wrap:hover .tip{opacity:1;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  .fu{animation:fadeUp .2s ease;}
`;

/* ── Toast ── */
function Toast({msg,type}){
  const T={success:{bg:"#166534",ic:"check-circle"},error:{bg:"#991B1B",ic:"alert-circle"},info:{bg:"#1E3A8A",ic:"info"}}[type]||{bg:"#1E3A8A",ic:"info"};
  return <div className="fu" style={{position:"fixed",top:24,right:24,zIndex:9999,background:T.bg,color:"#fff",padding:"12px 18px",borderRadius:12,fontSize:14,fontWeight:500,display:"flex",alignItems:"center",gap:10,boxShadow:"0 6px 28px rgba(0,0,0,.22)"}}>
    <Icon n={T.ic} s={{fontSize:19,color:"#fff"}}/>{msg}
  </div>;
}

/* ── Confirm Modal ── */
function ConfirmModal({title,msg,icon,color,okLabel,onOk,onClose}){
  const c=color||"var(--accent)";
  const softBg=c==="#B42318"?"#FFF2F2":c==="#C2410C"?"#FFF7ED":"var(--accent-soft)";
  return <div style={{position:"fixed",inset:0,background:"rgba(15,20,35,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20,animation:"fadeIn .18s ease"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="fu" style={{background:"var(--surface)",borderRadius:20,padding:"32px",width:400,maxWidth:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:60,height:60,background:softBg,borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
          <Icon n={icon||"alert-circle"} s={{fontSize:28,color:c}}/>
        </div>
        <h3 style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:8}}>{title}</h3>
        <p style={{fontSize:14,color:"var(--text-mute)",lineHeight:1.6}}>{msg}</p>
      </div>
      <div style={{display:"flex",gap:10}}>
        <BtnSec onClick={onClose} style={{flex:1,justifyContent:"center"}}>ยกเลิก</BtnSec>
        <button className="btn-pri" onClick={onOk} style={{flex:1,height:44,background:c,border:"none",borderRadius:11,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer"}}>{okLabel||"ยืนยัน"}</button>
      </div>
    </div>
  </div>;
}

/* ════════════════════════ LOGIN ════════════════════════ */
function LoginPage({db,onLogin,mode}){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [showPw,setShowPw]=useState(false); const [error,setError]=useState("");
  const [forgotMode,setForgotMode]=useState(false);
  const [empId,setEmpId]=useState(""); const [forgotEmail,setForgotEmail]=useState("");
  const [forgotMsg,setForgotMsg]=useState(null);

  const doLogin=()=>{ setError(""); const u=db.users.find(u=>u.email===email); if(!u){setError("ไม่พบอีเมลนี้ในระบบ");return;} if(u.status==="disabled"){setError("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");return;} if(u.password!==password){setError("รหัสผ่านไม่ถูกต้อง");return;} onLogin(u); };
  const doForgot=()=>{ setForgotMsg(null); const u=db.users.find(u=>u.empId===empId&&u.email===forgotEmail); if(!u){setForgotMsg({type:"error",text:"ไม่พบข้อมูลในระบบ — กรุณาตรวจสอบรหัสพนักงานและอีเมล"});return;} const nd=getDB(); nd.users=nd.users.map(x=>x.id===u.id?{...x,password:"12345",isFirstLogin:true}:x); saveDB(nd); setForgotMsg({type:"success",text:'รีเซ็ทสำเร็จ! รหัสผ่านใหม่คือ "12345" กรุณาเข้าสู่ระบบและตั้งรหัสใหม่'}); };

  const bg = mode==="dark"
    ? "linear-gradient(145deg,#1A2233 0%,#161D2B 55%,#1F1B2E 100%)"
    : "linear-gradient(145deg,var(--accent-soft2) 0%,#E8F5E9 55%,#FFF9E6 100%)";

  return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,transition:"background .3s"}}>
    <div className="fu" style={{width:420,background:"var(--surface)",borderRadius:24,padding:"44px 40px 36px",boxShadow:"0 12px 48px rgba(26,95,168,.13)"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:64,height:64,background:"linear-gradient(135deg,var(--accent),var(--accent-grad2))",borderRadius:18,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16,boxShadow:"0 6px 22px rgba(26,95,168,.32)"}}>
          <Icon n="calendar" s={{fontSize:32,color:"#fff"}}/>
        </div>
        <h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",marginBottom:4}}>BST e-Meeting</h1>
        <p style={{fontSize:14,color:"var(--text-faint)"}}>ระบบจัดการการประชุมภายในองค์กร</p>
      </div>

      {!forgotMode ? <>
        <FL label="อีเมล"><input style={IS} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/></FL>
        <FL label="รหัสผ่าน" right={
          <button type="button" tabIndex={-1} onClick={()=>setForgotMode(true)}
            style={{background:"none",border:"none",color:"var(--accent)",fontSize:12.5,fontWeight:600,cursor:"pointer",
              padding:0,display:"inline-flex",alignItems:"center",gap:4}}>
            <Icon n="lock" s={{fontSize:12,color:"var(--accent)"}}/>ลืมรหัสผ่าน?
          </button>
        }>
          <div style={{position:"relative"}}>
            <input style={{...IS,paddingRight:46}} type={showPw?"text":"password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            <Tooltip label={showPw?"ซ่อนรหัสผ่าน":"แสดงรหัสผ่าน"} dir="l">
              <button type="button" tabIndex={-1} onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-faint)",padding:2,display:"flex",alignItems:"center"}}>
                <Icon n={showPw?"eye-off":"eye"} s={{fontSize:19,color:"var(--text-faint)"}}/>
              </button>
            </Tooltip>
          </div>
        </FL>
        {error && <AlertBox type="error" msg={error} style={{marginBottom:14}}/>}
        <BtnPri onClick={doLogin} icon="login">เข้าสู่ระบบ</BtnPri>
        <div style={{marginTop:28,borderTop:"1px solid var(--border-soft)",paddingTop:20}}>
          <p style={{fontSize:12,color:"var(--text-ghost)",textAlign:"center",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Icon n="bolt" s={{fontSize:14,color:"#F59E0B"}}/> ทดสอบระบบด่วน
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {QUICK_LOGINS.map(q=>{ const rs=ROLE_STYLE[q.role]; return (
              <button key={q.label} className="btn-pri" onClick={()=>{ const u=db.users.find(x=>x.email===q.email); if(u) onLogin(u); }}
                style={{padding:"9px 4px",fontSize:13,background:rs.bg,border:`1.5px solid ${rs.color}33`,borderRadius:10,color:rs.color,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"}}>
                <Icon n={rs.icon} s={{fontSize:15,color:rs.color}}/>{q.label}
              </button>
            );})}
          </div>
        </div>
      </> : <>
        <AlertBox type="info" msg='กรอกรหัสพนักงานและอีเมลที่ลงทะเบียนไว้ — ระบบจะรีเซ็ทรหัสผ่านเป็น "12345"' style={{marginBottom:20}}/>
        <FL label="รหัสพนักงาน"><input style={IS} placeholder="เช่น 001" value={empId} onChange={e=>setEmpId(e.target.value)}/></FL>
        <FL label="อีเมล"><input style={IS} type="email" placeholder="your@email.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}/></FL>
        {forgotMsg && <AlertBox type={forgotMsg.type} msg={forgotMsg.text} style={{marginBottom:14}}/>}
        <BtnPri onClick={doForgot} icon="lock-open">รีเซ็ทรหัสผ่าน</BtnPri>
        <BtnSec onClick={()=>{setForgotMode(false);setForgotMsg(null);}} icon="arrow-left" style={{marginTop:10,width:"100%",justifyContent:"center"}}>กลับไปหน้าเข้าสู่ระบบ</BtnSec>
      </>}
    </div>
  </div>;
}

/* ════════════════════════ FORCE CHANGE ════════════════════════ */
function ForceChangePage({onSubmit,onDone,mode}){
  const [newPw,setNewPw]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState("");
  const [showNew,setShowNew]=useState(false); const [showConf,setShowConf]=useState(false);
  const [done,setDone]=useState(false);
  const doSubmit=()=>{
    if(newPw.length<6){setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");return;}
    if(newPw!==confirm){setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");return;}
    if(newPw==="12345"){setError("ไม่สามารถใช้รหัสผ่านเริ่มต้นได้");return;}
    onSubmit(newPw);
    setDone(true);
    setTimeout(()=>onDone(), 1800);
  };

  const bg = mode==="dark"
    ? "linear-gradient(145deg,#1F1B2E 0%,#161D2B 55%,#1A2233 100%)"
    : "linear-gradient(145deg,#FFF9E6 0%,#E8F5E9 55%,var(--accent-soft2) 100%)";

  if(done){
    return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,transition:"background .3s"}}>
      <div className="fu" style={{width:420,background:"var(--surface)",borderRadius:24,padding:"48px 40px",boxShadow:"0 12px 48px rgba(0,0,0,.10)",textAlign:"center"}}>
        <div style={{width:72,height:72,background:"linear-gradient(135deg,#34D399,#059669)",borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:20,boxShadow:"0 6px 22px rgba(5,150,105,.32)"}}>
          <Icon n="check" s={{fontSize:32,color:"#fff"}}/>
        </div>
        <h2 style={{fontSize:21,fontWeight:700,marginBottom:8,color:"var(--text)"}}>เปลี่ยนรหัสผ่านสำเร็จ!</h2>
        <p style={{fontSize:14,color:"var(--text-faint)",marginBottom:4}}>กำลังพาคุณกลับไปยังหน้าเข้าสู่ระบบ</p>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่</p>
      </div>
    </div>;
  }

  return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,transition:"background .3s"}}>
    <div className="fu" style={{width:420,background:"var(--surface)",borderRadius:24,padding:"44px 40px",boxShadow:"0 12px 48px rgba(0,0,0,.10)"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{width:62,height:62,background:"linear-gradient(135deg,#F59E0B,#EF6C00)",borderRadius:17,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 6px 22px rgba(245,158,11,.32)"}}>
          <Icon n="lock" s={{fontSize:28,color:"#fff"}}/>
        </div>
        <h2 style={{fontSize:21,fontWeight:700,marginBottom:6}}>ตั้งรหัสผ่านใหม่</h2>
        <p style={{fontSize:14,color:"var(--text-faint)"}}>กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งานระบบ</p>
      </div>
      <FL label="รหัสผ่านใหม่">
        <div style={{position:"relative"}}><input style={{...IS,paddingRight:46}} type={showNew?"text":"password"} placeholder="อย่างน้อย 6 ตัวอักษร" value={newPw} onChange={e=>setNewPw(e.target.value)}/>
          <Tooltip label={showNew?"ซ่อน":"แสดง"} dir="l"><button type="button" tabIndex={-1} onClick={()=>setShowNew(!showNew)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}><Icon n={showNew?"eye-off":"eye"} s={{fontSize:18,color:"var(--text-faint)"}}/></button></Tooltip></div>
      </FL>
      <FL label="ยืนยันรหัสผ่าน">
        <div style={{position:"relative"}}><input style={{...IS,paddingRight:46}} type={showConf?"text":"password"} placeholder="กรอกอีกครั้ง" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSubmit()}/>
          <Tooltip label={showConf?"ซ่อน":"แสดง"} dir="l"><button type="button" tabIndex={-1} onClick={()=>setShowConf(!showConf)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}><Icon n={showConf?"eye-off":"eye"} s={{fontSize:18,color:"var(--text-faint)"}}/></button></Tooltip></div>
      </FL>
      {error && <AlertBox type="error" msg={error} style={{marginBottom:14}}/>}
      <BtnPri onClick={doSubmit} icon="check">บันทึกรหัสผ่านใหม่</BtnPri>
    </div>
  </div>;
}

/* ════════════════════════ SIDEBAR ════════════════════════ */
function Sidebar({open,setOpen,activeMenu,setActiveMenu,meetingOpen,setMeetingOpen,settingOpen,setSettingOpen,currentUser,onLogout,userDrop,setUserDrop,mode,setMode}){
  const go=menu=>{setActiveMenu(menu);setUserDrop(false);};
  return <aside style={{width:open?250:70,height:"100vh",background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",transition:"width .25s cubic-bezier(.4,0,.2,1)",overflow:"hidden",flexShrink:0,position:"sticky",top:0,zIndex:10}}>
    {/* Header */}
    <div style={{padding:open?"18px 14px 14px":"14px 0",display:"flex",alignItems:"center",justifyContent:open?"space-between":"center",borderBottom:"1px solid var(--border-soft)",minHeight:66,flexShrink:0}}>
      {open && <div style={{display:"flex",alignItems:"center",gap:10,overflow:"hidden"}}>
        <div style={{width:38,height:38,background:"linear-gradient(135deg,var(--accent),var(--accent-grad2))",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 3px 10px rgba(26,95,168,.28)"}}>
          <Icon n="calendar" s={{fontSize:20,color:"#fff"}}/>
        </div>
        <div><p style={{fontSize:14,fontWeight:700,color:"var(--text)",whiteSpace:"nowrap"}}>BST e-Meeting</p><p style={{fontSize:11,color:"var(--text-faint)",whiteSpace:"nowrap"}}>ระบบจัดการประชุม</p></div>
      </div>}
      <Tooltip label={open?"ย่อเมนู":"ขยายเมนู"} dir="b">
          <button onClick={()=>setOpen(!open)} className="btn-sec" style={{background:"var(--bg)",border:"none",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-mute)",cursor:"pointer",flexShrink:0}}>
            <Icon n={open?"sidebar-collapse":"sidebar-expand"} s={{fontSize:18,color:"var(--text-mute)"}}/>
          </button>
        </Tooltip>
    </div>

    {/* Nav */}
    <nav style={{flex:1,padding:open?"12px 10px":"12px 8px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto",overflowX:"visible"}}>
      {open?<SecLabel>เมนูหลัก</SecLabel>:<SDiv/>}
      <SI icon="home" label="หน้าหลัก"      active={activeMenu==="dashboard"} open={open} onClick={()=>go("dashboard")}/>

      {open?<>
        <SI icon="meeting" label="การประชุม" open arrow expanded={meetingOpen} onClick={()=>setMeetingOpen(!meetingOpen)}/>
        {meetingOpen&&<div style={{marginLeft:10,paddingLeft:10,borderLeft:"2px solid var(--accent-soft)",marginBottom:2}}>
          <SI icon="clipboard"  label="บันทึกการประชุม" active={activeMenu==="agenda"} open sub onClick={()=>go("agenda")}/>
          <SI icon="file-text"  label="สรุปการประชุม"  active={activeMenu==="mom"}   open sub onClick={()=>go("mom")}/>
        </div>}
      </>:<>
        <SideTip label="บันทึกการประชุม"><SI icon="clipboard"  active={activeMenu==="agenda"} open={false} onClick={()=>go("agenda")}/></SideTip>
        <SideTip label="สรุปการประชุม"> <SI icon="file-text"  active={activeMenu==="mom"}   open={false} onClick={()=>go("mom")}/></SideTip>
      </>}

      <SI icon="bar-chart"    label="รายงาน"        active={activeMenu==="reports"} open={open} onClick={()=>go("reports")}/>
      <SI icon="calendar-plus" label="จองห้องประชุม" active={activeMenu==="booking"} open={open} onClick={()=>go("booking")}/>

      {currentUser?.role==="แอดมิน" && <>
        {open?<SecLabel style={{marginTop:8}}>ตั้งค่า</SecLabel>:<SDiv/>}
        {open?<>
          <SI icon="settings" label="ตั้งค่า" open arrow expanded={settingOpen} onClick={()=>setSettingOpen(!settingOpen)}/>
          {settingOpen&&<div style={{marginLeft:10,paddingLeft:10,borderLeft:"2px solid var(--accent-soft)",marginBottom:2}}>
            <SI icon="users" label="ผู้ใช้งานระบบ" active={activeMenu==="users"} open sub onClick={()=>go("users")}/>
            <SI icon="door"  label="ห้องประชุม"    active={activeMenu==="rooms"} open sub onClick={()=>go("rooms")}/>
          </div>}
        </>:<>
          <SideTip label="ผู้ใช้งานระบบ"><SI icon="users" active={activeMenu==="users"} open={false} onClick={()=>go("users")}/></SideTip>
          <SideTip label="ห้องประชุม">   <SI icon="door"  active={activeMenu==="rooms"} open={false} onClick={()=>go("rooms")}/></SideTip>
        </>}
      </>}
    </nav>

    {/* Footer */}
    <div style={{padding:open?"10px 10px 18px":"10px 8px 18px",borderTop:"1px solid var(--border-soft)",position:"relative",flexShrink:0}}>
      {open?<>
        <div onClick={()=>setUserDrop(!userDrop)} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"9px 10px",borderRadius:12,background:userDrop?"var(--bg)":"transparent",transition:"background .12s"}}>
          <Avatar user={currentUser} size={34}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser?.firstName} {currentUser?.lastName}</p>
            <p style={{fontSize:11,color:"var(--text-faint)"}}>{currentUser?.role}</p>
          </div>
          <Icon n={userDrop?"chevron-up":"chevron-down"} s={{fontSize:14,color:"var(--text-ghost)",flexShrink:0}}/>
        </div>
        {userDrop&&<div className="fu" style={{position:"absolute",bottom:82,left:10,right:10,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:13,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:200,overflow:"hidden"}}>
          <div style={{padding:"12px 14px 10px",borderBottom:"1px solid var(--bg)"}}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{currentUser?.prefix}{currentUser?.firstName} {currentUser?.lastName}</p>
            <p style={{fontSize:12,color:"var(--text-faint)"}}>{currentUser?.email}</p>
          </div>
          <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bg)"}}>
            <ModeSwitcher mode={mode} setMode={setMode}/>
          </div>
          <div style={{padding:"6px"}}>
            <button className="si" onClick={()=>{go("profile");setUserDrop(false);}} style={{width:"100%",padding:"10px 12px",background:"none",border:"none",textAlign:"left",fontSize:13,color:"var(--text-sub)",display:"flex",alignItems:"center",gap:9,borderRadius:9,cursor:"pointer"}}>
              <Icon n="user" s={{fontSize:16,color:"var(--accent)"}}/> ข้อมูลส่วนตัว
            </button>
            <button className="si" onClick={onLogout} style={{width:"100%",padding:"10px 12px",background:"none",border:"none",textAlign:"left",fontSize:13,color:"#B42318",display:"flex",alignItems:"center",gap:9,borderRadius:9,cursor:"pointer"}}>
              <Icon n="logout" s={{fontSize:16,color:"#B42318"}}/> ออกจากระบบ
            </button>
          </div>
        </div>}
      </>:<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,paddingBottom:4}}>
        {/* ปุ่ม action ขยายขึ้นด้านบน Avatar เมื่อเปิด */}
        {userDrop&&<>
          <div onClick={()=>setUserDrop(false)} style={{position:"fixed",inset:0,zIndex:10}}/>
          <div className="fu" style={{display:"flex",flexDirection:"column",gap:4,position:"relative",zIndex:20,width:"100%",alignItems:"center"}}>
            <Tooltip label={mode==="dark"?"สลับเป็นโหมดสว่าง":"สลับเป็นโหมดมืด"} dir="r">
              <button className="si" onClick={()=>setMode(mode==="dark"?"light":"dark")}
                style={{width:40,height:40,background:"var(--surface-2)",border:"1px solid var(--border)",
                  borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <Icon n={mode==="dark"?"moon":"sun"} s={{fontSize:18,color:"var(--text-mute)"}}/>
              </button>
            </Tooltip>
            <div style={{width:38,height:1,background:"var(--border)",margin:"2px 0"}}/>
            <Tooltip label="ข้อมูลส่วนตัว" dir="r">
              <button className="si" onClick={()=>{go("profile");setUserDrop(false);}}
                style={{width:40,height:40,background:"#F0F4FA",border:"none",
                  borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <Icon n="user" s={{fontSize:19,color:"var(--accent)"}}/>
              </button>
            </Tooltip>
            <Tooltip label="ออกจากระบบ" dir="r">
              <button className="si" onClick={()=>{onLogout();setUserDrop(false);}}
                style={{width:40,height:40,background:"#FEF2F2",border:"1px solid #FECACA",
                  borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <Icon n="logout" s={{fontSize:19,color:"#B42318"}}/>
              </button>
            </Tooltip>
          </div>
        </>}
        {/* Avatar อยู่ล่างสุดเสมอ */}
        <Tooltip label={userDrop?"":"เมนูผู้ใช้งาน"} dir="r">
          <button onClick={()=>setUserDrop(!userDrop)}
            style={{background:userDrop?"var(--accent-soft)":"none",border:"none",cursor:"pointer",
              padding:6,borderRadius:10,display:"flex",transition:"background .12s"}}>
            <Avatar user={currentUser} size={34}/>
          </button>
        </Tooltip>
      </div>}
    </div>
  </aside>;
}

/* ── Light/Dark mode switcher — ใช้ภายใน dropdown เมนูผู้ใช้งาน (expanded) เท่านั้น ── */
function ModeSwitcher({mode,setMode}){
  const isDark = mode==="dark";
  const toggle = () => setMode(isDark?"light":"dark");

  return (
    <button onClick={toggle}
      style={{width:"100%",height:36,borderRadius:9,cursor:"pointer",
        background:"var(--bg)",border:"1px solid var(--border)",
        display:"flex",alignItems:"center",padding:"0 4px",position:"relative",
        transition:"background .2s"}}>
      {/* sliding knob */}
      <div style={{position:"absolute",top:3,left:isDark?"calc(50% + 1px)":3,
        width:"calc(50% - 4px)",height:28,borderRadius:7,
        background:"var(--accent)",transition:"left .2s ease",zIndex:0}}/>
      <div style={{flex:1,zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
        <Icon n="sun" s={{fontSize:13,color:isDark?"var(--text-mute)":"var(--surface)"}}/>
        <span style={{fontSize:11.5,fontWeight:600,color:isDark?"var(--text-mute)":"var(--surface)"}}>สว่าง</span>
      </div>
      <div style={{flex:1,zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
        <Icon n="moon" s={{fontSize:13,color:isDark?"var(--surface)":"var(--text-mute)"}}/>
        <span style={{fontSize:11.5,fontWeight:600,color:isDark?"var(--surface)":"var(--text-mute)"}}>มืด</span>
      </div>
    </button>
  );
}

/* ── React-state Tooltip ── */
function Tooltip({label,dir="r",block=false,children}){
  const [pos,setPos]=useState(null);
  const ref=useRef();
  if(!label) return children;

  const show=e=>{
    const r=e.currentTarget.getBoundingClientRect();
    const GAP=10;
    let x,y;
    if(dir==="r"){x=r.right+GAP; y=r.top+r.height/2;}
    else if(dir==="l"){x=r.left-GAP; y=r.top+r.height/2;}
    else if(dir==="t"){x=r.left+r.width/2; y=r.top-GAP;}
    else{x=r.left+r.width/2; y=r.bottom+GAP;}
    setPos({x,y,dir});
  };
  const hide=()=>setPos(null);

  const tipStyle=()=>{
    if(!pos) return {};
    if(pos.dir==="r") return {left:pos.x,top:pos.y,transform:"translateY(-50%)"};
    if(pos.dir==="l") return {left:pos.x,top:pos.y,transform:"translate(-100%,-50%)"};
    if(pos.dir==="t") return {left:pos.x,top:pos.y,transform:"translate(-50%,-100%)"};
    return {left:pos.x,top:pos.y,transform:"translateX(-50%)"};
  };

  return(
    <>
      <div ref={ref} style={{display:block?"block":"inline-flex"}}
        onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </div>
      {pos&&<div style={{
        position:"fixed",...tipStyle(),
        background:"#1E293B",color:"#fff",
        padding:"5px 10px",borderRadius:7,
        fontSize:12,fontFamily:"'Sarabun','Segoe UI',sans-serif",
        whiteSpace:"nowrap",pointerEvents:"none",
        zIndex:99999,lineHeight:1.4,
        boxShadow:"0 2px 8px rgba(0,0,0,.25)",
      }}>{label}</div>}
    </>
  );
}

/* SideTip — block=true so full-width buttons get hover area */
function SideTip({label,children,off}){
  if(off) return children;
  return <Tooltip label={label} dir="r" block>{children}</Tooltip>;
}
function SecLabel({children,style={}}){ return <p style={{fontSize:10.5,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".08em",padding:"8px 10px 3px",textTransform:"uppercase",...style}}>{children}</p>; }
function SDiv(){ return <div style={{height:1,background:"var(--border-soft)",margin:"6px 8px"}}/>; }

function SI({icon,label,active,open,onClick,arrow,expanded,sub}){
  const btn=(
    <button onClick={onClick} className={`si${active?" si-active":""}`}
      style={{width:"100%",display:"flex",alignItems:"center",gap:10,
        padding:sub?"7px 10px":"10px 10px",borderRadius:10,border:"none",
        background:"transparent",
        color:active?"var(--accent)":sub?"var(--text-mute)":"var(--text-sub)",
        fontWeight:active?700:400,fontSize:sub?13:14,
        justifyContent:open?"flex-start":"center",textAlign:"left",cursor:"pointer"}}>
      <Icon n={icon} s={{fontSize:sub?15:19,color:active?"var(--accent)":sub?"var(--text-faint)":"var(--text-mute)"}}/>
      {open&&<span style={{flex:1,whiteSpace:"nowrap"}}>{label}</span>}
      {open&&arrow&&<Icon n={expanded?"chevron-up":"chevron-down"} s={{fontSize:14,color:"var(--text-ghost)"}}/>}
    </button>
  );
  if(!open&&label) return <Tooltip label={label} dir="r" block>{btn}</Tooltip>;
  return btn;
}

/* ════════════════════════ DASHBOARD ════════════════════════ */
function DashboardPage({db}){
  const stats=[
    {label:"ผู้ใช้งานทั้งหมด",value:db.users.length,icon:"users",accent:"var(--accent)",bg:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))"},
    {label:"ห้องประชุม",       value:db.rooms.length,icon:"building",accent:"#2E9E5B",bg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)"},
    {label:"แอดมิน",          value:db.users.filter(u=>u.role==="แอดมิน").length,icon:"shield",accent:"#7C3AED",bg:"linear-gradient(135deg,#EDE9FE,#DDD6FE)"},
    {label:"ระดับรายงาน",     value:db.users.filter(u=>u.role==="รายงาน").length,icon:"bar-chart",accent:"#0891B2",bg:"linear-gradient(135deg,#E0F7FA,#B2EBF2)"},
  ];
  return <div className="fu">
    <PageHeader title="หน้าหลัก" subtitle="ภาพรวมระบบ BST e-Meeting"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:16,marginBottom:28}}>
      {stats.map(s=><div key={s.label} style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"20px 20px 18px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
        <div style={{width:46,height:46,background:s.bg,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
          <Icon n={s.icon} s={{fontSize:23,color:s.accent}}/>
        </div>
        <p style={{fontSize:30,fontWeight:700,marginBottom:4,color:"var(--text)",lineHeight:1}}>{s.value}</p>
        <p style={{fontSize:13,color:"var(--text-mute)"}}>{s.label}</p>
      </div>)}
    </div>
    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 26px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{width:36,height:36,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="building" s={{fontSize:18,color:"var(--accent)"}}/>
        </div>
        <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>ห้องประชุมในระบบ</h3>
      </div>
      {db.rooms.map((r,i)=><div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:i<db.rooms.length-1?"1px solid var(--bg)":"none"}}>
        <div style={{width:42,height:42,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon n="door" s={{fontSize:20,color:"var(--accent)"}}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontWeight:600,fontSize:14,color:"var(--text)",marginBottom:3}}>{r.name}</p>
          <p style={{fontSize:12,color:"var(--text-faint)",display:"flex",alignItems:"center",gap:6}}>
            <Icon n="building" s={{fontSize:12,color:"var(--text-faint)"}}/>{r.place}
            <span style={{color:"#D1D5DB"}}>·</span>
            <Icon n="map-pin" s={{fontSize:12,color:"var(--text-faint)"}}/>ชั้น {r.floor}
          </p>
        </div>
        <RoomStatusBadge status={r.status}/>
      </div>)}
    </div>
  </div>;
}

/* ════════════════════════ USERS ════════════════════════ */
/* ── format ISO date → Thai locale short ── */
function fmtDate(iso){
  if(!iso) return null;
  const d=new Date(iso);
  if(isNaN(d)) return null;
  const dd=String(d.getDate()).padStart(2,"0");
  const mm=String(d.getMonth()+1).padStart(2,"0");
  const yy=d.getFullYear()+543;
  const hh=String(d.getHours()).padStart(2,"0");
  const min=String(d.getMinutes()).padStart(2,"0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

/* ── Pagination bar — ใช้ซ้ำได้ทั้งด้านบนและด้านล่างของตาราง ── */
function UserPagination({total,pageSize,setPageSize,safePage,setPage,totalPages,compact=false}){
  return <div style={{padding: compact?"10px 20px":"12px 20px", borderTop: compact?"none":"1px solid var(--bg)",
    borderBottom: compact?"1px solid var(--bg)":"none", background:"var(--surface-2)",
    display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>

    {/* Left: count + page size selector */}
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <Icon n="users" s={{fontSize:14,color:"var(--text-faint)"}}/>
      <span style={{fontSize:12,color:"var(--text-faint)"}}>ทั้งหมด {total} รายการ</span>
      <span style={{color:"var(--border-2)",fontSize:12}}>|</span>
      <span style={{fontSize:12,color:"var(--text-mute)"}}>แสดง</span>
      <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}
        style={{height:30,padding:"0 8px",border:"1.5px solid var(--border-2)",borderRadius:8,
          fontSize:12,color:"var(--text-sub)",background:"var(--surface)",cursor:"pointer",outline:"none"}}>
        {[5,10,20,50].map(n=><option key={n} value={n}>{n} รายการ</option>)}
      </select>
    </div>

    {/* Right: page navigation */}
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      {/* Prev */}
      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1}
        style={{width:30,height:30,border:"1.5px solid var(--border-2)",borderRadius:8,
          background:safePage===1?"var(--surface-3)":"var(--surface)",cursor:safePage===1?"not-allowed":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",color:safePage===1?"#D1D5DB":"var(--text-sub)"}}>
        <Icon n="arrow-left" s={{fontSize:14,color:safePage===1?"#D1D5DB":"var(--text-sub)"}}/>
      </button>

      {/* Page numbers */}
      {Array.from({length:totalPages},(_, i)=>i+1)
        .filter(p=> p===1||p===totalPages||Math.abs(p-safePage)<=1)
        .reduce((acc,p,i,arr)=>{
          if(i>0&&p-arr[i-1]>1) acc.push("…");
          acc.push(p); return acc;
        },[])
        .map((p,i)=> p==="…"
          ? <span key={"e"+i} style={{width:30,textAlign:"center",fontSize:12,color:"var(--text-faint)"}}>…</span>
          : <button key={p} onClick={()=>setPage(p)}
              style={{width:30,height:30,border:`1.5px solid ${safePage===p?"var(--accent)":"var(--border-2)"}`,
                borderRadius:8,background:safePage===p?"var(--accent)":"var(--surface)",
                color:safePage===p?"var(--surface)":"var(--text-sub)",fontSize:12,fontWeight:safePage===p?700:400,
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {p}
            </button>
        )
      }

      {/* Next */}
      <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}
        style={{width:30,height:30,border:"1.5px solid var(--border-2)",borderRadius:8,
          background:safePage===totalPages?"var(--surface-3)":"var(--surface)",
          cursor:safePage===totalPages?"not-allowed":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon n="chevron-right" s={{fontSize:14,color:safePage===totalPages?"#D1D5DB":"var(--text-sub)"}}/>
      </button>
    </div>
  </div>;
}

function UsersPage({db,updateDB,showToast,askConfirm,closeConfirm,currentUser}){
  const [search,    setSearch]   = useState("");
  const [showAdd,   setShowAdd]  = useState(false);
  const [editUser,  setEditUser] = useState(null);
  const [pageSize,  setPageSize] = useState(10);
  const [page,      setPage]     = useState(1);

  const filtered = db.users.filter(u=>
    u.firstName.includes(search)||u.lastName.includes(search)||
    u.email.includes(search)||u.empId.includes(search)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage-1)*pageSize, safePage*pageSize);

  const confirmReset = user => askConfirm({
    title:"รีเซ็ทรหัสผ่าน",
    msg:`รหัสผ่านของ ${user.firstName} ${user.lastName} จะถูกเปลี่ยนเป็น "12345" และต้องตั้งรหัสใหม่เมื่อเข้าสู่ระบบ`,
    icon:"key", color:"#C2410C", okLabel:"ยืนยัน รีเซ็ท",
    onOk:()=>{
      const now = new Date().toISOString();
      const nd  = {...db, users:db.users.map(u=>u.id===user.id
        ?{...u, password:"12345", isFirstLogin:true, lastPasswordChange:now} : u)};
      updateDB(nd); showToast(`รีเซ็ทรหัสผ่านของ ${user.firstName} สำเร็จ`); closeConfirm();
    }
  });

  const confirmToggleStatus = user => {
    const willDisable = user.status!=="disabled";
    askConfirm({
      title: willDisable ? "ปิดใช้งานบัญชี" : "เปิดใช้งานบัญชี",
      msg: willDisable
        ? `บัญชีของ ${user.prefix}${user.firstName} ${user.lastName} จะถูกปิดใช้งาน ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้ (ใช้สำหรับพนักงานที่ลาออก)`
        : `เปิดใช้งานบัญชีของ ${user.prefix}${user.firstName} ${user.lastName} อีกครั้ง ผู้ใช้จะสามารถเข้าสู่ระบบได้ตามปกติ`,
      icon: willDisable ? "ban" : "user-check", color: willDisable ? "#B42318" : "#1A7F37",
      okLabel: willDisable ? "ยืนยัน ปิดใช้งาน" : "ยืนยัน เปิดใช้งาน",
      onOk:()=>{
        const nd = {...db, users:db.users.map(u=>u.id===user.id?{...u,status:willDisable?"disabled":"active"}:u)};
        updateDB(nd); showToast(willDisable?`ปิดใช้งานบัญชีของ ${user.firstName} แล้ว`:`เปิดใช้งานบัญชีของ ${user.firstName} แล้ว`, willDisable?"info":"success"); closeConfirm();
      }
    });
  };

  const doAdd  = data => {
    const now = new Date().toISOString();
    updateDB({...db, users:[...db.users,{...data,id:Date.now(),isFirstLogin:true,password:"12345",lastPasswordChange:now,status:"active"}]});
    showToast("เพิ่มผู้ใช้งานสำเร็จ"); setShowAdd(false);
  };

  const doEdit = data => {
    const nd = {...db, users:db.users.map(u=>u.id===editUser.id?{...u,...data}:u)};
    updateDB(nd); showToast("แก้ไขข้อมูลผู้ใช้งานสำเร็จ"); setEditUser(null);
  };

  const COLS = ["#","รหัสพนักงาน","ชื่อ-นามสกุล","อีเมล","เบอร์โทร","แผนก","บทบาท","สิทธิ์การเข้าใช้","จัดการ"];

  return <div className="fu">
    <PageHeader title="ผู้ใช้งานระบบ" subtitle="จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ"/>
    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>

      {/* Toolbar */}
      <div style={{padding:"16px 20px",display:"flex",gap:12,alignItems:"center",borderBottom:"1px solid var(--bg)",background:"var(--surface-2)"}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",display:"flex",alignItems:"center"}}>
            <Icon n="search" s={{fontSize:17,color:"var(--text-ghost)"}}/>
          </span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            placeholder="ค้นหาชื่อ อีเมล หรือรหัสพนักงาน…" style={{...IS,paddingLeft:42}}/>
        </div>
        <BtnPri onClick={()=>setShowAdd(true)} icon="user-plus"
          style={{width:"auto",padding:"0 20px",height:42,whiteSpace:"nowrap"}}>
          เพิ่มผู้ใช้งาน
        </BtnPri>
      </div>

      {/* Pagination header */}
      <UserPagination total={filtered.length} pageSize={pageSize} setPageSize={setPageSize}
        safePage={safePage} setPage={setPage} totalPages={totalPages} compact/>

      {/* Table */}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5}}>
          <thead><tr style={{background:"var(--surface-3)"}}>
            {COLS.map(h=>(
              <th key={h} style={{padding:"11px 16px",textAlign:"left",color:"var(--text-mute)",
                fontWeight:600,fontSize:12,borderBottom:"1px solid var(--border-soft)",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((u,i)=>{
              const rs   = ROLE_STYLE[u.role];
              const as   = getAccessStatus(u);
              const isDisabled = u.status==="disabled";
              const lastLoginDate    = fmtDate(u.lastLogin);
              const lastPwChangeDate = fmtDate(u.lastPasswordChange);
              return (
                <tr key={u.id} className="row-hover" style={{borderBottom:"1px solid var(--bg)",opacity:isDisabled?.55:1}}>
                  {/* # */}
                  <td style={TD}><span style={{color:"var(--text-ghost)",fontSize:12,fontWeight:500}}>{(safePage-1)*pageSize+i+1}</span></td>
                  {/* รหัสพนักงาน */}
                  <td style={TD}>
                    <span style={{fontFamily:"monospace",background:"var(--bg)",padding:"3px 10px",
                      borderRadius:6,fontSize:12,color:"var(--text-sub)",fontWeight:600}}>{u.empId}</span>
                  </td>
                  {/* ชื่อ-นามสกุล */}
                  <td style={TD}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar user={u} size={32}/>
                      <span style={{fontWeight:600,color:"var(--text)",fontSize:13}}>
                        {u.prefix}{u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  {/* อีเมล */}
                  <td style={{...TD,color:"#4B5563",fontSize:13}}>{u.email}</td>
                  {/* เบอร์โทร */}
                  <td style={{...TD,color:"#4B5563",fontSize:13}}>{u.phone||"—"}</td>
                  {/* แผนก */}
                  <td style={{...TD,color:"var(--text-mute)",fontSize:12}}>{u.department}</td>
                  {/* บทบาท */}
                  <td style={TD}>
                    <span style={{fontSize:12,background:rs.bg,color:rs.color,padding:"4px 11px",
                      borderRadius:20,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}>
                      <Icon n={rs.icon} s={{fontSize:12,color:rs.color}}/>{u.role}
                    </span>
                  </td>
                  {/* สิทธิ์การเข้าใช้ */}
                  <td style={TD}>
                    <span style={{fontSize:12,background:as.bg,color:as.color,padding:"4px 11px",
                      borderRadius:20,fontWeight:600,whiteSpace:"nowrap",display:"inline-block"}}>
                      {as.label}
                    </span>
                    {!u.isFirstLogin && u.status!=="disabled" && (lastLoginDate || lastPwChangeDate) &&
                      <div style={{marginTop:4,display:"flex",flexDirection:"column",gap:2}}>
                        {lastLoginDate    && <Tooltip label="เข้าใช้งานล่าสุด" dir="t">
                          <p style={{fontSize:10.5,color:"var(--text-faint)",display:"flex",alignItems:"center",gap:4,cursor:"default"}}>
                            <Icon n="clock" s={{fontSize:11,color:"var(--text-ghost)"}}/>{lastLoginDate}
                          </p>
                        </Tooltip>}
                        {lastPwChangeDate && <Tooltip label="เปลี่ยนรหัสผ่านล่าสุด" dir="t">
                          <p style={{fontSize:10.5,color:"var(--text-faint)",display:"flex",alignItems:"center",gap:4,cursor:"default"}}>
                            <Icon n="key" s={{fontSize:11,color:"var(--text-ghost)"}}/>{lastPwChangeDate}
                          </p>
                        </Tooltip>}
                      </div>}
                  </td>
                  {/* จัดการ */}
                  <td style={TD}>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <Tooltip label="รีเซ็ทรหัสผ่าน" dir="t">
                        <button onClick={()=>confirmReset(u)}
                          style={{width:32,height:32,background:"#FFF7ED",border:"1.5px solid #FED7AA",
                            borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <Icon n="key" s={{fontSize:15,color:"#C2410C"}}/>
                        </button>
                      </Tooltip>
                      <Tooltip label="แก้ไขข้อมูล" dir="t">
                        <button onClick={()=>setEditUser(u)}
                          style={{width:32,height:32,background:"var(--accent-soft)",border:"1.5px solid #BFDBFE",
                            borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <Icon n="user-cog" s={{fontSize:15,color:"var(--accent)"}}/>
                        </button>
                      </Tooltip>
                      <Tooltip label={isDisabled?"เปิดใช้งานบัญชี":"ปิดใช้งานบัญชี (พนักงานลาออก)"} dir="t">
                        <button onClick={()=>confirmToggleStatus(u)}
                          style={{width:32,height:32,background:isDisabled?"#E7F6EC":"#FEF2F2",border:`1.5px solid ${isDisabled?"#A6E3B8":"#FECACA"}`,
                            borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <Icon n={isDisabled?"user-check":"ban"} s={{fontSize:15,color:isDisabled?"#1A7F37":"#B42318"}}/>
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length===0&&(
              <tr><td colSpan={9} style={{padding:"48px",textAlign:"center",color:"var(--text-ghost)"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                  <Icon n="search-off" s={{fontSize:36,color:"var(--text-ghost)"}}/> ไม่พบผู้ใช้งาน
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <UserPagination total={filtered.length} pageSize={pageSize} setPageSize={setPageSize}
        safePage={safePage} setPage={setPage} totalPages={totalPages}/>
    </div>

    {showAdd   && <AddUserModal db={db} onAdd={doAdd}  onClose={()=>setShowAdd(false)}/>}
    {editUser  && <EditUserModal db={db} user={editUser} onEdit={doEdit} onClose={()=>setEditUser(null)}/>}
  </div>;
}

/* ── EditUserModal: Admin แก้ไขข้อมูลผู้ใช้งาน ── */
function EditUserModal({db,user,onEdit,onClose}){
  const [form,setForm]=useState({
    empId:    user.empId,
    prefix:   ["นาย","นาง","นางสาว"].includes(user.prefix)?user.prefix:"อื่นๆ",
    prefixCustom: ["นาย","นาง","นางสาว"].includes(user.prefix)?"":user.prefix,
    firstName: user.firstName,
    lastName:  user.lastName,
    email:     user.email,
    phone:     user.phone||"",
    department:user.department,
    role:      user.role,
    photo:     user.photo||"",
  });
  const [errors,setErrors]=useState({});
  const thaiRx=/^[฀-๿\s]+$/;
  const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate=()=>{
    const e={};
    if(!form.firstName||!thaiRx.test(form.firstName)) e.firstName="กรอกภาษาไทยเท่านั้น";
    if(!form.lastName||!thaiRx.test(form.lastName))   e.lastName="กรอกภาษาไทยเท่านั้น";
    if(!form.email||!emailRx.test(form.email))        e.email="รูปแบบอีเมลไม่ถูกต้อง";
    else if(db.users.find(u=>u.email===form.email&&u.id!==user.id)) e.email="อีเมลนี้มีในระบบแล้ว";
    if(form.phone&&(!/^\d+$/.test(form.phone)||form.phone.length>10)) e.phone="ตัวเลขไม่เกิน 10 หลัก";
    if(form.prefix==="อื่นๆ"&&!form.prefixCustom) e.prefixCustom="กรุณาระบุคำนำหน้า";
    if(!form.department) e.department="กรุณาเลือกแผนก";
    setErrors(e); return Object.keys(e).length===0;
  };

  const doSubmit=()=>{
    if(!validate()) return;
    const prefix=form.prefix==="อื่นๆ"?form.prefixCustom:form.prefix;
    onEdit({prefix,firstName:form.firstName,lastName:form.lastName,
      email:form.email,phone:form.phone,department:form.department,
      role:form.role,photo:form.photo});
  };

  const onPhotoUpload = photo => setForm(f=>({...f,photo}));

  return <Modal onClose={onClose} wide>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,
      paddingBottom:18,borderBottom:"1px solid var(--border-soft)"}}>
      <div style={{width:48,height:48,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",
        borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon n="user-cog" s={{fontSize:24,color:"var(--accent)"}}/>
      </div>
      <div>
        <h3 style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:2}}>แก้ไขข้อมูลผู้ใช้งาน</h3>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>{user.prefix}{user.firstName} {user.lastName}</p>
      </div>
    </div>

    {/* Photo */}
    <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
      <AvatarUpload user={{photo:form.photo,firstName:form.firstName,lastName:form.lastName}}
        size={72} onUpload={onPhotoUpload}/>
    </div>

    {/* รหัสพนักงาน — readonly */}
    <FieldRow label="รหัสพนักงาน">
      <div style={{position:"relative"}}>
        <input style={READONLY_IS} value={form.empId} readOnly/>
        <span style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",display:"flex",alignItems:"center"}}>
          <Icon n="lock" s={{fontSize:14,color:"var(--text-ghost)"}}/>
        </span>
      </div>
    </FieldRow>

    {/* คำนำหน้า */}
    <div style={{display:"grid",gridTemplateColumns:form.prefix==="อื่นๆ"?"1fr 1fr":"1fr",gap:"0 16px"}}>
      <FieldRow label="คำนำหน้า *">
        <select style={IS} value={form.prefix} onChange={e=>setForm(f=>({...f,prefix:e.target.value}))}>
          {PREFIXES.map(p=><option key={p}>{p}</option>)}
        </select>
      </FieldRow>
      {form.prefix==="อื่นๆ" && (
        <FieldRow label="ระบุคำนำหน้า *" error={errors.prefixCustom}>
          <input style={IS} placeholder="เช่น ดร." value={form.prefixCustom}
            onChange={e=>setForm(f=>({...f,prefixCustom:e.target.value}))}/>
        </FieldRow>
      )}
    </div>

    {/* ชื่อ + นามสกุล */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <FieldRow label="ชื่อจริง * (ภาษาไทย)" error={errors.firstName}>
        <input style={IS} value={form.firstName}
          onChange={e=>setForm(f=>({...f,firstName:e.target.value.replace(/[^฀-๿\s]/g,"")}))}/>
      </FieldRow>
      <FieldRow label="นามสกุล * (ภาษาไทย)" error={errors.lastName}>
        <input style={IS} value={form.lastName}
          onChange={e=>setForm(f=>({...f,lastName:e.target.value.replace(/[^฀-๿\s]/g,"")}))}/>
      </FieldRow>
    </div>

    {/* อีเมล + เบอร์ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <FieldRow label="อีเมล *" error={errors.email}>
        <input style={IS} value={form.email}
          onChange={e=>setForm(f=>({...f,email:e.target.value.replace(/[^ -]/g,"")}))}/>
      </FieldRow>
      <FieldRow label="เบอร์โทรศัพท์" error={errors.phone}>
        <input style={IS} placeholder="0812345678" maxLength={10} value={form.phone}
          onChange={e=>setForm(f=>({...f,phone:e.target.value.replace(/\D/g,"")}))}/>
      </FieldRow>
    </div>

    {/* แผนก + บทบาท */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <FieldRow label="แผนก *" error={errors.department}>
        <select style={IS} value={form.department}
          onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
          {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="บทบาท *">
        <select style={IS} value={form.role}
          onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
          {ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
      </FieldRow>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
      <BtnSec onClick={onClose} icon="x" style={{justifyContent:"center"}}>ยกเลิก</BtnSec>
      <BtnPri onClick={doSubmit} icon="save">บันทึกการแก้ไข</BtnPri>
    </div>
  </Modal>;
}

/* ── Shared field wrapper (defined OUTSIDE components to prevent remount) ── */
function FieldRow({label,error,children}){
  return(
    <div style={{marginBottom:16}}>
      <label style={LS}>{label}</label>
      {children}
      {error&&<ErrMsg>{error}</ErrMsg>}
    </div>
  );
}

function AddUserModal({db,onAdd,onClose}){
  const [form,setForm]=useState({
    empId:"",prefix:"นาย",prefixCustom:"",
    firstName:"",lastName:"",email:"",
    phone:"",department:"",role:"ผู้ใช้งาน",photo:"",
  });
  const [errors,setErrors]=useState({});

  /* regex patterns */
  const thaiRx  = /^[ก-๙\s]+$/;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const engRx   = /^[a-zA-Z0-9@._\-+]+$/;

  /* input handlers with realtime filter */
  const onThaiInput  = field => e => {
    const v = e.target.value.replace(/[^฀-๿\s]/g,""); // strip non-Thai
    setForm(f=>({...f,[field]:v}));
  };
  const onEmailInput = e => {
    const v = e.target.value.replace(/[^ -]/g,""); // strip non-ASCII
    setForm(f=>({...f,email:v}));
  };
  const onPhotoUpload = photo => setForm(f=>({...f,photo}));

  const validate=()=>{
    const e={};
    if(!form.empId)                                  e.empId="กรุณากรอกรหัสพนักงาน";
    else if(!/^\d+$/.test(form.empId))              e.empId="กรอกได้เฉพาะตัวเลข";
    else if(form.empId.length>3)                     e.empId="ไม่เกิน 3 หลัก";
    else if(db.users.find(u=>u.empId===form.empId))  e.empId="รหัสพนักงานนี้มีในระบบแล้ว";
    if(form.prefix==="อื่นๆ"&&!form.prefixCustom)   e.prefixCustom="กรุณาระบุคำนำหน้า";
    if(!form.firstName)                              e.firstName="กรุณากรอกชื่อจริง";
    else if(!thaiRx.test(form.firstName))            e.firstName="กรอกภาษาไทยเท่านั้น";
    if(!form.lastName)                               e.lastName="กรุณากรอกนามสกุล";
    else if(!thaiRx.test(form.lastName))             e.lastName="กรอกภาษาไทยเท่านั้น";
    if(!form.email)                                  e.email="กรุณากรอกอีเมล";
    else if(!emailRx.test(form.email))               e.email="รูปแบบอีเมลไม่ถูกต้อง";
    else if(db.users.find(u=>u.email===form.email))  e.email="อีเมลนี้มีในระบบแล้ว";
    if(form.phone&&(!/^\d+$/.test(form.phone)||form.phone.length>10)) e.phone="ตัวเลขไม่เกิน 10 หลัก";
    if(!form.department) e.department="กรุณาเลือกแผนก";
    setErrors(e); return Object.keys(e).length===0;
  };

  const doSubmit=()=>{
    if(!validate()) return;
    const prefix=form.prefix==="อื่นๆ"?form.prefixCustom:form.prefix;
    onAdd({empId:form.empId,prefix,firstName:form.firstName,lastName:form.lastName,
      email:form.email,phone:form.phone,department:form.department,
      role:form.role,photo:form.photo});
  };

  /* preview avatar uses stable object reference via useMemo-equivalent: pass props directly */
  const avatarUser = {photo:form.photo, firstName:form.firstName, lastName:form.lastName};

  return <Modal onClose={onClose} wide>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,
      paddingBottom:18,borderBottom:"1px solid var(--border-soft)"}}>
      <div style={{width:48,height:48,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",
        borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon n="user-plus" s={{fontSize:24,color:"var(--accent)"}}/>
      </div>
      <div>
        <h3 style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:2}}>เพิ่มผู้ใช้งานระบบ</h3>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>กรอกข้อมูลผู้ใช้งานใหม่ทุกช่องที่มีเครื่องหมาย *</p>
      </div>
    </div>

    {/* Photo upload — stable: onPhotoUpload defined outside JSX tree */}
    <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
      <AvatarUpload user={avatarUser} size={72} onUpload={onPhotoUpload}/>
    </div>

    {/* Section: ข้อมูลบัญชี */}
    <p style={{fontSize:11,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".08em",
      textTransform:"uppercase",marginBottom:12}}>ข้อมูลบัญชี</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
      <FieldRow label="รหัสพนักงาน *" error={errors.empId}>
        <input style={IS} placeholder="001" maxLength={3} value={form.empId}
          onChange={e=>setForm(f=>({...f,empId:e.target.value.replace(/\D/g,"")}))}/>
      </FieldRow>
      <FieldRow label="บทบาท *">
        <select style={IS} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
          {ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
      </FieldRow>
    </div>

    {/* Section: ข้อมูลส่วนตัว */}
    <p style={{fontSize:11,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".08em",
      textTransform:"uppercase",marginBottom:12,marginTop:4}}>ข้อมูลส่วนตัว</p>

    {/* คำนำหน้า */}
    <div style={{display:"grid",gridTemplateColumns:form.prefix==="อื่นๆ"?"1fr 1fr":"1fr",gap:"0 20px"}}>
      <FieldRow label="คำนำหน้า *">
        <select style={IS} value={form.prefix} onChange={e=>setForm(f=>({...f,prefix:e.target.value}))}>
          {PREFIXES.map(p=><option key={p}>{p}</option>)}
        </select>
      </FieldRow>
      {form.prefix==="อื่นๆ" &&
        <FieldRow label="ระบุคำนำหน้า *" error={errors.prefixCustom}>
          <input style={IS} placeholder="เช่น ดร., พ.ต.ท." value={form.prefixCustom}
            onChange={e=>setForm(f=>({...f,prefixCustom:e.target.value}))}/>
        </FieldRow>
      }
    </div>

    {/* ชื่อ + นามสกุล — Thai only, filter on input */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
      <FieldRow label="ชื่อจริง * (ภาษาไทย)" error={errors.firstName}>
        <input style={IS} placeholder="ภาษาไทยเท่านั้น" value={form.firstName}
          onChange={onThaiInput("firstName")}
          onKeyDown={e=>{ if(e.key.length===1&&!/[฀-๿\s]/.test(e.key)) e.preventDefault(); }}/>
      </FieldRow>
      <FieldRow label="นามสกุล * (ภาษาไทย)" error={errors.lastName}>
        <input style={IS} placeholder="ภาษาไทยเท่านั้น" value={form.lastName}
          onChange={onThaiInput("lastName")}
          onKeyDown={e=>{ if(e.key.length===1&&!/[฀-๿\s]/.test(e.key)) e.preventDefault(); }}/>
      </FieldRow>
    </div>

    {/* อีเมล + เบอร์ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
      <FieldRow label="อีเมล * (ภาษาอังกฤษ)" error={errors.email}>
        <input style={IS} placeholder="email@company.com" value={form.email}
          onChange={onEmailInput}
          onKeyDown={e=>{ if(e.key.length===1&&e.key.charCodeAt(0)>127) e.preventDefault(); }}/>
      </FieldRow>
      <FieldRow label="เบอร์โทรศัพท์" error={errors.phone}>
        <input style={IS} placeholder="0812345678" maxLength={10} value={form.phone}
          onChange={e=>setForm(f=>({...f,phone:e.target.value.replace(/\D/g,"")}))}/>
      </FieldRow>
    </div>

    {/* แผนก — full width */}
    <FieldRow label="แผนก *" error={errors.department}>
      <select style={IS} value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
        <option value="">— เลือกแผนก —</option>
        {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
      </select>
    </FieldRow>

    {/* Info + Buttons */}
    <AlertBox type="info" msg='รหัสผ่านเริ่มต้นจะเป็น "12345" ผู้ใช้งานจะถูกบังคับให้ตั้งรหัสใหม่เมื่อเข้าสู่ระบบครั้งแรก' style={{margin:"4px 0 20px"}}/>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
      <BtnSec onClick={onClose} icon="x">ยกเลิก</BtnSec>
      <BtnPri onClick={doSubmit} icon="user-plus" style={{width:"auto",padding:"0 28px"}}>เพิ่มผู้ใช้งาน</BtnPri>
    </div>
  </Modal>;
}

/* ════════════════════════ BOOKING — date utils ════════════════════════ */
const DOW_TH   = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const DOW_TH_S = ["อา","จ","อ","พ","พฤ","ศ","ส"];
const MONTH_TH = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const HOURS = Array.from({length:24},(_,i)=>i); // 00:00 - 24:00 (full day, scrollable — default view scrolls to 06:00)

const pad2 = n => String(n).padStart(2,"0");
const ymd  = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const addDays   = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const addMonths = (d,n) => { const x=new Date(d); x.setMonth(x.getMonth()+n); return x; };
const startOfWeek  = d => addDays(d, -d.getDay()); // Sunday
const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
const isSameDay = (a,b) => ymd(a)===ymd(b);
const toMin = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
const beThaiYear = d => d.getFullYear()+543;

function timeRangesOverlap(aStart,aEnd,bStart,bEnd){
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
}
/* find a booking that conflicts with the given room/date/time range, excluding a given booking id (for edit) */
function findConflict(bookings, {roomId,date,start,end}, excludeId){
  return bookings.find(b =>
    b.id!==excludeId && b.roomId===roomId && b.date===date &&
    timeRangesOverlap(b.start,b.end,start,end)
  );
}

/* Lay out a same-day list of bookings (possibly across different rooms) so that
   bookings whose time ranges overlap are placed side-by-side instead of stacked
   on top of each other. Returns each booking annotated with _col (0-based column
   index) and _totalCols (number of columns in its overlap cluster). */
function layoutOverlaps(dayBookings){
  const items = [...dayBookings]
    .map(b => ({ b, s:toMin(b.start), e:toMin(b.end) }))
    .sort((x,y) => x.s-y.s || x.e-y.e);

  // group into clusters of transitively-overlapping bookings (sweep by start time)
  const clusters = [];
  let cluster = [], clusterEnd = -Infinity;
  items.forEach(it => {
    if (cluster.length && it.s >= clusterEnd) { clusters.push(cluster); cluster = []; clusterEnd = -Infinity; }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.e);
  });
  if (cluster.length) clusters.push(cluster);

  // within each cluster, greedily assign each booking to the first free column
  const out = [];
  clusters.forEach(cl => {
    const colEnd = []; // end time currently occupied by each column
    cl.forEach(it => {
      let col = colEnd.findIndex(end => it.s >= end);
      if (col === -1) { col = colEnd.length; colEnd.push(it.e); }
      else colEnd[col] = it.e;
      it.col = col;
    });
    const totalCols = colEnd.length;
    cl.forEach(it => out.push({ ...it.b, _col: it.col, _totalCols: totalCols }));
  });
  return out;
}

/* ════════════════════════ BOOKING — main page ════════════════════════ */
function BookingPage({db,updateDB,currentUser,showToast,askConfirm,closeConfirm}){
  const [view,setView]     = useState("week");         // "week" | "month"
  const [cursor,setCursor] = useState(()=>new Date());  // any date within the visible period
  const [roomFilter,setRoomFilter] = useState([]);       // empty = all rooms
  const [search,setSearch] = useState("");
  const [showModal,setShowModal] = useState(false);
  const [editBooking,setEditBooking] = useState(null);
  const [detailBooking,setDetailBooking] = useState(null);

  const today = new Date();
  const activeRooms = db.rooms.filter(r=>r.status==="active");
  const roomColor = id => ROOM_ACCENT[db.rooms.findIndex(r=>r.id===id)%ROOM_ACCENT.length] || ROOM_ACCENT[0];

  const visibleBookings = useMemo(()=>{
    return db.bookings.filter(b=>{
      if(roomFilter.length>0 && !roomFilter.includes(b.roomId)) return false;
      if(search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  },[db.bookings,roomFilter,search]);

  const goPrev  = ()=> setCursor(c => view==="week" ? addDays(c,-7) : addMonths(c,-1));
  const goNext  = ()=> setCursor(c => view==="week" ? addDays(c, 7) : addMonths(c, 1));
  const goToday = ()=> setCursor(new Date());

  const openNew = (presetDate, presetRoomId) => {
    setEditBooking(presetDate||presetRoomId ? {presetDate,presetRoomId} : null);
    setShowModal(true);
  };

  const doSave = (data, originalId) => {
    if(originalId){
      const nd = {...db, bookings: db.bookings.map(b=>b.id===originalId?{...b,...data}:b)};
      updateDB(nd); showToast("แก้ไขการจองสำเร็จ");
    } else {
      const id = db.nextBookingId || (db.bookings.length+1);
      const nd = {...db, bookings:[...db.bookings,{...data,id}], nextBookingId:id+1};
      updateDB(nd); showToast("จองห้องประชุมสำเร็จ");
    }
    setShowModal(false); setEditBooking(null); setDetailBooking(null);
  };

  const doDelete = (booking) => askConfirm({
    title:"ยกเลิกการจอง", msg:`ยืนยันยกเลิกการประชุม "${booking.title}"?`,
    icon:"x", color:"#B42318", okLabel:"ยกเลิกการจอง",
    onOk:()=>{
      updateDB({...db, bookings:db.bookings.filter(b=>b.id!==booking.id)});
      showToast("ยกเลิกการจองสำเร็จ","info"); closeConfirm(); setDetailBooking(null);
    }
  });

  const periodLabel = view==="week"
    ? (()=>{ const s=startOfWeek(cursor);
        const wk = Math.ceil((((s - startOfMonth(s))/86400000)+startOfMonth(s).getDay()+1)/7);
        return `${MONTH_TH[s.getMonth()]} ${beThaiYear(s)} (สัปดาห์ที่ ${wk})`; })()
    : `${MONTH_TH[cursor.getMonth()]} ${beThaiYear(cursor)}`;

  return <div className="fu">
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:700,color:"var(--text)",marginBottom:5,display:"flex",alignItems:"center",gap:10}}>
          <Icon n="calendar-plus" s={{fontSize:24,color:"var(--accent)"}}/> จองห้องประชุมแบบปฏิทิน
        </h1>
        <p style={{color:"var(--text-faint)",fontSize:14}}>เลือกผู้เข้าร่วมการประชุม จัดตามแผนก เฝ้าระวังเวลาซ้อนแบบอัตโนมัติ</p>
      </div>
      <BtnPri onClick={()=>openNew()} icon="calendar-plus" style={{width:"auto",padding:"0 22px",height:44,boxShadow:"0 4px 16px rgba(26,95,168,.3)"}}>
        จองห้องประชุมใหม่
      </BtnPri>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"flex-start"}}>
      {/* ── Main calendar ── */}
      <div style={{background:"var(--surface)",borderRadius:18,border:"1px solid var(--border)",boxShadow:"0 1px 4px rgba(0,0,0,.04)",overflow:"hidden",minWidth:0}}>
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderBottom:"1px solid var(--border-soft)",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <Tooltip label="วันก่อนหน้า" dir="t"><button onClick={goPrev} className="btn-sec" style={{width:36,height:36,padding:0,background:"var(--bg)",border:"none",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon n="arrow-left" s={{fontSize:16,color:"var(--text-mute)"}}/></button></Tooltip>
            <button onClick={goToday} className="btn-sec" style={{height:36,padding:"0 16px",background:"var(--surface)",border:"1.5px solid var(--border-2)",borderRadius:9,fontSize:13,fontWeight:600,color:"var(--text-sub)",cursor:"pointer"}}>วันนี้</button>
            <Tooltip label="วันถัดไป" dir="t"><button onClick={goNext} className="btn-sec" style={{width:36,height:36,padding:0,background:"var(--bg)",border:"none",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon n="arrow-left" s={{fontSize:16,color:"var(--text-mute)",transform:"rotate(180deg)"}}/></button></Tooltip>
          </div>
          <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)",flex:1,minWidth:120}}>{periodLabel}</h3>
          <div style={{position:"relative",width:200}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",display:"flex"}}><Icon n="search" s={{fontSize:15,color:"var(--text-ghost)"}}/></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อการประชุม…" style={{...IS,padding:"8px 10px 8px 34px",fontSize:13,height:36}}/>
          </div>
          <div style={{display:"flex",background:"var(--bg)",borderRadius:9,padding:3,gap:2}}>
            {[["week","รายสัปดาห์"],["month","รายเดือน"]].map(([k,label])=>(
              <button key={k} onClick={()=>setView(k)}
                style={{padding:"7px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
                  background:view===k?"var(--surface)":"transparent",color:view===k?"var(--accent)":"var(--text-mute)",
                  boxShadow:view===k?"0 1px 4px rgba(0,0,0,.08)":"none",transition:"all .15s"}}>{label}</button>
            ))}
          </div>
        </div>

        {view==="week"
          ? <WeekView cursor={cursor} bookings={visibleBookings} db={db} roomColor={roomColor} today={today}
              onSlotClick={(date,roomId)=>openNew(date,roomId)} onBookingClick={b=>setDetailBooking(b)}/>
          : <MonthView cursor={cursor} bookings={visibleBookings} db={db} roomColor={roomColor} today={today}
              onDayClick={date=>openNew(date)} onBookingClick={b=>setDetailBooking(b)}/>}
      </div>

      {/* ── Sidebar ── */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <MiniCalendar cursor={cursor} setCursor={setCursor} today={today} bookings={visibleBookings}/>
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"18px 18px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h4 style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>ตัวกรองห้องประชุม</h4>
            {roomFilter.length>0 && <button onClick={()=>setRoomFilter([])} style={{fontSize:11.5,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>เลือกทั้งหมด</button>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {activeRooms.map((r,i)=>{
              const ac=ROOM_ACCENT[db.rooms.findIndex(x=>x.id===r.id)%ROOM_ACCENT.length];
              const checked = roomFilter.length===0 || roomFilter.includes(r.id);
              return <label key={r.id} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <span style={{width:9,height:9,borderRadius:"50%",background:ac.text,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</p>
                  <p style={{fontSize:11,color:"var(--text-faint)"}}>{r.place} · ชั้น {r.floor}</p>
                </div>
                <input type="checkbox" checked={checked} onChange={()=>{
                  setRoomFilter(prev=>{
                    const all = activeRooms.map(x=>x.id);
                    const cur = prev.length===0 ? all : prev;
                    return cur.includes(r.id) ? cur.filter(x=>x!==r.id) : [...cur,r.id];
                  });
                }} style={{width:16,height:16,accentColor:"var(--accent)",cursor:"pointer"}}/>
              </label>;
            })}
            {activeRooms.length===0 && <p style={{fontSize:12,color:"var(--text-ghost)"}}>ยังไม่มีห้องประชุมที่พร้อมใช้งาน</p>}
          </div>
        </div>
      </div>
    </div>

    {showModal && <BookingModal db={db} currentUser={currentUser}
      initial={editBooking && editBooking.id ? editBooking : null}
      presetDate={editBooking?.presetDate} presetRoomId={editBooking?.presetRoomId}
      onSave={doSave} onClose={()=>{setShowModal(false);setEditBooking(null);}}/>}

    {detailBooking && <BookingDetailModal booking={detailBooking} db={db} currentUser={currentUser}
      roomColor={roomColor}
      onEdit={()=>{setEditBooking(detailBooking); setDetailBooking(null); setShowModal(true);}}
      onDelete={()=>doDelete(detailBooking)}
      onClose={()=>setDetailBooking(null)}/>}
  </div>;
}

/* ── Mini calendar (month grid, sidebar) ── */
function MiniCalendar({cursor,setCursor,today,bookings}){
  const [miniMonth,setMiniMonth] = useState(()=>startOfMonth(cursor));
  const first = startOfMonth(miniMonth);
  const gridStart = startOfWeek(first);
  const days = Array.from({length:42},(_,i)=>addDays(gridStart,i));
  const bookedDates = new Set(bookings.map(b=>b.date));

  return <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"16px 16px 12px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <h4 style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{MONTH_TH[miniMonth.getMonth()]} {beThaiYear(miniMonth)}</h4>
      <div style={{display:"flex",gap:4}}>
        <button onClick={()=>setMiniMonth(addMonths(miniMonth,-1))} style={{width:24,height:24,border:"none",background:"var(--bg)",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="arrow-left" s={{fontSize:12,color:"var(--text-mute)"}}/></button>
        <button onClick={()=>setMiniMonth(addMonths(miniMonth,1))} style={{width:24,height:24,border:"none",background:"var(--bg)",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="arrow-left" s={{fontSize:12,color:"var(--text-mute)",transform:"rotate(180deg)"}}/></button>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
      {DOW_TH_S.map(d=><div key={d} style={{fontSize:10.5,color:"var(--text-ghost)",textAlign:"center",fontWeight:600,padding:"4px 0"}}>{d}</div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
      {days.map((d,i)=>{
        const inMonth = d.getMonth()===miniMonth.getMonth();
        const isToday = isSameDay(d,today);
        const isSel   = isSameDay(d,cursor);
        const hasBooking = bookedDates.has(ymd(d));
        return <button key={i} onClick={()=>setCursor(d)}
          style={{aspectRatio:"1",border:"none",borderRadius:8,cursor:"pointer",position:"relative",
            background:isSel?"var(--accent)":isToday?"var(--accent-soft)":"transparent",
            color:isSel?"var(--surface)":!inMonth?"#D1D5DB":isToday?"var(--accent)":"var(--text-sub)",
            fontWeight:isToday||isSel?700:400,fontSize:12.5,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
          {d.getDate()}
          {hasBooking && !isSel && <span style={{position:"absolute",bottom:3,width:4,height:4,borderRadius:"50%",background:"#2E9E5B"}}/>}
        </button>;
      })}
    </div>
  </div>;
}

/* ── Week view ── */
function WeekView({cursor,bookings,db,roomColor,today,onSlotClick,onBookingClick}){
  const start = startOfWeek(cursor);
  const days  = Array.from({length:7},(_,i)=>addDays(start,i));
  const ROW_H = 52;
  const VISIBLE_H = 16*ROW_H; // viewport shows ~16 hours at a time, same as before
  const bodyRef = useRef(null);

  useEffect(()=>{
    if(bodyRef.current) bodyRef.current.scrollTop = 6*ROW_H; // default scroll position: 06:00
  },[]);

  return <div style={{overflowX:"auto"}}>
    <div style={{minWidth:760}}>
      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",borderBottom:"1px solid var(--border-soft)"}}>
        <div/>
        {days.map((d,i)=>{ const isToday=isSameDay(d,today); return (
          <div key={i} style={{padding:"10px 6px",textAlign:"center",borderLeft:"1px solid var(--bg)",
            background:isToday?"var(--accent-soft)":"transparent"}}>
            <p style={{fontSize:11,color:isToday?"var(--accent)":"var(--text-faint)",fontWeight:600,marginBottom:2}}>{DOW_TH[d.getDay()]}</p>
            <p style={{fontSize:14,fontWeight:700,color:isToday?"var(--accent)":"var(--text)",
              display:"inline-flex",alignItems:"center",justifyContent:"center",
              width:isToday?28:"auto",height:isToday?28:"auto",borderRadius:"50%",
              background:isToday?"var(--accent)":"transparent",
              ...(isToday?{color:"#fff"}:{})}}>{d.getDate()}</p>
          </div>
        );})}
      </div>

      {/* Grid body — scrollable, full 24h tall so no booking can ever overflow it */}
      <div ref={bodyRef} style={{maxHeight:VISIBLE_H,overflowY:"auto"}}>
        <div style={{position:"relative",display:"grid",gridTemplateColumns:"56px repeat(7,1fr)"}}>
          {/* Hour labels column */}
          <div>
            {HOURS.map(h=><div key={h} style={{height:ROW_H,borderBottom:"1px solid var(--bg)",fontSize:11,color:"var(--text-ghost)",
              display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:2}}>{pad2(h)}:00</div>)}
          </div>
          {/* Day columns */}
          {days.map((d,di)=>{
            const dayKey=ymd(d); const isToday=isSameDay(d,today);
            const dayBookings = bookings.filter(b=>b.date===dayKey);
            return <div key={di} style={{position:"relative",borderLeft:"1px solid var(--bg)",background:isToday?"#FAFCFF":"transparent"}}>
              {HOURS.map(h=><div key={h} onClick={()=>onSlotClick(dayKey)}
                style={{height:ROW_H,borderBottom:"1px solid var(--bg)",cursor:"pointer"}}
                className="row-hover"/>)}
              {layoutOverlaps(dayBookings).map(b=>{
                const top = (toMin(b.start)-HOURS[0]*60)/60*ROW_H;
                const h   = Math.max((toMin(b.end)-toMin(b.start))/60*ROW_H, 30);
                const ac  = roomColor(b.roomId);
                const room = db.rooms.find(r=>r.id===b.roomId);
                const cols = b._totalCols||1, col = b._col||0, GAP=4;
                return <div key={b.id} onClick={e=>{e.stopPropagation();onBookingClick(b);}}
                  style={{position:"absolute",top,
                    left:`calc(${(col/cols)*100}% + ${GAP}px)`,
                    width:`calc(${100/cols}% - ${GAP*2}px)`,
                    height:h,
                    background:ac.soft,borderLeft:`3px solid ${ac.text}`,borderRadius:8,
                    padding:"6px 8px",overflow:"hidden",cursor:"pointer",zIndex:2,
                    boxShadow:"0 1px 3px rgba(0,0,0,.08)",transition:"transform .12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.zIndex=5;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.zIndex=2;}}>
                  <p style={{fontSize:11.5,fontWeight:700,color:ac.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.title}</p>
                  <p style={{fontSize:10.5,color:ac.text,opacity:.8}}>{b.start} - {b.end}</p>
                  {h>44 && cols<3 && <p style={{fontSize:10,color:ac.text,opacity:.7,fontWeight:600,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{room?.name}</p>}
                </div>;
              })}
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

/* ── Month view ── */
function MonthView({cursor,bookings,db,roomColor,today,onDayClick,onBookingClick}){
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const days = Array.from({length:42},(_,i)=>addDays(gridStart,i));

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid var(--border-soft)"}}>
      {DOW_TH.map(d=><div key={d} style={{padding:"10px 6px",textAlign:"center",fontSize:12,fontWeight:700,color:"var(--text-faint)"}}>{d}</div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
      {days.map((d,i)=>{
        const inMonth = d.getMonth()===cursor.getMonth();
        const isToday = isSameDay(d,today);
        const dayKey = ymd(d);
        const dayBookings = bookings.filter(b=>b.date===dayKey).sort((a,b)=>toMin(a.start)-toMin(b.start));
        const extra = dayBookings.length-3;
        return <div key={i} onClick={()=>onDayClick(dayKey)}
          style={{minHeight:104,padding:"8px 7px",borderRight:"1px solid var(--bg)",borderBottom:"1px solid var(--bg)",
            background:isToday?"#FAFCFF":!inMonth?"#FBFBFC":"var(--surface)",cursor:"pointer"}}
          className="row-hover">
          <span style={{fontSize:12.5,fontWeight:isToday?700:500,color:!inMonth?"#D1D5DB":isToday?"var(--surface)":"var(--text-sub)",
            display:"inline-flex",alignItems:"center",justifyContent:"center",
            width:isToday?22:"auto",height:isToday?22:"auto",borderRadius:"50%",
            background:isToday?"var(--accent)":"transparent"}}>{d.getDate()}</span>
          <div style={{marginTop:5,display:"flex",flexDirection:"column",gap:3}}>
            {dayBookings.slice(0,3).map(b=>{
              const ac=roomColor(b.roomId);
              return <div key={b.id} onClick={e=>{e.stopPropagation();onBookingClick(b);}}
                style={{fontSize:10.5,background:ac.soft,color:ac.text,borderRadius:5,padding:"2px 6px",
                  fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",cursor:"pointer"}}>
                {b.start} {b.title}
              </div>;
            })}
            {extra>0 && <p style={{fontSize:10,color:"var(--text-faint)",fontWeight:600,paddingLeft:6}}>+{extra} เพิ่มเติม</p>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

/* ── Booking detail modal (view existing booking) ── */
function BookingDetailModal({booking,db,roomColor,onEdit,onDelete,onClose}){
  const room = db.rooms.find(r=>r.id===booking.roomId);
  const organizer = db.users.find(u=>u.id===booking.organizerId);
  const participants = db.users.filter(u=>booking.participantIds?.includes(u.id));
  const ac = roomColor(booking.roomId);
  const d = new Date(booking.date+"T00:00:00");

  return <Modal onClose={onClose}>
    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:20,paddingBottom:18,borderBottom:"1px solid var(--border-soft)"}}>
      <div style={{width:46,height:46,background:ac.soft,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon n="meeting" s={{fontSize:22,color:ac.text}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:4}}>{booking.title}</h3>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>{DOW_TH[d.getDay()]}ที่ {d.getDate()} {MONTH_TH[d.getMonth()]} {beThaiYear(d)} · {booking.start} - {booking.end} น.</p>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
      <DetailRow icon="door" label="ห้องประชุม" value={`${room?.name||"-"} · ${room?.place||""} ชั้น ${room?.floor||""}`}/>
      <DetailRow icon="user" label="ผู้จอง" value={organizer?`${organizer.prefix}${organizer.firstName} ${organizer.lastName}`:"-"}/>
      {booking.note && <DetailRow icon="file-text" label="รายละเอียด" value={booking.note}/>}
    </div>

    <div style={{marginBottom:22}}>
      <p style={{fontSize:11,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".06em",textTransform:"uppercase",marginBottom:10}}>
        ผู้เข้าร่วมประชุม ({participants.length} คน)
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {participants.map(u=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:7,background:"var(--bg)",borderRadius:20,padding:"5px 12px 5px 5px"}}>
            <Avatar user={u} size={24}/>
            <span style={{fontSize:12.5,fontWeight:500,color:"var(--text-sub)"}}>{u.firstName}</span>
          </div>
        ))}
        {participants.length===0 && <p style={{fontSize:12.5,color:"var(--text-ghost)"}}>ไม่มีผู้เข้าร่วมเพิ่มเติม</p>}
      </div>
    </div>

    <div style={{display:"flex",gap:10}}>
      <BtnSec onClick={onDelete} icon="x" style={{flex:1,justifyContent:"center",color:"#B42318",borderColor:"#FECACA",background:"#FFF7F7"}}>ยกเลิกการจอง</BtnSec>
      <BtnPri onClick={onEdit} icon="save" style={{flex:1}}>แก้ไขการจอง</BtnPri>
    </div>
  </Modal>;
}
function DetailRow({icon,label,value}){
  return <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
    <div style={{width:30,height:30,background:"var(--bg)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
      <Icon n={icon} s={{fontSize:14,color:"var(--text-mute)"}}/>
    </div>
    <div style={{flex:1,minWidth:0}}>
      <p style={{fontSize:11,color:"var(--text-faint)",marginBottom:2}}>{label}</p>
      <p style={{fontSize:13.5,color:"var(--text-sub)",fontWeight:500,lineHeight:1.5,wordBreak:"break-word"}}>{value}</p>
    </div>
  </div>;
}

/* ── Booking create/edit modal ── */
/* ── DateField: whole box is clickable, opens a calendar popover ── */
function DateField({value,onChange}){
  const [open,setOpen] = useState(false);
  const [viewMonth,setViewMonth] = useState(()=>startOfMonth(value?new Date(value+"T00:00:00"):new Date()));
  const ref = useRef();

  useEffect(()=>{
    const onDocClick = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  },[]);

  const selectedDate = value ? new Date(value+"T00:00:00") : null;
  const gridStart = startOfWeek(startOfMonth(viewMonth));
  const days = Array.from({length:42},(_,i)=>addDays(gridStart,i));
  const today = new Date();

  const display = selectedDate
    ? `${selectedDate.getDate()} ${MONTH_TH[selectedDate.getMonth()]} ${beThaiYear(selectedDate)}`
    : "เลือกวันที่";

  return <div ref={ref} style={{position:"relative"}}>
    <div onClick={()=>setOpen(o=>!o)}
      style={{...IS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}>
      <span style={{color:value?"var(--text)":"var(--text-faint)"}}>{display}</span>
      <Icon n="calendar" s={{fontSize:16,color:"var(--text-faint)"}}/>
    </div>
    {open && <div className="fu" style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:500,
      background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,boxShadow:"0 10px 32px rgba(0,0,0,.14)",padding:14,width:280}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <h4 style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{MONTH_TH[viewMonth.getMonth()]} {beThaiYear(viewMonth)}</h4>
        <div style={{display:"flex",gap:4}}>
          <button type="button" onClick={()=>setViewMonth(addMonths(viewMonth,-1))} style={{width:24,height:24,border:"none",background:"var(--bg)",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="arrow-left" s={{fontSize:12,color:"var(--text-mute)"}}/></button>
          <button type="button" onClick={()=>setViewMonth(addMonths(viewMonth,1))} style={{width:24,height:24,border:"none",background:"var(--bg)",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="arrow-left" s={{fontSize:12,color:"var(--text-mute)",transform:"rotate(180deg)"}}/></button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {DOW_TH_S.map(d=><div key={d} style={{fontSize:10.5,color:"var(--text-ghost)",textAlign:"center",fontWeight:600,padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {days.map((d,i)=>{
          const inMonth = d.getMonth()===viewMonth.getMonth();
          const isToday = isSameDay(d,today);
          const isSel   = selectedDate && isSameDay(d,selectedDate);
          return <button key={i} type="button" onClick={()=>{ onChange(ymd(d)); setOpen(false); }}
            style={{aspectRatio:"1",border:"none",borderRadius:8,cursor:"pointer",
              background:isSel?"var(--accent)":isToday?"var(--accent-soft)":"transparent",
              color:isSel?"var(--surface)":!inMonth?"#D1D5DB":isToday?"var(--accent)":"var(--text-sub)",
              fontWeight:isToday||isSel?700:400,fontSize:12.5}}>
            {d.getDate()}
          </button>;
        })}
      </div>
      <button type="button" onClick={()=>{ onChange(ymd(today)); setViewMonth(startOfMonth(today)); setOpen(false); }}
        style={{width:"100%",marginTop:10,padding:"8px 0",background:"var(--bg)",border:"none",borderRadius:8,fontSize:12.5,fontWeight:600,color:"var(--accent)",cursor:"pointer"}}>
        วันนี้
      </button>
    </div>}
  </div>;
}

/* ── TimeField: whole box is clickable, opens a 24-hour dropdown list ── */
const TIME_OPTIONS = Array.from({length:48},(_,i)=>`${pad2(Math.floor(i/2))}:${i%2===0?"00":"30"}`);
function TimeField({value,onChange}){
  const [open,setOpen] = useState(false);
  const ref = useRef();
  const listRef = useRef();

  useEffect(()=>{
    const onDocClick = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  },[]);

  useEffect(()=>{
    if(open && listRef.current){
      const selEl = listRef.current.querySelector('[data-selected="true"]');
      if(selEl) selEl.scrollIntoView({block:"center"});
    }
  },[open]);

  return <div ref={ref} style={{position:"relative"}}>
    <div onClick={()=>setOpen(o=>!o)}
      style={{...IS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}>
      <span style={{color:value?"var(--text)":"var(--text-faint)"}}>{value ? `${value} น.` : "เลือกเวลา"}</span>
      <Icon n={open?"chevron-up":"chevron-down"} s={{fontSize:14,color:"var(--text-faint)"}}/>
    </div>
    {open && <div ref={listRef} className="fu" style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:500,
      background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 10px 32px rgba(0,0,0,.14)",
      maxHeight:220,overflowY:"auto",padding:6}}>
      {TIME_OPTIONS.map(t=>{
        const isSel = t===value;
        return <button key={t} type="button" data-selected={isSel} onClick={()=>{ onChange(t); setOpen(false); }}
          style={{width:"100%",textAlign:"left",padding:"8px 12px",border:"none",borderRadius:8,cursor:"pointer",
            background:isSel?"var(--accent-soft)":"transparent",color:isSel?"var(--accent)":"var(--text-sub)",
            fontWeight:isSel?700:400,fontSize:13}}>
          {t} น.
        </button>;
      })}
    </div>}
  </div>;
}

function RoomField({rooms,value,onChange}){
  const [open,setOpen] = useState(false);
  const ref = useRef();

  useEffect(()=>{
    const onDocClick = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  },[]);

  const selected = rooms.find(r=>String(r.id)===String(value));

  return <div ref={ref} style={{position:"relative"}}>
    <div onClick={()=>rooms.length>0 && setOpen(o=>!o)}
      style={{...IS,cursor:rooms.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}>
      <span style={{color:selected?"var(--text)":"var(--text-faint)"}}>
        {selected ? `${selected.name} (${selected.place})` : (rooms.length===0 ? "— ไม่มีห้องที่พร้อมใช้งาน —" : "— เลือกห้องประชุม —")}
      </span>
      <Icon n={open?"chevron-up":"chevron-down"} s={{fontSize:14,color:"var(--text-faint)"}}/>
    </div>
    {open && rooms.length>0 && <div className="fu" style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:500,
      background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 10px 32px rgba(0,0,0,.14)",
      maxHeight:220,overflowY:"auto",padding:6}}>
      {rooms.map(r=>{
        const isSel = String(r.id)===String(value);
        return <button key={r.id} type="button" data-selected={isSel} onClick={()=>{ onChange(r.id); setOpen(false); }}
          style={{width:"100%",textAlign:"left",padding:"8px 12px",border:"none",borderRadius:8,cursor:"pointer",
            background:isSel?"var(--accent-soft)":"transparent",color:isSel?"var(--accent)":"var(--text-sub)",
            fontWeight:isSel?700:400,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
          <Icon n="door" s={{fontSize:14,color:isSel?"var(--accent)":"var(--text-faint)"}}/>{r.name} ({r.place})
        </button>;
      })}
    </div>}
  </div>;
}

function BookingModal({db,currentUser,initial,presetDate,presetRoomId,onSave,onClose}){
  const isEdit = !!initial;
  const activeRooms = db.rooms.filter(r=>r.status==="active");
  const [form,setForm] = useState({
    title:    initial?.title    || "",
    roomId:   initial?.roomId   || presetRoomId || "",
    date:     initial?.date     || presetDate   || ymd(new Date()),
    start:    initial?.start    || "",
    end:      initial?.end      || "",
    note:     initial?.note     || "",
  });
  const [participantIds,setParticipantIds] = useState(
    initial?.participantIds?.length ? initial.participantIds : [currentUser.id]
  );
  const [pSearch,setPSearch] = useState("");
  const [openDepts,setOpenDepts] = useState(()=>new Set());
  const [errors,setErrors] = useState({});

  const usersByDept = useMemo(()=>{
    const map = {};
    DEPARTMENTS.forEach(d=>map[d]=[]);
    db.users.forEach(u=>{ if(!map[u.department]) map[u.department]=[]; map[u.department].push(u); });
    return map;
  },[db.users]);

  const matchesSearch = u => !pSearch ||
    `${u.firstName}${u.lastName}`.includes(pSearch) || u.empId.includes(pSearch) || u.email.toLowerCase().includes(pSearch.toLowerCase());

  const toggleDept = dept => setOpenDepts(prev=>{
    const n=new Set(prev); n.has(dept)?n.delete(dept):n.add(dept); return n;
  });
  const toggleUser = id => setParticipantIds(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);

  const selectedUsers = db.users.filter(u=>participantIds.includes(u.id));

  const validate = () => {
    const e={};
    if(!form.title.trim()) e.title="กรุณากรอกหัวข้อการประชุม";
    if(!form.roomId) e.room="กรุณาเลือกห้องประชุม";
    if(!form.date) e.date="กรุณาเลือกวันที่";
    if(!form.start || !form.end) e.time="กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด";
    else if(toMin(form.end)<=toMin(form.start)) e.time="เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
    if(form.roomId && form.date && form.start && form.end && toMin(form.end)>toMin(form.start)){
      const conflict = findConflict(db.bookings, {roomId:Number(form.roomId),date:form.date,start:form.start,end:form.end}, initial?.id);
      if(conflict) e.time = `ห้องนี้ถูกจองแล้วในช่วงเวลา ${conflict.start}-${conflict.end} น. ("${conflict.title}") กรุณาเลือกเวลาอื่น`;
    }
    setErrors(e); return Object.keys(e).length===0;
  };

  const doSubmit = () => {
    if(!validate()) return;
    onSave({
      title:form.title.trim(), roomId:Number(form.roomId), date:form.date,
      start:form.start, end:form.end, note:form.note.trim(),
      organizerId: initial?.organizerId || currentUser.id,
      participantIds,
    }, initial?.id);
  };

  return <Modal onClose={onClose} wide>
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:18,borderBottom:"1px solid var(--border-soft)"}}>
      <div style={{width:46,height:46,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon n="calendar-plus" s={{fontSize:22,color:"var(--accent)"}}/>
      </div>
      <div>
        <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:2}}>{isEdit?"แก้ไขการจองห้องประชุม":"จองห้องประชุมองค์กร"}</h3>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>เลือกวันเวลาและเพิ่มผู้เข้าร่วมให้ครบเพื่อยืนยันการจอง</p>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      {/* ── Left: form fields ── */}
      <div>
        <FL label="หัวข้อการประชุม *" error={errors.title}>
          <input style={IS} placeholder="เช่น สรุปป้ายขายไตรมาส 2" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        </FL>
        <FL label="เลือกห้องประชุม *" error={errors.room}>
          <RoomField rooms={activeRooms} value={form.roomId} onChange={id=>setForm({...form,roomId:id})}/>
        </FL>
        <FL label="วันที่จอง *" error={errors.date}>
          <DateField value={form.date} onChange={d=>setForm({...form,date:d})}/>
        </FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
          <FL label="เวลาเริ่มต้น *">
            <TimeField value={form.start} onChange={t=>setForm({...form,start:t})}/>
          </FL>
          <FL label="เวลาสิ้นสุด *">
            <TimeField value={form.end} onChange={t=>setForm({...form,end:t})}/>
          </FL>
        </div>
        {errors.time && <AlertBox type="error" msg={errors.time} style={{marginBottom:16,marginTop:-4}}/>}
        <FL label="รายละเอียดเพิ่มเติม">
          <textarea style={{...IS,minHeight:78,resize:"vertical",fontFamily:"inherit"}} placeholder="เช่น ลิงก์ห้องประชุมออนไลน์ หรือเรื่องที่จะหารือ…" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
        </FL>
      </div>

      {/* ── Right: participant picker, grouped by department ── */}
      <div style={{display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <label style={LS}>รายชื่อผู้เข้าร่วมการประชุม ({participantIds.length} คน)</label>
          {participantIds.length>0 && <button onClick={()=>setParticipantIds([])} style={{fontSize:11.5,color:"#B42318",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>ล้างทั้งหมด</button>}
        </div>

        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",display:"flex"}}><Icon n="search" s={{fontSize:15,color:"var(--text-ghost)"}}/></span>
          <input value={pSearch} onChange={e=>setPSearch(e.target.value)} placeholder="ค้นหาพนักงานด้วย ชื่อ-นามสกุล หรือ รหัสพนักงาน…" style={{...IS,padding:"9px 10px 9px 34px",fontSize:13}}/>
        </div>

        {selectedUsers.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {selectedUsers.map(u=>(
            <span key={u.id} style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--accent-soft)",color:"var(--accent-dark)",borderRadius:20,padding:"4px 6px 4px 10px",fontSize:12,fontWeight:600}}>
              {u.firstName}
              <button onClick={()=>toggleUser(u.id)} style={{background:"var(--surface)",border:"none",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
                <Icon n="x" s={{fontSize:10,color:"var(--accent-dark)"}}/>
              </button>
            </span>
          ))}
        </div>}

        <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",maxHeight:330,overflowY:"auto"}}>
          {DEPARTMENTS.map(dept=>{
            const members = (usersByDept[dept]||[]).filter(matchesSearch);
            if(pSearch && members.length===0) return null;
            const selCount = members.filter(u=>participantIds.includes(u.id)).length;
            const isOpen = openDepts.has(dept) || !!pSearch;
            return <div key={dept} style={{borderBottom:"1px solid var(--bg)"}}>
              <button onClick={()=>toggleDept(dept)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"var(--surface-2)",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:selCount>0?"var(--accent)":"#D1D5DB",flexShrink:0}}/>
                <span style={{flex:1,fontSize:12.5,fontWeight:600,color:"var(--text-sub)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dept}</span>
                <span style={{fontSize:11,color:selCount>0?"var(--accent)":"var(--text-faint)",fontWeight:600,background:selCount>0?"var(--accent-soft)":"var(--border-soft)",padding:"2px 8px",borderRadius:10,flexShrink:0}}>{selCount} คน</span>
                <Icon n={isOpen?"chevron-up":"chevron-down"} s={{fontSize:13,color:"var(--text-ghost)",flexShrink:0}}/>
              </button>
              {isOpen && <div style={{padding:"4px 6px 6px"}}>
                {members.length===0 && <p style={{fontSize:12,color:"var(--text-ghost)",padding:"6px 10px"}}>ไม่มีพนักงานในแผนกนี้</p>}
                {members.map(u=>{
                  const checked = participantIds.includes(u.id);
                  return <label key={u.id} onClick={()=>toggleUser(u.id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,cursor:"pointer",
                      background:checked?"#F4F9FF":"transparent"}}>
                    <input type="checkbox" checked={checked} onChange={()=>{}} style={{width:15,height:15,accentColor:"var(--accent)",cursor:"pointer",flexShrink:0}}/>
                    <Avatar user={u} size={26}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12.5,fontWeight:500,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.prefix}{u.firstName} {u.lastName}</p>
                      <p style={{fontSize:10.5,color:"var(--text-faint)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.empId} · {u.email}</p>
                    </div>
                  </label>;
                })}
              </div>}
            </div>;
          })}
        </div>
      </div>
    </div>

    <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:20,marginTop:20,borderTop:"1px solid var(--border-soft)"}}>
      <BtnSec onClick={onClose} icon="x">ยกเลิก</BtnSec>
      <BtnPri onClick={doSubmit} icon={isEdit?"save":"check"} style={{width:"auto",padding:"0 28px"}}>
        {isEdit?"บันทึกการแก้ไข":`ยืนยันและส่งคำเชิญ (${participantIds.length} คน)`}
      </BtnPri>
    </div>
  </Modal>;
}

/* ════════════════════════ ROOMS ════════════════════════ */
/* ── Room status config ── */
const ROOM_STATUS = {
  active:   { label:"พร้อมใช้งาน", bg:"#ECFDF5", color:"#065F46", icon:"check-circle",  dot:"#10B981" },
  temp:     { label:"ปิดชั่วคราว", bg:"#FFFBEB", color:"#92400E", icon:"alert-circle",  dot:"#F59E0B" },
  closed:   { label:"ปิดถาวร",     bg:"#FEF2F2", color:"#991B1B", icon:"x",             dot:"#EF4444" },
};

const ROOM_ACCENT = [
  {grad:"linear-gradient(135deg,var(--accent),var(--accent-grad2))",soft:"var(--accent-soft)",text:"var(--accent)"},
  {grad:"linear-gradient(135deg,#0891B2,#06B6D4)",soft:"#E0F7FA",text:"#0E7490"},
  {grad:"linear-gradient(135deg,#7C3AED,#8B5CF6)",soft:"#EDE9FE",text:"#6D28D9"},
  {grad:"linear-gradient(135deg,#059669,#10B981)",soft:"#ECFDF5",text:"#065F46"},
];

function RoomStatusBadge({status}){
  const s = ROOM_STATUS[status]||ROOM_STATUS.active;
  return (
    <span style={{fontSize:12,background:s.bg,color:s.color,padding:"4px 10px",
      borderRadius:20,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:s.dot,display:"inline-block",flexShrink:0}}/>
      {s.label}
    </span>
  );
}

function RoomsPage({db,updateDB,showToast,askConfirm,closeConfirm}){
  const [showAdd,  setShowAdd]  = useState(false);
  const [editRoom, setEditRoom] = useState(null);   // room object being edited

  const doAdd = (data) => {
    const nextId = (db.nextRoomId||db.rooms.length+1);
    const newDb  = {...db, rooms:[...db.rooms,{...data,id:nextId}], nextRoomId:nextId+1};
    updateDB(newDb); showToast("เพิ่มห้องประชุมสำเร็จ"); setShowAdd(false);
  };

  const doEdit = (data) => {
    const newDb = {...db, rooms:db.rooms.map(r=>r.id===editRoom.id?{...r,...data}:r)};
    updateDB(newDb); showToast("แก้ไขห้องประชุมสำเร็จ"); setEditRoom(null);
  };

  const confirmDelete = (room) => {
    askConfirm({
      title:"ลบห้องประชุม",
      msg:`ยืนยันการลบ "${room.name}" ออกจากระบบ? ข้อมูลจะหายถาวร`,
      icon:"x", color:"#B42318", okLabel:"ลบห้องประชุม",
      onOk:()=>{
        const newDb = {...db, rooms:db.rooms.filter(r=>r.id!==room.id)};
        updateDB(newDb); showToast(`ลบ "${room.name}" สำเร็จ`,"info"); closeConfirm();
      }
    });
  };

  return <div className="fu">
    <PageHeader title="ห้องประชุม" subtitle="จัดการห้องประชุมในองค์กร"/>

    {/* Toolbar */}
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
      <BtnPri onClick={()=>setShowAdd(true)} icon="plus"
        style={{width:"auto",padding:"0 20px",height:42}}>
        เพิ่มห้องประชุม
      </BtnPri>
    </div>

    {/* Cards */}
    {db.rooms.length===0 && (
      <div style={{background:"var(--surface)",borderRadius:16,border:"1.5px dashed #D1D5DB",
        padding:"48px",textAlign:"center",color:"var(--text-faint)"}}>
        <Icon n="building" s={{fontSize:40,color:"#D1D5DB",display:"block",margin:"0 auto 12px"}}/>
        <p style={{fontSize:14}}>ยังไม่มีห้องประชุม กดปุ่มด้านบนเพื่อเพิ่ม</p>
      </div>
    )}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16,marginBottom:8}}>
      {db.rooms.map((r,idx)=>{
        const ac  = ROOM_ACCENT[idx%ROOM_ACCENT.length];
        const st  = ROOM_STATUS[r.status]||ROOM_STATUS.active;
        const dim = r.status!=="active";
        return(
          <div key={r.id} style={{background:"var(--surface)",borderRadius:18,
            border:"1px solid var(--border)",overflow:"hidden",
            boxShadow:"0 2px 12px rgba(0,0,0,.06)",
            opacity:dim?.72:1,transition:"opacity .2s"}}>
            {/* top bar */}
            <div style={{height:6,background:dim?"#D1D5DB":ac.grad}}/>
            <div style={{padding:"20px 22px 18px"}}>
              {/* Header row */}
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
                <div style={{width:46,height:46,background:dim?"var(--bg)":ac.soft,
                  borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon n="building" s={{fontSize:23,color:dim?"var(--text-faint)":ac.text}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:dim?"var(--text-faint)":"var(--text)",
                    marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</h3>
                  <RoomStatusBadge status={r.status}/>
                </div>
              </div>

              {/* Info box */}
              <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:10,
                  padding:"10px 14px",borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>
                  <Icon n="building" s={{fontSize:14,color:"var(--text-faint)"}}/>
                  <div>
                    <p style={{fontSize:10,color:"var(--text-faint)",marginBottom:1}}>สถานที่</p>
                    <p style={{fontSize:13,fontWeight:600,color:"var(--text-sub)"}}>{r.place||"—"}</p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,
                  padding:"10px 14px",background:"var(--surface-2)"}}>
                  <Icon n="map-pin" s={{fontSize:14,color:"var(--text-faint)"}}/>
                  <div>
                    <p style={{fontSize:10,color:"var(--text-faint)",marginBottom:1}}>ชั้น</p>
                    <p style={{fontSize:13,fontWeight:600,color:"var(--text-sub)"}}>ชั้น {r.floor||"—"}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setEditRoom(r)}
                  style={{flex:1,height:36,background:"var(--accent-soft)",border:"none",borderRadius:9,
                    fontSize:13,fontWeight:600,color:"var(--accent)",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Icon n="user-cog" s={{fontSize:15,color:"var(--accent)"}}/> แก้ไข
                </button>
                <Tooltip label="ลบห้องประชุม" dir="t">
                  <button onClick={()=>confirmDelete(r)}
                    style={{width:36,height:36,background:"#FEF2F2",border:"none",borderRadius:9,
                      cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon n="x" s={{fontSize:16,color:"#B42318"}}/>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {showAdd   && <RoomModal onSave={doAdd}           onClose={()=>setShowAdd(false)}  title="เพิ่มห้องประชุม"/>}
    {editRoom  && <RoomModal onSave={doEdit}          onClose={()=>setEditRoom(null)}  title="แก้ไขห้องประชุม" initial={editRoom}/>}
  </div>;
}

/* ── Room add/edit modal ── */
function RoomModal({title,initial,onSave,onClose}){
  const [form,setForm]=useState({
    name:    initial?.name    || "",
    place:   initial?.place   || "",
    floor:   initial?.floor   || "",
    status:  initial?.status  || "active",
  });
  const [errors,setErrors]=useState({});

  const validate=()=>{
    const e={};
    if(!form.name.trim())  e.name="กรุณากรอกชื่อห้องประชุม";
    if(!form.place.trim()) e.place="กรุณากรอกสถานที่";
    if(!form.floor.trim()) e.floor="กรุณากรอกชั้น";
    setErrors(e); return Object.keys(e).length===0;
  };

  const doSubmit=()=>{ if(!validate()) return; onSave(form); };

  const isEdit = !!initial;

  return <Modal onClose={onClose}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22,
      paddingBottom:18,borderBottom:"1px solid var(--border-soft)"}}>
      <div style={{width:46,height:46,background:isEdit?"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))":"linear-gradient(135deg,#EAF3DE,#C8E6C9)",
        borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon n={isEdit?"user-cog":"building"} s={{fontSize:22,color:isEdit?"var(--accent)":"#2E9E5B"}}/>
      </div>
      <div>
        <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:2}}>{title}</h3>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>{isEdit?"แก้ไขข้อมูลห้องประชุม":"กรอกข้อมูลห้องประชุมใหม่"}</p>
      </div>
    </div>

    {/* ชื่อห้อง */}
    <FL label="ชื่อห้องประชุม *" error={errors.name}>
      <input style={IS} placeholder="เช่น Blue Diamond, Conference A"
        value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
    </FL>

    {/* สถานที่ + ชั้น */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <FL label="สถานที่ / อาคาร *" error={errors.place}>
        <input style={IS} placeholder="เช่น อาคาร A, Tower 1"
          value={form.place} onChange={e=>setForm({...form,place:e.target.value})}/>
      </FL>
      <FL label="ชั้น *" error={errors.floor}>
        <input style={IS} placeholder="เช่น 3, G, B1"
          value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})}/>
      </FL>
    </div>

    {/* สถานะ */}
    <div style={{marginBottom:24}}>
      <label style={LS}>สถานะ</label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {Object.entries(ROOM_STATUS).map(([key,s])=>(
          <button key={key} onClick={()=>setForm({...form,status:key})}
            style={{padding:"10px 8px",borderRadius:10,cursor:"pointer",
              border:form.status===key?`2px solid ${s.color}`:"1.5px solid var(--border-2)",
              background:form.status===key?s.bg:"var(--surface-2)",
              display:"flex",flexDirection:"column",alignItems:"center",gap:6,
              transition:"all .15s"}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:s.dot}}/>
            <span style={{fontSize:12,fontWeight:form.status===key?700:400,
              color:form.status===key?s.color:"var(--text-mute)"}}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Buttons */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
      <BtnSec onClick={onClose} icon="x" style={{width:"100%",justifyContent:"center"}}>ยกเลิก</BtnSec>
      <BtnPri onClick={doSubmit} icon={isEdit?"save":"plus"}
        style={{background:isEdit?"linear-gradient(135deg,var(--accent),var(--accent-dark))":"linear-gradient(135deg,#2E9E5B,#1B7A48)"}}>
        {isEdit?"บันทึกการแก้ไข":"เพิ่มห้องประชุม"}
      </BtnPri>
    </div>
  </Modal>;
}

/* ════════════════════════ PROFILE ════════════════════════ */
const READONLY_IS = {
  width:"100%", padding:"10px 13px",
  border:"1.5px solid var(--border-soft)", borderRadius:10,
  fontSize:14, color:"var(--text-mute)", background:"var(--surface-3)",
  boxSizing:"border-box", outline:"none", fontFamily:"inherit",
  cursor:"not-allowed",
};

function ProfilePage({currentUser,db,updateDB,setCurrentUser,showToast,askConfirm,closeConfirm}){
  const stdPfx=["นาย","นาง","นางสาว"];
  const [form,setForm]=useState({
    prefix:stdPfx.includes(currentUser.prefix)?currentUser.prefix:"อื่นๆ",
    prefixCustom:stdPfx.includes(currentUser.prefix)?"":currentUser.prefix,
    firstName:currentUser.firstName, lastName:currentUser.lastName,
    phone:currentUser.phone||"", department:currentUser.department,
  });
  const [pwForm,setPwForm]=useState({current:"",newPw:"",confirm:""});
  const [errors,setErrors]=useState({}); const [pwErrors,setPwErrors]=useState({});
  const [showC,setShowC]=useState(false); const [showN,setShowN]=useState(false); const [showF,setShowF]=useState(false);
  const [pwOpen,setPwOpen]=useState(false);
  const thaiRx=/^[ก-๙\s]+$/;

  const confirmSave=()=>{
    const e={};
    if(form.prefix==="อื่นๆ"&&!form.prefixCustom) e.prefixCustom="กรุณาระบุคำนำหน้า";
    if(!form.firstName||!thaiRx.test(form.firstName)) e.firstName="กรอกภาษาไทยเท่านั้น";
    if(!form.lastName||!thaiRx.test(form.lastName))   e.lastName="กรอกภาษาไทยเท่านั้น";
    if(form.phone&&(!/^\d+$/.test(form.phone)||form.phone.length>10)) e.phone="ตัวเลขไม่เกิน 10 หลัก";
    setErrors(e); if(Object.keys(e).length>0) return;
    askConfirm({title:"บันทึกข้อมูลส่วนตัว",msg:"คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลส่วนตัวใช่หรือไม่?",icon:"save",color:"var(--accent)",okLabel:"บันทึก",
      onOk:()=>{
        const prefix=form.prefix==="อื่นๆ"?form.prefixCustom:form.prefix;
        const updated={...currentUser,prefix,firstName:form.firstName,lastName:form.lastName,phone:form.phone};
        updateDB({...db,users:db.users.map(u=>u.id===currentUser.id?updated:u)});
        setCurrentUser(updated); closeConfirm(); showToast("บันทึกข้อมูลส่วนตัวสำเร็จ");
      }});
  };
  const confirmPw=()=>{
    const e={};
    if(pwForm.current!==currentUser.password) e.current="รหัสผ่านปัจจุบันไม่ถูกต้อง";
    if(pwForm.newPw.length<6) e.newPw="อย่างน้อย 6 ตัวอักษร";
    if(pwForm.newPw==="12345") e.newPw="ไม่สามารถใช้รหัสผ่านเริ่มต้นได้";
    if(pwForm.newPw!==pwForm.confirm) e.confirm="รหัสผ่านไม่ตรงกัน";
    setPwErrors(e); if(Object.keys(e).length>0) return;
    askConfirm({title:"เปลี่ยนรหัสผ่าน",msg:"คุณต้องการเปลี่ยนรหัสผ่านใช่หรือไม่?",icon:"lock",color:"var(--accent)",okLabel:"เปลี่ยนรหัสผ่าน",
      onOk:()=>{
        const now = new Date().toISOString();
        updateDB({...db,users:db.users.map(u=>u.id===currentUser.id?{...u,password:pwForm.newPw,lastPasswordChange:now}:u)});
        setCurrentUser({...currentUser,password:pwForm.newPw,lastPasswordChange:now});
        setPwForm({current:"",newPw:"",confirm:""}); closeConfirm(); showToast("เปลี่ยนรหัสผ่านสำเร็จ");
      }});
  };

  const PwF=({label,val,setVal,show,setShow,error})=><FL label={label} error={error}>
    <div style={{position:"relative"}}>
      <input style={{...IS,paddingRight:46}} type={show?"text":"password"} value={val} onChange={e=>setVal(e.target.value)}/>
      <Tooltip label={show?"ซ่อนรหัสผ่าน":"แสดงรหัสผ่าน"} dir="l">
        <button type="button" tabIndex={-1} onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}>
          <Icon n={show?"eye-off":"eye"} s={{fontSize:18,color:"var(--text-faint)"}}/>
        </button>
      </Tooltip>
    </div>
  </FL>;

  const rs=ROLE_STYLE[currentUser.role];
  const fullName = `${currentUser.prefix}${currentUser.firstName} ${currentUser.lastName}`;
  const profileMeta = [
    {icon:"key", label:"รหัสพนักงาน", value:currentUser.empId},
    {icon:"user", label:"บทบาท", value:currentUser.role},
    {icon:"building", label:"แผนก", value:currentUser.department},
  ];

  return <div className="fu" style={{maxWidth:1120,margin:"0 auto"}}>
    <PageHeader title="ข้อมูลส่วนตัว" subtitle="จัดการข้อมูลบัญชี โปรไฟล์ และความปลอดภัยของคุณ"/>

    {/* Hero header */}
    <div style={{display:"flex",alignItems:"center",gap:24,marginBottom:20,background:"linear-gradient(135deg,var(--surface) 0%,var(--accent-soft) 100%)",
      borderRadius:18,border:"1px solid var(--border)",padding:"28px 32px",
      boxShadow:"var(--shadow)",overflow:"hidden",position:"relative",flexWrap:"wrap"}}>
      <div style={{position:"absolute",right:-60,top:-80,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.4)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:60,bottom:-90,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.25)",pointerEvents:"none"}}/>
      <AvatarUpload user={currentUser} size={84} onUpload={photo=>{
        const updated={...currentUser,photo};
        const nd={...db,users:db.users.map(u=>u.id===currentUser.id?updated:u)};
        updateDB(nd); setCurrentUser(updated); showToast("เปลี่ยนรูปโปรไฟล์สำเร็จ");
      }}/>
      <div style={{flex:1,minWidth:220,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:7}}>
          <h1 style={{fontSize:25,fontWeight:800,color:"var(--text)",lineHeight:1.2}}>{fullName}</h1>
          <span style={{fontSize:12,background:rs.bg,color:rs.color,padding:"4px 12px",
            borderRadius:20,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5,flexShrink:0}}>
            <Icon n={rs.icon} s={{fontSize:12,color:rs.color}}/>{currentUser.role}
          </span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"5px 20px"}}>
          {profileMeta.map(m=>(
            <span key={m.label} style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13}}>
              <Icon n={m.icon} s={{fontSize:13,color:"var(--accent)"}}/>
              <span style={{color:"var(--text-faint)"}}>{m.label}</span>
              <span style={{fontWeight:700,color:"var(--text)"}}>{m.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.55fr) minmax(330px,.85fr)",gap:20,alignItems:"start"}}>
    {/* Info card */}
    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"28px",boxShadow:"var(--shadow)",marginBottom:0}}>
      <CardHead icon="user" title="ข้อมูลส่วนตัว"/>

      {/* Read-only basics — shown as plain info rows, not editable form fields */}
      <p style={{fontSize:11,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".07em",textTransform:"uppercase",marginBottom:10}}>ข้อมูลพื้นฐาน (แก้ไขไม่ได้)</p>
      <div style={{background:"var(--surface-3)",border:"1px solid var(--border-soft)",borderRadius:12,padding:"4px 16px",marginBottom:24}}>
        {[
          {icon:"key",      label:"รหัสพนักงาน", value:currentUser.empId},
          {icon:"link",     label:"อีเมล",       value:currentUser.email},
          {icon:"shield",   label:"บทบาท",       value:currentUser.role},
          {icon:"building", label:"แผนก",         value:currentUser.department},
        ].map((r,i)=>(
          <div key={r.label} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",
            borderBottom:i<3?"1px solid var(--border-soft)":"none"}}>
            <Icon n={r.icon} s={{fontSize:14,color:"var(--text-ghost)",flexShrink:0}}/>
            <span style={{fontSize:12.5,color:"var(--text-faint)",flexShrink:0,width:88}}>{r.label}</span>
            <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-sub)",wordBreak:"break-all",flex:1}}>{r.value}</span>
            <Icon n="lock" s={{fontSize:13,color:"var(--text-ghost)",flexShrink:0}}/>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <p style={{fontSize:11,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".07em",textTransform:"uppercase",marginBottom:14}}>แก้ไขข้อมูลส่วนตัว</p>

      <div style={{display:"grid",gridTemplateColumns:form.prefix==="อื่นๆ"?"1fr 1fr":"1fr",gap:"0 14px"}}>
        <FL label="คำนำหน้า">
          <select style={IS} value={form.prefix} onChange={e=>setForm({...form,prefix:e.target.value})}>
            {PREFIXES.map(p=><option key={p}>{p}</option>)}
          </select>
        </FL>
        {form.prefix==="อื่นๆ" &&
          <FL label="ระบุคำนำหน้า" error={errors.prefixCustom}>
            <input style={IS} placeholder="เช่น ดร., พ.ต.ท." value={form.prefixCustom} onChange={e=>setForm({...form,prefixCustom:e.target.value})}/>
          </FL>
        }
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <FL label="ชื่อจริง" error={errors.firstName}>
          <input style={IS} value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/>
        </FL>
        <FL label="นามสกุล" error={errors.lastName}>
          <input style={IS} value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/>
        </FL>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:"0 14px"}}>
        <FL label="เบอร์โทรศัพท์" error={errors.phone}>
          <input style={IS} value={form.phone} maxLength={10} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"")})} placeholder="0812345678"/>
        </FL>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",paddingTop:8}}>
        <BtnPri onClick={confirmSave} icon="save" style={{width:"auto",padding:"0 28px"}}>บันทึกข้อมูล</BtnPri>
      </div>
    </div>

    {/* Change password card — collapsible */}
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",boxShadow:"var(--shadow)"}}>
        <CardHead icon="shield" title="สถานะบัญชี"/>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border-soft)"}}>
            <span style={{fontSize:13,color:"var(--text-faint)"}}>อีเมล</span>
            <span style={{fontSize:13,fontWeight:600,color:"var(--text-sub)",textAlign:"right",wordBreak:"break-all"}}>{currentUser.email}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border-soft)"}}>
            <span style={{fontSize:13,color:"var(--text-faint)"}}>สถานะ</span>
            <span style={{fontSize:12,fontWeight:700,color:"#2E9E5B",background:"#E8F5E9",padding:"4px 10px",borderRadius:20}}>พร้อมใช้งาน</span>
          </div>
        </div>
      </div>

    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
      <button onClick={()=>setPwOpen(!pwOpen)}
        style={{width:"100%",padding:"20px 28px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
        <div style={{width:36,height:36,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon n="lock" s={{fontSize:18,color:"var(--accent)"}}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:2}}>เปลี่ยนรหัสผ่าน</p>
          <p style={{fontSize:12,color:"var(--text-faint)"}}>อัปเดตรหัสผ่านเพื่อความปลอดภัย</p>
        </div>
        <Icon n={pwOpen?"chevron-up":"chevron-down"} s={{fontSize:18,color:"var(--text-faint)"}}/>
      </button>

      {pwOpen && <div style={{padding:"0 28px 28px",borderTop:"1px solid var(--bg)"}}>
        <div style={{paddingTop:20}}>
          <PwF label="รหัสผ่านปัจจุบัน" val={pwForm.current} setVal={v=>setPwForm({...pwForm,current:v})} show={showC} setShow={setShowC} error={pwErrors.current}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:"0 14px"}}>
            <PwF label="รหัสผ่านใหม่"   val={pwForm.newPw}   setVal={v=>setPwForm({...pwForm,newPw:v})}   show={showN} setShow={setShowN} error={pwErrors.newPw}/>
            <PwF label="ยืนยันรหัสผ่าน" val={pwForm.confirm} setVal={v=>setPwForm({...pwForm,confirm:v})} show={showF} setShow={setShowF} error={pwErrors.confirm}/>
          </div>
          <AlertBox type="info" msg="รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร และไม่ใช่รหัสเริ่มต้น 12345" style={{marginBottom:20}}/>
          <BtnPri onClick={confirmPw} icon="shield">เปลี่ยนรหัสผ่าน</BtnPri>
        </div>
      </div>}
    </div>
    </div>
    </div>
  </div>;
}

/* ════════════════════════ AGENDA (บันทึกการประชุม) ════════════════════════ */
/* db.agendas: [{id, code, meetingType, parentAgendaId, title, locationMode, place, roomId,
   offsiteLocation, hasOnlineLink, onlineLink, date, start, end, objective, items:[{id,detail}],
   details, participantIds, hasExternal, externalParticipants, organizerId, createdAt, updatedAt}] */

function genAgendaCode(db){
  const yr = new Date().getFullYear();
  const n  = db.nextAgendaId || ((db.agendas||[]).length+1);
  return `AGD-${yr}-${String(n).padStart(4,"0")}`;
}
/* visibility: admin sees everything; everyone else only sees agendas they organize or are invited to */
function canSeeAgenda(agenda, currentUser){
  if(!currentUser) return false;
  if(currentUser.role==="แอดมิน") return true;
  return agenda.organizerId===currentUser.id || (agenda.participantIds||[]).includes(currentUser.id);
}
/* edit rights: only the creator, or an admin */
function canEditAgenda(agenda, currentUser){
  if(!currentUser) return false;
  return currentUser.role==="แอดมิน" || agenda.organizerId===currentUser.id;
}
/* true when the current user is genuinely part of the meeting (not just viewing as admin) */
function isInvolvedInAgenda(agenda, currentUser){
  if(!currentUser) return false;
  return agenda.organizerId===currentUser.id || (agenda.participantIds||[]).includes(currentUser.id);
}
/* เช็คห้องชนกัน ทั้งกับการจองห้อง (bookings) และ Agenda อื่นที่ใช้ห้องเดียวกัน วันเวลาเดียวกัน
   คืนค่า {source:"booking"|"agenda", title, start, end} ของรายการที่ชนตัวแรกที่เจอ หรือ null ถ้าไม่ชน */
function findRoomConflict(db, {roomId,date,start,end}, excludeAgendaId){
  if(!roomId || !date || !start || !end) return null;

  const bConflict = findConflict(db.bookings||[], {roomId,date,start,end}, null);
  if(bConflict) return { source:"booking", title:bConflict.title, start:bConflict.start, end:bConflict.end };

  const aConflict = (db.agendas||[]).find(a =>
    a.id!==excludeAgendaId && a.locationMode==="place" && a.roomId===roomId && a.date===date &&
    a.status!=="cancelled" &&
    timeRangesOverlap(a.start,a.end,start,end)
  );
  if(aConflict) return { source:"agenda", title:aConflict.title, start:aConflict.start, end:aConflict.end, code:aConflict.code };

  return null;
}

/* ── สถานะ Agenda — คำนวณอัตโนมัติจากวันที่/เวลา/การถูกยกเลิก ──
   ลำดับความสำคัญ: ยกเลิก (ผู้ใช้กดเอง, override ทุกอย่าง)
                  > เสร็จสิ้น (ต่อเนื่อง) (มี agenda อื่นต่อเนื่องจากตัวนี้ + ผ่านเวลาไปแล้ว)
                  > เสร็จสิ้น (เลยเวลาประชุมไปแล้ว)
                  > อยู่ระหว่างการประชุม (เวลาปัจจุบันอยู่ในช่วง start-end ของวันนี้)
                  > รอการประชุม (ยังไม่ถึงเวลา) */
const AGENDA_STATUS_META = {
  upcoming:           { label:"รอการประชุม",                 bg:"#E6F1FB", color:"#0C447C", icon:"clock"        },
  ongoing:            { label:"อยู่ระหว่างการประชุม",          bg:"#FFF7ED", color:"#C2410C", icon:"loader"       },
  done:               { label:"การประชุมเสร็จสิ้น",            bg:"#E7F6EC", color:"#1A7F37", icon:"check-circle" },
  done_continued:     { label:"การประชุมเสร็จสิ้น (ต่อเนื่อง)", bg:"#EAF3DE", color:"#2D5A0E", icon:"link"         },
  cancelled:          { label:"ยกเลิกการประชุม",               bg:"#FEE4E2", color:"#B42318", icon:"x-circle"     },
};
function getAgendaStatus(agenda, db){
  if(agenda.status==="cancelled") return "cancelled";

  const hasContinuation = (db.agendas||[]).some(a=>a.parentAgendaId===agenda.id);

  const now = new Date();
  const startDt = new Date(`${agenda.date}T${agenda.start||"00:00"}:00`);
  const endDt   = new Date(`${agenda.date}T${agenda.end||"23:59"}:00`);

  let base;
  if(now>endDt) base = "done";
  else if(now>=startDt && now<=endDt) base = "ongoing";
  else base = "upcoming";

  if(base==="done" && hasContinuation) return "done_continued";
  return base;
}

function agendaLocationLabel(a, db){
  if(a.locationMode==="offsite") return a.offsiteLocation || "นอกสถานที่";
  const room = (db.rooms||[]).find(r=>r.id===a.roomId);
  return room ? `${room.name} (${a.place})` : (a.place || "—");
}

/* generic pill/segmented selector — reused for meeting type, location, online-link, external participants */
function PillToggle({options,value,onChange}){
  return <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    {options.map(o=>{
      const sel = o.value===value;
      return <button key={String(o.value)} type="button" onClick={()=>onChange(o.value)}
        style={{padding:"9px 16px",borderRadius:10,border:`1.5px solid ${sel?"var(--accent)":"var(--border-2)"}`,
          background:sel?"var(--accent-soft)":"var(--surface)",color:sel?"var(--accent)":"var(--text-sub)",
          fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
        {o.icon && <Icon n={o.icon} s={{fontSize:14,color:sel?"var(--accent)":"var(--text-faint)"}}/>}
        {o.label}
      </button>;
    })}
  </div>;
}

/* dropdown to pick a "parent" agenda for continued meetings */
function ParentAgendaField({agendas,value,onChange}){
  const [open,setOpen] = useState(false);
  const [search,setSearch] = useState("");
  const ref = useRef();
  const inputRef = useRef();
  useEffect(()=>{
    const onDocClick = e => { if(ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  },[]);
  const selected = agendas.find(a=>String(a.id)===String(value));
  const filtered = agendas.filter(a=> !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()));

  const openDropdown = () => {
    if(agendas.length===0) return;
    setOpen(true); setSearch("");
    setTimeout(()=>inputRef.current?.focus(), 0);
  };

  return <div ref={ref} style={{position:"relative"}}>
    {open
      ? <input ref={inputRef} autoFocus value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="พิมพ์ค้นหารหัส Agenda หรือชื่อการประชุม…" style={IS}/>
      : <div onClick={openDropdown}
          style={{...IS,cursor:agendas.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}>
          <span style={{color:selected?"var(--text)":"var(--text-faint)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {selected ? `${selected.code} — ${selected.title}` : (agendas.length===0 ? "— ไม่มีการประชุมให้เลือก —" : "— เลือกการประชุม —")}
          </span>
          <Icon n="chevron-down" s={{fontSize:14,color:"var(--text-faint)"}}/>
        </div>}
    {open && agendas.length>0 && <div className="fu" style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:500,
      background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 10px 32px rgba(0,0,0,.14)",
      maxHeight:240,overflowY:"auto",padding:6}}>
      {filtered.length===0 && <p style={{fontSize:12.5,color:"var(--text-ghost)",padding:"10px 12px"}}>ไม่พบการประชุมที่ตรงกับคำค้นหา</p>}
      {filtered.map(a=>{
        const isSel = String(a.id)===String(value);
        return <button key={a.id} type="button" onClick={()=>{ onChange(a.id); setOpen(false); setSearch(""); }}
          style={{width:"100%",textAlign:"left",padding:"8px 12px",border:"none",borderRadius:8,cursor:"pointer",
            background:isSel?"var(--accent-soft)":"transparent",color:isSel?"var(--accent)":"var(--text-sub)",fontSize:13}}>
          <span style={{fontWeight:700}}>{a.code}</span> — {a.title}
        </button>;
      })}
    </div>}
  </div>;
}

function SummaryRow({icon,label,value}){
  return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
    <div style={{width:30,height:30,background:"var(--accent-soft)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <Icon n={icon} s={{fontSize:14,color:"var(--accent)"}}/>
    </div>
    <div style={{minWidth:0,flex:1}}>
      <p style={{fontSize:11,color:"var(--text-faint)",marginBottom:1}}>{label}</p>
      <p style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</p>
    </div>
  </div>;
}

function DetailField({icon,label,value}){
  return <div>
    <p style={{fontSize:11.5,color:"var(--text-faint)",marginBottom:4,display:"flex",alignItems:"center",gap:5}}>
      <Icon n={icon} s={{fontSize:12,color:"var(--text-faint)"}}/>{label}
    </p>
    <p style={{fontSize:13.5,fontWeight:500,color:"var(--text)",wordBreak:"break-word"}}>{value}</p>
  </div>;
}

/* ── Create / edit form — full page (too many fields for a modal) ── */
function AgendaForm({db,currentUser,initial,onSave,onCancel,askConfirm,closeConfirm}){
  const isEdit = !!initial;
  const activeRooms = (db.rooms||[]).filter(r=>r.status==="active");
  const places = [...new Set(activeRooms.map(r=>r.place))];

  const [meetingType,setMeetingType]   = useState(initial?.meetingType || "new");
  const [parentAgendaId,setParentId]   = useState(initial?.parentAgendaId || "");
  const [title,setTitle]               = useState(initial?.title || "");
  const [locationMode,setLocationMode] = useState(initial?.locationMode || "place");
  const [place,setPlace]               = useState(initial?.place || places[0] || "");
  const [roomId,setRoomId]             = useState(initial?.roomId || "");
  const [offsiteLocation,setOffsite]   = useState(initial?.offsiteLocation || "");
  const [hasOnlineLink,setHasLink]     = useState(initial?.hasOnlineLink || false);
  const [onlineLink,setOnlineLink]     = useState(initial?.onlineLink || "");
  const [date,setDate]                 = useState(initial?.date || "");
  const [start,setStart]               = useState(initial?.start || "");
  const [end,setEnd]                   = useState(initial?.end || "");
  const [objective,setObjective]       = useState(initial?.objective || "");
  const [items,setItems]               = useState(initial?.items?.length ? initial.items : [{id:1,detail:""}]);
  const [details,setDetails]           = useState(initial?.details || "");
  const [participantIds,setParticipantIds] = useState(initial?.participantIds?.length ? initial.participantIds : [currentUser.id]);
  const [hasExternal,setHasExternal]   = useState(initial?.hasExternal || false);
  const [externalParticipants,setExternal] = useState(initial?.externalParticipants || "");
  const [errors,setErrors]             = useState({});

  /* participant picker (grouped by department, with search) */
  const [pSearch,setPSearch]   = useState("");
  const [openDepts,setOpenDepts] = useState(()=>new Set());
  const usersByDept = useMemo(()=>{
    const map = {}; DEPARTMENTS.forEach(d=>map[d]=[]);
    db.users.forEach(u=>{ if(!map[u.department]) map[u.department]=[]; map[u.department].push(u); });
    return map;
  },[db.users]);
  const matchesSearch = u => !pSearch ||
    `${u.firstName}${u.lastName}`.includes(pSearch) || u.empId.includes(pSearch) || u.email.toLowerCase().includes(pSearch.toLowerCase());
  const toggleDept = dept => setOpenDepts(prev=>{ const n=new Set(prev); n.has(dept)?n.delete(dept):n.add(dept); return n; });
  const toggleUser = id => setParticipantIds(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  const selectedUsers = db.users.filter(u=>participantIds.includes(u.id));

  const selectableAgendas = (db.agendas||[]).filter(a=> canSeeAgenda(a,currentUser) && a.id!==initial?.id);
  const roomsAtPlace = activeRooms.filter(r=>r.place===place);

  const addItem    = () => setItems(prev=>[...prev, {id:Date.now(), detail:""}]);
  const removeItem = id => {
    const doRemove = () => setItems(prev=> prev.length>1 ? prev.filter(i=>i.id!==id) : prev);
    const target = items.find(i=>i.id===id);
    if(target && target.detail.trim()){
      askConfirm({
        title:"ลบวาระการประชุม",
        msg:`ยืนยันการลบวาระ "${target.detail.trim()}" ออกจากรายการ?`,
        icon:"x", color:"#B42318", okLabel:"ลบวาระ",
        onOk:()=>{ doRemove(); closeConfirm(); }
      });
    } else {
      doRemove();
    }
  };
  const updateItem = (id,val) => setItems(prev=> prev.map(i=>i.id===id?{...i,detail:val}:i));

  const validate = () => {
    const e = {};
    if(meetingType==="continued" && !parentAgendaId) e.parent="กรุณาเลือกการประชุมที่ต่อเนื่อง";
    if(!title.trim()) e.title="กรุณากรอกหัวข้อการประชุม";
    if(locationMode==="place" && !roomId) e.room="กรุณาเลือกห้องประชุม";
    if(locationMode==="offsite" && !offsiteLocation.trim()) e.offsite="กรุณาระบุสถานที่ประชุม";
    if(hasOnlineLink && !onlineLink.trim()) e.onlineLink="กรุณาระบุลิงก์การประชุมออนไลน์";
    if(!date) e.date="กรุณาเลือกวันที่ประชุม";
    if(!start||!end) e.time="กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด";
    else if(toMin(end)<=toMin(start)) e.time="เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
    if(!objective.trim()) e.objective="กรุณากรอกวัตถุประสงค์การประชุม";
    if(items.every(i=>!i.detail.trim())) e.items="กรุณากรอกวาระการประชุมอย่างน้อย 1 วาระ";
    if(hasExternal && !externalParticipants.trim()) e.external="กรุณาระบุรายชื่อผู้เข้าร่วมภายนอก";

    // ตรวจห้องว่าง — เฉพาะกรณีเลือกห้องในสถานที่ของบริษัท และข้อมูลวันเวลาครบถ้วนไม่มี error อื่นอยู่ก่อนแล้ว
    if(locationMode==="place" && roomId && date && start && end && !e.time){
      const conflict = findRoomConflict(db, {roomId:Number(roomId),date,start,end}, initial?.id);
      if(conflict){
        e.room = conflict.source==="booking"
          ? `ห้องนี้ถูกจองแล้วในช่วงเวลา ${conflict.start}-${conflict.end} น. ("${conflict.title}") กรุณาเลือกห้องหรือเวลาอื่น`
          : `ห้องนี้ถูกใช้ใน Agenda ${conflict.code} ("${conflict.title}") ช่วงเวลา ${conflict.start}-${conflict.end} น. กรุณาเลือกห้องหรือเวลาอื่น`;
      }
    }

    setErrors(e); return Object.keys(e).length===0;
  };

  const doSubmit = () => {
    if(!validate()) return;
    onSave({
      meetingType, parentAgendaId: meetingType==="continued" ? Number(parentAgendaId) : null,
      title: title.trim(),
      locationMode, place: locationMode==="place" ? place : "", roomId: locationMode==="place" ? Number(roomId) : null,
      offsiteLocation: locationMode==="offsite" ? offsiteLocation.trim() : "",
      hasOnlineLink, onlineLink: hasOnlineLink ? onlineLink.trim() : "",
      date, start, end,
      objective: objective.trim(),
      items: items.filter(i=>i.detail.trim()).map(i=>({id:i.id,detail:i.detail.trim()})),
      details: details.trim(),
      participantIds, hasExternal, externalParticipants: hasExternal ? externalParticipants.trim() : "",
    });
  };

  const selectedRoom = activeRooms.find(r=>String(r.id)===String(roomId));
  const selectedParent = selectableAgendas.find(a=>String(a.id)===String(parentAgendaId));

  /* ตรวจห้องว่างแบบ live ทุกครั้งที่ห้อง/วันที่/เวลาเปลี่ยน เพื่อเตือนผู้ใช้ก่อนกด submit */
  const roomConflict = useMemo(()=>{
    if(locationMode!=="place" || !roomId || !date || !start || !end) return null;
    if(toMin(end)<=toMin(start)) return null;
    return findRoomConflict(db, {roomId:Number(roomId),date,start,end}, initial?.id);
  },[locationMode,roomId,date,start,end,db.bookings,db.agendas,initial?.id]);

  return <div className="fu">
    <button onClick={onCancel} style={{background:"none",border:"none",color:"var(--text-faint)",cursor:"pointer",
      display:"flex",alignItems:"center",gap:5,fontSize:13,padding:0,marginBottom:10}}>
      <Icon n="arrow-left" s={{fontSize:13,color:"var(--text-faint)"}}/> {isEdit ? "ย้อนกลับ" : "บันทึกการประชุม"}
    </button>
    <PageHeader title={isEdit?"แก้ไข Agenda":"สร้าง Agenda ใหม่"}
      subtitle={isEdit?`กำลังแก้ไข ${initial.code}`:"กรอกข้อมูลรายละเอียดการประชุมและจัดเรียงวาระ"}/>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,alignItems:"flex-start"}}>
      <div>
        {/* ── Section 1: ข้อมูลการประชุม ── */}
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="info" title="ข้อมูลการประชุม"/>

          <FL label="ประเภทการประชุม *">
            <PillToggle options={[{value:"new",label:"การประชุมใหม่",icon:"calendar-plus"},{value:"continued",label:"การประชุมต่อเนื่อง",icon:"link"}]}
              value={meetingType} onChange={setMeetingType}/>
          </FL>
          {meetingType==="continued" && <FL label="เลือกการประชุมที่ต่อเนื่องจาก *" error={errors.parent}>
            <ParentAgendaField agendas={selectableAgendas} value={parentAgendaId} onChange={setParentId}/>
          </FL>}

          <FL label="หัวข้อการประชุม *" error={errors.title}>
            <input style={IS} placeholder="เช่น ประชุมทีมพัฒนา Sprint Planning" value={title} onChange={e=>setTitle(e.target.value)}/>
          </FL>

          <FL label="สถานที่ประชุม *">
            <PillToggle
              options={[...places.map(p=>({value:p,label:p,icon:"building"})), {value:"offsite",label:"นอกสถานที่",icon:"map-pin"}]}
              value={locationMode==="offsite" ? "offsite" : place}
              onChange={v=>{ if(v==="offsite"){ setLocationMode("offsite"); } else { setLocationMode("place"); setPlace(v); setRoomId(""); } }}/>
          </FL>
          {locationMode==="place" && <FL label="เลือกห้องประชุม *" error={errors.room}>
            <RoomField rooms={roomsAtPlace} value={roomId} onChange={setRoomId}/>
            {!errors.room && roomId && date && start && end && toMin(end)>toMin(start) && (
              roomConflict ? (
                <p style={{fontSize:12,color:"#B42318",display:"flex",alignItems:"center",gap:5,marginTop:7}}>
                  <Icon n="x-circle" s={{fontSize:13,color:"#B42318"}}/>
                  ห้องไม่ว่างช่วงเวลานี้ — ชนกับ{roomConflict.source==="booking"?"การจองห้อง":"Agenda"} "{roomConflict.title}" ({roomConflict.start}-{roomConflict.end} น.)
                </p>
              ) : (
                <p style={{fontSize:12,color:"#1A7F37",display:"flex",alignItems:"center",gap:5,marginTop:7}}>
                  <Icon n="check-circle" s={{fontSize:13,color:"#1A7F37"}}/> ห้องว่างในช่วงเวลานี้
                </p>
              )
            )}
          </FL>}
          {locationMode==="offsite" && <FL label="ระบุสถานที่ *" error={errors.offsite}>
            <input style={IS} placeholder="เช่น โรงแรม หรือสถานที่จัดงาน" value={offsiteLocation} onChange={e=>setOffsite(e.target.value)}/>
          </FL>}

          <FL label="ลิงก์การประชุมออนไลน์">
            <PillToggle options={[{value:false,label:"ไม่มี",icon:"x"},{value:true,label:"มี",icon:"video"}]}
              value={hasOnlineLink} onChange={setHasLink}/>
          </FL>
          {hasOnlineLink && <FL label="ระบุลิงก์การประชุมออนไลน์ *" error={errors.onlineLink}>
            <input style={IS} placeholder="เช่น Zoom / Google Meet / Microsoft Teams" value={onlineLink} onChange={e=>setOnlineLink(e.target.value)}/>
          </FL>}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
            <FL label="วันที่ประชุม *" error={errors.date}><DateField value={date} onChange={setDate}/></FL>
            <FL label="เวลาเริ่มต้น *"><TimeField value={start} onChange={setStart}/></FL>
            <FL label="เวลาสิ้นสุด *"><TimeField value={end} onChange={setEnd}/></FL>
          </div>
          {errors.time && <AlertBox type="error" msg={errors.time} style={{marginBottom:16,marginTop:-4}}/>}

          <FL label="วัตถุประสงค์การประชุม *" error={errors.objective}>
            <textarea style={{...IS,minHeight:70,resize:"vertical",fontFamily:"inherit"}} placeholder="ระบุวัตถุประสงค์ของการประชุมนี้"
              value={objective} onChange={e=>setObjective(e.target.value)}/>
          </FL>
        </div>

        {/* ── Section 2: วาระการประชุม ── */}
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="list" title="วาระการประชุม"/>
          {errors.items && <AlertBox type="error" msg={errors.items} style={{marginBottom:14}}/>}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            {items.map((it,idx)=>(
              <div key={it.id} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{width:34,height:38,display:"flex",alignItems:"center",justifyContent:"center",
                  background:"var(--accent-soft)",color:"var(--accent)",borderRadius:8,fontSize:12,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
                  {idx+1}
                </span>
                <input style={{...IS,flex:1}} placeholder={`วาระที่ ${idx+1}`} value={it.detail}
                  onChange={e=>updateItem(it.id,e.target.value)}/>
                <button type="button" onClick={()=>removeItem(it.id)} disabled={items.length===1}
                  style={{width:38,height:38,border:"none",borderRadius:9,flexShrink:0,
                    background:items.length===1?"var(--surface-2)":"#FEF2F2",
                    color:items.length===1?"var(--text-ghost)":"#B42318",
                    cursor:items.length===1?"default":"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon n="x" s={{fontSize:15,color:items.length===1?"var(--text-ghost)":"#B42318"}}/>
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",
            background:"var(--accent-soft)",border:"none",borderRadius:10,color:"var(--accent)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            <Icon n="plus" s={{fontSize:14,color:"var(--accent)"}}/> เพิ่มวาระ
          </button>
        </div>

        {/* ── Section 3: รายละเอียดเพิ่มเติม ── */}
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="file-text" title="รายละเอียดการประชุม"/>
          <FL label="รายละเอียดเพิ่มเติม">
            <textarea style={{...IS,minHeight:90,resize:"vertical",fontFamily:"inherit"}} placeholder="รายละเอียด เอกสารที่เกี่ยวข้อง หรือข้อมูลเพิ่มเติมอื่นๆ"
              value={details} onChange={e=>setDetails(e.target.value)}/>
          </FL>
        </div>

        {/* ── Section 4: ผู้เข้าร่วมประชุม ── */}
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="users" title="ผู้เข้าร่วมประชุม"/>
          <AlertBox type="info" style={{marginBottom:16}}
            msg="เฉพาะผู้สร้าง ผู้ที่อยู่ในรายชื่อผู้เข้าร่วมด้านล่าง และแอดมิน จะมองเห็น Agenda นี้ได้ ผู้ใช้งานอื่นจะไม่เห็นข้อมูลนี้"/>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <label style={LS}>รายชื่อผู้เข้าร่วมการประชุม ({participantIds.length} คน)</label>
            {participantIds.length>0 && <button onClick={()=>setParticipantIds([])} style={{fontSize:11.5,color:"#B42318",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>ล้างทั้งหมด</button>}
          </div>

          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",display:"flex"}}><Icon n="search" s={{fontSize:15,color:"var(--text-ghost)"}}/></span>
            <input value={pSearch} onChange={e=>setPSearch(e.target.value)} placeholder="ค้นหาพนักงานด้วย ชื่อ-นามสกุล หรือ รหัสพนักงาน…" style={{...IS,padding:"9px 10px 9px 34px",fontSize:13}}/>
          </div>

          {selectedUsers.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {selectedUsers.map(u=>(
              <span key={u.id} style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--accent-soft)",color:"var(--accent-dark)",borderRadius:20,padding:"4px 6px 4px 10px",fontSize:12,fontWeight:600}}>
                {u.firstName}
                <button onClick={()=>toggleUser(u.id)} style={{background:"var(--surface)",border:"none",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
                  <Icon n="x" s={{fontSize:10,color:"var(--accent-dark)"}}/>
                </button>
              </span>
            ))}
          </div>}

          <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",maxHeight:300,overflowY:"auto"}}>
            {DEPARTMENTS.map(dept=>{
              const members = (usersByDept[dept]||[]).filter(matchesSearch);
              if(pSearch && members.length===0) return null;
              const selCount = members.filter(u=>participantIds.includes(u.id)).length;
              const isOpen = openDepts.has(dept) || !!pSearch;
              return <div key={dept} style={{borderBottom:"1px solid var(--bg)"}}>
                <button onClick={()=>toggleDept(dept)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"var(--surface-2)",border:"none",cursor:"pointer",textAlign:"left"}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:selCount>0?"var(--accent)":"#D1D5DB",flexShrink:0}}/>
                  <span style={{flex:1,fontSize:12.5,fontWeight:600,color:"var(--text-sub)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dept}</span>
                  <span style={{fontSize:11,color:selCount>0?"var(--accent)":"var(--text-faint)",fontWeight:600,background:selCount>0?"var(--accent-soft)":"var(--border-soft)",padding:"2px 8px",borderRadius:10,flexShrink:0}}>{selCount} คน</span>
                  <Icon n={isOpen?"chevron-up":"chevron-down"} s={{fontSize:13,color:"var(--text-ghost)",flexShrink:0}}/>
                </button>
                {isOpen && <div style={{padding:"4px 6px 6px"}}>
                  {members.length===0 && <p style={{fontSize:12,color:"var(--text-ghost)",padding:"6px 10px"}}>ไม่มีพนักงานในแผนกนี้</p>}
                  {members.map(u=>{
                    const checked = participantIds.includes(u.id);
                    return <label key={u.id} onClick={()=>toggleUser(u.id)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,cursor:"pointer",
                        background:checked?"var(--accent-soft)":"transparent"}}>
                      <input type="checkbox" checked={checked} onChange={()=>{}} style={{width:15,height:15,accentColor:"var(--accent)",cursor:"pointer",flexShrink:0}}/>
                      <Avatar user={u} size={26}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:12.5,fontWeight:500,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.prefix}{u.firstName} {u.lastName}</p>
                        <p style={{fontSize:10.5,color:"var(--text-faint)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.empId} · {u.email}</p>
                      </div>
                    </label>;
                  })}
                </div>}
              </div>;
            })}
          </div>

          <div style={{marginTop:18,paddingTop:18,borderTop:"1px solid var(--border-soft)"}}>
            <FL label="ผู้เข้าร่วมประชุมภายนอก">
              <PillToggle options={[{value:false,label:"ไม่มี"},{value:true,label:"มี"}]} value={hasExternal} onChange={setHasExternal}/>
            </FL>
            {hasExternal && <FL label="ระบุรายชื่อผู้เข้าร่วมภายนอก *" error={errors.external}>
              <textarea style={{...IS,minHeight:60,resize:"vertical",fontFamily:"inherit"}}
                placeholder="เช่น ชื่อ-นามสกุล หน่วยงาน/บริษัท (คั่นด้วยจุลภาคหรือขึ้นบรรทัดใหม่)"
                value={externalParticipants} onChange={e=>setExternal(e.target.value)}/>
            </FL>}
          </div>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <BtnSec onClick={onCancel} icon="x">ยกเลิก</BtnSec>
          <BtnPri onClick={doSubmit} icon={isEdit?"save":"check"} style={{width:"auto",padding:"0 28px"}}>
            {isEdit?"บันทึกการแก้ไข":"สร้าง Agenda"}
          </BtnPri>
        </div>
      </div>

      {/* ── Summary sidebar ── */}
      <div style={{position:"sticky",top:20}}>
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:22,boxShadow:"var(--shadow)"}}>
          <p style={{fontSize:11,fontWeight:700,color:"var(--text-ghost)",letterSpacing:".06em",textTransform:"uppercase",marginBottom:16}}>สรุปข้อมูลการประชุม</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <SummaryRow icon="clipboard" label="รหัส Agenda" value={isEdit?initial.code:"จะถูกสร้างหลังบันทึก"}/>
            <SummaryRow icon="file-text" label="ชื่อการประชุม" value={title||"—"}/>
            <SummaryRow icon="calendar" label="วันที่" value={date||"—"}/>
            <SummaryRow icon="clock" label="เวลา" value={start&&end?`${start} - ${end} น.`:"—"}/>
            <SummaryRow icon="map-pin" label="สถานที่" value={locationMode==="offsite" ? (offsiteLocation||"—") : (selectedRoom?`${selectedRoom.name} (${place})`:"—")}/>
            <SummaryRow icon="list" label="จำนวนวาระ" value={`${items.filter(i=>i.detail.trim()).length} วาระ`}/>
            <SummaryRow icon="users" label="ผู้เข้าร่วม" value={`${participantIds.length} คน`}/>
            {meetingType==="continued" && <SummaryRow icon="link" label="ต่อเนื่องจาก" value={selectedParent?selectedParent.code:"—"}/>}
          </div>
        </div>
      </div>
    </div>
  </div>;
}

/* ── Read-only detail view ── */
function htmlEscape(v){
  return String(v ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;"
  }[ch]));
}
function exportAgendaPdf({agenda,organizer,participants,room,statusMeta}){
  const safeFile = (agenda.code || "agenda").replace(/[^\w-]+/g,"-");
  const location = agenda.locationMode==="offsite" ? agenda.offsiteLocation : `${room?.name||"-"} (${agenda.place||"-"})`;
  const agendaRows = (agenda.items||[]).map((it,idx)=>`
    <tr>
      <td class="num">${idx+1}</td>
      <td>${htmlEscape(it.detail || "-")}</td>
    </tr>`).join("") || `<tr><td colspan="2" class="empty">ไม่มีวาระการประชุม</td></tr>`;
  const participantRows = participants.map((u,idx)=>`
    <tr>
      <td class="num">${idx+1}</td>
      <td>${htmlEscape(`${u.prefix||""}${u.firstName||""} ${u.lastName||""}`)}</td>
      <td>${htmlEscape(u.department || "-")}</td>
    </tr>`).join("") || `<tr><td colspan="3" class="empty">ไม่มีผู้เข้าร่วม</td></tr>`;
  const external = agenda.hasExternal && agenda.externalParticipants
    ? `<section><h2>ผู้เข้าร่วมภายนอก</h2><p class="pre">${htmlEscape(agenda.externalParticipants)}</p></section>`
    : "";
  const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8"/>
  <title>${htmlEscape(agenda.code)} - Meeting Record</title>
  <style>
    @page{size:A4;margin:16mm 14mm;}
    *{box-sizing:border-box}
    body{font-family:'Sarabun','Tahoma','Arial',sans-serif;color:#111827;margin:0;background:#fff;font-size:13px;line-height:1.55}
    .doc{max-width:780px;margin:0 auto}
    .brand{display:flex;align-items:center;gap:12px;border-bottom:3px solid #1A5FA8;padding-bottom:16px;margin-bottom:18px}
    .logo{width:42px;height:42px;border-radius:12px;background:#1A5FA8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
    .brand h1{font-size:22px;margin:0;color:#0F172A}
    .brand p{margin:2px 0 0;color:#64748B}
    .title{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}
    .title h2{font-size:20px;margin:0 0 6px;color:#0F172A}
    .meta{color:#64748B;font-size:12px}
    .badge{display:inline-block;border-radius:999px;background:${statusMeta.bg};color:${statusMeta.color};padding:6px 12px;font-weight:700;white-space:nowrap}
    section{border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px;margin-bottom:14px;break-inside:avoid}
    section h2{font-size:15px;margin:0 0 12px;color:#0F172A}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px}
    .field label{display:block;font-size:11px;color:#64748B;font-weight:700;margin-bottom:3px}
    .field div{font-weight:600;color:#111827}
    .pre{white-space:pre-wrap;margin:0;color:#334155}
    table{width:100%;border-collapse:collapse}
    th{background:#F1F5F9;color:#334155;text-align:left;font-size:12px;padding:9px 10px;border-bottom:1px solid #E2E8F0}
    td{padding:9px 10px;border-bottom:1px solid #EEF2F7;vertical-align:top}
    .num{width:42px;text-align:center;color:#1A5FA8;font-weight:700}
    .empty{text-align:center;color:#94A3B8;padding:18px}
    .footer{margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:18px;color:#64748B;font-size:12px}
    .sign{border-top:1px solid #CBD5E1;padding-top:8px;margin-top:42px;text-align:center}
  </style>
</head>
<body>
  <div class="doc">
    <div class="brand">
      <div class="logo">BST</div>
      <div><h1>บันทึกการประชุม</h1><p>BST e-Meeting Meeting Record</p></div>
    </div>
    <div class="title">
      <div>
        <h2>${htmlEscape(agenda.title)}</h2>
        <div class="meta">รหัส ${htmlEscape(agenda.code)} • สร้างโดย ${htmlEscape(`${organizer?.prefix||""}${organizer?.firstName||""} ${organizer?.lastName||""}`)}</div>
      </div>
      <span class="badge">${htmlEscape(statusMeta.label)}</span>
    </div>
    <section>
      <h2>ข้อมูลการประชุม</h2>
      <div class="grid">
        <div class="field"><label>วันที่</label><div>${htmlEscape(agenda.date || "-")}</div></div>
        <div class="field"><label>เวลา</label><div>${htmlEscape(`${agenda.start || "-"} - ${agenda.end || "-"} น.`)}</div></div>
        <div class="field"><label>สถานที่</label><div>${htmlEscape(location || "-")}</div></div>
        <div class="field"><label>ลิงก์ออนไลน์</label><div>${htmlEscape(agenda.hasOnlineLink ? agenda.onlineLink : "ไม่มี")}</div></div>
      </div>
      <div class="field" style="margin-top:14px"><label>วัตถุประสงค์การประชุม</label><div>${htmlEscape(agenda.objective || "-")}</div></div>
    </section>
    <section><h2>วาระการประชุม</h2><table><tbody>${agendaRows}</tbody></table></section>
    ${agenda.details ? `<section><h2>รายละเอียดเพิ่มเติม</h2><p class="pre">${htmlEscape(agenda.details)}</p></section>` : ""}
    <section>
      <h2>ผู้เข้าร่วม (${participants.length})</h2>
      <table>
        <thead><tr><th style="width:42px">#</th><th>ชื่อ-นามสกุล</th><th>แผนก</th></tr></thead>
        <tbody>${participantRows}</tbody>
      </table>
    </section>
    ${external}
    <div class="footer"><div class="sign">ผู้บันทึกการประชุม</div><div class="sign">ผู้ตรวจสอบ / อนุมัติ</div></div>
  </div>
  <script>
    document.title = "${htmlEscape(safeFile)}.pdf";
  </script>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if(!doc) return false;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(()=>{
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(()=>iframe.remove(), 1000);
    }, 250);
  };
  return true;
}
function AgendaExportButton({agenda,organizer,participants,room,statusMeta,showToast}){
  const [open,setOpen] = useState(false);
  const downloadPdf = () => {
    setOpen(false);
    const ok = exportAgendaPdf({agenda,organizer,participants,room,statusMeta});
    return showToast(ok ? "เปิดหน้าพิมพ์ PDF แล้ว กรุณาเลือก Save as PDF" : "ไม่สามารถเปิดหน้าพิมพ์ PDF ได้ กรุณาลองใหม่อีกครั้ง", ok ? "success" : "error");
  };

  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(v=>!v)} className="btn-sec" style={{height:44,padding:"0 14px 0 16px",background:"var(--surface)",color:"var(--accent)",border:"1.5px solid var(--accent-soft2)",borderRadius:11,fontSize:14,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",boxShadow:"var(--shadow)"}}>
      <Icon n="download" s={{fontSize:17,color:"var(--accent)"}}/>
      ดาวน์โหลด
      <Icon n="chevron-down" s={{fontSize:14,color:"var(--accent)"}}/>
    </button>
    {open && <div style={{position:"absolute",right:0,top:50,width:230,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 14px 36px rgba(15,23,42,.16)",padding:6,zIndex:20}}>
      <button onClick={downloadPdf} className="row-hover" style={{width:"100%",border:"none",background:"transparent",borderRadius:9,padding:"10px 11px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
        <span style={{width:34,height:34,borderRadius:10,background:"#FEE2E2",color:"#B42318",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>PDF</span>
        <span><span style={{display:"block",fontSize:13,fontWeight:700,color:"var(--text)"}}>ดาวน์โหลดเป็น PDF</span><span style={{display:"block",fontSize:11.5,color:"var(--text-faint)"}}>เอกสารพร้อมพิมพ์</span></span>
      </button>
      <button disabled style={{width:"100%",border:"none",background:"transparent",borderRadius:9,padding:"10px 11px",display:"flex",alignItems:"center",gap:10,textAlign:"left",opacity:.5,cursor:"not-allowed"}}>
        <span style={{width:34,height:34,borderRadius:10,background:"#DCFCE7",color:"#15803D",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>XLS</span>
        <span><span style={{display:"block",fontSize:13,fontWeight:700,color:"var(--text)"}}>ดาวน์โหลดเป็น Excel</span><span style={{display:"block",fontSize:11.5,color:"var(--text-faint)"}}>เตรียมไว้สำหรับอนาคต</span></span>
      </button>
    </div>}
  </div>;
}
function AgendaDetail({db,agenda,currentUser,onBack,onEdit,updateDB,showToast,askConfirm,closeConfirm,onOpenMom}){
  const organizer = db.users.find(u=>u.id===agenda.organizerId);
  const parent = agenda.parentAgendaId ? (db.agendas||[]).find(a=>a.id===agenda.parentAgendaId) : null;
  const continuations = (db.agendas||[]).filter(a=>a.parentAgendaId===agenda.id);
  const participants = db.users.filter(u=>(agenda.participantIds||[]).includes(u.id));
  const canEdit = canEditAgenda(agenda,currentUser);
  const room = agenda.roomId ? db.rooms.find(r=>r.id===agenda.roomId) : null;

  const statusKey = getAgendaStatus(agenda,db);
  const statusMeta = AGENDA_STATUS_META[statusKey];
  const canCancel = canEdit && statusKey!=="cancelled" && statusKey!=="done" && statusKey!=="done_continued";
  const linkedBooking = (db.bookings||[]).find(b=>b.agendaId===agenda.id);

  const doCancel = () => askConfirm({
    title:"ยกเลิกการประชุม", msg:`ยืนยันการยกเลิกการประชุม "${agenda.title}" (${agenda.code})? ผู้เข้าร่วมจะเห็นสถานะนี้ทันที และการจองห้องที่เกี่ยวข้องจะถูกลบออกจากปฏิทินด้วย`,
    icon:"ban", color:"#B42318", okLabel:"ยืนยันยกเลิก",
    onOk:()=>{
      const nd = {
        ...db,
        agendas:(db.agendas||[]).map(a=>a.id===agenda.id?{...a,status:"cancelled",updatedAt:new Date().toISOString()}:a),
        bookings:(db.bookings||[]).filter(b=>b.agendaId!==agenda.id),
      };
      updateDB(nd); closeConfirm(); showToast("ยกเลิกการประชุมแล้ว","info");
    }
  });
  const doReactivate = () => {
    const nd = {...db, agendas:(db.agendas||[]).map(a=>a.id===agenda.id?{...a,status:null,updatedAt:new Date().toISOString()}:a)};
    updateDB(nd); showToast("ยกเลิกการยกเลิก — นัดหมายกลับมาใช้งานได้ตามปกติ");
  };

  return <div className="fu">
    <button onClick={onBack} style={{background:"none",border:"none",color:"var(--text-faint)",cursor:"pointer",
      display:"flex",alignItems:"center",gap:5,fontSize:13,padding:0,marginBottom:14}}>
      <Icon n="arrow-left" s={{fontSize:13,color:"var(--text-faint)"}}/> บันทึกการประชุม
    </button>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:16,flexWrap:"wrap"}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <h1 style={{fontSize:22,fontWeight:700,color:"var(--text)"}}>{agenda.title}</h1>
          <span style={{fontSize:11.5,fontWeight:600,padding:"3px 10px",borderRadius:20,
            background:agenda.meetingType==="continued"?"#FFF7ED":"var(--accent-soft)",
            color:agenda.meetingType==="continued"?"#C2410C":"var(--accent)"}}>
            {agenda.meetingType==="continued"?"การประชุมต่อเนื่อง":"การประชุมใหม่"}
          </span>
        </div>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>รหัส {agenda.code} · สร้างโดย {organizer?.prefix}{organizer?.firstName} {organizer?.lastName}</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <AgendaExportButton agenda={agenda} organizer={organizer} participants={participants} room={room} statusMeta={statusMeta} showToast={showToast}/>
        {["done","done_continued"].includes(statusKey) && <BtnSec onClick={()=>onOpenMom(agenda.id)} icon="file-text" style={{width:"auto",padding:"0 18px",height:44}}>ดู/กรอก MOM</BtnSec>}
        {canCancel && <BtnSec onClick={doCancel} icon="ban" style={{width:"auto",padding:"0 18px",height:44,color:"#B42318",borderColor:"#FECACA",background:"#FFF7F7"}}>ยกเลิกการประชุม</BtnSec>}
        {statusKey==="cancelled" && canEdit && <BtnSec onClick={doReactivate} icon="reset" style={{width:"auto",padding:"0 18px",height:44}}>ยกเลิกการยกเลิก</BtnSec>}
        {canEdit && statusKey!=="cancelled" && <BtnPri onClick={onEdit} icon="edit" style={{width:"auto",padding:"0 22px",height:44}}>แก้ไข Agenda</BtnPri>}
      </div>
    </div>

    {/* Status banner */}
    <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 16px",borderRadius:30,marginBottom:18,
      background:statusMeta.bg,color:statusMeta.color,fontSize:13,fontWeight:700}}>
      <Icon n={statusMeta.icon} s={{fontSize:15,color:statusMeta.color}}/> {statusMeta.label}
    </div>

    {parent && <AlertBox type="info" msg={`การประชุมนี้ต่อเนื่องจาก ${parent.code} — ${parent.title}`} style={{marginBottom:18}}/>}
    {continuations.length>0 && <AlertBox type="info" style={{marginBottom:18}}
      msg={`มีการประชุมต่อเนื่องจาก Agenda นี้: ${continuations.map(c=>`${c.code} (${c.title})`).join(", ")}`}/>}
    {linkedBooking && <AlertBox type="success" style={{marginBottom:18}}
      msg={`ห้อง ${room?.name||"—"} วันที่ ${linkedBooking.date} เวลา ${linkedBooking.start}-${linkedBooking.end} น. — บันทึกในปฏิทินจองห้องแล้วอัตโนมัติ`}/>}

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
      <div>
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="info" title="ข้อมูลการประชุม"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
            <DetailField icon="calendar" label="วันที่" value={agenda.date}/>
            <DetailField icon="clock" label="เวลา" value={`${agenda.start} - ${agenda.end} น.`}/>
            <DetailField icon="map-pin" label="สถานที่" value={agenda.locationMode==="offsite" ? agenda.offsiteLocation : `${room?.name||"—"} (${agenda.place})`}/>
            <DetailField icon="video" label="ลิงก์ออนไลน์" value={agenda.hasOnlineLink ? agenda.onlineLink : "ไม่มี"}/>
          </div>
          <p style={{fontSize:12,color:"var(--text-faint)",marginBottom:6,fontWeight:600}}>วัตถุประสงค์การประชุม</p>
          <p style={{fontSize:13.5,color:"var(--text-sub)",lineHeight:1.7}}>{agenda.objective||"—"}</p>
        </div>

        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="list" title="วาระการประชุม"/>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {(agenda.items||[]).map((it,idx)=>(
              <div key={it.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:idx<agenda.items.length-1?"1px solid var(--border-soft)":"none"}}>
                <span style={{width:26,height:26,borderRadius:7,background:"var(--accent-soft)",color:"var(--accent)",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{idx+1}</span>
                <p style={{fontSize:13.5,color:"var(--text-sub)",paddingTop:3}}>{it.detail}</p>
              </div>
            ))}
            {(!agenda.items || agenda.items.length===0) && <p style={{fontSize:13,color:"var(--text-faint)"}}>ไม่มีวาระการประชุม</p>}
          </div>
        </div>

        {agenda.details && <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="file-text" title="รายละเอียดเพิ่มเติม"/>
          <p style={{fontSize:13.5,color:"var(--text-sub)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{agenda.details}</p>
        </div>}
      </div>

      <div>
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:22,marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="users" title={`ผู้เข้าร่วม (${participants.length})`}/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {participants.map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar user={u} size={32}/>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.prefix}{u.firstName} {u.lastName}</p>
                  <p style={{fontSize:11,color:"var(--text-faint)"}}>{u.department}</p>
                </div>
              </div>
            ))}
            {participants.length===0 && <p style={{fontSize:13,color:"var(--text-faint)"}}>ไม่มีผู้เข้าร่วม</p>}
          </div>
          {agenda.hasExternal && <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--border-soft)"}}>
            <p style={{fontSize:12,fontWeight:600,color:"var(--text-faint)",marginBottom:6}}>ผู้เข้าร่วมภายนอก</p>
            <p style={{fontSize:13,color:"var(--text-sub)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{agenda.externalParticipants}</p>
          </div>}
        </div>
      </div>
    </div>
  </div>;
}
function AgendaPage({db,updateDB,currentUser,showToast,askConfirm,closeConfirm,openAgendaId,onOpenMom}){
  const deepLinked = openAgendaId ? (db.agendas||[]).find(a=>a.id===openAgendaId) : null;
  const [view,setView]       = useState(deepLinked ? "detail" : "list"); // "list" | "form" | "detail"
  const [selected,setSelected] = useState(deepLinked || null);
  const [search,setSearch]   = useState("");
  const [typeFilter,setTypeFilter] = useState("all"); // all | new | continued
  const [statusFilter,setStatusFilter] = useState("all"); // all | upcoming | ongoing | done | done_continued | cancelled
  const [onlyMine,setOnlyMine] = useState(false);

  const isAdmin = currentUser?.role==="แอดมิน";

  const openCreate = () => { setSelected(null); setView("form"); };
  const openEdit    = a => { setSelected(a); setView("form"); };
  const openView    = a => { setSelected(a); setView("detail"); };
  const backToList  = () => { setSelected(null); setView("list"); };

  const saveAgenda = data => {
    if(selected){
      /* ── แก้ไข Agenda: update booking ที่ผูกไว้ด้วย (ถ้ามี) ── */
      const updatedAgenda = {...selected, ...data, updatedAt:new Date().toISOString()};
      let newBookings = db.bookings;
      const linkedBooking = (db.bookings||[]).find(b=>b.agendaId===selected.id);
      if(data.locationMode==="place" && data.roomId){
        if(linkedBooking){
          /* อัปเดต booking เดิม */
          newBookings = newBookings.map(b=>b.agendaId===selected.id
            ? {...b, title:data.title, roomId:Number(data.roomId), date:data.date, start:data.start, end:data.end, participantIds:data.participantIds||[], note:data.objective||""}
            : b);
        } else {
          /* ยังไม่เคยสร้าง booking → สร้างใหม่ */
          const bId = (db.nextBookingId || Date.now());
          newBookings = [...newBookings, { id:bId, agendaId:selected.id, title:data.title,
            roomId:Number(data.roomId), date:data.date, start:data.start, end:data.end,
            organizerId:currentUser.id, participantIds:data.participantIds||[], note:data.objective||"" }];
        }
      } else if(linkedBooking){
        /* เปลี่ยนจากห้องในองค์กรเป็นออกนอก → ลบ booking เดิมออก */
        newBookings = newBookings.filter(b=>b.agendaId!==selected.id);
      }
      const nd = {...db, agendas:(db.agendas||[]).map(a=>a.id===selected.id?updatedAgenda:a), bookings:newBookings};
      updateDB(nd); showToast("บันทึกการแก้ไข Agenda สำเร็จ");
      setSelected(updatedAgenda); setView("detail");
    } else {
      /* ── สร้าง Agenda ใหม่: สร้าง booking ควบคู่กันถ้าเลือกห้องในองค์กร ── */
      const id = db.nextAgendaId || Date.now();
      const newAgenda = { id, code:genAgendaCode(db), ...data, organizerId:currentUser.id,
        createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      let newBookings = db.bookings;
      let nextBookingId = db.nextBookingId;
      if(data.locationMode==="place" && data.roomId){
        const bId = nextBookingId || Date.now();
        newBookings = [...newBookings, { id:bId, agendaId:id, title:data.title,
          roomId:Number(data.roomId), date:data.date, start:data.start, end:data.end,
          organizerId:currentUser.id, participantIds:data.participantIds||[], note:data.objective||"" }];
        nextBookingId = bId + 1;
      }
      const nd = {...db, agendas:[...(db.agendas||[]), newAgenda], nextAgendaId:id+1, bookings:newBookings, nextBookingId};
      updateDB(nd); showToast("สร้าง Agenda สำเร็จ" + (data.locationMode==="place" && data.roomId ? " — บันทึกการจองห้องอัตโนมัติแล้ว" : ""));
      setSelected(newAgenda); setView("detail");
    }
  };

  if(view==="form") return <AgendaForm db={db} currentUser={currentUser} initial={selected}
    onSave={saveAgenda} onCancel={selected?()=>setView("detail"):backToList}
    askConfirm={askConfirm} closeConfirm={closeConfirm}/>;

  if(view==="detail" && selected){
    // keep the displayed copy fresh in case db changed elsewhere
    const fresh = (db.agendas||[]).find(a=>a.id===selected.id) || selected;
    return <AgendaDetail db={db} agenda={fresh} currentUser={currentUser} onBack={backToList} onEdit={()=>setView("form")}
      updateDB={updateDB} showToast={showToast} askConfirm={askConfirm} closeConfirm={closeConfirm} onOpenMom={onOpenMom}/>;
  }

  const visible = (db.agendas||[])
    .filter(a=> canSeeAgenda(a,currentUser))
    .filter(a=> !onlyMine || isInvolvedInAgenda(a,currentUser))
    .filter(a=> typeFilter==="all" || a.meetingType===typeFilter)
    .filter(a=> statusFilter==="all" || getAgendaStatus(a,db)===statusFilter)
    .filter(a=> !search || a.title.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=> (b.date+b.start).localeCompare(a.date+a.start));

  return <div className="fu">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:16,flexWrap:"wrap"}}>
      <PageHeader title="บันทึกการประชุม" subtitle="สร้างและจัดการวาระการประชุม (Agenda) ทั้งหมด"/>
      <BtnPri onClick={openCreate} icon="plus" style={{width:"auto",padding:"0 22px",height:44,flexShrink:0}}>สร้าง Agenda</BtnPri>
    </div>

    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
      <div style={{position:"relative",flex:"1 1 260px",minWidth:220}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",display:"flex"}}>
          <Icon n="search" s={{fontSize:17,color:"var(--text-ghost)"}}/>
        </span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาด้วยรหัส Agenda หรือชื่อการประชุม…" style={{...IS,paddingLeft:42}}/>
      </div>
      <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...IS,width:"auto",minWidth:170,cursor:"pointer"}}>
        <option value="all">ทุกประเภท</option>
        <option value="new">การประชุมใหม่</option>
        <option value="continued">การประชุมต่อเนื่อง</option>
      </select>
      <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...IS,width:"auto",minWidth:180,cursor:"pointer"}}>
        <option value="all">ทุกสถานะ</option>
        {Object.entries(AGENDA_STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
      </select>
      {isAdmin && <button onClick={()=>setOnlyMine(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
        border:`1.5px solid ${onlyMine?"var(--accent)":"var(--border-2)"}`,borderRadius:10,background:onlyMine?"var(--accent-soft)":"var(--surface)",
        color:onlyMine?"var(--accent)":"var(--text-mute)",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
        <Icon n="user-check" s={{fontSize:15,color:onlyMine?"var(--accent)":"var(--text-mute)"}}/>
        เฉพาะที่ฉันเกี่ยวข้อง
      </button>}
    </div>

    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5}}>
          <thead><tr style={{background:"var(--surface-2)"}}>
            {["จัดการ","รหัส Agenda","ชื่อการประชุม","ประเภท","สถานะ","วันที่ / เวลา","สถานที่","ผู้สร้าง","ผู้เข้าร่วม","วาระ"].map(h=>(
              <th key={h} style={{padding:"11px 16px",textAlign:"left",color:"var(--text-mute)",fontWeight:600,fontSize:12,borderBottom:"1px solid var(--border-soft)",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {visible.map(a=>{
              const organizer = db.users.find(u=>u.id===a.organizerId);
              const involved = isInvolvedInAgenda(a,currentUser);
              const canEdit = canEditAgenda(a,currentUser);
              return <tr key={a.id} className="row-hover" style={{borderBottom:"1px solid var(--border-soft)"}}>
                <td style={TD}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Tooltip label="ดูรายละเอียด" dir="t">
                      <button onClick={()=>openView(a)} style={{width:32,height:32,background:"var(--accent-soft)",border:"none",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                        <Icon n="eye" s={{fontSize:15,color:"var(--accent)"}}/>
                      </button>
                    </Tooltip>
                    {canEdit && <Tooltip label="แก้ไข" dir="t">
                      <button onClick={()=>openEdit(a)} style={{width:32,height:32,background:"var(--surface-2)",border:"none",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                        <Icon n="edit" s={{fontSize:15,color:"var(--text-mute)"}}/>
                      </button>
                    </Tooltip>}
                  </div>
                </td>
                <td style={TD}><span style={{fontFamily:"monospace",fontSize:12,fontWeight:600,color:"var(--text-sub)"}}>{a.code}</span></td>
                <td style={TD}>
                  <p style={{fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",maxWidth:230,overflow:"hidden",textOverflow:"ellipsis"}}>{a.title}</p>
                  {isAdmin && involved && <span style={{fontSize:10.5,color:"var(--accent)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:3,marginTop:2}}>
                    <Icon n="user-check" s={{fontSize:11,color:"var(--accent)"}}/>คุณเกี่ยวข้อง
                  </span>}
                </td>
                <td style={TD}>
                  <span style={{fontSize:11.5,fontWeight:600,padding:"3px 10px",borderRadius:20,
                    background:a.meetingType==="continued"?"#FFF7ED":"var(--accent-soft)",
                    color:a.meetingType==="continued"?"#C2410C":"var(--accent)"}}>
                    {a.meetingType==="continued"?"ต่อเนื่อง":"ใหม่"}
                  </span>
                </td>
                <td style={TD}>
                  {(()=>{ const st=AGENDA_STATUS_META[getAgendaStatus(a,db)]; return (
                    <span style={{fontSize:11.5,fontWeight:600,padding:"3px 10px",borderRadius:20,
                      background:st.bg,color:st.color,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                      <Icon n={st.icon} s={{fontSize:11,color:st.color}}/>{st.label}
                    </span>
                  );})()}
                </td>
                <td style={TD}>
                  <p style={{fontSize:13,color:"var(--text-sub)"}}>{a.date}</p>
                  <p style={{fontSize:11.5,color:"var(--text-faint)"}}>{a.start}-{a.end} น.</p>
                </td>
                <td style={TD}><span style={{fontSize:12.5,color:"var(--text-mute)"}}>{agendaLocationLabel(a,db)}</span></td>
                <td style={TD}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Avatar user={organizer} size={26}/>
                    <span style={{fontSize:12.5,color:"var(--text-sub)",whiteSpace:"nowrap"}}>{organizer?.firstName||"—"}</span>
                  </div>
                </td>
                <td style={TD}><span style={{fontSize:12.5,color:"var(--text-mute)"}}>{(a.participantIds||[]).length} คน</span></td>
                <td style={TD}><span style={{fontSize:12.5,color:"var(--text-mute)"}}>{(a.items||[]).length} วาระ</span></td>
              </tr>;
            })}
            {visible.length===0 && <tr><td colSpan={10} style={{padding:"48px",textAlign:"center",color:"var(--text-ghost)"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                <Icon n="clipboard" s={{fontSize:36,color:"var(--text-ghost)"}}/> ยังไม่มี Agenda ที่ตรงกับเงื่อนไข
              </div>
            </td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 20px",fontSize:12,color:"var(--text-faint)",borderTop:"1px solid var(--border-soft)",background:"var(--surface-2)",display:"flex",alignItems:"center",gap:6}}>
        <Icon n="clipboard" s={{fontSize:14,color:"var(--text-faint)"}}/> ทั้งหมด {visible.length} รายการ
      </div>
    </div>
  </div>;
}

/* ════════════════════════ MOM (สรุปการประชุม) ════════════════════════ */
/* โครงสร้างตารางเตรียมไว้ล่วงหน้า (mirror รูปแบบเดียวกับ AgendaPage) — ยังไม่ผูกข้อมูลจริง
   เพราะกำลังจะออกแบบฟีเจอร์ MOM ใหม่ทั้งหมด ตอนนี้แสดงเป็นหน้าว่างไว้ก่อน */
function MomPage({db,updateDB,currentUser,showToast,askConfirm,closeConfirm,openAgendaId,onOpenAgenda}){
  const deepLinked = openAgendaId
    ? (db.agendas||[]).find(a=>a.id===openAgendaId && ["done","done_continued"].includes(getAgendaStatus(a,db)))
    : null;
  const [view,setView] = useState(deepLinked ? "detail" : "list");
  const [selected,setSelected] = useState(deepLinked || null);
  const [search,setSearch] = useState("");
  const [typeFilter,setTypeFilter] = useState("all");
  const [momFilter,setMomFilter] = useState("all");
  const [onlyMine,setOnlyMine] = useState(false);

  const isAdmin = currentUser?.role==="แอดมิน";

  const openView = agenda => { setSelected(agenda); setView("detail"); };
  const backToList = () => { setSelected(null); setView("list"); };

  const saveMom = (agenda, data) => {
    const now = new Date().toISOString();
    const oldMinutes = db.minutes || [];
    const existing = oldMinutes.find(m=>m.agendaId===agenda.id);
    const nextMom = {
      ...(existing || {agendaId:agenda.id, createdAt:now}),
      ...data,
      agendaId:agenda.id,
      updatedBy:currentUser.id,
      updatedAt:now,
    };
    const nd = {...db, minutes: existing
      ? oldMinutes.map(m=>m.agendaId===agenda.id ? nextMom : m)
      : [...oldMinutes, nextMom]};
    updateDB(nd);
    showToast(data.status==="published" ? "เผยแพร่ MOM แล้ว" : "บันทึกฉบับร่าง MOM แล้ว");
  };

  if(view==="detail" && selected){
    const fresh = (db.agendas||[]).find(a=>a.id===selected.id) || selected;
    return <MomDetail db={db} agenda={fresh} currentUser={currentUser} onBack={backToList} onSave={saveMom} onOpenAgenda={onOpenAgenda}/>;
  }

  const visible = (db.agendas||[])
    .filter(a=> canSeeAgenda(a,currentUser))
    .filter(a=> ["done","done_continued"].includes(getAgendaStatus(a,db)))
    .filter(a=> !onlyMine || isInvolvedInAgenda(a,currentUser))
    .filter(a=> typeFilter==="all" || a.meetingType===typeFilter)
    .filter(a=>{
      const mom = (db.minutes||[]).find(m=>m.agendaId===a.id);
      return momFilter==="all" || (momFilter==="none" ? !mom : (mom?.status||"draft")===momFilter);
    })
    .filter(a=> !search || a.title.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=> (b.date+b.start).localeCompare(a.date+a.start));

  return <div className="fu">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:16,flexWrap:"wrap"}}>
      <PageHeader title="สรุปการประชุม" subtitle="แสดง Agenda ที่เสร็จสิ้นแล้ว และบันทึก Minutes of Meeting แยกจากข้อมูล Agenda"/>
    </div>

    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
      <div style={{position:"relative",flex:"1 1 260px",minWidth:220}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",display:"flex"}}>
          <Icon n="search" s={{fontSize:17,color:"var(--text-ghost)"}}/>
        </span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาด้วยรหัส Agenda หรือชื่อการประชุม..." style={{...IS,paddingLeft:42}}/>
      </div>
      <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...IS,width:"auto",minWidth:170,cursor:"pointer"}}>
        <option value="all">ทุกประเภท</option>
        <option value="new">การประชุมใหม่</option>
        <option value="continued">การประชุมต่อเนื่อง</option>
      </select>
      <select value={momFilter} onChange={e=>setMomFilter(e.target.value)} style={{...IS,width:"auto",minWidth:170,cursor:"pointer"}}>
        <option value="all">ทุกสถานะ MOM</option>
        <option value="none">ยังไม่กรอก</option>
        <option value="draft">ฉบับร่าง</option>
        <option value="published">เผยแพร่แล้ว</option>
      </select>
      {isAdmin && <button onClick={()=>setOnlyMine(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
        border:`1.5px solid ${onlyMine?"var(--accent)":"var(--border-2)"}`,borderRadius:10,
        background:onlyMine?"var(--accent-soft)":"var(--surface)",
        color:onlyMine?"var(--accent)":"var(--text-mute)",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
        <Icon n="user-check" s={{fontSize:15,color:onlyMine?"var(--accent)":"var(--text-mute)"}}/>
        เฉพาะที่ฉันเกี่ยวข้อง
      </button>}
    </div>

    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5}}>
          <thead><tr style={{background:"var(--surface-2)"}}>
            {["จัดการ","รหัส Agenda","ชื่อการประชุม","ประเภท","สถานะ Agenda","สถานะ MOM","วันที่ / เวลา","สถานที่","ผู้สร้าง","Action Items"].map(h=>(
              <th key={h} style={{padding:"11px 16px",textAlign:"left",color:"var(--text-mute)",fontWeight:600,fontSize:12,borderBottom:"1px solid var(--border-soft)",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {visible.map(a=>{
              const organizer = db.users.find(u=>u.id===a.organizerId);
              const mom = (db.minutes||[]).find(m=>m.agendaId===a.id);
              const canEdit = canEditAgenda(a,currentUser);
              const st = AGENDA_STATUS_META[getAgendaStatus(a,db)];
              const momStatus = mom?.status || "draft";
              const actionDone = (mom?.actionItems||[]).filter(x=>x.done).length;
              return <tr key={a.id} className="row-hover" style={{borderBottom:"1px solid var(--border-soft)"}}>
                <td style={TD}>
                  <Tooltip label={canEdit?"ดู/กรอก MOM":"ดู MOM"} dir="t">
                    <button onClick={()=>openView(a)} style={{width:32,height:32,background:canEdit?"var(--accent-soft)":"var(--surface-2)",border:"none",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                      <Icon n={canEdit?"edit":"eye"} s={{fontSize:15,color:canEdit?"var(--accent)":"var(--text-mute)"}}/>
                    </button>
                  </Tooltip>
                </td>
                <td style={TD}><span style={{fontFamily:"monospace",fontSize:12,fontWeight:600,color:"var(--text-sub)"}}>{a.code}</span></td>
                <td style={TD}><p style={{fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",maxWidth:260,overflow:"hidden",textOverflow:"ellipsis"}}>{a.title}</p></td>
                <td style={TD}>
                  <span style={{fontSize:11.5,fontWeight:600,padding:"3px 10px",borderRadius:20,
                    background:a.meetingType==="continued"?"#FFF7ED":"var(--accent-soft)",
                    color:a.meetingType==="continued"?"#C2410C":"var(--accent)"}}>
                    {a.meetingType==="continued"?"ต่อเนื่อง":"ใหม่"}
                  </span>
                </td>
                <td style={TD}>
                  <span style={{fontSize:11.5,fontWeight:600,padding:"3px 10px",borderRadius:20,
                    background:st.bg,color:st.color,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                    <Icon n={st.icon} s={{fontSize:11,color:st.color}}/>{st.label}
                  </span>
                </td>
                <td style={TD}><MomStatusBadge status={mom ? momStatus : "none"}/></td>
                <td style={TD}>
                  <p style={{fontSize:13,color:"var(--text-sub)"}}>{a.date}</p>
                  <p style={{fontSize:11.5,color:"var(--text-faint)"}}>{a.start}-{a.end} น.</p>
                </td>
                <td style={TD}><span style={{fontSize:12.5,color:"var(--text-mute)"}}>{agendaLocationLabel(a,db)}</span></td>
                <td style={TD}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Avatar user={organizer} size={26}/>
                    <span style={{fontSize:12.5,color:"var(--text-sub)",whiteSpace:"nowrap"}}>{organizer?.firstName||"—"}</span>
                  </div>
                </td>
                <td style={TD}><span style={{fontSize:12.5,color:"var(--text-mute)"}}>{mom ? `${actionDone}/${(mom.actionItems||[]).length} เสร็จ` : "—"}</span></td>
              </tr>;
            })}
            {visible.length===0 && <tr><td colSpan={10} style={{padding:"48px",textAlign:"center",color:"var(--text-ghost)"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                <Icon n="file-text" s={{fontSize:36,color:"var(--text-ghost)"}}/>
                <span>ยังไม่มี Agenda ที่เสร็จสิ้นตรงกับเงื่อนไข</span>
                <span style={{fontSize:12}}>หน้านี้จะแสดงเฉพาะ Agenda สถานะเสร็จสิ้น หรือเสร็จสิ้น (ต่อเนื่อง)</span>
              </div>
            </td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 20px",fontSize:12,color:"var(--text-faint)",borderTop:"1px solid var(--border-soft)",background:"var(--surface-2)",display:"flex",alignItems:"center",gap:6}}>
        <Icon n="file-text" s={{fontSize:14,color:"var(--text-faint)"}}/> ทั้งหมด {visible.length} รายการ
      </div>
    </div>
  </div>;
}

function MomStatusBadge({status}){
  const meta = {
    none:{label:"ยังไม่กรอก",bg:"#F1F5F9",color:"#64748B",icon:"info"},
    draft:{label:"ฉบับร่าง",bg:"#FFF7ED",color:"#C2410C",icon:"edit"},
    published:{label:"เผยแพร่แล้ว",bg:"#E7F6EC",color:"#1A7F37",icon:"check-circle"},
  }[status] || {};
  return <span style={{fontSize:11.5,fontWeight:600,padding:"3px 10px",borderRadius:20,
    background:meta.bg,color:meta.color,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
    <Icon n={meta.icon} s={{fontSize:11,color:meta.color}}/>{meta.label}
  </span>;
}

function emptyMomForAgenda(agenda){
  return {
    agendaId:agenda.id,
    overview:"",
    agendaResults:(agenda.items||[]).map(it=>({itemId:it.id,result:""})),
    actionItems:[],
    status:"draft",
  };
}

function normalizeMom(mom, agenda){
  const base = mom || emptyMomForAgenda(agenda);
  const agendaResults = (agenda.items||[]).map(it=>{
    const existing = (base.agendaResults||[]).find(r=>String(r.itemId)===String(it.id));
    return {itemId:it.id,result:existing?.result||""};
  });
  return {...base, agendaResults, actionItems:base.actionItems||[], status:base.status||"draft"};
}

function MomDetail({db,agenda,currentUser,onBack,onSave,onOpenAgenda}){
  const savedMom = (db.minutes||[]).find(m=>m.agendaId===agenda.id);
  const [form,setForm] = useState(()=>normalizeMom(savedMom, agenda));
  const canEdit = canEditAgenda(agenda,currentUser);
  const organizer = db.users.find(u=>u.id===agenda.organizerId);
  const room = agenda.roomId ? db.rooms.find(r=>r.id===agenda.roomId) : null;
  const participants = db.users.filter(u=>(agenda.participantIds||[]).includes(u.id));
  const disabled = !canEdit;

  const setAgendaResult = (itemId, result) => setForm(f=>({
    ...f,
    agendaResults:(f.agendaResults||[]).map(r=>String(r.itemId)===String(itemId)?{...r,result}:r)
  }));
  const addAction = () => setForm(f=>({
    ...f,
    actionItems:[...(f.actionItems||[]), {id:Date.now(), task:"", ownerId:"", dueDate:"", done:false}]
  }));
  const updateAction = (id, patch) => setForm(f=>({
    ...f,
    actionItems:(f.actionItems||[]).map(a=>a.id===id?{...a,...patch}:a)
  }));
  const removeAction = id => setForm(f=>({...f, actionItems:(f.actionItems||[]).filter(a=>a.id!==id)}));
  const doSave = () => onSave(agenda, form);

  return <div className="fu">
    <button onClick={onBack} style={{background:"none",border:"none",color:"var(--text-faint)",cursor:"pointer",
      display:"flex",alignItems:"center",gap:5,fontSize:13,padding:0,marginBottom:14}}>
      <Icon n="arrow-left" s={{fontSize:13,color:"var(--text-faint)"}}/> สรุปการประชุม
    </button>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap",marginBottom:14}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",marginBottom:5}}>{agenda.title}</h1>
        <p style={{fontSize:13,color:"var(--text-faint)"}}>รหัส {agenda.code} · สร้างโดย {organizer?.prefix}{organizer?.firstName} {organizer?.lastName}</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <MomStatusBadge status={savedMom ? form.status : "none"}/>
        <BtnSec onClick={()=>onOpenAgenda(agenda.id)} icon="clipboard" style={{width:"auto",padding:"0 18px",height:44}}>ดู Agenda</BtnSec>
        {canEdit && <BtnPri onClick={doSave} icon="save" style={{width:"auto",padding:"0 22px",height:44}}>บันทึก MOM</BtnPri>}
      </div>
    </div>

    {!canEdit && <AlertBox type="info" msg="คุณมีสิทธิ์ดู MOM ได้อย่างเดียว เฉพาะผู้สร้าง Agenda หรือแอดมินเท่านั้นที่แก้ไข MOM ได้" style={{marginBottom:18}}/>}

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
      <div>
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="info" title="ข้อมูล Agenda (อ่านอย่างเดียว)"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
            <DetailField icon="calendar" label="วันที่" value={agenda.date}/>
            <DetailField icon="clock" label="เวลา" value={`${agenda.start} - ${agenda.end} น.`}/>
            <DetailField icon="map-pin" label="สถานที่" value={agenda.locationMode==="offsite" ? agenda.offsiteLocation : `${room?.name||"—"} (${agenda.place})`}/>
            <DetailField icon="video" label="ลิงก์ออนไลน์" value={agenda.hasOnlineLink ? agenda.onlineLink : "ไม่มี"}/>
          </div>
          <p style={{fontSize:12,color:"var(--text-faint)",marginBottom:6,fontWeight:600}}>วัตถุประสงค์การประชุม</p>
          <p style={{fontSize:13.5,color:"var(--text-sub)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{agenda.objective||"—"}</p>
          {agenda.details && <>
            <p style={{fontSize:12,color:"var(--text-faint)",margin:"16px 0 6px",fontWeight:600}}>รายละเอียดเพิ่มเติม</p>
            <p style={{fontSize:13.5,color:"var(--text-sub)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{agenda.details}</p>
          </>}
        </div>

        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="file-text" title="สรุปภาพรวมการประชุม"/>
          <textarea value={form.overview||""} readOnly={disabled} onChange={e=>setForm(f=>({...f,overview:e.target.value}))}
            placeholder="กรอกสรุปภาพรวมการประชุม..." style={{...IS,minHeight:110,resize:"vertical",lineHeight:1.6,background:disabled?"var(--surface-2)":"var(--input-bg)"}}/>
        </div>

        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="list" title="ผลการประชุมแยกตามวาระ"/>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {(agenda.items||[]).map((it,idx)=>{
              const result = (form.agendaResults||[]).find(r=>String(r.itemId)===String(it.id))?.result || "";
              return <div key={it.id} style={{paddingBottom:14,borderBottom:idx<agenda.items.length-1?"1px solid var(--border-soft)":"none"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                  <span style={{width:26,height:26,borderRadius:7,background:"var(--accent-soft)",color:"var(--accent)",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{idx+1}</span>
                  <p style={{fontSize:13.5,fontWeight:600,color:"var(--text-sub)",paddingTop:3}}>{it.detail}</p>
                </div>
                <textarea value={result} readOnly={disabled} onChange={e=>setAgendaResult(it.id,e.target.value)}
                  placeholder="กรอกผลการประชุมของวาระนี้..." style={{...IS,minHeight:82,resize:"vertical",lineHeight:1.6,background:disabled?"var(--surface-2)":"var(--input-bg)"}}/>
              </div>;
            })}
            {(!agenda.items || agenda.items.length===0) && <p style={{fontSize:13,color:"var(--text-faint)"}}>ไม่มีวาระการประชุม</p>}
          </div>
        </div>

        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px",marginBottom:18,boxShadow:"var(--shadow)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:14}}>
            <CardHead icon="check-circle" title="Action Items"/>
            {canEdit && <BtnSec onClick={addAction} icon="plus" style={{width:"auto",padding:"0 14px",height:36}}>เพิ่มงาน</BtnSec>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(form.actionItems||[]).map((a,idx)=>(
              <div key={a.id} style={{display:"grid",gridTemplateColumns:"minmax(220px,1.7fr) minmax(160px,1fr) 150px 78px 36px",gap:10,alignItems:"center"}}>
                <input value={a.task||""} readOnly={disabled} onChange={e=>updateAction(a.id,{task:e.target.value})} placeholder={`งานที่ต้องทำ #${idx+1}`} style={{...IS,background:disabled?"var(--surface-2)":"var(--input-bg)"}}/>
                <select value={a.ownerId||""} disabled={disabled} onChange={e=>updateAction(a.id,{ownerId:e.target.value?Number(e.target.value):""})} style={{...IS,cursor:disabled?"default":"pointer",background:disabled?"var(--surface-2)":"var(--input-bg)"}}>
                  <option value="">ผู้รับผิดชอบ</option>
                  {participants.map(u=><option key={u.id} value={u.id}>{u.prefix}{u.firstName} {u.lastName}</option>)}
                </select>
                <input type="date" value={a.dueDate||""} readOnly={disabled} onChange={e=>updateAction(a.id,{dueDate:e.target.value})} style={{...IS,background:disabled?"var(--surface-2)":"var(--input-bg)"}}/>
                <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12.5,color:"var(--text-sub)",cursor:disabled?"default":"pointer"}}>
                  <input type="checkbox" checked={!!a.done} disabled={disabled} onChange={e=>updateAction(a.id,{done:e.target.checked})}/> เสร็จ
                </label>
                {canEdit ? <button onClick={()=>removeAction(a.id)} style={{width:34,height:34,border:"none",borderRadius:8,background:"#FEF2F2",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <Icon n="x" s={{fontSize:15,color:"#B42318"}}/>
                </button> : <span/>}
              </div>
            ))}
            {(form.actionItems||[]).length===0 && <p style={{fontSize:13,color:"var(--text-faint)"}}>ยังไม่มี Action Items</p>}
          </div>
        </div>
      </div>

      <div>
        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:22,marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="settings" title="สถานะ MOM"/>
          <select value={form.status||"draft"} disabled={disabled} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
            style={{...IS,cursor:disabled?"default":"pointer",background:disabled?"var(--surface-2)":"var(--input-bg)"}}>
            <option value="draft">ฉบับร่าง</option>
            <option value="published">เผยแพร่แล้ว</option>
          </select>
        </div>

        <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:22,marginBottom:18,boxShadow:"var(--shadow)"}}>
          <CardHead icon="users" title={`ผู้เข้าร่วม (${participants.length})`}/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {participants.map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar user={u} size={32}/>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.prefix}{u.firstName} {u.lastName}</p>
                  <p style={{fontSize:11,color:"var(--text-faint)"}}>{u.department}</p>
                </div>
              </div>
            ))}
            {participants.length===0 && <p style={{fontSize:13,color:"var(--text-faint)"}}>ไม่มีผู้เข้าร่วม</p>}
          </div>
          {agenda.hasExternal && <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--border-soft)"}}>
            <p style={{fontSize:12,fontWeight:600,color:"var(--text-faint)",marginBottom:6}}>ผู้เข้าร่วมภายนอก</p>
            <p style={{fontSize:13,color:"var(--text-sub)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{agenda.externalParticipants}</p>
          </div>}
        </div>
      </div>
    </div>
  </div>;
}


function ReportsPage({db}){
  const [range, setRange] = useState("month"); // week | month | all

  const today = new Date();
  const inRange = (dateStr) => {
    if(range==="all") return true;
    const d = new Date(dateStr);
    const diffDays = (today - d) / 86400000;
    if(range==="week")  return diffDays>=0 && diffDays<=7;
    if(range==="month") return diffDays>=0 && diffDays<=30;
    return true;
  };

  const bookings = (db.bookings||[]).filter(b=>inRange(b.date));
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u=>u.status!=="disabled").length;
  const totalRooms = db.rooms.length;
  const activeRooms = db.rooms.filter(r=>r.status==="active").length;
  const totalBookings = bookings.length;
  const agendaCount = (db.agendas||[]).length;

  // bookings per room
  const byRoom = db.rooms.map(r=>({
    room:r, count: bookings.filter(b=>b.roomId===r.id).length
  })).sort((a,b)=>b.count-a.count);
  const maxRoomCount = Math.max(1, ...byRoom.map(x=>x.count));

  // bookings per department (via organizer)
  const deptCounts = {};
  bookings.forEach(b=>{
    const u = db.users.find(x=>x.id===b.organizerId);
    if(u){ deptCounts[u.department]=(deptCounts[u.department]||0)+1; }
  });
  const byDept = Object.entries(deptCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxDeptCount = Math.max(1, ...byDept.map(([,c])=>c));

  // role distribution
  const roleCounts = {"แอดมิน":0,"รายงาน":0,"ผู้ใช้งาน":0};
  db.users.forEach(u=>{ if(roleCounts[u.role]!=null) roleCounts[u.role]++; });

  const RANGE_LABEL = {week:"7 วันล่าสุด", month:"30 วันล่าสุด", all:"ทั้งหมด"};

  return <div className="fu">
    <PageHeader title="รายงาน" subtitle="ภาพรวมการใช้งานระบบและสถิติการประชุม"/>

    {/* range filter */}
    <div style={{display:"flex",gap:8,marginBottom:24}}>
      {Object.entries(RANGE_LABEL).map(([key,label])=>(
        <button key={key} onClick={()=>setRange(key)}
          style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",
            border:range===key?"1.5px solid var(--accent)":"1.5px solid var(--border-2)",
            background:range===key?"var(--accent-soft)":"var(--surface)",
            color:range===key?"var(--accent)":"var(--text-mute)"}}>
          {label}
        </button>
      ))}
    </div>

    {/* stat cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:16,marginBottom:24}}>
      {[
        {label:"การจองห้องประชุม", value:totalBookings, icon:"calendar-plus", accent:"var(--accent)", bg:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))"},
        {label:"ผู้ใช้งานทั้งหมด",  value:`${activeUsers}/${totalUsers}`, icon:"users",       accent:"#2E9E5B", bg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)"},
        {label:"ห้องประชุมพร้อมใช้", value:`${activeRooms}/${totalRooms}`, icon:"building",    accent:"#7C3AED", bg:"linear-gradient(135deg,#EDE9FE,#DDD6FE)"},
        {label:"บันทึกการประชุม (Agenda)", value:agendaCount, icon:"clipboard",  accent:"#0891B2", bg:"linear-gradient(135deg,#E0F7FA,#B2EBF2)"},
      ].map(s=>(
        <div key={s.label} style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"20px 20px 18px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{width:44,height:44,background:s.bg,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
            <Icon n={s.icon} s={{fontSize:22,color:s.accent}}/>
          </div>
          <p style={{fontSize:26,fontWeight:700,marginBottom:4,color:"var(--text)",lineHeight:1}}>{s.value}</p>
          <p style={{fontSize:13,color:"var(--text-mute)"}}>{s.label}</p>
        </div>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:18,marginBottom:18}}>
      {/* bookings per room */}
      <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:34,height:34,background:"var(--accent-soft)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon n="building" s={{fontSize:17,color:"var(--accent)"}}/>
          </div>
          <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>การใช้งานห้องประชุม</h3>
        </div>
        {byRoom.length===0 && <p style={{fontSize:13,color:"var(--text-ghost)"}}>ไม่มีข้อมูล</p>}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {byRoom.map(({room,count})=>(
            <div key={room.id}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:500,color:"var(--text-sub)"}}>{room.name}</span>
                <span style={{fontSize:13,fontWeight:600,color:"var(--accent)"}}>{count} ครั้ง</span>
              </div>
              <div style={{height:8,background:"var(--bg)",borderRadius:6,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(count/maxRoomCount)*100}%`,
                  background:"linear-gradient(90deg,var(--accent),var(--accent-grad2))",borderRadius:6,transition:"width .3s"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* role distribution */}
      <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:34,height:34,background:"#EDE9FE",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon n="shield" s={{fontSize:17,color:"#7C3AED"}}/>
          </div>
          <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>สัดส่วนบทบาทผู้ใช้งาน</h3>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {Object.entries(roleCounts).map(([role,count])=>{
            const rs = ROLE_STYLE[role];
            const pct = totalUsers ? Math.round((count/totalUsers)*100) : 0;
            return (
              <div key={role}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:500,color:"var(--text-sub)",display:"flex",alignItems:"center",gap:6}}>
                    <Icon n={rs.icon} s={{fontSize:13,color:rs.color}}/>{role}
                  </span>
                  <span style={{fontSize:13,fontWeight:600,color:rs.color}}>{count} คน ({pct}%)</span>
                </div>
                <div style={{height:8,background:"var(--bg)",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:rs.color,borderRadius:6,transition:"width .3s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* bookings per department */}
    <div style={{background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)",padding:"22px 24px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{width:34,height:34,background:"#E0F7FA",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="bar-chart" s={{fontSize:17,color:"#0891B2"}}/>
        </div>
        <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>แผนกที่จองห้องประชุมมากที่สุด ({RANGE_LABEL[range]})</h3>
      </div>
      {byDept.length===0 && <p style={{fontSize:13,color:"var(--text-ghost)"}}>ไม่มีข้อมูลในช่วงเวลานี้</p>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {byDept.map(([dept,count])=>(
          <div key={dept}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:500,color:"var(--text-sub)"}}>{dept}</span>
              <span style={{fontSize:13,fontWeight:600,color:"#0891B2"}}>{count} ครั้ง</span>
            </div>
            <div style={{height:8,background:"var(--bg)",borderRadius:6,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(count/maxDeptCount)*100}%`,background:"#0891B2",borderRadius:6,transition:"width .3s"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

/* ════════════════════════ PLACEHOLDER ════════════════════════ */
function PlaceholderPage({icon,title,subtitle}){
  return <div className="fu" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:380}}>
    <div style={{width:80,height:80,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",borderRadius:22,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:22,boxShadow:"0 4px 18px rgba(26,95,168,.12)"}}>
      <Icon n={icon} s={{fontSize:40,color:"var(--accent)"}}/>
    </div>
    <h2 style={{fontSize:21,fontWeight:700,marginBottom:8,color:"var(--text)"}}>{title}</h2>
    <p style={{fontSize:14,color:"var(--text-faint)"}}>{subtitle}</p>
  </div>;
}

/* ════════════════════════ SHARED ATOMS ════════════════════════ */
function PageHeader({title,subtitle}){ return <div style={{marginBottom:28}}><h1 style={{fontSize:24,fontWeight:700,color:"var(--text)",marginBottom:5}}>{title}</h1><p style={{color:"var(--text-faint)",fontSize:14}}>{subtitle}</p></div>; }
function CardHead({icon,title}){ return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}><div style={{width:38,height:38,background:"linear-gradient(135deg,var(--accent-soft),var(--accent-soft2))",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n={icon} s={{fontSize:19,color:"var(--accent)"}}/></div><h3 style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{title}</h3></div>; }
function Avatar({user,size=34}){
  if(user?.photo){
    return <img src={user.photo} alt={user.firstName}
      style={{width:size,height:size,borderRadius:"50%",flexShrink:0,objectFit:"cover",
        border:`${size>40?3:2}px solid var(--accent-soft)`}}/>;
  }
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
    background:"linear-gradient(135deg,var(--accent-soft2),#C8E6C9)",
    display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:size*0.35,fontWeight:700,color:"var(--accent)",
    border:`${size>40?3:2}px solid var(--accent-soft)`}}>
    {user?.firstName?.[0]}{user?.lastName?.[0]}
  </div>;
}

/* ── AvatarUpload: clickable avatar with upload overlay ── */
function AvatarUpload({user,size=72,onUpload}){
  const [hover,setHover]=useState(false);
  const [err,setErr]=useState("");
  const ref=useRef();

  const handleFile=e=>{
    const file=e.target.files?.[0]; if(!file) return;
    if(!file.type.startsWith("image/")){setErr("รองรับเฉพาะไฟล์รูปภาพ"); return;}
    if(file.size>10*1024*1024){setErr("ขนาดไฟล์ต้องไม่เกิน 10 MB"); return;}
    setErr("");
    const reader=new FileReader();
    reader.onload=ev=>onUpload(ev.target.result);
    reader.readAsDataURL(file);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{position:"relative",display:"inline-block",cursor:"pointer"}}
        onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        onClick={()=>ref.current.click()}>
        <Avatar user={user} size={size}/>
        {/* overlay */}
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          background:"rgba(0,0,0,.45)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,
          opacity:hover?1:0,transition:"opacity .18s",cursor:"pointer"}}>
          <Icon n="save" s={{fontSize:18,color:"#fff"}}/>
          <span style={{fontSize:9,color:"#fff",fontWeight:600,letterSpacing:".04em"}}>เปลี่ยนรูป</span>
        </div>
        <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
      </div>
      {err && <p style={{fontSize:11,color:"#B42318",margin:0}}>{err}</p>}
      {!err && <p style={{fontSize:11,color:"var(--text-faint)",margin:0}}>คลิกที่รูปเพื่อเปลี่ยน · ไม่เกิน 10 MB</p>}
    </div>
  );
}
function GreenBadge({children}){ return <span style={{fontSize:12,background:"#ECFDF5",color:"#065F46",padding:"5px 12px",borderRadius:20,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}><Icon n="check-circle" s={{fontSize:12,color:"#065F46"}}/>{children}</span>; }

function AlertBox({type,msg,style={}}){
  const C={error:{bg:"#FEF2F2",color:"#991B1B",border:"#FECACA",ic:"alert-circle"},success:{bg:"#F0FDF4",color:"#14532D",border:"#BBF7D0",ic:"check-circle"},info:{bg:"#EFF6FF",color:"#1E3A8A",border:"#BFDBFE",ic:"info"}}[type]||{bg:"#F3F4F6",color:"var(--text-sub)",border:"var(--border-2)",ic:"info"};
  return <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"flex-start",gap:9,...style}}>
    <Icon n={C.ic} s={{fontSize:16,color:C.color,marginTop:1,flexShrink:0}}/><p style={{fontSize:13,color:C.color,lineHeight:1.55}}>{msg}</p>
  </div>;
}

function ErrMsg({children}){ return <p style={{color:"#B42318",fontSize:12,marginTop:4,display:"flex",alignItems:"center",gap:4}}><Icon n="alert-circle" s={{fontSize:12,color:"#B42318"}}/>{children}</p>; }
function FL({label,error,children,right}){
  return <div style={{marginBottom:16}}>
    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,marginBottom:7}}>
      <label style={{...LS,marginBottom:0}}>{label}</label>
      {right}
    </div>
    {children}
    {error&&<ErrMsg>{error}</ErrMsg>}
  </div>;
}

function BtnPri({onClick,icon,children,style={}}){
  return <button onClick={onClick} className="btn-pri" style={{width:"100%",height:44,padding:"0 20px",background:"linear-gradient(135deg,var(--accent) 0%,var(--accent-grad2) 100%)",color:"#fff",border:"none",borderRadius:11,fontSize:14,fontWeight:600,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 2px 10px rgba(26,95,168,.28)",cursor:"pointer",...style}}>
    {icon&&<Icon n={icon} s={{fontSize:17,color:"#fff"}}/>}{children}
  </button>;
}
function BtnSec({onClick,icon,children,style={}}){
  return <button onClick={onClick} className="btn-sec" style={{height:44,padding:"0 20px",background:"var(--surface)",color:"var(--text-sub)",border:"1.5px solid var(--border-2)",borderRadius:11,fontSize:14,fontWeight:500,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",...style}}>
    {icon&&<Icon n={icon} s={{fontSize:17,color:"var(--text-mute)"}}/>}{children}
  </button>;
}

function Modal({children,onClose,wide}){
  return <div style={{position:"fixed",inset:0,background:"rgba(15,20,35,.48)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,animation:"fadeIn .18s ease"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="fu" style={{background:"var(--surface)",borderRadius:20,padding:"30px 32px",width:wide?630:440,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",position:"relative",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
      <button onClick={onClose} className="btn-sec" style={{position:"absolute",top:18,right:18,background:"var(--bg)",border:"none",borderRadius:9,width:34,height:34,padding:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <Icon n="x" s={{fontSize:17,color:"var(--text-mute)"}}/>
      </button>
      {children}
    </div>
  </div>;
}

const IS={width:"100%",padding:"10px 13px",border:"1.5px solid var(--border-2)",borderRadius:10,fontSize:14,color:"var(--text)",background:"var(--surface-2)",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
const LS={display:"block",fontSize:13,fontWeight:500,color:"var(--text-sub)",marginBottom:7};
const TD={padding:"12px 16px",color:"var(--text-sub)",verticalAlign:"middle"};
