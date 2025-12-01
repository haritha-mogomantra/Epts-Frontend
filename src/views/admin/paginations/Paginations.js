import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
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


const PerformanceMetrics = () => {
  const [selectedWeek, setSelectedWeek] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState({
    name: "",
    department: "",
    manager: "",
    weeklyCalendar: "",
    presentDate: "",
  });
  const [duplicateError, setDuplicateError] = useState("");

  const [evaluationId, setEvaluationId] = useState(null);
  const [scores, setScores] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState({
    search: false,
    submit: false,
    print: false,
  });
  const [performanceList, setPerformanceList] = useState([]);

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
  const { employee, mode, selectedWeek: navigatedWeek } = location.state || {};
  const [isReadOnly, setIsReadOnly] = useState(mode === "view");

  //AUTO SELECT LATEST WEEK ON PAGE LOAD (ADD MODE)
  useEffect(() => {
    const fetchLatestWeek = async () => {
      try {
        const res = await axiosInstance.get("/performance/latest-week/");
        let { year, week } = res.data;

        // Performance is filled for previous week
        let latestWeek = week - 1;
        let latestYear = year;

        // Handle edge case: Week 1 → go to last week of previous year
        if (latestWeek === 0) {
          latestYear = year - 1;
          latestWeek = 52;
        }

        const formattedWeek = `${latestYear}-W${String(latestWeek).padStart(2, "0")}`;
        setSelectedWeek(formattedWeek);

      } catch (error) {
        console.error("Error fetching latest week:", error);
      }
    };

      if (!evaluationId) {
        fetchLatestWeek();
      }
    }, [evaluationId]);

  useEffect(() => {
    const fetchPerformanceList = async () => {
      try {
        const res = await axiosInstance.get("/performance/evaluations/");
        setPerformanceList(res.data || []);
      } catch (error) {
        console.error("Error fetching performance list:", error);
      }
    };

    fetchPerformanceList();
  }, []);

  const today = new Date();
  const maxWeek = getISOWeek(today);

  const prevWeek1 = new Date(today);
  prevWeek1.setDate(today.getDate() - 7);

  const prevWeek2 = new Date(today);
  prevWeek2.setDate(today.getDate() - 14);

  const minWeek = getISOWeek(prevWeek2);


  const parseWeek = (weekValue) => {
    if (!weekValue || !weekValue.includes("-W")) return { year: null, week: null };
    const [year, weekStr] = weekValue.split("-W");
    return { year: Number(year), week: Number(weekStr) };
  };


  useEffect(() => {
    if (employee) {
      setEmployeeId(employee.emp_id);

      setEmployeeData({
        name: employee.full_name || "",
        department: employee.department_name || "",
        manager: employee.manager_name || "",
      });
    }
  }, [employee]);


  useEffect(() => {
    if (location.state?.forceLatestWeek) {
      // Always load latest week for Add Performance
      const fetchLatestWeek = async () => {
        try {
          const res = await axiosInstance.get("/performance/latest-week/");
          const { year, week } = res.data;
          const formattedWeek = `${year}-W${String(week).padStart(2, "0")}`;
          setSelectedWeek(formattedWeek);
        } catch (error) {
          console.error("Error fetching latest week:", error);
        }
      };
      fetchLatestWeek();
      return;
    }

    if (navigatedWeek) {
      setSelectedWeek(navigatedWeek);
    }
  }, [navigatedWeek, location.state]);


  //Reset duplicate error when employee or week changes
  useEffect(() => {
    if (duplicateError) {
      setDuplicateError("");
    }
  }, [employeeId, selectedWeek]);


  useEffect(() => {
    const loadEmployeeEvaluation = async () => {
      if (employee) {
        setLoading((prev) => ({ ...prev, page: true }));
        const empId = employee.user?.emp_id || employee.emp_id || employee.id;

        try {
          const evalId = location.state?.evaluation_id || null;

          if (!evalId) {
            console.error("Missing evaluation ID");
            return;
          }

          const res = await axiosInstance.get(`/performance/evaluations/${evalId}/`);


          const evalData = res.data;
          setEvaluationId(evalData.id);

          const metrics = evalData.metrics || {};


          const metricFields = [
            "communication_skills",
            "multitasking",
            "team_skills",
            "technical_skills",
            "job_knowledge",
            "productivity",
            "creativity",
            "work_quality",
            "professionalism",
            "work_consistency",
            "attitude",
            "cooperation",
            "dependability",
            "attendance",
            "punctuality",
          ];

          // Load scores
          setScores(metricFields.map(field => metrics[field] ?? ""));

          // Load comments
          setComments(
            metricFields.map(field => metrics[field + "_comment"] ?? "")
          );

          setEmployeeData({
            name:
              evalData.employee?.full_name ||
              evalData.employee?.user?.full_name ||
              "",
            department:
              evalData.department_name ||
              evalData.employee?.department_name ||
              "",
            manager:
              evalData.employee?.manager_name ||
              evalData.evaluator?.full_name ||
              "",
            rank: evalData.rank || "-",
          });

        } catch (error) {
          console.error("Error fetching existing evaluation:", error);
        } finally {
          setLoading((prev) => ({ ...prev, page: false }));
        }
      }
    };

    loadEmployeeEvaluation();
  }, [employee, location.state?.evaluation_id]);

  const handleSearch = async () => {
    if (!employeeId) {
      alert("Please enter Employee ID.");
      return;
    }

    setDuplicateError("");
    setLoading((prev) => ({ ...prev, search: true }));

    const { year, week } = parseWeek(selectedWeek);

    try {
      // DUPLICATE CHECK
      const duplicateCheck = await axiosInstance.get(
        `/performance/check-duplicate/?emp_id=${employeeId}&year=${year}&week=${week}`
      );

      if (duplicateCheck.data.exists) {
        setDuplicateError("⚠ Record already exists for this employee for this week.");
      }

      // ALWAYS FETCH EMPLOYEE DETAILS
      const res = await axiosInstance.get(`employee/employees/${employeeId}/`);

      if (res.data) {
        const emp = res.data;
        setEmployeeData({
          name:
            emp.full_name ||
            emp.user?.full_name ||
            `${(emp.user?.first_name || "")} ${(emp.user?.last_name || "")}`.trim(),
          department:
            emp.department?.name ||
            emp.department_name ||
            emp.designation ||
            "N/A",
          manager:
            emp.manager_name ||
            emp.manager ||
            emp.manager_fullname ||
            emp.manager_user_fullname ||
            "Not Assigned",
        });
      } else {
        setEmployeeData({ name: "", department: "", manager: "" });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error while processing request.");
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  const handleChange = (e) => {
    setEmployeeData({ ...employeeData, [e.target.name]: e.target.value });
  };

  const handleScoreChange = (index, value) => {
    const updatedScores = [...scores];

    // Allow empty while typing
    if (value === "") {
      updatedScores[index] = "";
      setScores(updatedScores);
      return;
    }

    // llow a single "0" as valid value
    if (value === "0") {
      updatedScores[index] = "0";
      setScores(updatedScores);
      return;
    }

    // Block values that START with 0 and have more digits: 01, 09, 010, 005 etc.
    if (value.length > 1 && value[0] === "0") {
        alert("Invalid score format");

      // revert to last valid value
      updatedScores[index] = scores[index] ?? "";
      setScores(updatedScores);
      return;
    }

    // Normal number validation
    const num = Number(value);

    if (Number.isNaN(num) || num < 0) {
      alert("Please enter a valid number (0–100).");
      updatedScores[index] = scores[index] ?? "";
      setScores(updatedScores);
      return;
    }

    if (num > 100) {
      alert("Score cannot exceed 100.");
      updatedScores[index] = scores[index] ?? "";
      setScores(updatedScores);
      return;
    }

    // ✅ Keep as typed (no trimming/normalizing), since we already blocked bad formats
    updatedScores[index] = value;
    setScores(updatedScores);
  };


  const handleCancel = () => {
    setScores(Array(measurements.length).fill(""));
    setComments(Array(measurements.length).fill(""));
  };


  const columns = ["Score", "Comments/Remarks"];

  const totalScore = scores
    .filter((s) => s !== "")
    .reduce((sum, val) => sum + Number(val), 0);

  //PRINT HANDLER
  const handlePrint = () => {
    setLoading((prev) => ({ ...prev, print: true }));

    setTimeout(() => {
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
                <td><strong>Employee ID:</strong> ${employeeId || ""}</td>
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
              <strong>Total Score:</strong> ${totalScore} / ${
        measurements.length * 100
      }
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      setLoading((prev) => ({ ...prev, print: false }));
    }, 600);
  };

  // 🔹 SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId) {
      alert("Please search and select an Employee first.");
      return;
    }

    const allFilled =
      scores.length === 15 && scores.every((s) => s !== "" && s !== undefined);
    if (!allFilled) {
      alert("Please fill all performance metrics before submitting.");
      return;
    }

    const invalid = scores.some((s) => isNaN(s) || s < 0 || s > 100);
    if (invalid) {
      alert("Please ensure all scores are valid numbers between 0 and 100.");
      return;
    }

    const metricFields = [
      "communication_skills",
      "multitasking",
      "team_skills",
      "technical_skills",
      "job_knowledge",
      "productivity",
      "creativity",
      "work_quality",
      "professionalism",
      "work_consistency",
      "attitude",
      "cooperation",
      "dependability",
      "attendance",
      "punctuality",
    ];
    

    if (!selectedWeek) {
      alert("Please select a week for evaluation.");
      return;
    }

    const { year, week } = parseWeek(selectedWeek);

    const payload = {
      employee_emp_id: Number(employeeId),
      evaluation_type: "Manager",
      year: year,
      week: week,
      review_date: new Date().toISOString().slice(0, 10),
      remarks: "",
    };


    const metrics = {};
    metricFields.forEach((field, idx) => {
      metrics[field] = Number(scores[idx]);
    });
    // add comments
    metricFields.forEach((field, idx) => {
      metrics[field + "_comment"] = comments[idx] || "";
    });


    payload.metrics = metrics;
    payload.total_score = Object.values(metrics).reduce((sum, val) => sum + (val || 0), 0);


    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      let res;
      if (evaluationId && mode === "edit") {
        // Update existing evaluation (Edit mode)
        res = await axiosInstance.put(`performance/evaluations/${evaluationId}/`, payload);
      } else {
        // Create new evaluation (Add mode)
        res = await axiosInstance.post("performance/evaluations/", payload);
      }


      if (res.status === 201 || res.status === 200) {
        alert("Evaluation submitted successfully.");
        navigate("/admin/employeeperformance");
      } else {
        console.log("Server responded:", res.status, res.data);
        alert("Submission returned unexpected status. See console.");
      }
    } catch (err) {
      console.error("Submit error:", err.response || err);
      const message =
        err.response?.data?.errors ||
        err.response?.data?.detail ||
        err.response?.data ||
        err.message;
      alert("Submission failed: " + JSON.stringify(message));
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  

  return (
  <div className="container mt-0">
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
    <div className="d-flex justify-content-between text-black">
      <h5>EMPLOYEE PERFORMANCE METRICS</h5>
    </div>

    <div className="card-body">
      <div className="card">
        {duplicateError && (
          <div className="alert alert-danger text-center fw-bold my-2">
            {duplicateError}
          </div>
        )}

        {/* Search + Buttons */}
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

            <button
              className="btn btn-primary ms-2"
              onClick={handleSearch}
              disabled={loading.search}
            >
              {loading.search ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>

          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => navigate("/admin/employeeperformance")}
            >
              <i className="bi bi-arrow-left me-1"></i> Back
            </button>

            <button
              className="btn btn-success"
              onClick={handlePrint}
              disabled={loading.print}
            >
              {loading.print ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Printing...
                </>
              ) : (
                "Print"
              )}
            </button>
          </div>
        </div>

        {/* FORM START */}
        <form onSubmit={handleSubmit}>
          <div ref={printRef}>
            {/* Employee Basic Details */}
            <div className="p-2">
              <div className="row">

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Select Week</label>
                  <input
                    type="week"
                    className="form-control"
                    style={weekInputStyle}
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    min={minWeek}
                    max={maxWeek}
                    title="Only current and last 2 weeks are allowed"
                  />
                </div>

                {/* Hidden Employee ID input — logic remains same */}
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  style={{ display: "none" }}
                  readOnly
                />

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Employee Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={employeeData.name}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
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
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
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
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </div>

              </div>

              {/* Section Title */}
              <div className="d-flex justify-content-between align-items-center mt-3 mb-3 p-2">
                <h5 className="text-start mb-0">EMPLOYEE PERFORMANCE EVALUATION</h5>
              </div>

              {/* TABLE */}
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
                            onChange={(e) => handleScoreChange(rowIndex, e.target.value)}
                            readOnly={isReadOnly}
                            disabled={isReadOnly}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={comments[rowIndex] || ""}
                            onChange={(e) => {
                              const updated = [...comments];
                              updated[rowIndex] = e.target.value;
                              setComments(updated);
                            }}
                            readOnly={isReadOnly}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTAL SCORE */}
              <div className="text-end fw-bold mt-2 p-2">
                Total Score: {totalScore} / {measurements.length * 100}
              </div>
            </div>
          </div>

          {/* FORM BUTTONS */}
          <div className="mt-3 d-flex justify-content-between p-2">
            <button
              type="button"
              className="btn btn-secondary px-4 mb-2"
              onClick={mode === "view" ? () => navigate("/admin/employeeperformance") : handleCancel}
            >
              {mode === "view" ? "Back" : "Cancel"}
            </button>

            {mode !== "view" && (
              <button
                type="submit"
                className="btn btn-primary px-4 mb-2"
                disabled={loading.submit || duplicateError}
              >
                {loading.submit ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default PerformanceMetrics;