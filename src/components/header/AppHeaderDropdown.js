
import React from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";


const AppHeaderDropdown = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "guest";
  const username = localStorage.getItem("username") || "User";

  const handleProfile = () => {
    if (role === "admin") navigate("/pages/adminprofile");
    else if (role === "employee") navigate("/pages/employeeprofile");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };



  const handleChangePassword = () =>{
    navigate('/base/list-groups')
  }

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" id="dropdown-basic">
        {role === "admin" ? "Admin" : role === "employee" ? "Employee" : "User"}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Header>Welcome, {username}</Dropdown.Header>
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleProfile}>Profile</Dropdown.Item>
       
        
        <Dropdown.Item onClick={handleChangePassword}>Change Password</Dropdown.Item>
        <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default AppHeaderDropdown;




/*
import React, { useEffect } from "react";
import {Link} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";




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
          <Link className="dropdown-item" to="/base/paginations">
            <i className="bi bi-person me-2"></i>
            Profile
          </Link>
        </li>
        <li>
          <Link className="dropdown-item" to="/base/list-groups">
           <i className="bi bi-key me-2"></i> Change Password
          </Link>
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

export default AppHeaderDropdown; */
