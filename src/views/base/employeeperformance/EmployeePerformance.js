import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";

const weekInputStyle = {
  fontFamily: "Segoe UI, Arial, sans-serif",
  fontSize: "14px",
  fontWeight: "400",
  color: "#212529",
};

// Helper to calculate ISO Week
const getISOWeek = (date) => {
  const temp = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  temp.setDate(temp.getDate() - dayNumber + 3);

  const firstThursday = temp.valueOf();
  temp.setMonth(0, 1);

  const week =
    Math.ceil((((firstThursday - temp) / 86400000) + temp.getDay() + 1) / 7);

  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

function EmployeePerformance() {
  const navigate = useNavigate();
  const location = useLocation();

  // Bootstrap Alert State
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const showAlert = (msg, type = "danger") => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };

  // Auto-select latest week
  useEffect(() => {
    const fetchLatestWeek = async () => {
      try {
        const today = new Date();
        const lastCompletedWeek = new Date(today);
        lastCompletedWeek.setDate(today.getDate() - 7);

        const formatted = getISOWeek(lastCompletedWeek);

        setSelectedWeek(formatted);
        setMaxSelectableWeek(formatted);
        setPage(1);
        setAutoWeekLoaded(true);
      } catch (error) {
        showAlert("Failed to load week", "danger");
      }
    };

    fetchLatestWeek();
  }, []);

  const [employees, setEmployees] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [autoWeekLoaded, setAutoWeekLoaded] = useState(false);
  const [maxSelectableWeek, setMaxSelectableWeek] = useState("");

  useEffect(() => setPage(1), [location.key]);

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!autoWeekLoaded || !selectedWeek) {
        setLoading(false);
        setPageLoading(false);
        return;
      }

      setEmployees([]);
      setLoading(true);

      try {
        let url = "http://127.0.0.1:8000/api/performance/summary/?";

        if (sortConfig.key) {
          url += `sort_by=${sortConfig.key}&order=${sortConfig.direction}&`;
        }

        if (searchQuery) {
          url += `search=${encodeURIComponent(searchQuery)}&`;
        }

        if (selectedWeek.includes("-W")) {
          let [year, wk] = selectedWeek.split("-W");
          year = parseInt(year);
          wk = parseInt(wk);

          if (!isNaN(year) && !isNaN(wk)) {
            url += `week=${wk}&year=${year}&`;
          }
        }

        const finalURL = `${url}page=${page}&page_size=${pageSize}`;

        const response = await axiosInstance.get(finalURL);

        const backend = response.data;
        let finalRecords = backend.results?.records || backend.records || [];

        const sanitized = finalRecords.map(emp => ({
          ...emp,
          total_score: Number(emp.total_score),
          rank: Number(emp.rank),
        }));

        setEmployees(sanitized);
        setVisibleCount(sanitized.length);
        setTotalRecords(backend.count || 0);
        setTotalPages(Math.ceil((backend.count || 0) / pageSize));
      } catch (error) {
        showAlert("Error loading data", "danger");
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };

    fetchPerformanceData();
  }, [selectedWeek, page, searchQuery, location.key, sortConfig.key, sortConfig.direction, autoWeekLoaded]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  const handleNavigate = (emp, mode) => {
    const evalId = emp.evaluation_id;

    if (!evalId) {
      showAlert("Evaluation ID missing!", "warning");
      return;
    }

    navigate("/theme/performancemetrics", {
      state: {
        employee: emp,
        mode,
        evaluation_id: evalId,
        selectedWeek: selectedWeek,
      },
    });
  };

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(startRecord + visibleCount - 1, totalRecords);

  return (
    <div className="container">

      {/* Bootstrap Alerts */}
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mt-3`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Page Loading Overlay */}
      {pageLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }}></div>
        </div>
      )}

      <div className="text-dark">
        <h5>PERFORMANCE DETAILS</h5>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-3">

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex justify-content-start">
              <input
                type="text"
                className="form-control w-25 me-3"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />

              <input
                type="week"
                className="form-control w-auto me-3"
                style={weekInputStyle}
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  setPage(1);
                }}
                min="2000-W01"
                max={maxSelectableWeek}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/theme/performancemetrics")}
            >
              <i className="bi bi-plus-circle me-2" /> Add Performance
            </button>
          </div>

          {/* FIXED TABLE + HORIZONTAL SCROLLBAR */}
          <div className="table-responsive mt-3" style={{ minHeight: "350px", overflowX: "auto" }}>
            <table
              className="table table-bordered table-striped text-center align-middle"
              style={{ tableLayout: "fixed", width: "1200px" }}
            >
              <thead className="table-dark">
                <tr>
                  <th style={{ width: "80px" }} onClick={() => handleSort("emp_id")}>Emp ID</th>
                  <th style={{ width: "150px" }} onClick={() => handleSort("full_name")}>Full Name</th>
                  <th style={{ width: "150px" }}>Department</th>
                  <th style={{ width: "80px" }} onClick={() => handleSort("total_score")}>Score</th>
                  <th style={{ width: "180px" }}>Evaluation Period</th>
                  <th style={{ width: "80px" }} onClick={() => handleSort("rank")}>Rank</th>
                  <th style={{ width: "150px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="7" className="placeholder-glow py-3">
                        <span className="placeholder col-12"></span>
                      </td>
                    </tr>
                  ))
                ) : employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.evaluation_id}>
                      <td>{emp.emp_id}</td>
                      <td>{emp.full_name}</td>
                      <td>{emp.department_name}</td>
                      <td>{emp.total_score}</td>
                      <td>{emp.evaluation_period || "-"}</td>
                      <td>{emp.rank || "-"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleNavigate(emp, "edit")}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleNavigate(emp, "view")}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-danger fw-bold">
                      No performance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {startRecord} – {endRecord} of {totalRecords} records
              </div>

              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>Prev</button>
                  </li>

                  {[...Array(totalPages).keys()].map((num) => {
                    const pageNum = num + 1;
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${page === pageNum ? "active" : ""}`}
                      >
                        <button className="page-link" onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}

                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)}>Next</button>
                  </li>
                </ul>
              </nav>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeePerformance;
