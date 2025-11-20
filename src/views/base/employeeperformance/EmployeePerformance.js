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

const today = new Date();
const maxWeek = getISOWeek(today);

const minWeek = "2000-W01";


 
function EmployeePerformance() {
  const navigate = useNavigate();
  const location = useLocation();

  const [week, setWeek] = useState("");

  // Auto-load latest week from backend on page load
  useEffect(() => {
    const fetchLatestWeek = async () => {
      try {
        const res = await axiosInstance.get("/performance/latest-week/");

        if (res.data.week && res.data.year) {
          const formatted = `${res.data.year}-W${String(res.data.week).padStart(2, "0")}`;

          setWeek(formatted);  // Auto-select latest week
          setPage(1);          // Reset pagination
        }
      } catch (error) {
        console.error("Error loading latest week:", error);
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
  const [maxSelectableWeek, setMaxSelectableWeek] = useState("");



  // Auto-select latest week on initial load
  useEffect(() => {
    const fetchLatestWeek = async () => {
      try {
        const res = await axiosInstance.get("/performance/latest-week/");

        if (res.data.week && res.data.year) {
          const formatted = `${res.data.year}-W${String(res.data.week).padStart(2, "0")}`;
          setSelectedWeek(formatted);
          setWeek(formatted);
          setMaxSelectableWeek(formatted); // ✅ prevents future selection
        }

      } catch (error) {
        console.error("Error fetching latest week:", error);
      }
    };

    fetchLatestWeek();
  }, []);

 
  // Reset to page 1 every time you navigate back to this screen
  useEffect(() => {
    setPage(1);
  }, [location.key]);

  // Fetch Performance Data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      setEmployees([]);
      setLoading(true);

      try {
        let url = "http://127.0.0.1:8000/api/performance/summary/?";

        // include sorting params when present
        if (sortConfig.key) {
          url += `sort_by=${sortConfig.key}&order=${sortConfig.direction}&`;
        }

        // Add search
        if (searchQuery) {
          url += `search=${encodeURIComponent(searchQuery)}&`;
        }

        if (week && week.includes("-W")) {
          let [year, wk] = week.split("-W");
          year = parseInt(year);
          wk = parseInt(wk);

          if (!isNaN(year) && !isNaN(wk)) {
            url += `week=${wk}&year=${year}&`;
          }
        }

        // Pagination
        let paginatedUrl = `${url}page=${page}&page_size=${pageSize}`;

        // ===== Helpful debug logs =====
        console.log("SORT CONFIG:", sortConfig);
        console.log("🔍 FINAL URL:", paginatedUrl);

        const response = await axiosInstance.get(paginatedUrl);

        const backend = response.data;

        let finalRecords = [];

        // DRF Paginated Response → results: { evaluation_period, records }
        if (backend.results?.records) {
          finalRecords = backend.results.records;
        }
        // Fallback
        else if (backend.records) {
          finalRecords = backend.records;
        }

        console.log("Extracted Records:", finalRecords);

        setEmployees(finalRecords);
        setVisibleCount(finalRecords.length);
        setTotalRecords(backend.count || 0);
        setTotalPages(Math.ceil((backend.count || 0) / pageSize));
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };

    fetchPerformanceData();
    // include sortConfig.key & sortConfig.direction so effect re-runs on sort changes
  }, [week, page, searchQuery, location.key, sortConfig.key, sortConfig.direction]);


 
  const handleSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });

    // ⬇ RESET PAGE & FETCH AGAIN
    setPage(1);
  };
 
  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };
 
  const handleNavigate = (emp, mode) => {
    const evalId = emp.evaluation_id;

    if (!evalId) {
      alert("No evaluation ID found for this record.");
      return;
    }

    navigate("/theme/performancemetrics", {
      state: {
        employee: emp,
        mode,
        evaluation_id: evalId,
        selectedWeek: week   // 🔥 PASS SELECTED WEEK TO NEXT PAGE
      }
    });
  };



  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(startRecord + visibleCount - 1, totalRecords);

  const SortIcon = ({ column, sortConfig }) => {
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


 
  return (
    <div className="container">
      <style>
      {`
      input[type="week"] {
        color: #212529 !important;
      }

      input[type="week"]::-webkit-datetime-edit {
        color: #212529 !important;
      }

      input[type="week"]::-webkit-datetime-edit-text {
        color: #212529 !important;
      }

      input[type="week"]::-webkit-datetime-edit-year-field,
      input[type="week"]::-webkit-datetime-edit-week-field {
        color: #212529 !important;
      }
      `}
      </style>
      {pageLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(2px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: "4rem", height: "4rem" }}
          ></div>
        </div>
      )}
      <div className="text-dark">
        <h5>PERFORMANCE DETAILS</h5>
      </div>
 
      <div className="card shadow-sm">
        <div className="card-body p-3">

          {/* Filters */}
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
                  setTotalRecords(0);      
                  setTotalPages(1);     
                }}
              />

              <input
                type="week"
                className="form-control w-auto me-3"
                style={weekInputStyle}
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  setWeek(e.target.value);
                }}
                min="2000-W01"            
                max={maxSelectableWeek} 
                title="Past weeks only. Future weeks are disabled."
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/theme/performancemetrics")}
            >
              <i className="bi bi-plus-circle me-2" /> Add Performance
            </button>
          </div>
 
          {/* Table */}
          <div className="table-responsive mt-3" style={{ minHeight: "350px" }}>
            <table className="table table-bordered table-striped text-center align-middle">
              <thead className="table-dark">
                <tr>
                  <th onClick={() => handleSort("emp_id")} style={{ cursor: "pointer" }}>
                    Emp ID <SortIcon column="emp_id" sortConfig={sortConfig} />
                  </th>
                  <th onClick={() => handleSort("full_name")} style={{ cursor: "pointer" }}>
                    Full Name <SortIcon column="full_name" sortConfig={sortConfig} />
                  </th>
                  <th>Department</th>
                  <th onClick={() => handleSort("total_score")} style={{ cursor: "pointer" }}>
                    Score <SortIcon column="total_score" sortConfig={sortConfig} />
                  </th>
                  <th>Evaluation Period</th>
                  <th onClick={() => handleSort("rank")} style={{ cursor: "pointer" }}>
                    Rank <SortIcon column="rank" sortConfig={sortConfig} />
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="7" className="placeholder-glow py-3">
                          <span className="placeholder col-12"></span>
                        </td>
                      </tr>
                    ))}
                  </>
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
                          title="Edit"
                          onClick={() => handleNavigate(emp, "edit")}
                        >
                          <i className="bi bi-pencil-square text-white"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          title="View"
                          onClick={() => handleNavigate(emp, "view")}
                        >
                          <i className="bi bi-eye text-white"></i>
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

            {/* RECORD COUNT + PAGINATION */}
            <div
              className="d-flex justify-content-between align-items-center mt-3"
              style={{ width: "100%" }}
            >

              {/* LEFT — Count */}
              <div className="text-muted" style={{ fontWeight: "normal", margin: 0}}>
                Showing {startRecord} – {endRecord} of {totalRecords} records
              </div>

              {/* RIGHT — Pagination */}
              <nav>
                <ul className="pagination mb-0">

                  {/* Prev */}
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>
                      Prev
                    </button>
                  </li>

                  {/* Page numbers */}
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

                  {/* Next */}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)}>
                      Next
                    </button>
                  </li>

                </ul>
              </nav>
            </div>
            {/* PAGINATION END */}

          </div>

        </div>
      </div>
    </div>
  );
}
 
export default EmployeePerformance;