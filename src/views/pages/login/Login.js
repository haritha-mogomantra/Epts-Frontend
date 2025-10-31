import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  
  const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "manager", password: "manager123", role: "manager" },
    { username: "employee", password: "employee123", role: "employee" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      alert(`Welcome ${user.role}! Login successful.`);

      
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "manager") navigate("/manager-dashboard");
      else navigate("/employee-dashboard");
    } else {
      alert("Invalid username or password!");
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center align-items-center">
      <div className="card shadow-lg p-4" style={{ width: "400px", borderRadius: "15px" }}>
        <h3 className="text-center mb-4 text-primary">LOGIN</h3>

        <form onSubmit={handleSubmit}>
          
          <div className="mb-3">
            <label className="form-label fw-bold">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
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
            />
          </div>

          
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>

        
       <div className="text-center mt-3 text-muted small">
        © 2025 eGrovity
      </div>
      </div>
    </div>
  );
}
