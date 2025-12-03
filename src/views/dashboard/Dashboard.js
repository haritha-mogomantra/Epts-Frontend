import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar } from "react-chartjs-2";
import axiosInstance from "../../utils/axiosInstance";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,

} from "chart.js";

import { LineElement, PointElement } from "chart.js";

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);


function PerformanceDashboard() {

  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const DEFAULT_PROFILE = "/images/default-profile.png";
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");



  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        //Get latest completed week
        const latestWeekRes = await axiosInstance.get("performance/latest-week/");
        const { week, year } = latestWeekRes.data;

        let performanceURL = "performance/summary/";

        // If latest completed week exists use it
        if (week && year) {
          performanceURL = `performance/summary/?week=${week}&year=${year}`;
        } 
        // ELSE fallback to most recent data automatically
        else {
          console.warn("No completed week found, falling back to latest available data");
        }

        let allRecords = [];
        let nextUrl = performanceURL;

        while (nextUrl) {
          const response = await axiosInstance.get(nextUrl);
          const data = response.data;

          allRecords = [...allRecords, ...(data.results?.records || [])];

          // Convert absolute URL to relative for axiosInstance baseURL
          nextUrl = data.next 
            ? data.next.replace("http://127.0.0.1:8000/api/", "") 
            : null;
        }

        const records = allRecords;

        const getDesignationByDepartment = (dept) => {
          const map = {
            Marketing: "Marketing Executive",
            "Human Resources": "HR Associate",
            Engineering: "Software Engineer",
            Finance: "Financial Analyst",
            Sales: "Sales Executive"
          };
          return map[dept] || "Staff Member";
        };

        const formatted = records.map(item => ({
          id: item.emp_id,
          name: item.full_name,
          department: item.department_name || "N/A",
          score: item.total_score || 0,
          profile_picture: item.profile_picture || "",
          designation: item.designation && item.designation.trim() !== ""
            ? item.designation
            : getDesignationByDepartment(item.department_name)
        }));

        setEmployees(formatted);
        // ✅ Extract unique department list from employees
        const uniqueDepartments = [...new Set(formatted.map(emp => emp.department))];
        const departmentObjects = uniqueDepartments.map((dept, index) => ({
          id: index + 1,
          name: dept
        }));

        setDepartments(departmentObjects);

      } catch (error) {
        console.error("Dashboard load error:", error);
      }
    };

    fetchDashboard();
    
  }, []);


  // Sorting logic (unchanged)

  const sortedEmployees = [...employees].sort((a, b) => b.score - a.score);

  const rankedEmployees = sortedEmployees.map((emp, index) => ({
    ...emp,
    rank: index + 1,
  }));

  const filteredRankedEmployees =
    selectedDept === "all"
      ? rankedEmployees
      : rankedEmployees.filter(emp => emp.department === selectedDept);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentEmployees = filteredRankedEmployees.slice(indexOfFirst, indexOfLast);


  const topPerformers = sortedEmployees.slice(0, 3);
  const lowPerformers = [...sortedEmployees].reverse().slice(0, 3);

  // Chart data (unchanged)

  const maxScore = rankedEmployees.length
    ? Math.max(...rankedEmployees.map(e => e.score))
    : 0;

  const chartData = {
    labels: rankedEmployees.map(e => e.name),
    datasets: [
      {
        label: "Performance Score",
        data: rankedEmployees.map(e => e.score),
        backgroundColor: rankedEmployees.map(e => {
          if (e.rank <= 3) return "#28a745";      // Top Performers
          if (e.rank > rankedEmployees.length - 3) return "#dc3545"; // Weak
          return "#0d6efd"; // Normal employees
        }),
        borderRadius: 8,
        barThickness: 40,
      },

      // Business Target Line (Example Target = 1200)
      {
        type: "line",
        label: "Target Score",
        data: rankedEmployees.map(() => 1200),
        borderColor: "#ffc107",
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top"
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const emp = rankedEmployees[context.dataIndex];
            return [
              `Name: ${emp.name}`,
              `Department: ${emp.department}`,
              `Score: ${emp.score}`,
              `Rank: ${emp.rank}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 1500,
        ticks: {
          stepSize: 250 
        },
        title: {
          display: true,
          text: "Performance Score"
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 25
        }
      }
    }
  };

  const deptColorMap = {
    Marketing: "bg-danger",
    "Human Resources": "bg-warning",
    Engineering: "bg-secondary",
    Finance: "bg-success",
    Sales: "bg-info"
  };

  const getDeptColor = (dept) => deptColorMap[dept] || "bg-primary";

  const openEmployeeModal = (emp) => {
    const rankedEmp = rankedEmployees.find(e => e.id === emp.id);
    setSelectedEmployee(rankedEmp);
    setShowModal(true);
  };

  // TOTAL PAGES
  const totalPages = Math.ceil(rankedEmployees.length / rowsPerPage);

  // CHANGE PAGE FUNCTION
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };



  return (
    <div>
      <div className=" text-dark">
        <h5 className="">DASHBOARD</h5>
      </div>

      {/* ============== TOP & WEAK MEMBERS ROW ============== */}
      <div className="row mt-4">

        {/* TOP MEMBERS */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-bold">Top 3 Employees</div>
            <div className="card-body">

              {topPerformers.map((emp) => (
                <div 
                  key={emp.id}
                  onClick={() => openEmployeeModal(emp)}
                  className="employee-card d-flex align-items-center justify-content-between py-2">

                  <div className="d-flex align-items-center">
                    <img
                      src={emp.profile_picture || DEFAULT_PROFILE}
                      alt="profile"
                      className="rounded-circle me-2"
                      style={{ width: "38px", height: "38px", objectFit: "cover" }}
                    />

                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong>{emp.name}</strong>
                        {emp.rank === 1 && (
                          <span className="badge bg-primary ms-1">Top Performer</span>
                        )}
                        <span className={`badge ${getDeptColor(emp.department)} text-white`}>
                          {emp.department}
                        </span>
                      </div>
                      <small className="text-muted">{emp.designation}</small>
                    </div>
                  </div>

                  <div className="text-end">
                    <small className="text-muted">Score</small>
                    <div className="fw-bold fs-5">{emp.score}</div>
                  </div>

                </div>
              ))}

            </div>
          </div>
        </div>

        {/* WEAK MEMBERS */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-bold">Weak 3 Employees</div>
            <div className="card-body">

              {lowPerformers.map((emp) => (
                <div 
                  key={emp.id}
                  onClick={() => openEmployeeModal(emp)}
                  className="employee-card d-flex align-items-center justify-content-between py-2">

                  <div className="d-flex align-items-center">
                    <img
                      src={emp.profile_picture || DEFAULT_PROFILE}
                      alt="profile"
                      className="rounded-circle me-2"
                      style={{ width: "38px", height: "38px", objectFit: "cover" }}
                    />

                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong>{emp.name}</strong>
                        <span className={`badge ${getDeptColor(emp.department)} text-white`}>
                          {emp.department}
                        </span>
                      </div>
                      <small className="text-muted">{emp.designation}</small>
                    </div>
                  </div>

                  <div className="text-end">
                    <small className="text-muted">Score</small>
                    <div className="fw-bold fs-5">{emp.score}</div>
                  </div>

                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      {/* ================= CHART ROW ================= */}
      <div className="row pt-3">

        <div className="col-md-12">
          <div className="card">
            <div className="card-header text-white bg-info fw-bold">
              <h5>Weekly Performance Chart</h5>
            </div>

            <div style={{ height: "320px", padding: "15px" }}>
              {rankedEmployees.length > 0 && (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

      </div>

      
 {/* Bottom Performance Block Start */}
  <div className="card mt-5 mb-3">
  {/* ========== TOP PART: Header + Controls ========== */}      
      {/* Left: Title + subtitle */}
    <div className="card-header">
      <div className="row">
          <div className="col-8 col-md-8">
            <h5 className="mb-0 fw-semibold text-dark">All Employee Performance</h5>
            <small className="text-muted">Weekly ranking overview of all employees</small>
          </div>

          <div className="col-4 col-md-4">
            <select
              className="form-select fw-semibold"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
     </div>
    </div>

  {/* ========== BOTTOM PART: Table Card ========== */}
  <div className="card-body">
    <div className="table-responsive">
      <table className="table table-bordered align-middle table-hover mb-0">
        <thead className="table-dark text-center">
          <tr>
            <th>Emp ID</th>
            <th className="text-start">Name</th>
            <th className="text-start">Department</th>
            <th>Score</th>
            <th>Rank</th>
          </tr>
        </thead>

        <tbody>
          {currentEmployees.map((emp) => {
            const isTop = topPerformers.some(p => p.id === emp.id);
            const isLow = lowPerformers.some(p => p.id === emp.id);

            return (
              <tr
                key={emp.id}
                className={
                  isTop
                    ? "table-success fw-semibold"
                    : isLow
                    ? "table-danger"
                    : ""
                }
              >
                <td className="text-center">{emp.id}</td>

                <td className="text-start">
                  <div className="fw-semibold">{emp.name}</div>
                  <small className="text-muted">{emp.designation}</small>
                </td>

                <td className="text-start">
                  <span className={`badge ${getDeptColor(emp.department)} text-white`}>
                    {emp.department}
                  </span>
                </td>

                <td className="text-center fw-bold">{emp.score}</td>

                <td className="text-center">
                  <span
                    className={`badge ${
                      isTop
                        ? "bg-success"
                        : isLow
                        ? "bg-danger"
                        : "bg-secondary"
                    }`}
                  >
                    #{emp.rank}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination + record count — unchanged logic */}
      {rankedEmployees.length > 0 && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">

          <div className="text-muted">
            Showing {(currentPage - 1) * rowsPerPage + 1} –{" "}
            {Math.min(currentPage * rowsPerPage, rankedEmployees.length)} of {filteredRankedEmployees.length} records
          </div>

          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>

        </div>
      )}

    </div>
  </div>
</div>
 {/* Bottom Performance Block End */}

      
      {showModal && selectedEmployee && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">Employee Details</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body text-center">

                <img
                  src={selectedEmployee.profile_picture || DEFAULT_PROFILE}
                  className="rounded-circle mb-3 shadow"
                  width="90"
                  height="90"
                  style={{ objectFit: "cover" }}
                />

                <h4 className="fw-bold mb-1">{selectedEmployee.name}</h4>
                <p className="text-muted mb-1">{selectedEmployee.designation}</p>

                <span className={`badge ${getDeptColor(selectedEmployee.department)} text-white mb-3`}>
                  {selectedEmployee.department}
                </span>

                <hr className="my-3" />

                <div className="row text-start px-3">

                  <div className="col-6 mb-3">
                    <div className="text-uppercase text-muted small fw-semibold">
                      Employee ID
                    </div>
                    <div className="fw-bold">
                      {selectedEmployee.id}
                    </div>
                  </div>

                  <div className="col-6 mb-3">
                    <div className="text-uppercase text-muted small fw-semibold">
                      Department
                    </div>
                    <div className="fw-bold">
                      {selectedEmployee.department}
                    </div>
                  </div>

                  <div className="col-6 mb-3">
                    <div className="text-uppercase text-muted small fw-semibold">
                      Score
                    </div>
                    <div className="fw-bold">
                      {selectedEmployee.score}
                    </div>
                  </div>

                  <div className="col-6 mb-3">
                    <div className="text-uppercase text-muted small fw-semibold">
                      Rank
                    </div>
                    <div className="fw-bold">
                      #{selectedEmployee.rank}
                    </div>
                  </div>

                </div>

                <div className="mt-3">
                  {selectedEmployee.rank <= 3 && (
                    <span className="badge bg-success px-3 py-2">Top Performer</span>
                  )}

                  {selectedEmployee.rank > rankedEmployees.length - 3 && (
                    <span className="badge bg-danger px-3 py-2">Needs Improvement</span>
                  )}

                  {selectedEmployee.rank > 3 && selectedEmployee.rank <= rankedEmployees.length - 3 && (
                    <span className="badge bg-primary px-3 py-2">Stable Performance</span>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceDashboard;
