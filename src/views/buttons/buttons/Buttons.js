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

  const [reportType, setReportType] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const chartRef = useRef(null);
  const reportRef = useRef(null);

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

    if (reportType === "weekly" && selectedWeek) data = employees;
    else if (reportType === "manager" && selectedOption && selectedWeek)
      data =
        selectedOption === "all"
          ? employees
          : employees.filter((e) => e.manager === selectedOption);
    else if (reportType === "department" && selectedOption && selectedWeek)
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
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, filename);
    } catch (err) {
      alert("Export failed, using CSV fallback");
    }
  };

  const handlePrint = async () => {
    if (!reportRef.current) return alert("Nothing to print");
    setIsPrinting(true);
    try {
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
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="container py-3">
      <h5 className="text-dark mb-3">EMPLOYEE PERFORMANCE REPORTS</h5>

      <div className="row g-3">
        {["weekly", "manager", "department"].map((type) => (
          <div key={type} className="col-12 col-md-6 col-lg-4">
            <div
              className={`card shadow-sm border-0 ${
                reportType === type ? "border-primary" : ""
              }`}
            >
              <div className="card-body">
                <div className="form-check">
                  <input
                    type="radio"
                    name="reportType"
                    id={`rt-${type}`}
                    value={type}
                    className="form-check-input"
                    checked={reportType === type}
                    onChange={(e) => {
                      setReportType(e.target.value);
                      setSelectedOption("");
                      setSelectedWeek("");
                      setFilteredData([]);
                    }}
                  />
                  <label
                    htmlFor={`rt-${type}`}
                    className="form-check-label text-capitalize fw-semibold ms-2"
                  >
                    {type} Report
                  </label>
                </div>

                {reportType === type && (
                  <div className="mt-3 animate__animated animate__fadeIn">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Select Week</label>
                      <input
                        type="week"
                        className="form-control"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                      />
                    </div>

                    {(type === "manager" || type === "department") && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          {type === "manager"
                            ? "Select Manager"
                            : "Select Department"}
                        </label>
                        <select
                          className="form-select"
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="all">
                            {type === "manager"
                              ? "All Managers"
                              : "All Departments"}
                          </option>
                          {(type === "manager" ? managers : departments).map(
                            (item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )}

                    <button className="btn btn-primary w-100" onClick={handleSubmit}>
                      Generate Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length > 0 && (
        <div ref={reportRef} className="mt-5">
          <div className="d-flex justify-content-end gap-3 mb-3">
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

          <h5 className="fw-bold mb-3 text-start">
            📋 {reportType.toUpperCase()} REPORT{" "}
            {selectedWeek && `(${selectedWeek})`}
          </h5>

          <div className="table-responsive">
            <table className="table table-bordered table-striped text-center">
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

          <div className="mt-4">
            <h6 className="fw-bold mb-2 text-start">📈 Performance Chart</h6>
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicPerformanceReport;
