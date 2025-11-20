import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const AppHeaderDropdown = ({ userRole }) => {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  // Fetch data stored at login
  const fullName = localStorage.getItem("full_name") || "User";
  const role = (localStorage.getItem("role") || "").toLowerCase();

  const displayName = fullName;

  return (
    <div className="dropdown text-end">
      <button
        className="btn btn-link text-decoration-none text-dark dropdown-toggle fw-semibold"
        type="button"
        id="headerDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {displayName}
      </button>

      <ul
        className="dropdown-menu dropdown-menu-end shadow"
        aria-labelledby="headerDropdown"
      >
        <li>
          <Link
            className="dropdown-item"
            to={role === "admin" ? "/pages/profile" : "/pages/employeeprofile"}
          >
            <i className="bi bi-person-circle me-2"></i> Profile
          </Link>
        </li>

        <li>
          <Link className="dropdown-item" to="/pages/change-password">
            <i className="bi bi-shield-lock-fill me-2"></i> Change Password
          </Link>
        </li>

        <li>
          <button
            className="dropdown-item text-danger"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            <i className="bi bi-box-arrow-right me-2 text-danger"></i> Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AppHeaderDropdown;
