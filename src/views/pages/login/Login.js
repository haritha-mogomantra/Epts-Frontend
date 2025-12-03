

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../../../utils/axiosInstance";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false); // ✅ Added
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Show loader

    try {
      const response = await axiosInstance.post("users/login/", {
        username,
        password,
      });

      console.log("Response:", response.data);

      if (response.data.success === true) {
        const role = response.data.role?.toLowerCase();

        localStorage.setItem("access_token", response.data.token);
        localStorage.setItem("refresh_token", response.data.refresh);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("userId", response.data.emp_id);

        localStorage.setItem("full_name", response.data.full_name);
        localStorage.setItem("emp_id", response.data.emp_id);

        setAlert({
          show: true,
          message: `Welcome ${role}! Login successful.`,
          type: "success",
        });

        setTimeout(() => {
          if (role === "admin") {
            navigate("/dashboard");
          } else if (role === "manager") {
            navigate("/dashboard");
          } else if (role === "employee") {
            navigate("/employee-dashboard");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      } else {
        setAlert({
          show: true,
          message: response.data.message || "Invalid credentials!",
          type: "danger",
        });
      }
    } catch (error) {
      console.error("Login Error:", error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Server error! Please try again later.";

      setAlert({
        show: true,
        message,
        type: "danger",
      });
    } finally {
      setLoading(false); // ✅ Hide loader
    }
  };

  return (
    
    <div className="container mt-5">
      <div className="row justify-content-center">
     <div className="col-12 col-md-12 text-center mb-3">
        <img 
          src="/images/logo-purple.png" 
          alt="Logo" 
          className="img-fluid" 
          style={{ width: "240px" }} 
        />
    </div>
     <div className="clearfix"></div>
     <div className="col-md-5">
        <div className="card shadow-lg p-4"
          style={{ borderRadius: "15px" }} >
          
        <h3 className="text-center mb-4 text-primary fw-bold">LOGIN</h3>

          {alert.show && (
            <div
              className={`alert alert-${alert.type} alert-dismissible fade show`}
              role="alert"
            >
              {alert.message}
              <button
                type="button"
                className="btn-close"
                onClick={() => setAlert({ show: false, message: "", type: "" })}
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">
                Username / Emp ID / Email
              </label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username, emp ID, or email"
                disabled={loading} // ✅ Disable during loading
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                disabled={loading} // ✅ Disable during loading
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 d-flex justify-content-center align-items-center"
              disabled={loading} // ✅ Prevent multiple clicks
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="text-center mt-3 text-muted small">© 2025 eGrovity</div>
        </div>
      </div>
      <div className="clearfix"></div>
    </div>
  </div>
  );
}
