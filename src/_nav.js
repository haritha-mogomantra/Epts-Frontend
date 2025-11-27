import React from "react";
import CIcon from "@coreui/icons-react";
import { cilUser, cilSpeedometer, cilCursor } from "@coreui/icons";
import { CNavItem } from "@coreui/react";

// Read role from localStorage
const role = (localStorage.getItem("role") || "").toLowerCase();

// ===============================
// ADMIN MENU (NO DROPDOWNS)
// ===============================
const adminMenu = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee details",
    to: "/base/employeedetails",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee Performance",
    to: "/base/employeeperformance",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee credentials",
    to: "/base/cards",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Reports",
    to: "/buttons",
    icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
  },
];

// ===============================
// EMPLOYEE MENU (NO DROPDOWNS)
// ===============================
const employeeMenu = [
  {
    component: CNavItem,
    name: "Employee Dashboard",
    to: "/base/collapses",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee Performance",
    to: "/base/carousels",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
];

// ===============================
// FINAL ROLE-BASED MENU OUTPUT
// ===============================
let _nav = [];

if (role === "admin") _nav = [...adminMenu];
else if (role === "employee") _nav = [...employeeMenu];
else _nav = [...employeeMenu];

export default _nav;
