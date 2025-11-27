import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  CContainer,
  CDropdown,
  CDropdownHeader ,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  useColorModes,
  CBadge,
} from "@coreui/react";

import CIcon from "@coreui/icons-react";
import {
  cilBell,
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
} from "@coreui/icons";

import axios from "axios";
import { AppBreadcrumb } from "./index";
import { AppHeaderDropdown } from "./header/index";

const API_BASE = "http://localhost:8000/api/notifications/";

const AppHeader = () => {
  const headerRef = useRef();
  const dispatch = useDispatch();
  const sidebarShow = useSelector((state) => state.sidebarShow);
  const { colorMode, setColorMode } = useColorModes(
    "coreui-free-react-admin-template-theme"
  );

  const [userRole, setUserRole] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ==========================================================
  // 🔹 FUNCTIONS MUST COME BEFORE useEffect()
  // ==========================================================

  // Load unread notifications from Django
  const loadNotifications = () => {
    const token = localStorage.getItem("access_token");

    axios
      .get(`${API_BASE}?status=unread`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    const token = localStorage.getItem("access_token");

    await axios.patch(
      `${API_BASE}${id}/mark-read/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadNotifications(); // refresh
  };

  // ==========================================================
  // 1️⃣ Fetch USER ROLE
  // ==========================================================
  // Load role directly from login info
  useEffect(() => {
    const savedRole = localStorage.getItem("role");

    if (savedRole) {
      setUserRole(savedRole.toLowerCase());
    } else {
      setUserRole("guest");
    }
  }, []);


  // ==========================================================
  // 2️⃣ Load notifications when role becomes 'employee'
  // ==========================================================
  useEffect(() => {
    if (userRole === "employee") {
      loadNotifications();
    }
  }, [userRole]);

  // ==========================================================
  // 3️⃣ Auto-refresh notifications every 30s
  // ==========================================================
  useEffect(() => {
    if (userRole !== "employee") return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [userRole]);

  // ==========================================================
  // 4️⃣ Header shadow effect on scroll
  // ==========================================================
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        headerRef.current.classList.toggle(
          "shadow-sm",
          document.documentElement.scrollTop > 0
        );
      }
    };

    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  // ==========================================================
  // RENDER UI
  // ==========================================================
  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: "set", sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: "-14px" }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <CHeaderNav className="ms-auto align-items-center">

          {/* Notification Bell */}
          {userRole === "employee" && (
            <CDropdown variant="nav-item" placement="bottom-end">
              <CDropdownToggle caret={false}>
                <div style={{ position: "relative" }} title="Notifications">
                  <CIcon icon={cilBell} size="lg" />
                  {unreadCount > 0 && (
                    <CBadge
                      color="danger"
                      position="top-end"
                      shape="rounded-pill"
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-8px",
                        fontSize: "0.6rem",
                      }}
                    >
                      {unreadCount}
                    </CBadge>
                  )}
                </div>
              </CDropdownToggle>

              <CDropdownMenu className="pt-0">
                <CDropdownHeader>Notifications</CDropdownHeader>


                {notifications.length > 0 ? (
                  notifications.map((note) => (
                    <CDropdownItem key={note.id} onClick={() => markAsRead(note.id)}>
                      {note.meta_display}
                    </CDropdownItem>
                  ))
                ) : (
                  <CDropdownItem disabled>No new notifications</CDropdownItem>
                )}
              </CDropdownMenu>
            </CDropdown>
          )}

          {/* Divider */}
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* Theme Switch */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              {colorMode === "dark" ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === "auto" ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>

            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === "light"}
                as="button"
                onClick={() => setColorMode("light")}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>

              <CDropdownItem
                active={colorMode === "dark"}
                as="button"
                onClick={() => setColorMode("dark")}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>

              <CDropdownItem
                active={colorMode === "auto"}
                as="button"
                onClick={() => setColorMode("auto")}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          {/* Divider */}
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* Profile Dropdown */}
          <AppHeaderDropdown userRole={userRole} />
        </CHeaderNav>
      </CContainer>

      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  );
};

export default AppHeader;
