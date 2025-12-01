import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilUser,
  cilSpeedometer,
  cilCursor,
  cilAddressBook,   // Employee Details
  cilChartLine,     // Employee Performance
  cilLockLocked     // Employee Credentials
} from "@coreui/icons";

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
    name: "Employee Details",
    to: "/admin/employeedetails",
    icon: <CIcon icon={cilAddressBook} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee Performance",
    to: "/admin/employeeperformance",
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee Credentials",
    to: "/admin/cards",
    icon: <CIcon icon={cilLockLocked} customClassName="nav-icon" />,
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
    to: "/admin/collapses",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Employee Performance",
    to: "/admin/carousels",
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
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
