








import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginDetails = () => {
  const API_URL = "http://127.0.0.1:8000/api/users/login-details/";
  const REGENERATE_URL = "http://127.0.0.1:8000/api/users/regenerate-password/";

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(null); // ✅ track per-row regen loading
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    currentPage: 1,
    totalCount: 0,
  });

  // ==================================================
  // FETCH EMPLOYEES — Use backend temp_password only
  // ==================================================
  const fetchEmployees = async (url = API_URL) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Failed to fetch employees");

      const employeesList = (data.results || []).map((emp) => ({
        ...emp,
        password: emp.temp_password || "",
      }));

      setEmployees(employeesList);
      setPagination({
        next: data.next,
        previous: data.previous,
        totalCount: data.count,
        currentPage: getPageNumberFromUrl(url) || 1,
      });

      // ✅ Save current page URL to localStorage
      localStorage.setItem("loginDetailsPageUrl", url);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setAlert({
        show: true,
        type: "danger",
        message: "Error fetching employee data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPageNumberFromUrl = (url) => {
    const match = url.match(/page=(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  useEffect(() => {
    // ✅ On mount, check if last viewed page exists in localStorage
    const savedUrl = localStorage.getItem("loginDetailsPageUrl");
    if (savedUrl) {
      fetchEmployees(savedUrl);
    } else {
      fetchEmployees(API_URL);
    }
  }, []);

  // ==================================================
  // PASSWORD REGENERATION (Backend Only)
  // ==================================================
  const regeneratePassword = async (empId) => {
    setRegenLoading(empId); // ✅ show loader for specific row
    try {
      const response = await fetch(`${REGENERATE_URL}${empId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Password regeneration failed");

      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp.emp_id === empId
            ? {
                ...emp,
                password: data.temp_password || data.password || "",
              }
            : emp
        )
      );

      setAlert({
        show: true,
        type: "success",
        message: data.message || `Password regenerated for ${empId}`,
      });

      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error regenerating password:", error);
      setAlert({
        show: true,
        type: "danger",
        message: `Failed to regenerate password for ${empId}.`,
      });
    } finally {
      setRegenLoading(null); // ✅ stop loader
    }
  };

  // ==================================================
  // SORTING
  // ==================================================
  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredData = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
      emp.username?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // ==================================================
  // PAGINATION
  // ==================================================
  const handleNextPage = () => pagination.next && fetchEmployees(pagination.next);
  const handlePreviousPage = () =>
    pagination.previous && fetchEmployees(pagination.previous);
  const handlePageClick = (pageNum) => {
    const newUrl = `${API_URL}?page=${pageNum}`;
    fetchEmployees(newUrl);
  };

  // ==================================================
  // RENDER UI
  // ==================================================
  return (
    <div className="container">
      <div className="text-dark mb-3">
        <h5>LOGIN CREDENTIALS</h5>
      </div>

      <div className="card shadow border-0">
        <div className="card-body">
          {/* Alert Message */}
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

          {/* Search Bar */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search Employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th
                    onClick={() => handleSort("emp_id")}
                    style={{ cursor: "pointer" }}
                  >
                    Emp ID {getSortIcon("emp_id")}
                  </th>
                  <th
                    onClick={() => handleSort("full_name")}
                    style={{ cursor: "pointer" }}
                  >
                    Name {getSortIcon("full_name")}
                  </th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      ></div>
                    </td>
                  </tr>
                ) : sortedData.length > 0 ? (
                  sortedData.map((emp) => (
                    <tr key={emp.emp_id}>
                      <td>{emp.emp_id}</td>
                      <td>{emp.full_name || "-"}</td>
                      <td>{emp.username}</td>
                      <td>
                        <input
                          type="text"
                          value={emp.password || emp.temp_password || ""}
                          className="form-control text-center"
                          style={{ width: "150px", margin: "auto" }}
                          readOnly
                        />
                      </td>
                      <td>
                        {regenLoading === emp.emp_id ? (
                          <div
                            className="spinner-border spinner-border-sm text-warning"
                            role="status"
                          ></div>
                        ) : (
                          <button
                            className="btn btn-warning btn-sm text-white"
                            onClick={() => regeneratePassword(emp.emp_id)}
                          >
                            Regenerate Password
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav>
            <ul className="pagination justify-content-end mt-3 mb-0">
              <li
                className={`page-item ${
                  !pagination.previous ? "disabled" : ""
                }`}
              >
                <button className="page-link" onClick={handlePreviousPage}>
                  Previous
                </button>
              </li>

              {(() => {
                const pageSize = 20;
                const totalPages = Math.ceil(pagination.totalCount / pageSize);
                const current = pagination.currentPage;
                const start = Math.max(1, current - 2);
                const end = Math.min(totalPages, start + 4);
                const pages = [];
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map((num) => (
                  <li
                    key={num}
                    className={`page-item ${num === current ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageClick(num)}
                    >
                      {num}
                    </button>
                  </li>
                ));
              })()}

              <li
                className={`page-item ${!pagination.next ? "disabled" : ""}`}
              >
                <button className="page-link" onClick={handleNextPage}>
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default LoginDetails;









/*
   import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginDetails = () => {
  const [employees, setEmployees] = useState([
    { id: "EMP001", name: "eswar", username: "eswar", password: "pass@123" },
    { id: "EMP002", name: "haritha", username: "haritha", password: "pass@456" },
    { id: "EMP003", name: "gopi", username: "gopi", password: "pass@789" },
    { id: "EMP004", name: "srinivas", username: "srinu", password: "pass@321" },
    { id: "EMP005", name: "sandeep", username: "sandy", password: "pass@654" },
    { id: "EMP006", name: "sravani", username: "sravs", password: "pass@147" },
  ]);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const recordsPerPage = 4;

  const filteredData = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      emp.username.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const currentData = sortedData.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const regeneratePassword = (empId) => {
    const newPass = Math.random().toString(36).slice(-8);
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === empId ? { ...emp, password: newPass } : emp
      )
    );

    // ✅ Show success alert instead of normal alert()
    setAlert({
      show: true,
      type: "success",
      message: `Password regenerated successfully for ${empId}.`,
    });

    // Auto hide alert after 3 seconds
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <div className="container">
      <div className="text-dark mb-3">
        <h5>LOGIN CREDENTIALS</h5>
      </div>

      <div className="card shadow border-0">
        <div className="card-body">
          
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

          <div className="mb-3">
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search Employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                    Emp ID {getSortIcon("id")}
                  </th>
                  <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                    Name {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("username")} style={{ cursor: "pointer" }}>
                    Username {getSortIcon("username")}
                  </th>
                  <th onClick={() => handleSort("password")} style={{ cursor: "pointer" }}>
                    Password {getSortIcon("password")}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.name}</td>
                      <td>{emp.username}</td>
                      <td>{emp.password}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm text-white"
                          onClick={() => regeneratePassword(emp.id)}
                        >
                          Regenerate Password
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

    
          <nav>
            <ul className="pagination justify-content-end mt-3 mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </button>
              </li>

              {[...Array(totalPages)].map((_, i) => (
                <li
                  key={i}
                  className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default LoginDetails;

*/