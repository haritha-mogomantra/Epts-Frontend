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
  const [allEmployees, setAllEmployees] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const fetchAllEmployees = async () => {
    try {
      let all = [];
      let page = 1;

      while (true) {
        const res = await fetch(`${API_URL}?page=${page}`);
        const data = await res.json();

        if (!data.results || data.results.length === 0) break;

        all.push(...data.results);

        if (!data.next) break;
        page++;
      }

      return all;
    } catch (error) {
      console.error("Error fetching all employees:", error);
      return [];
    }
  };

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

      // Save current page URL to localStorage
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
    const loadData = async () => {
      try {
        setMenuLoading(true);

      const savedUrl = localStorage.getItem("loginDetailsPageUrl");

      if (savedUrl) {
        await fetchEmployees(savedUrl);
      } else {
        await fetchEmployees(API_URL);
      }

      const all = await fetchAllEmployees();
      setAllEmployees(all);
    } catch (err) {
      console.error(err);
    } finally {
      setMenuLoading(false);
    }
    };

    loadData();
  }, []);

  // ==================================================
  // PASSWORD REGENERATION (Backend Only)
  // ==================================================
  const regeneratePassword = async (empId) => {
    setRegenLoading(empId); // show loader for specific row
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

  const sourceData = allEmployees.length > 0 ? allEmployees : employees;

  const filteredData =
    search.trim() === ""
      ? sourceData
      : sourceData.filter(
          (emp) =>
            emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            emp.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
            emp.username?.toLowerCase().includes(search.toLowerCase())
        );


  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal = a[sortConfig.key] ?? "";
    const bVal = b[sortConfig.key] ?? "";

    if (String(aVal).toLowerCase() < String(bVal).toLowerCase())
      return sortConfig.direction === "asc" ? -1 : 1;

    if (String(aVal).toLowerCase() > String(bVal).toLowerCase())
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

  // Always-visible sort icons
  const SortIcon = ({ column }) => {
    const active = sortConfig.key === column;
    const isAsc = sortConfig.direction === "asc";

    return (
      <span style={{ marginLeft: "5px", fontSize: "11px" }}>
        <span
          style={{
            color: active && isAsc ? "#0d6efd" : "#ccc",
            marginRight: "1px",
          }}
        >
          ▲
        </span>
        <span
          style={{
            color: active && !isAsc ? "#0d6efd" : "#ccc",
          }}
        >
          ▼
        </span>
      </span>
    );
  };


  // ==================================================
  // RENDER UI
  // ==================================================
  return (
    <div className="container">
      {menuLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            pointerEvents: "auto" // prevents clicks
          }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} role="status"></div>
            <div className="mt-2 fw-semibold text-primary">Loading…</div>
          </div>
        </div>
      )}
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
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);

                setLoading(true);
                setTimeout(() => setLoading(false), 400);

                // Load all employees only once for global search
                if (value.trim() !== "" && allEmployees.length === 0) {
                  fetchAllEmployees().then((all) => setAllEmployees(all));
                }
              }}
            />
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("emp_id")} style={{ cursor: "pointer" }}>
                    Emp ID <SortIcon column="emp_id" />
                  </th>

                  <th onClick={() => handleSort("full_name")} style={{ cursor: "pointer" }}>
                    Name <SortIcon column="full_name" />
                  </th>

                  <th>Username</th>
                  <th>Password</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>

                {loading ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="5" className="placeholder-glow py-3">
                          <span className="placeholder col-12"></span>
                        </td>
                      </tr>
                    ))}
                  </>
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
                    <td colSpan="5" className="text-muted py-4">
                      No employees found
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>

          {/* RECORD COUNT + PAGINATION */}
          <div className="d-flex justify-content-between align-items-center mt-3">

            {/* LEFT — Record Count */}
            <div className="text-muted">
              Showing {(pagination.currentPage - 1) * 10 + 1} –{" "}
              {Math.min(pagination.currentPage * 10, pagination.totalCount)} of{" "}
              {pagination.totalCount} records
            </div>

            {/* RIGHT — Pagination */}
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${!pagination.previous ? "disabled" : ""}`}>
                  <button className="page-link" onClick={handlePreviousPage}>Previous</button>
                </li>

                {(() => {
                  const pageSize = 10;
                  const totalPages = Math.ceil(pagination.totalCount / pageSize);
                  const current = pagination.currentPage;
                  const start = Math.max(1, current - 2);
                  const end = Math.min(totalPages, start + 4);
                  const pages = [];
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map((num) => (
                    <li key={num} className={`page-item ${num === current ? "active" : ""}`}>
                      <button className="page-link" onClick={() => handlePageClick(num)}>
                        {num}
                      </button>
                    </li>
                  ));
                })()}

                <li className={`page-item ${!pagination.next ? "disabled" : ""}`}>
                  <button className="page-link" onClick={handleNextPage}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginDetails;
