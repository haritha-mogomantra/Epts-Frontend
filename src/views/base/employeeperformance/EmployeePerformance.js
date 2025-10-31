import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useNavigate } from "react-router-dom";

function EmployeePerformance() {
  const navigate = useNavigate();

  const [week, setWeek] = useState("");
  const [employees, setEmployees] = useState([
    {
      id: "EMP001",
      firstName: "Haritha",
      lastName: "Hari",
      designation: "Manager",
      manager: "Mark",
      score: 92,
      period: "week-1",
      rank: 1,
    },
    {
      id: "EMP002",
      firstName: "Eswar",
      lastName: "Anil",
      designation: "Developer",
      manager: "Haritha",
      score: 85,
      period: "week-2",
      rank: 3,
    },
    {
      id: "EMP003",
      firstName: "Gopi",
      lastName: "Rao",
      designation: "Tester",
      manager: "Haritha",
      score: 76,
      period: "week-3",
      rank: 5,
    },
  ]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...employees].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setEmployees(sorted);
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <div className="container">
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
              />

              <input
                type="week"
                className="form-control w-auto me-3"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                title="Select Week"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/theme/performancemetrics")}
            >
              Add Performance
            </button>
          </div>

          
          <div className="table-responsive mt-3">
            <table className="table table-bordered table-striped text-center align-middle">
              <thead className="table-dark">
                <tr>
                  <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                    Emp ID {getSortIcon("id")}
                  </th>
                  <th onClick={() => handleSort("firstName")} style={{ cursor: "pointer" }}>
                    Full Name {getSortIcon("firstName")}
                  </th>
                  <th onClick={() => handleSort("designation")} style={{ cursor: "pointer" }}>
                    Designation {getSortIcon("designation")}
                  </th>
                  <th onClick={() => handleSort("manager")} style={{ cursor: "pointer" }}>
                    Manager {getSortIcon("manager")}
                  </th>
                  <th onClick={() => handleSort("score")} style={{ cursor: "pointer" }}>
                    Score {getSortIcon("score")}
                  </th>
                  <th onClick={() => handleSort("period")} style={{ cursor: "pointer" }}>
                    Evaluation Period {getSortIcon("period")}
                  </th>
                  <th onClick={() => handleSort("rank")} style={{ cursor: "pointer" }}>
                    Rank {getSortIcon("rank")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.firstName + " " + emp.lastName}</td>
                    <td>{emp.designation}</td>
                    <td>{emp.manager}</td>
                    <td>{emp.score}</td>
                    <td>{emp.period}</td>
                    <td>{emp.rank}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-info me-2"
                        title="Edit"
                        data-bs-toggle="tooltip"
                      >
                        <i className="bi bi-pencil-square text-white"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        title="View"
                        data-bs-toggle="tooltip"
                      >
                        <i className="bi bi-eye text-white"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
          <nav>
            <ul className="pagination justify-content-end mt-2 ">
              <li className="page-item disabled">
                <a className="page-link" href="#">
                  Previous
                </a>
              </li>
              <li className="page-item active">
                <a className="page-link" href="#">
                  1
                </a>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">
                  2
                </a>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">
                  Next
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default EmployeePerformance;
