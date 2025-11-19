import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import axiosInstance from "../../../utils/axiosInstance";


function DynamicPerformanceReport() {
  const [reportType, setReportType] = useState("weekly");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedWeek2, setSelectedWeek2] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);

 
  const reportRef = useRef(null);
 
  const API_BASE = {
    weekly: "reports/weekly/",
    manager: "reports/manager/",
    department: "reports/department/"
  };

  const getCurrentWeek = () => {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
};



  useEffect(() => {
    let isMounted = true;

    const loadInitialReport = async () => {
      setLoading(true);

      try {
        const instantWeek = getCurrentWeek();
        let finalWeek = instantWeek;

        // Step 1: show immediate week in picker
        setSelectedWeek2(instantWeek);

        // Step 2: fetch latest available week from backend
        const res = await axiosInstance.get("/performance/latest-week/");

        if (res?.data?.week && res?.data?.year) {
          finalWeek = `${res.data.year}-W${String(res.data.week).padStart(2, "0")}`;
          setSelectedWeek2(finalWeek);
        }

        // Step 3: Auto-load weekly report on first load ONLY
        const { year, week } = parseWeek(finalWeek);
        await fetchReport("weekly", "", "", week, year);

        setInitialLoadDone(true);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialReport();

    return () => {
      isMounted = false;
    };
  }, []);

    // Auto-load manager list when switching to Manager report
    useEffect(() => {
      if (reportType === "manager") {
        fetchManagers();
      }
    }, [reportType]);

    useEffect(() => {
      if (reportType === "department") {
        fetchDepartments();
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
      if (manager && manager !== "ALL_MGR") {
        params.manager = manager;
      }

      if (department && department !== "ALL_DEPT") {
        params.department = department;
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

    if (reportType === "manager")
      fetchReport("manager", selectedOption, "", week, year);
    else if (reportType === "department")
      fetchReport("department", "", selectedOption, week, year);
    else
      fetchReport("weekly", "", "", week, year);
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

  // Manager dropdown list
  const fetchManagers = async () => {
    try {
      const res = await axiosInstance.get("/employee/employees/managers/");
      const data = res.data.results || res.data;

      setManagers(
        data.map((m) => ({
          emp_id: m.emp_id || m.user?.emp_id || "",
          full_name:
            m.full_name ||
            `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim(),
        }))
      );
    } catch (error) {
      console.error("Failed to load managers:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get("/employee/departments/");
      console.log("DEPARTMENT API RESPONSE:", res.data);

      let list = [];

      // CASE 1: Backend sends { results: [...] }
      if (Array.isArray(res.data.results)) {
        list = res.data.results;
      }
      // CASE 2: Backend sends { departments: [...] }
      else if (Array.isArray(res.data.departments)) {
        list = res.data.departments;
      }
      // CASE 3: Backend sends a plain array: [ ... ]
      else if (Array.isArray(res.data)) {
        list = res.data;
      }
      // CASE 4: Backend sends { data: [...] }
      else if (Array.isArray(res.data.data)) {
        list = res.data.data;
      }

      setDepartments(
        list.map((d) => ({
          code: d.code || d.id || d.department_code,
          name: d.name || d.title || d.department_name,
        }))
      );

    } catch (error) {
      console.error("Failed to load departments:", error);
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
    let sorted = [...filteredData];

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
  }, [filteredData, sortConfig]);

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

  const sortIcon = (key) => {
    if (sortConfig.key !== key)
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;

    return sortConfig.direction === "asc"
      ? <i className="bi bi-caret-up-fill ms-1"></i>
      : <i className="bi bi-caret-down-fill ms-1"></i>;
  };


  return (
    <div className="container py-4">
      {loading && <LoadingOverlay />}

      <h5 className="fw-bold mb-4 text-dark">EMPLOYEE PERFORMANCE REPORTS</h5>

      <div className="card shadow-sm border-0 p-4">

        {/* ---------------- FORM ---------------- */}
        <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-3 mb-4">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <label className="fw-semibold me-2">Select Report Type:</label>

            {["weekly", "manager", "department"].map((type) => (
              <div key={type} className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="reportType"
                  id={`type-${type}`}
                  value={type}
                  checked={reportType === type}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setSelectedOption("");
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
              <label className="form-label fw-semibold">Select Week:</label>
              <input
                type="week"
                className="form-control"
                value={selectedWeek2}
                onChange={(e) => setSelectedWeek2(e.target.value)}
              />
            </div>

            {(reportType === "manager" || reportType === "department") && (
              <div className="col-md-3">
                <label className="form-label fw-semibold">
                  {reportType === "manager" ? "Select Manager:" : "Select Department:"}
                </label>

                {reportType === "manager" ? (
                  <select
                    className="form-select"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    onClick={fetchManagers}
                  >
                    <option value="">Select Manager</option>
                    <option value="ALL_MGR">All Managers</option>

                    {managers.map((m) => (
                      <option key={m.emp_id} value={m.emp_id}>
                        {m.full_name} ({m.emp_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="form-select"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    <option value="ALL_DEPT">All Departments</option>

                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="col-md-3">
              <button type="submit" className="btn btn-primary w-100">
                Submit
              </button>
            </div>
          </div>
        </form>

        {/* ---------------- REPORT TABLE ---------------- */}
        {!loading && filteredData.length > 0 && (
          <div ref={reportRef}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">
                {reportTitleMap[reportType]} {selectedWeek2 && `(${selectedWeek2})`}
              </h6>

              <div className="d-flex gap-3">
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

            {/* Table */}
            <div className="table-responsive">
              <table
                className="table table-bordered table-striped text-center align-middle"
                style={{ whiteSpace: "nowrap", tableLayout: "auto" }}
              >
                <thead className="table-info">
                  <tr>
                    {reportType === "weekly" && (
                      <>
                        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                          Employee ID {sortIcon("id")}
                        </th>

                        <th>Employee Name</th>
                        <th>Department</th>
                        <th>Manager</th>

                        <th onClick={() => requestSort("score")} style={{ cursor: "pointer" }}>
                          Score {sortIcon("score")}
                        </th>

                        <th onClick={() => requestSort("rank")} style={{ cursor: "pointer" }}>
                          Rank {sortIcon("rank")}
                        </th>
                      </>
                    )}

                    {reportType === "department" && (
                      <>
                        <th>Department</th>

                        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                          Employee ID {sortIcon("id")}
                        </th>

                        <th>Employee Name</th>
                        <th>Manager</th>

                        <th onClick={() => requestSort("score")} style={{ cursor: "pointer" }}>
                          Score {sortIcon("score")}
                        </th>

                        <th onClick={() => requestSort("rank")} style={{ cursor: "pointer" }}>
                          Rank {sortIcon("rank")}
                        </th>
                      </>
                    )}

                    {reportType === "manager" && (
                      <>
                        <th>Manager</th>
                        <th>Department</th>

                        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                          Employee ID {sortIcon("id")}
                        </th>

                        <th>Employee Name</th>

                        <th onClick={() => requestSort("score")} style={{ cursor: "pointer" }}>
                          Score {sortIcon("score")}
                        </th>

                        <th onClick={() => requestSort("rank")} style={{ cursor: "pointer" }}>
                          Rank {sortIcon("rank")}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map((emp) => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------------- PAGINATION ---------------- */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">

                <div className="text-muted">
                  Showing {(currentPage - 1) * pageSize + 1} –{" "}
                  {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
                  {filteredData.length} records
                </div>

                <nav>
                  <ul className="pagination mb-0">

                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
                        Previous
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(page)}>
                          {page}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>
                        Next
                      </button>
                    </li>

                  </ul>
                </nav>
              </div>
            )}

          </div>
        )}
      </div> 
    </div>
  );
}

export default DynamicPerformanceReport;

