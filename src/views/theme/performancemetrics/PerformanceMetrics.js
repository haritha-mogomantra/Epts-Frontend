import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

const PerformanceMetrics = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState({
    name: "",
    department: "",
    manager: "",
    weeklyCalendar: "",
    presentDate: "",
  });

  const employeeDatabase = {
    1001: { name: "Anil", department: "Fullstack", manager: "Haritha" },
    1002: { name: "Gopi", department: "Backend", manager: "Haritha" },
    1003: { name: "Sandeep", department: "Database", manager: "Haritha" },
    1004: { name: "Srinivas", department: "Testing", manager: "Haritha" },
  };

  const handleSearch = () => {
    const data = employeeDatabase[employeeId];
    if (data) {
      setEmployeeData({
        ...data,
        weeklyCalendar: "",
        presentDate: "",
      });
    } else {
      alert("Employee ID not found!");
      setEmployeeData({
        name: "",
        department: "",
        manager: "",
        weeklyCalendar: "",
        presentDate: "",
      });
    }
  };

  const handleChange = (e) => {
    setEmployeeData({ ...employeeData, [e.target.name]: e.target.value });
  };

  const rows = [
    "Communication Skills",
    "Multi Tasking Abilities",
    "Team Skills",
    "Technical Skills",
    "Job Knowledge",
    "Productivity",
    "Creativity",
    "Work Quality",
    "Professionalism",
    "Work Consistency",
    "Attitude",
    "Cooperation",
    "Dependability",
    "Attendance",
    "Punctuality",
  ];

  const columns = ["Score", "Comments/Remarks"];
  const navigate = useNavigate();

  return (
    <div className="container mt-0">


      <div className="d-flex justify-content-between  text-black">
        <h5>EMPLOYEE PERFORMANCE METRICS</h5>

      </div>


      <div className="card-body">

        <div className="card">
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2 p-2">
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control w-auto"
                style={{ width: "250px" }}
                placeholder="Enter Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <button className="btn btn-primary ms-2" onClick={handleSearch}>
                Search
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/base/employeeperformance")}
            >
              View Performance
            </button>
          </div>



         <div className="p-2">
           <form>
            <div className="row">
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Employee Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={employeeData.name}
                    onChange={handleChange}
                    placeholder="Employee Name"
                    readOnly
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    name="department"
                    value={employeeData.department}
                    onChange={handleChange}
                    placeholder="Department"
                    readOnly
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Weekly Calendar</label>
                  <select
                    className="form-select"
                    name="weeklyCalendar"
                    value={employeeData.weeklyCalendar}
                    onChange={handleChange}
                  >
                    <option value="">-- Select Week --</option>
                    <option value="Week 40 (Sept 29 - Oct 5)">
                      Week 40 (Sept 29 - Oct 5)
                    </option>
                    <option value="Week 41 (Oct 6 - Oct 12)">
                      Week 41 (Oct 6 - Oct 12)
                    </option>
                    <option value="Week 42 (Oct 13 - Oct 19)">
                      Week 42 (Oct 13 - Oct 19)
                    </option>
                    <option value="Week 43 (Oct 20 - Oct 26)">
                      Week 43 (Oct 20 - Oct 26)
                    </option>
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Manager Assigned</label>
                  <input
                    type="text"
                    className="form-control"
                    name="manager"
                    value={employeeData.manager}
                    onChange={handleChange}
                    placeholder="Manager"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </form>
         </div>
        </div>


        <div>
          <h5 className="text-start mb-3 mt-3">
            EMPLOYEE PERFORMANCE EVALUTION
          </h5>

          <div className="table-responsive">
            <table className="table table-bordered align-middle text-center">
              <thead className="table-primary">
                <tr>
                  <th style={{ minWidth: "200px" }}>Measurement</th>
                  {columns.map((col, index) => (
                    <th key={index} style={{ minWidth: "150px" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="fw-bold text-start">{row}</td>
                    {columns.map((col, colIndex) => (
                      <td key={colIndex}>
                        {col === "Score Individual" ? (
                          <input
                            type="number"
                            className="form-control form-control-sm  " style={{ width: "50px" }}
                            min="0"
                            max="100"
                            onInput={(e) => {
                              if (e.target.value > 100)
                                e.target.value = 100;
                              if (e.target.value < 0)
                                e.target.value = 0;
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className=" mt-3 d-flex justify-content-between">
              <button className="btn btn-secondary px-4 mb-2 ">Cancel</button>
              <button className="btn btn-primary px-4 mb-2">Submit</button>

            </div>

          </div>

        </div>
      </div>
    </div>

  );
};

export default PerformanceMetrics;
