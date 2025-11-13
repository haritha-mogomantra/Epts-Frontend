import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const PerformanceMetrics = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState({
    name: "",
    department: "",
    manager: "",
  });

  const [scores, setScores] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [measurements, setMeasurements] = useState([
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
  ]);

  const navigate = useNavigate();
  const printRef = useRef(null);
  const location = useLocation();
  const { employee, mode } = location.state || {};

  useEffect(() => {
    if (employee) {
      setEmployeeId(employee.id);
      setEmployeeData({
        name: `${employee.firstname} ${employee.lastname || ""}`,
        department: employee.designation || "",
        manager: employee.manager || "",
      });
    }
  }, [employee]);

  
  const handleSearch = async () => {
    if (!employeeId) {
      alert("Enter Employee ID");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8000/api/employees/employee/${employeeId}`
      );

      if (res.data) {
        setEmployeeData({
          name: res.data.firstname + " " + res.data.lastname,
          department: res.data.designation,
          manager: res.data.manager,
        });
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      alert("Employee Not Found!");
      setEmployeeData({ name: "", department: "", manager: "" });
    } finally {
      setLoading(false);
    }
  };

  
  const handleScoreChange = (index, value) => {
    const updatedScores = [...scores];
    const numericValue =
      value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    updatedScores[index] = numericValue;
    setScores(updatedScores);
  };

  
  const handleCommentChange = (index, value) => {
    const updatedComments = [...comments];
    updatedComments[index] = value;
    setComments(updatedComments);
  };

  
  const totalScore = scores
    .filter((s) => s !== "")
    .reduce((sum, val) => sum + Number(val), 0);

  // ✅ Submit data to API
  const handleSubmit = async () => {
    const payload = {
      employeeId,
      name: employeeData.name,
      department: employeeData.department,
      manager: employeeData.manager,
      scores,
      comments,
      totalScore,
      reviewDate: new Date().toISOString(),
    };

    try {
      const res = await axios.post(
        "http://localhost:8000/api/performance/save",
        payload
      );

      if (res.status === 201 || res.status === 200) {
        alert("Performance data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving performance:", error);
      alert("Error saving performance data!");
    }
  };

  
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Performance Review</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
        </head>
        <body>
          <h2 class="text-center fw-bold border p-2">EMPLOYEE PERFORMANCE REVIEW</h2>

          <table class="table table-bordered mt-3">
            <tr>
              <td><strong>Employee Name:</strong> ${employeeData.name}</td>
              <td><strong>Department:</strong> ${employeeData.department}</td>
              <td><strong>Reviewer:</strong> ${employeeData.manager}</td>
            </tr>
            <tr>
              <td><strong>Date:</strong> ${new Date().toLocaleDateString()}</td>
              <td><strong>Period:</strong> Week</td>
              <td><strong>Job Title:</strong> ${employeeData.department}</td>
            </tr>
          </table>

          <table class="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Measurement</th>
                <th>Score</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              ${measurements
                .map(
                  (m, i) => `
                <tr>
                  <td>${m}</td>
                  <td>${scores[i] || ""}</td>
                  <td>${comments[i] || ""}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <h4 class="text-end mt-3">Total Score: ${totalScore}</h4>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container mt-0">
      <div className="d-flex justify-content-between text-black">
        <h5>EMPLOYEE PERFORMANCE METRICS</h5>
      </div>

      <div className="card-body">
        <div className="card">
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2 p-2">
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control"
                style={{ width: "250px" }}
                placeholder="Enter Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <button className="btn btn-primary ms-2" onClick={handleSearch}>
                {loading ? "Loading..." : "Search"}
              </button>
            </div>

            <div>
              <button
                className="btn btn-primary me-2"
                onClick={() => navigate("/base/employeeperformance")}
              >
                View Performance
              </button>
              <button className="btn btn-success" onClick={handlePrint}>
                Print
              </button>
            </div>
          </div>

          
          <div className="p-2">
            <form>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Employee ID</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={employeeId}
                  />
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Employee Name</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={employeeData.name}
                  />
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={employeeData.department}
                  />
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Manager</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={employeeData.manager}
                  />
                </div>
              </div>
            </form>
          </div>

          
          <div className="table-responsive p-2">
            <table className="table table-bordered align-middle text-center">
              <thead className="table-primary">
                <tr>
                  <th>Measurement</th>
                  <th>Score</th>
                  <th>Comments/Remarks</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, index) => (
                  <tr key={index}>
                    <td className="fw-bold text-start">{m}</td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm text-center"
                        min="0"
                        max="100"
                        value={scores[index] || ""}
                        onChange={(e) =>
                          handleScoreChange(index, e.target.value)
                        }
                        readOnly={mode === "view"}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={comments[index] || ""}
                        onChange={(e) =>
                          handleCommentChange(index, e.target.value)
                        }
                        readOnly={mode === "view"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
          <div className="text-end fw-bold mt-2 p-2">
            Total Score: {totalScore} / {measurements.length * 100}
          </div>

          
          <div className="mt-3 d-flex justify-content-between p-2">
            <button className="btn btn-secondary px-4 mb-2">Cancel</button>
            <button
              className="btn btn-primary px-4 mb-2"
              onClick={handleSubmit}
              disabled={mode === "view"}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;




/*
import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";

const PerformanceMetrics = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState({
    name: "",
    department: "",
    manager: "",
    weeklyCalendar: "",
    presentDate: "",
  });

  const [scores, setScores] = useState([]);
  const [measurements, setMeasurements] = useState([
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
  ]);

  const navigate = useNavigate();
  const printRef = useRef(null);
  const location = useLocation();
  const { employee, mode } = location.state || {};

  useEffect(() => {
    if (employee) {
      setEmployeeId(employee.id);
      setEmployeeData({
        name: `${employee.firstname} ${employee.lastname || ""}`,
        department: employee.designation || "",
        manager: employee.manager || "",
      });
    }
  }, [employee]);

  const employeeDatabase = {
    1001: { name: "Anil", department: "Fullstack", manager: "Haritha" },
    1002: { name: "Gopi", department: "Backend", manager: "Haritha" },
    1003: { name: "Sandeep", department: "Database", manager: "Haritha" },
    1004: { name: "Srinivas", department: "Testing", manager: "Haritha" },
  };

  const handleSearch = () => {
    const data = employeeDatabase[employeeId];
    if (data) {
      setEmployeeData({ ...data });
    } else {
      alert("Employee ID not found!");
      setEmployeeData({ name: "", department: "", manager: "" });
    }
  };

  const handleChange = (e) => {
    setEmployeeData({ ...employeeData, [e.target.name]: e.target.value });
  };

  const handleScoreChange = (index, value) => {
    const updatedScores = [...scores];
    const numericValue =
      value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    updatedScores[index] = numericValue;
    setScores(updatedScores);
  };

  const columns = ["Score", "Comments/Remarks"];

  const totalScore = scores
    .filter((s) => s !== "")
    .reduce((sum, val) => sum + Number(val), 0);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Performance Review</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #000; }
            .report-header {
              background-color: #FFD700;
              color: #000;
              text-align: center;
              font-weight: bold;
              padding: 10px;
              font-size: 22px;
              border: 2px solid #000;
            }
            .section-title {
              background-color: #000;
              color: #fff;
              padding: 6px 10px;
              font-size: 16px;
              font-weight: bold;
              margin-top: 20px;
              text-transform: uppercase;
            }
            .info-table td {
              padding: 4px 10px;
              vertical-align: middle;
              border: 1px solid #000;
            }
            .eval-table th, .eval-table td {
              border: 1px solid #000;
              text-align: center;
              font-size: 13px;
              padding: 6px;
            }
            .eval-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .footer-summary td {
              background-color: #001f3f;
              color: white;
              font-weight: bold;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">EMPLOYEE PERFORMANCE REVIEW</div>

          <div class="section-title">Employee Information</div>
          <table class="table table-bordered info-table mb-3">
            <tr>
              <td><strong>Employee Name:</strong> ${employeeData.name || ""}</td>
              <td><strong>Department:</strong> ${employeeData.department || ""}</td>
              <td><strong>Reviewer:</strong> ${employeeData.manager || ""}</td>
            </tr>
            <tr>
              <td><strong>Date:</strong> ${new Date().toLocaleDateString()}</td>
              <td><strong>Period of Review:</strong> Week</td>
              <td><strong>Job Title:</strong> ${employeeData.department || ""}</td>
            </tr>
          </table>

          <div class="section-title">Performance Evaluation</div>
          <table class="table table-bordered eval-table mb-3">
            <thead>
              <tr>
                <th>Performance Evaluation</th>
                <th>Score</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              ${measurements
                .map(
                  (m, i) => `
                <tr>
                  <td>${m}</td>
                  <td>${scores[i] || ""}</td>
                  <td></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="footer-summary">
                <td>Total</td>
                <td>${totalScore}</td>
                <td>100%</td>
              </tr>
            </tfoot>
          </table>

          <div class="text-end mt-4">
            <strong>Total Score:</strong> ${totalScore} / ${measurements.length * 100}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container mt-0">
      <div className="d-flex justify-content-between text-black">
        <h5>EMPLOYEE PERFORMANCE METRICS</h5>
      </div>

      <div className="card-body">
        <div className="card">
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2 p-2">
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control"
                style={{ width: "250px" }}
                placeholder="Enter Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <button className="btn btn-primary ms-2" onClick={handleSearch}>
                Search
              </button>
            </div>

            <div>
              <button
                className="btn btn-primary me-2"
                onClick={() => navigate("/base/employeeperformance")}
              >
                View Performance
              </button>
              <button className="btn btn-success" onClick={handlePrint}>
                Print
              </button>
            </div>
          </div>

          <div ref={printRef}>
            <div className="p-2">
              <form>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Employee ID</label>
                    <input
                      type="text"
                      className="form-control"
                      name="employeeId"
                      value={employeeId}
                      readOnly
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Employee Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={employeeData.name}
                      onChange={handleChange}
                      readOnly={mode === "view"}
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      name="department"
                      value={employeeData.department}
                      onChange={handleChange}
                      readOnly={mode === "view"}
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Manager Assigned</label>
                    <input
                      type="text"
                      className="form-control"
                      name="manager"
                      value={employeeData.manager}
                      onChange={handleChange}
                      readOnly={mode === "view"}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 mb-3 p-2">
              <h5 className="text-start mb-0">EMPLOYEE PERFORMANCE EVALUATION</h5>
            </div>

            <div className="table-responsive p-2">
              <table className="table table-bordered align-middle text-center">
                <thead className="table-primary">
                  <tr>
                    <th>Measurement</th>
                    {columns.map((col, index) => (
                      <th key={index}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="fw-bold text-start">{row}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-center"
                          min="0"
                          max="100"
                          value={scores[rowIndex] || ""}
                          onChange={(e) =>
                            handleScoreChange(rowIndex, e.target.value)
                          }
                          readOnly={mode === "view"}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder=""
                          readOnly={mode === "view"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-end fw-bold mt-2 p-2">
              Total Score: {totalScore} / {measurements.length * 100}
            </div>
          </div>

          <div className="mt-3 d-flex justify-content-between p-2">
            <button className="btn btn-secondary px-4 mb-2">Cancel</button>
            <button className="btn btn-primary px-4 mb-2">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
*/