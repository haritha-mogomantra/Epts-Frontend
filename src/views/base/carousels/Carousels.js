import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
 

const ViewPerformance = () => {

  const location = useLocation();
  const employeeId = location.state?.employeeId || localStorage.getItem("emp_id");
  const [employeeInfo, setEmployeeInfo] = useState({

    empId: "",
    name: "",
    department: "",
    manager: "",
  });
 
  const [selectedWeek, setSelectedWeek] = useState("");
  const [allWeeks, setAllWeeks] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    scores: {},
    comments: {},
  });
  const [measurementFields, setMeasurementFields] = useState([]);

  const convertToWeekInput = (weekString) => {
    if (!weekString) return "";
    const weekNumber = weekString.replace("Week ", "").trim();
    const year = new Date().getFullYear();
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  };

  const convertFromWeekInput = (weekInput) => {
    if (!weekInput) return "";
    const week = weekInput.split("-W")[1];
    return `Week ${parseInt(week, 10)}`;
  };


 
  // -------------------------------

  //  FETCH EMPLOYEE DATA FROM BACKEND

  // -------------------------------

  const fetchEmployeeDetails = async () => {

    try {

      const res = await axiosInstance.get(`employee/employees/employee/${employeeId}/`);
      console.log("EMPLOYEE API DATA =>", res.data);

      setEmployeeInfo({
        empId: res.data.emp_id || res.data.empId || res.data.id || employeeId,
        name:
          res.data.name ||
          res.data.full_name ||
          res.data.employee_name ||
          `${res.data.first_name || ""} ${res.data.last_name || ""}`.trim(),
        department:
          res.data.department ||
          res.data.department_name ||
          res.data.dept_name ||
          "",
        manager:
          res.data.manager ||
          res.data.reporting_manager ||
          res.data.manager_name ||
          "",
      });

    } catch (err) {
      console.error("Employee fetch error:", err);
    }
  };
 
  // ----------------------------------------

  //  FETCH PERFORMANCE DATA FROM BACKEND

  // ----------------------------------------

  const fetchPerformance = async () => {
    try {
      // ✅ Get system latest week (current processing week)
      const latestWeekRes = await axiosInstance.get("performance/latest-week/");

      let { year, week } = latestWeekRes.data;

      // ✅ Latest created performance week = current system week - 1
      let displayWeek = week - 1;
      let displayYear = year;

      // ✅ Handle year rollover
      if (displayWeek === 0) {
        displayWeek = 52;
        displayYear = year - 1;
      }

      const weekNumber = displayWeek;
      const finalYear = displayYear;

      const weekInputValue = `${year}-W${weekNumber.toString().padStart(2, "0")}`;
      setSelectedWeek(weekInputValue);

      const weekResponse = await axiosInstance.get(
        `performance/performance/by-employee-week/`,
        {
          params: {
            emp_id: employeeId,
            week: weekNumber,
            year: year,
          },
        }
      );

      const weekData = weekResponse.data;
      setPerformanceData(weekData);

      let fields = [];

      if (weekData?.scores && Object.keys(weekData.scores).length > 0) {
        fields = Object.keys(weekData.scores);
      } else if (weekData?.metrics?.length > 0) {
        fields = weekData.metrics.map((m) => m.name);
      }

      setMeasurementFields(fields);
    } catch (err) {
      console.error("Performance fetch error:", err);
    }
  };
 
  // ----------------------------------------

  //  USE EFFECT TO LOAD DATA ONCE

  // ----------------------------------------

  useEffect(() => {
    fetchEmployeeDetails();
    fetchPerformance();
  }, [employeeId]);
 
  // ----------------------------------------

  //  WHEN WEEK IS CHANGED

  // ----------------------------------------


  const handleWeekChange = async (e) => {
    const weekInputValue = e.target.value;
    if (!weekInputValue) return;
    setSelectedWeek(weekInputValue);

    const backendWeek = parseInt(weekInputValue.split("-W")[1], 10);
    const year = weekInputValue.split("-W")[0];

    try {
      const res = await axiosInstance.get(
        `performance/performance/by-employee-week/`,
        {
          params: {
            emp_id: employeeId,
            week: backendWeek,
            year: year,
          },
        }
      );

      const weekData = res.data;
      setPerformanceData(weekData);

      let fields = [];

      if (weekData?.scores && Object.keys(weekData.scores).length > 0) {
        fields = Object.keys(weekData.scores);
      } else if (weekData?.metrics?.length > 0) {
        fields = weekData.metrics.map((m) => m.name);
      }

      setMeasurementFields(fields);
    } catch (err) {
      console.error("Week change error:", err);
    }
  };

  // ----------------------------------------

  // TOTAL SCORE CALCULATION

  // ----------------------------------------

  const fallbackMetrics = [
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
    "Punctuality"
  ];

  const displayMetrics =
    measurementFields.length > 0 ? measurementFields : fallbackMetrics;

  const totalScore = displayMetrics.reduce((sum, field) => {
    const val = performanceData?.scores?.[field];
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
 
  return (
    <div className="container mt-2">

      {/* HEADER + WEEK DROPDOWN */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>EMPLOYEE PERFORMANCE</h5>
      <div style={{ width: "250px" }}>
        <input
            type="week"
            className="form-control"
            value={selectedWeek}
            onChange={handleWeekChange}
          />
      </div>
  </div>
 
      {/* EMPLOYEE INFO */}
      <div className="card mb-3 p-3">
      <div className="row">
      <div className="col-md-3">
        <label className="fw-bold">EmpId:</label>
          <p>{employeeInfo.empId}</p>
      </div>
      <div className="col-md-3">
        <label className="fw-bold">Employee Name:</label>
          <p>{employeeInfo.name}</p>
      </div>
<div className="col-md-3">
<label className="fw-bold">Department:</label>
<p>{employeeInfo.department}</p>
</div>
<div className="col-md-3">
<label className="fw-bold">Manager:</label>
<p>{employeeInfo.manager}</p>
</div>
</div>
</div>
 
      {/* PERFORMANCE TABLE */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle text-start">
          <thead className="table-primary">
            <tr>
              <th>Measurement</th>
              <th>Score</th>
              <th>Comments/Remarks</th>
            </tr>
          </thead>
        <tbody>


        {Array.isArray(displayMetrics) && displayMetrics.length > 0 && displayMetrics.map((field, index) => {

          const metricObj = Array.isArray(performanceData?.metrics)
            ? performanceData.metrics.find(m => m.name === field || m.metric === field)
            : null;

          const score =
            performanceData?.scores?.[field] ?? 
            performanceData?.values?.[field] ?? 
            metricObj?.score ?? 
            metricObj?.value ?? "-";

          const comment =
            performanceData?.comments?.[field] ?? 
            metricObj?.comment ?? 
            metricObj?.remarks ?? "-";

          return (
            <tr key={index}>
              <td className="fw-bold">{field}</td>
              <td>{score}</td>
              <td>{comment}</td>
            </tr>
          );
        })}
      
            <tr className="fw-bold table-secondary">
              <td>Total Score</td>
              <td>{totalScore}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
  </div>
  );
};
      
export default ViewPerformance;