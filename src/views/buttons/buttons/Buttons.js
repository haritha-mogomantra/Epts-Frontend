import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function DynamicPerformanceReport() {
  const employees = [
    { id: 1, name: "Anil", department: "Frontend", manager: "Mark", score: 88 },
    { id: 2, name: "Haritha", department: "UI/UX", manager: "Mark", score: 91 },
    { id: 3, name: "Gopi", department: "Backend", manager: "Suman", score: 65 },
    { id: 4, name: "Sandeep", department: "Database", manager: "Suman", score: 70 },
    { id: 5, name: "Srinivas", department: "Testing", manager: "Naveen", score: 92 },
    { id: 6, name: "Kiran", department: "UI/UX", manager: "Rajesh", score: 80 },
    { id: 7, name: "Ravi", department: "Backend", manager: "Suman", score: 60 },
    { id: 8, name: "Divya", department: "Frontend", manager: "Rajesh", score: 90 },
    { id: 9, name: "Pavan", department: "DevOps", manager: "Naveen", score: 55 },
    { id: 10, name: "Manoj", department: "QA", manager: "Naveen", score: 88 },
  ];

  const managers = [...new Set(employees.map((e) => e.manager))];
  const departments = [...new Set(employees.map((e) => e.department))];

  // ✅ Default to "weekly" report
  const [reportType, setReportType] = useState("weekly");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedWeek2, setSelectedWeek2] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const chartRef = useRef(null);
  const reportRef = useRef(null);

  // ✅ Load latest weekly report automatically on page load
  useEffect(() => {
    const ranked = employees
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((emp, index) => ({ ...emp, rank: index + 1 }));
    setFilteredData(ranked);
  }, []);

  const generateRankedData = (data) => {
    let sorted = [...data].sort((a, b) => b.score - a.score);
    let ranked = [];
    let lastScore = null;
    let lastRank = 0;
    sorted.forEach((emp, index) => {
      if (emp.score === lastScore) ranked.push({ ...emp, rank: lastRank });
      else {
        lastScore = emp.score;
        lastRank = index + 1;
        ranked.push({ ...emp, rank: lastRank });
      }
    });
    return ranked;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let data = [];
    if (reportType === "weekly" && selectedWeek2) data = employees;
    else if (reportType === "manager" && selectedOption && selectedWeek2)
      data =
        selectedOption === "all"
          ? employees
          : employees.filter((e) => e.manager === selectedOption);
    else if (reportType === "department" && selectedOption && selectedWeek2)
      data =
        selectedOption === "all"
          ? employees
          : employees.filter((e) => e.department === selectedOption);
    else {
      alert("⚠️ Please select all required fields!");
      return;
    }
    const ranked = generateRankedData(data);
    setFilteredData(ranked);
  };

  const chartData = {
    labels: filteredData.map((e) => e.name),
    datasets: [
      {
        label: "Performance Score",
        data: filteredData.map((e) => e.score),
        backgroundColor: "rgba(0,123,255,0.6)",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  const exportExcel = async (rows, filename = "report.xlsx") => {
    if (!rows.length) {
      alert("No data to export");
      return;
    }
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
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => l.href)
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join("\n");
    const content = reportRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>${links}</head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setIsPrinting(false);
  };

  const reportTitleMap = {
    weekly: "Weekly Report",
    manager: "Manager Wise Report",
    department: "Department Wise Report",
  };

  return (
    <div className="container py-4">
      <h5 className="fw-bold mb-4 text-dark">EMPLOYEE PERFORMANCE REPORTS</h5>

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
                  setSelectedWeek2("");
                  setFilteredData([]);
                }}
              />
              <label
                className="form-check-label text-capitalize"
                htmlFor={`type-${type}`}
              >
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
              <select
                className="form-select"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              >
                <option value="">Select</option>
                <option value="all">
                  {reportType === "manager" ? "All Managers" : "All Departments"}
                </option>
                {(reportType === "manager" ? managers : departments).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="col-md-3">
            <button type="submit" className="btn btn-primary w-100">
              Submit
            </button>
          </div>
        </div>
      </form>

      {filteredData.length > 0 && (
        <div ref={reportRef}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">
              📋 {reportTitleMap[reportType]}{" "}
              {selectedWeek2 && `(${selectedWeek2})`}
            </h6>
            <div className="d-flex gap-3">
              <i
                className="bi bi-file-earmark-excel text-success fs-4"
                role="button"
                title="Export Excel"
                onClick={() => exportExcel(filteredData, "report.xlsx")}
              ></i>
              <i
                className={`bi bi-printer fs-4 ${
                  isPrinting ? "text-secondary" : "text-primary"
                }`}
                role="button"
                title="Print Report"
                onClick={handlePrint}
              ></i>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Score</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.manager}</td>
                    <td>{emp.score}</td>
                    <td>{emp.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h6 className="fw-bold mt-4 mb-2">📈 Performance Chart</h6>
          <Bar ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default DynamicPerformanceReport;
