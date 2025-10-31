import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // ✅ Important: adds dropdown, modal, tooltip behavior

const AppHeaderDropdown = () => {
  useEffect(() => {
    // Optional: Initialize bootstrap JS if needed
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <div className="dropdown text-end">
      <button
        className="btn btn-link text-decoration-none text-dark dropdown-toggle fw-semibold"
        type="button"
        id="dropdownMenuButton"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Admin
      </button>

      <ul
        className="dropdown-menu dropdown-menu-end shadow"
        aria-labelledby="dropdownMenuButton"
      >
        <li>
          <a className="dropdown-item" href="#">
            <i className="bi bi-person me-2"></i>
            Profile
          </a>
        </li>

        <li>
          <a className="dropdown-item" href="#">
            <i className="bi bi-box-arrow-right me-2 text-dark"></i>
            Logout
          </a>
        </li>
      </ul>
    </div>
  );
};

export default AppHeaderDropdown;
