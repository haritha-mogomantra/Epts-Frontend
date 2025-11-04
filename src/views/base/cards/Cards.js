import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginDetails = () => {
  const [employees, setEmployees] = useState([
    { id: "EMP001", name: "eswar", username: "eswar", password: "pass@123" },
    { id: "EMP002", name: "haritha", username: "haritha", password: "pass@456" },
    { id: "EMP003", name: "gopi", username: "gopi", password: "pass@789" },
    { id: "EMP004", name: "srinivas", username: "srinu", password: "pass@321" },
    { id: "EMP005", name: "sandeep", username: "sandy", password: "pass@654" },
    { id: "EMP006", name: "sravani", username: "sravs", password: "pass@147" },
  ]);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const recordsPerPage = 4;

  const filteredData = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      emp.username.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const currentData = sortedData.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const regeneratePassword = (empId) => {
    const newPass = Math.random().toString(36).slice(-8);
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === empId ? { ...emp, password: newPass } : emp
      )
    );

    // ✅ Show success alert instead of normal alert()
    setAlert({
      show: true,
      type: "success",
      message: `Password regenerated successfully for ${empId}.`,
    });

    // Auto hide alert after 3 seconds
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <div className="container">
      <div className="text-dark mb-3">
        <h5>LOGIN CREDENTIALS</h5>
      </div>

      <div className="card shadow border-0">
        <div className="card-body">
          {/* ✅ Bootstrap Alert */}
          {alert.show && (
            <div
              className={`alert alert-${alert.type} alert-dismissible fade show`}
              role="alert"
            >
              {alert.message}
              <button
                type="button"
                className="btn-close"
                onClick={() => setAlert({ show: false, message: "", type: "" })}
              ></button>
            </div>
          )}

          <div className="mb-3">
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search Employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                    Emp ID {getSortIcon("id")}
                  </th>
                  <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                    Name {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("username")} style={{ cursor: "pointer" }}>
                    Username {getSortIcon("username")}
                  </th>
                  <th onClick={() => handleSort("password")} style={{ cursor: "pointer" }}>
                    Password {getSortIcon("password")}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.name}</td>
                      <td>{emp.username}</td>
                      <td>{emp.password}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm text-white"
                          onClick={() => regeneratePassword(emp.id)}
                        >
                          Regenerate Password
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination */}
          <nav>
            <ul className="pagination justify-content-end mt-3 mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </button>
              </li>

              {[...Array(totalPages)].map((_, i) => (
                <li
                  key={i}
                  className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default LoginDetails;
