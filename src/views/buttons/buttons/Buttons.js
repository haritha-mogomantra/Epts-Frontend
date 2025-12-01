import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import axiosInstance from "../../../utils/axiosInstance";


function DynamicPerformanceReport() {
  const [reportType, setReportType] = useState("weekly");
  const [selectedOption, setSelectedOption] = useState("");

  const [selectedWeek2, setSelectedWeek2] = useState("");
  const [maxSelectableWeek, setMaxSelectableWeek] = useState("");
  const [initialWeek, setInitialWeek] = useState("");
  const [isWeekChanged, setIsWeekChanged] = useState(false);

  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [hasManagerInteracted, setHasManagerInteracted] = useState(false);
  const [hasDepartmentInteracted, setHasDepartmentInteracted] = useState(false);

  const [filteredData, setFilteredData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

 
  const reportRef = useRef(null);
 
  const API_BASE = {
    weekly: "reports/weekly/",
    manager: "reports/manager/",
    department: "reports/department/"
  };

  const getCurrentWeek = () => {
    const today = new Date();
    const onejan = new Date(today.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((today - onejan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((today.getDay() + 1 + numberOfDays) / 7);
    return `${today.getFullYear()}-W${String(week).padStart(2, "0")}`;
  };


  useEffect(() => {
    let isMounted = true;

    const loadInitialReport = async () => {
      setLoading(true);

      try {
        const storedWeek = localStorage.getItem("selectedWeek");

        if (storedWeek) {
          setSelectedWeek2(storedWeek);
          setInitialWeek(storedWeek);

          setHasUserInteracted(true);
          setIsWeekChanged(true);

          const { year, week } = parseWeek(storedWeek);
          await fetchReport("weekly", "", "", week, year);
          setLoading(false);
          return;
        }
        const res = await axiosInstance.get("/reports/latest-week/");

        if (res?.data?.week && res?.data?.year) {
          const backendWeek = `${res.data.year}-W${String(res.data.week).padStart(2, "0")}`;
          setSelectedWeek2(backendWeek);

          setMaxSelectableWeek(getCurrentWeek());

          setInitialWeek(backendWeek);
          setIsWeekChanged(false);

          const { year, week } = parseWeek(backendWeek);
          await fetchReport("weekly", "", "", week, year);
        }

      } catch (e) {
        console.error("Failed to load latest week:", e);
      } finally {
        setLoading(false);
      }
    };

    loadInitialReport();

    return () => {
      isMounted = false;

      // CLEAR WEEK ONLY WHEN USER LEAVES REPORTS PAGE
      localStorage.removeItem("selectedWeek");
    };
  }, []);

    useEffect(() => {
      if (reportType === "manager") {
        fetchManagers();
          setSelectedOption("ALL_MGR");
      }
    }, [reportType]);


    useEffect(() => {
      if (reportType === "department") {
        fetchDepartments();
          setSelectedOption("ALL_DEPT");
      }
    }, [reportType]);


  const parseWeek = (weekValue) => {
    // weekValue = "2025-W46"
    if (!weekValue || !weekValue.includes("-W")) return { year: null, week: null };

    const [year, weekStr] = weekValue.split("-W");
    return { year: parseInt(year), week: parseInt(weekStr) };
  };

 
  const fetchReport = async (type, manager = "", department = "", week = "", year = "") => {
    try {
      setLoading(true);
      setError("");
 
      const params = {};
      // Manager filter
      if (manager === "ALL_MGR") {
          params.manager = "";             // send empty → backend returns all managers
      } else if (manager) {
          params.manager = manager;        // specific manager
      }

      // Department filter
      if (department === "ALL_DEPT") {
          params.department = "";          // send empty → backend returns all departments
      } else if (department) {
          params.department = department;  // specific department
      }

      if (week) params.week = week;
      if (year) params.year = year;
 
      const res = await axiosInstance.get(API_BASE[type], { params });
      const data = res.data;

      // If backend returned a message or empty data → show no rows
      if (!data.records || !Array.isArray(data.records)) {
        setFilteredData([]);
        setLoading(false);
        return;
      }


      const normalized = data.records.map((item) => ({
        id: item.emp_id ?? item.id ?? "-",
        name: item.employee_full_name ?? item.full_name ?? item.name ?? "-",
        department: item.department ?? item.department_name ?? "-",
        manager:
          item.manager_full_name ??
          item.manager ??
          item.manager_name ??
          item.evaluator_name ??         
          item.evaluator_full_name ??   
          item.reviewer_name ??          
          item.reviewer_full_name ??     
          item.evaluator ??
          item.reviewer ??
          "-",
        score:
          item.score ??
          item.total_score ??
          item.average_score ??
          item.avg_score ??
          0,
        rank: item.rank ?? "-",
      }));


      // ---------------- DENSE RANK COMPUTATION BASED ON SCORE ----------------

      // Sort by score DESC (higher score first)
      const sorted = [...normalized].sort((a, b) => {
        const s1 = Number(a.score ?? 0);
        const s2 = Number(b.score ?? 0);

        if (s1 !== s2) return s2 - s1; // DESC

        return (a.name || "").localeCompare(b.name || "");
      });

      // Dense ranking: 1, 2, 2, 3
      let prevScore = null;
      let currentRank = 0;

      for (const item of sorted) {
        const score = Number(item.score ?? 0);

        if (prevScore === null || score !== prevScore) {
          currentRank += 1;   // Increment rank only on score change
          prevScore = score;
        }

        item.rank = currentRank;
      }

      setFilteredData(sorted);
      setCurrentPage(1);



    } catch (err) {
      setError("Failed to load data from server");
    } finally {
      setLoading(false);
    }
  };

 
  const handleSubmit = (e) => {
    e.preventDefault();
 
    if (!selectedWeek2) {
      alert("Please select week");
      return;
    }
 
    const { year, week } = parseWeek(selectedWeek2);

    if (!week || !year) {
      alert("Invalid week selection");
      return;
    }

    if (reportType === "manager") {
      fetchReport("manager", selectedOption, null, week, year);
  }
  else if (reportType === "department") {
      fetchReport("department", null, selectedOption, week, year);
  }
  else {
      fetchReport("weekly", null, null, week, year);
  }
  };


 
  const exportExcel = async (rows, filename = "report.xlsx") => {
    if (!rows.length) return alert("No data to export");
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);
  };
 
  const handlePrint = async () => {
    if (!reportRef.current) return alert("Nothing to print");
    setIsPrinting(true);
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    const content = reportRef.current.innerHTML;
    printWindow.document.write(`<html><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.print();
    setIsPrinting(false);
  };
 
  const reportTitleMap = {
    weekly: "Weekly Report",
    manager: "Manager Wise Report",
    department: "Department Wise Report",
  };
 

  const LoadingOverlay = () => (
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
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }}></div>
    </div>
  );

  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchManagers = async () => {
    try {
      const res = await axiosInstance.get("employee/employees/managers/");
      
      let list = [];

      if (Array.isArray(res.data.results)) {
        list = res.data.results;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      } else {
        console.warn("Managers API returned unexpected format:", res.data);
      }

      const mappedManagers = list.map((m) => ({
        emp_id: m.emp_id || m.user?.emp_id || "",
        full_name:
          m.full_name ||
          `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim(),
      }));

      setManagers(mappedManagers);
    } catch (error) {
      console.error("❌ Failed to load managers:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get("employee/departments/");
      let list = [];

      if (Array.isArray(res.data.results)) {
        list = res.data.results;
      }

      else if (Array.isArray(res.data.departments)) {
        list = res.data.departments;
      }

      else if (Array.isArray(res.data)) {
        list = res.data;
      }

      else if (Array.isArray(res.data.data)) {
        list = res.data.data;
      }

      const mappedDepartments = list.map((d) => ({
        code: d.code || d.id || d.department_code || d.pk,
        name: d.name || d.title || d.department_name || d.department,
      }));

      setDepartments(mappedDepartments);

    } catch (error) {
    }
  };

  const parseEmpId = (id) => {
    if (!id) return 0;

    // Extract numeric part (EMP0012 → 12)
    const numeric = id.match(/\d+/);

    // If no number found → treat it as very large to push to bottom
    if (!numeric) return Number.MAX_SAFE_INTEGER;

    return parseInt(numeric[0], 10);
  };

  const sortedData = React.useMemo(() => {
    let sorted = filteredData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (!sortConfig.key) return sorted;

    sorted.sort((a, b) => {
      let x = a[sortConfig.key];
      let y = b[sortConfig.key];

      // --- Employee ID sorting rule ---
      if (sortConfig.key === "id") {
        x = parseEmpId(x);
        y = parseEmpId(y);
      }

      // --- Numeric sorting for score & rank ---
      if (["score", "rank"].includes(sortConfig.key)) {
        x = Number(x);
        y = Number(y);
      }

      if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
      if (x > y) return sortConfig.direction === "asc" ? 1 : -1;

      // Tie-break rule → fallback to alphabetical name
      return (a.name || "").localeCompare(b.name || "");
    });

    return sorted;
  }, [filteredData, sortConfig, searchTerm]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const requestSort = (key) => {
    // If clicking same column → toggle ASC/DESC
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc"
      });
    } else {
      // New column click → always start ASC
      setSortConfig({ key, direction: "asc" });
    }
  };

  const SortIcon = ({ column }) => {
  const isActive = sortConfig.key === column;
  const isAsc = sortConfig.direction === "asc";

  const barsClass = !isActive
    ? "sort-bars default"
    : isAsc
    ? "sort-bars asc"
    : "sort-bars desc";

  return (
    <span className="sort-wrapper">
      <div className={barsClass}>
        <span></span>
      </div>

      <i
        className={`bi ${
          !isActive ? "bi-arrow-down-up" : isAsc ? "bi-arrow-up" : "bi-arrow-down"
        } sort-arrow ${isActive ? "active" : ""}`}
      />
    </span>
  );
};


  return (
    <div className="container py-4">
      {loading && <LoadingOverlay />}

      <h5 className="fw-bold mb-4 text-dark">EMPLOYEE PERFORMANCE REPORTS</h5>

      <div className="card shadow-sm border-0 p-4">

        {/* ---------------- FORM ---------------- */}
        <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-3 mb-4">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <label className="fw-semibold me-2">Report Type:</label>

            {["weekly", "manager", "department"].map((type) => (
              <div key={type} className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="reportType"
                  id={`type-${type}`}
                  value={type}
                  checked={reportType === type}
                  onChange={async (e) => {
                    const type = e.target.value;
                    setReportType(type);

                    // Reset interaction states completely
                    setHasUserInteracted(false);
                    setHasManagerInteracted(false);
                    setHasDepartmentInteracted(false);
                    setIsWeekChanged(false);

                    setMaxSelectableWeek(getCurrentWeek());

                    try {
                      const res = await axiosInstance.get("/reports/latest-week/");

                      if (res?.data?.week && res?.data?.year) {
                        const latestWeekValue = `${res.data.year}-W${String(res.data.week).padStart(2, "0")}`;
                        const latestWeekNum = parseInt(res.data.week);
                        const latestYearNum = parseInt(res.data.year);

                        if (type === "manager") {
                          setSelectedOption("ALL_MGR");
                          setFilteredData([]);
                          await fetchReport("manager", "", "", latestWeekNum, latestYearNum);
                        }
                        else if (type === "department") {
                          setSelectedOption("ALL_DEPT");
                          setFilteredData([]);
                          await fetchReport("department", "", "", latestWeekNum, latestYearNum);
                        }
                        else {
                          setSelectedOption("");
                          setFilteredData([]);
                          await fetchReport("weekly", "", "", latestWeekNum, latestYearNum);
                        }

                        // Update selected week WITHOUT marking user interaction
                        setSelectedWeek2(latestWeekValue);
                      }
                    } catch (err) {
                      console.error("Failed to fetch latest week:", err);
                    }
                  }}
                />
                <label className="form-check-label text-capitalize">
                  {reportTitleMap[type]}
                </label>
              </div>
            ))}
          </div>

          <div className="row align-items-end mt-4">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Week:</label>
              <input
                type="week"
                className="form-control"
                value={selectedWeek2}
                max={maxSelectableWeek}
                onChange={(e) => {
                  const value = e.target.value;

                  setSelectedWeek2(value);
                  localStorage.setItem("selectedWeek", value);

                  setHasUserInteracted(true);
                  setIsWeekChanged(true);

                }}
              />
            </div>

            {(reportType === "manager" || reportType === "department") && (
              <div className="col-md-3">
                <label className="form-label fw-semibold">
                  {reportType === "manager" ? "Manager:" : "Department:"}
                </label>

                {reportType === "manager" ? (
                  <select
                    className="form-select"
                    value={selectedOption}
                    onChange={(e) => {
                      setSelectedOption(e.target.value);

                      if (e.target.value !== "ALL_MGR") {
                        setHasManagerInteracted(true);
                      }
                    }}
                  >
                    <option value="ALL_MGR">All Managers</option>
                    
                    {managers.length === 0 ? (
                      <option value="" disabled>Loading managers...</option>
                    ) : (
                      managers.map((m) => (
                        <option key={m.emp_id} value={m.emp_id}>
                          {m.full_name} ({m.emp_id})
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <select
                    className="form-select"
                    value={selectedOption}
                    onChange={(e) => {
                      setSelectedOption(e.target.value);

                      if (e.target.value !== "ALL_DEPT") {
                        setHasDepartmentInteracted(true);
                      }
                    }}
                  >
                    <option value="ALL_DEPT">All Departments</option>
                    
                    {departments.length === 0 ? (
                      <option value="" disabled>Loading departments...</option>
                    ) : (
                      departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name} ({d.code})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            )}

            <div className="col-md-3">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={
                  !(
                    hasUserInteracted ||
                    hasManagerInteracted ||
                    hasDepartmentInteracted
                  )
                }
              >
                Submit
              </button>
            </div>
          </div>
        </form>

        {/* ---------------- REPORT TABLE ---------------- */}
        {!loading && (
          <div ref={reportRef}>

            <div className="dt-toolbar">
              <div className="dt-toolbar-inner">

                <div className="dt-left">
                  <div>
                    Show{" "}
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="form-select d-inline-block mx-2"
                      style={{ width: "70px" }}
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
                      placeholder="Search report..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="dt-right d-flex align-items-center gap-3">
                  <i className="bi bi-file-earmark-excel text-success fs-4"
                    role="button"
                    title="Export Excel"
                    onClick={() => exportExcel(filteredData, "report.xlsx")}
                  />
                  <i className={`bi bi-printer fs-4 ${isPrinting ? "text-secondary" : "text-primary"}`}
                    role="button"
                    title="Print Report"
                    onClick={handlePrint}
                  />
                </div>

              </div>
            </div>

            {/* Table */}
            <div className="dt-wrapper" style={{ minHeight: "300px" }}>
              <div className="table-responsive">
              <table
                className="table dt-table align-middle"
                style={{ whiteSpace: "nowrap", width: "100%", textAlign: "left" }}
              >
                <thead className="custom-table-header">
                  <tr>
                    {reportType === "weekly" && (
                      <>
                        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Employee ID <SortIcon column="id" /></span>
                        </th>

                        <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Employee Name <SortIcon column="name" /></span>
                        </th>

                        <th onClick={() => requestSort("department")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Department <SortIcon column="department" /></span>
                        </th>

                        <th onClick={() => requestSort("manager")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Manager <SortIcon column="manager" /></span>
                        </th>

                        <th onClick={() => requestSort("score")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Score <SortIcon column="score" /></span>
                        </th>

                        <th onClick={() => requestSort("rank")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Rank <SortIcon column="rank" /></span>
                        </th>
                      </>
                    )}

                    {reportType === "department" && (
                      <>
                        <th onClick={() => requestSort("department")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Department <SortIcon column="department" /></span>
                        </th>

                        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Employee ID <SortIcon column="id" /></span>
                        </th>

                        <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Employee Name <SortIcon column="name" /></span>
                        </th>

                        <th onClick={() => requestSort("manager")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Manager <SortIcon column="manager" /></span>
                        </th>

                        <th onClick={() => requestSort("score")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Score <SortIcon column="score" /></span>
                        </th>

                        <th onClick={() => requestSort("rank")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Rank <SortIcon column="rank" /></span>
                        </th>
                      </>
                    )}

                    {reportType === "manager" && (
                      <>
                        <th onClick={() => requestSort("manager")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Manager <SortIcon column="manager" /></span>
                        </th>

                        <th onClick={() => requestSort("department")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Department <SortIcon column="department" /></span>
                        </th>

                        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Employee ID <SortIcon column="id" /></span>
                        </th>

                        <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Employee Name <SortIcon column="name" /></span>
                        </th>

                        <th onClick={() => requestSort("score")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Score <SortIcon column="score" /></span>
                        </th>

                        <th onClick={() => requestSort("rank")} style={{ cursor: "pointer" }}>
                          <span className="th-label">Rank <SortIcon column="rank" /></span>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state-row">
                        <div style={{ fontSize: "3rem", color: "#ccc" }}>
                          <i className="bi bi-inbox"></i>
                        </div>
                        <p className="mt-3 text-muted mb-0" style={{ fontSize: "1.1rem" }}>
                          No performance records found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((emp) => (
                      <tr key={emp.id}>
                        {reportType === "weekly" && (
                          <>
                            <td>{emp.id}</td>
                            <td>{emp.name}</td>
                            <td>{emp.department}</td>
                            <td>{emp.manager}</td>
                            <td>{emp.score}</td>
                            <td>{emp.rank}</td>
                          </>
                        )}

                        {reportType === "department" && (
                          <>
                            <td>{emp.department}</td>
                            <td>{emp.id}</td>
                            <td>{emp.name}</td>
                            <td>{emp.manager}</td>
                            <td>{emp.score}</td>
                            <td>{emp.rank}</td>
                          </>
                        )}

                        {reportType === "manager" && (
                          <>
                            <td>{emp.manager}</td>
                            <td>{emp.department}</td>
                            <td>{emp.id}</td>
                            <td>{emp.name}</td>
                            <td>{emp.score}</td>
                            <td>{emp.rank}</td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>

            <div className="dt-pagination d-flex justify-content-between align-items-center mt-3">

              <div className="text-muted" style={{ fontWeight: "normal", margin: 0 }}>
                Showing {(currentPage - 1) * pageSize + 1} – 
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
              </div>

              <nav>
                <ul className="pagination mb-0">

                  {/* FIRST */}
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(1)}>«</button>
                  </li>

                  {/* PREVIOUS */}
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
                  </li>

                  {/* DYNAMIC PAGE NUMBERS */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p >= currentPage - 2 && p <= currentPage + 2)
                    .map(p => (
                      <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                      </li>
                    ))}

                  {/* NEXT */}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>›</button>
                  </li>

                  {/* LAST */}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(totalPages)}>»</button>
                  </li>

                </ul>
              </nav>
            </div>
          </div>
        )}
      </div> 
    </div>
  );
}

export default DynamicPerformanceReport;
