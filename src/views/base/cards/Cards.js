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
    alert(`Password regenerated for ${empId}`);
  };

  
  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <div className="container">

       <div className="text-Dark">
          <h5>LOGIN CREDENTIALS</h5>
        </div>
      <div className="card shadow border-0">
       

        <div className="card-body">
          
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
                          className="btn btn-warning btn-sm"
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

          
           <nav>
            <ul className="pagination justify-content-end mt-3 mb-0">
              <li className="page-item disabled">
                <a className="page-link" href="#!">Previous</a>
              </li>
              <li className="page-item active"><a className="page-link" href="#!">1</a></li>
              <li className="page-item"><a className="page-link" href="#!">2</a></li>
              <li className="page-item"><a className="page-link" href="#!">Next</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default LoginDetails;
