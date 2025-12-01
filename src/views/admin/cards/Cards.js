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
  const [currentPage, setCurrentPage] = useState(1);
  const [entries, setEntries] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
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
  const fetchEmployees = async (page = 1, pageSize) => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}?page=${page}&page_size=${pageSize}`);
      const data = await res.json();

      const employeesList = (data.results || []).map((emp) => ({
        ...emp,
        password: emp.temp_password || "",
      }));

      setEmployees(employeesList);
      setTotalRecords(data.count || 0);

    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setMenuLoading(true);

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

  useEffect(() => {
    if (search.trim() === "") {
      console.log('Fetching with:', currentPage, entries);
      fetchEmployees(currentPage, entries);
    }
  }, [entries, currentPage, search]);

  
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

  const sourceData = search.trim() ? allEmployees : employees;

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

  const displayData = sortedData;

  // ==================================================
  // PAGINATION
  // ==================================================
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    handlePageClick(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) handlePageClick(currentPage - 1);
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
            pointerEvents: "auto"
          }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              style={{ width: "4rem", height: "4rem" }}
              role="status"
            ></div>
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

          {/* DATATABLES TOOLBAR */}
          <div className="dt-toolbar">
            <div className="dt-toolbar-inner">

              <div className="dt-left">
                <div>
                  Show{" "}
                  <select
                    value={entries}
                    onChange={(e) => {
                      setEntries(Number(e.target.value));
                      setCurrentPage(1);   // ✅ FORCE RESET PAGE
                    }}
                    className="form-select d-inline-block mx-2"
                    style={{ width: "60px", paddingRight: "28px" }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  entries
                </div>

                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search login details..."
                    value={search}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearch(value);

                      if (value.trim() !== "" && allEmployees.length === 0) {
                        fetchAllEmployees().then((all) => setAllEmployees(all));
                      }
                    }}
                  />
                </div>

              </div>

              <div className="dt-right"></div>

            </div>
          </div>

          {/* Table */}
          <div className="dt-wrapper">
            <div className="table-responsive">
              <table
                className="table dt-table text-center align-middle"
                style={{ whiteSpace: "nowrap", tableLayout: "auto" }}
              >
              <thead className="custom-table-header">
                <tr>
                  <th onClick={() => handleSort("emp_id")} style={{ cursor: "pointer" }}>
                    <span className="th-label">
                      Emp ID
                      <SortIcon column="emp_id" />
                    </span>
                  </th>

                  <th onClick={() => handleSort("full_name")} style={{ cursor: "pointer" }}>
                    <span className="th-label">
                      Name
                      <SortIcon column="full_name" />
                    </span>
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

                  displayData.map((emp) => (
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
        </div>

          {/* RECORD COUNT + PAGINATION */}
          <div className="d-flex justify-content-between align-items-center mt-3">

            <div className="text-muted" style={{ fontWeight: "normal", margin: 0 }}>
              Showing{" "}
              {totalRecords === 0 ? 0 : (currentPage - 1) * entries + 1}
              {" "}to{" "}
              {Math.min(currentPage * entries, totalRecords)}
              {" "}of {totalRecords} records
            </div>

            <nav>
              <ul className="pagination mb-0">

                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => handlePageClick(1)}>«</button>
                </li>

                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={handlePreviousPage}>‹</button>
                </li>

                {(() => {
                  const pageSize = entries;
                  const totalPages = Math.ceil(totalRecords / entries);
                  const current = currentPage;

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

                <li className={`page-item ${currentPage * entries >= totalRecords ? "disabled" : ""}`}>
                  <button className="page-link" onClick={handleNextPage}>›</button>
                </li>

                <li className={`page-item ${currentPage * entries >= totalRecords ? "disabled" : ""}`}>
                  <button className="page-link"
                    onClick={() => {
                      const totalPages = Math.ceil(totalRecords / entries);
                      handlePageClick(totalPages);
                    }}
                  >
                    »
                  </button>
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
