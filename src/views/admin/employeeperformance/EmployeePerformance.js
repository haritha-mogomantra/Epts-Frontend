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

  // AUTO SELECT LATEST WEEK ON PAGE LOAD
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
        console.error("Error fetching latest week:", error);
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

 
  useEffect(() => {
    setPage(1);
  }, [location.key]);

  // Fetch Performance Data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      
      if (!autoWeekLoaded || !selectedWeek) {
        setPageLoading(false);   // ✅ stop spinner
        setLoading(false);
        return;
      }
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

        if (selectedWeek && selectedWeek.includes("-W")) {
          let [year, wk] = selectedWeek.split("-W");
          year = parseInt(year);
          wk = parseInt(wk);

          if (!isNaN(year) && !isNaN(wk)) {
            url += `week=${wk}&year=${year}&`;
          }
        }

        // Pagination
        let paginatedUrl = `${url}page=${page}&page_size=${pageSize}`;

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

        const sanitized = finalRecords.map(emp => ({
          ...emp,
          total_score: Number(emp.total_score),
          rank: Number(emp.rank)
        }));

        setEmployees(sanitized);
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
  }, [selectedWeek, page, searchQuery, location.key, sortConfig.key, sortConfig.direction, autoWeekLoaded]);


 
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

    navigate("/admin/paginations", {
      state: {
        employee: emp,
        mode,
        evaluation_id: evalId,
        selectedWeek: selectedWeek
      }
    });
  };



  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(startRecord + visibleCount - 1, totalRecords);

  const SortIcon = ({ column, sortConfig }) => {
    const active = sortConfig.key === column;
    const isAsc = sortConfig.direction === "asc";

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          marginLeft: "6px",
          verticalAlign: "middle"
        }}
      >
        {/* LINES */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "10px"
          }}
        >
          {/* DEFAULT */}
          {!active && (
            <>
              <div style={{ width: "6px", height: "2px", background: "#333", borderRadius: "10px" }} />
              <div style={{ width: "9px", height: "2px", background: "#333", borderRadius: "10px" }} />
              <div style={{ width: "12px", height: "2px", background: "#333", borderRadius: "10px" }} />
            </>
          )}

          {/* ASCENDING */}
          {active && isAsc && (
            <>
              <div style={{ width: "6px", height: "2px", background: "#333", borderRadius: "10px" }} />
              <div style={{ width: "9px", height: "2px", background: "#333", borderRadius: "10px" }} />
              <div style={{ width: "12px", height: "2px", background: "#333", borderRadius: "10px" }} />
            </>
          )}

          {/* DESCENDING */}
          {active && !isAsc && (
            <>
              <div style={{ width: "12px", height: "2px", background: "#333", borderRadius: "10px" }} />
              <div style={{ width: "9px", height: "2px", background: "#333", borderRadius: "10px" }} />
              <div style={{ width: "6px", height: "2px", background: "#333", borderRadius: "10px" }} />
            </>
          )}
        </div>

        {/* ARROWS */}
        {!active ? (
          // DEFAULT: normal thin arrows
          <span style={{ display: "flex", alignItems: "center" }}>
            <i
              className="bi bi-arrow-up"
              style={{
                fontSize: "10px",
                color: "#333",
                marginRight: "-2px",
                lineHeight: "10px"
              }}
            ></i>
            <i
              className="bi bi-arrow-down"
              style={{
                fontSize: "10px",
                color: "#333",
                lineHeight: "10px"
              }}
            ></i>
          </span>
        ) : (
          // ACTIVE: bold arrow with same height as lines
          <i
            className={`bi ${isAsc ? "bi-arrow-up" : "bi-arrow-down"}`}
            style={{
              fontSize: "14px",
              fontWeight: "900",
              color: "#333",
              lineHeight: TOTAL_LINES_HEIGHT
            }}
          ></i>
        )}
      </span>
    );
  };

 
  return (
    <div className="container">
      <style>
      {`
      .sort-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 6px;
      }

      /* Container for 3 lines */
      .sort-bars {
        position: relative;
        width: 18px;
        height: 12px;
      }

      /* Create 3 lines */
      .sort-bars::before,
      .sort-bars::after {
        content: '';
        position: absolute;
        height: 2px;
        background: #aaa;
        border-radius: 2px;
        left: 0;
      }

      /* middle line */
      .sort-bars span {
        position: absolute;
        height: 2px;
        background: #aaa;
        border-radius: 2px;
        left: 0;
      }

      /* DEFAULT - uniform increasing */
      .sort-bars.default::before { top: 0; width: 40%; }
      .sort-bars.default span { top: 5px; width: 70%; }
      .sort-bars.default::after { bottom: 0; width: 100%; }

      /* ASC - same increasing visual */
      .sort-bars.asc::before { top: 0; width: 40%; }
      .sort-bars.asc span { top: 5px; width: 70%; }
      .sort-bars.asc::after { bottom: 0; width: 100%; }

      /* DESC - reversed visually */
      .sort-bars.desc::before { top: 0; width: 100%; }
      .sort-bars.desc span { top: 5px; width: 70%; }
      .sort-bars.desc::after { bottom: 0; width: 40%; }

      /* Arrow */
      .sort-arrow {
        font-size: 14px;
        font-weight: bold;
        color: #888;
      }

      .sort-arrow.active {
        color: #0d6efd;
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

          <div className="dt-toolbar">
            <div className="dt-toolbar-inner">

              {/* LEFT SIDE */}
              <div className="dt-left">

                <div className="search-input-wrapper">
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="search"
                    // style={{width:"100px"}}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                      setTotalRecords(0);
                      setTotalPages(1);
                    }}
                  />
                </div>

                <div className="week-wrapper">
                  <input
                    type="week"
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

              </div>

              {/* RIGHT SIDE */}
              <div className="dt-right d-flex align-items-center gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    navigate("/theme/performancemetrics", {
                      state: { forceLatestWeek: true }
                    })
                  }
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Performance
                </button>
              </div>

            </div>
          </div>
 
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
                      <SortIcon column="emp_id" sortConfig={sortConfig} />
                    </span>
                  </th>

                  <th onClick={() => handleSort("full_name")} style={{ cursor: "pointer" }}>
                    <span className="th-label">
                      Full Name
                      <SortIcon column="full_name" sortConfig={sortConfig} />
                    </span>
                  </th>

                  <th>Department</th>

                  <th onClick={() => handleSort("total_score")} style={{ cursor: "pointer" }}>
                    <span className="th-label">
                      Score
                      <SortIcon column="total_score" sortConfig={sortConfig} />
                    </span>
                  </th>

                  <th>Evaluation Period</th>

                  <th onClick={() => handleSort("rank")} style={{ cursor: "pointer" }}>
                    <span className="th-label">
                      Rank
                      <SortIcon column="rank" sortConfig={sortConfig} />
                    </span>
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
                    <td colSpan="7" className="text-center py-5">
                      <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ccc" }}></i>
                      <p className="mt-3 text-muted mb-0">
                        No performance records found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="dt-pagination d-flex justify-content-between align-items-center mt-3">

              <div className="text-muted" style={{ fontWeight: "normal", margin: 0}}>
                Showing {startRecord} – {endRecord} of {totalRecords} records
              </div>

              <nav>
                <ul className="pagination mb-0">

                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>
                      Prev
                    </button>
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
                    <button className="page-link" onClick={() => setPage(page + 1)}>
                      Next
                    </button>
                  </li>

                </ul>
              </nav>
            </div>

          </div>

        </div>
      </div>
    </div>
    </div>
  );
}

export default EmployeePerformance;