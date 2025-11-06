import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function EmployeeTables() {
  const API_URL = "http://127.0.0.1:8000/api/employee/employees/";
  const CSV_UPLOAD_URL = "http://127.0.0.1:8000/api/employee/upload_csv/";
  const MANAGER_LIST_URL = "http://127.0.0.1:8000/api/employee/employees/managers/";

  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const [formData, setFormData] = useState({
    id: null,
    emp_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department_code: "",
    role: "",
    designation: "",
    project_name: "",     // ✅ NEW FIELD
    joining_date: "",
    manager: "",
  });

  const [mode, setMode] = useState("add");
  const [showModal, setShowModal] = useState(false);

  const managerLabel = (m) => {
    const name =
      m.full_name ||
      `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim();
    const id = m.emp_id || m.user?.emp_id || "";
    return id ? `${name} (${id})` : name || "Unknown";
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch(MANAGER_LIST_URL);
      const data = await res.json();
      setManagers(
        (data.results || data).map((m) => ({
          emp_id: m.emp_id || m.user?.emp_id || "",
          full_name:
            m.full_name ||
            `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim(),
        }))
      );
    } catch {
      console.error("Error fetching manager list");
    }
  };

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?page=${page}`);
      const data = await res.json();
      setEmployees(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage);
    fetchManagers();
  }, [currentPage]);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const filteredEmployees = employees.filter((emp) => {
    const text = searchTerm.toLowerCase();
    return (
      emp.emp_id?.toLowerCase().includes(text) ||
      emp.full_name?.toLowerCase().includes(text)
    );
  });

  const handleInputChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleAdd = () => {
    setFormData({
      id: null,
      emp_id: "",
      first_name: "",
      last_name: "",
      email: "",
      department_code: "",
      role: "",
      designation: "",
      project_name: "",     // ✅ NEW
      joining_date: "",
      manager: "",
    });
    setMode("add");
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setFormData({
      id: emp.id,
      emp_id: emp.emp_id,
      first_name: emp.user?.first_name || "",
      last_name: emp.user?.last_name || "",
      email: emp.email,
      department_code: emp.department_code || emp.department?.code || "",
      role: emp.role || "",
      designation: emp.designation || "",
      project_name: emp.project_name || "",  // ✅ NEW
      joining_date: emp.joining_date || "",
      manager: emp.manager_name !== "Not Assigned" ? emp.manager_name : "",
    });

    setMode("edit");
    setShowModal(true);
  };

  const handleView = (emp) => {
    handleEdit(emp);
    setMode("view");
  };

  const handleSave = async () => {
    setLoading(true);

    const method = mode === "edit" ? "PATCH" : "POST";
    const url =
      mode === "edit"
        ? `${API_URL}${formData.emp_id}/` // ✅ CORRECT PATCH URL
        : API_URL;

    const payload = { ...formData };
    delete payload.emp_id;
    delete payload.id;

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      fetchEmployees(currentPage);
      setShowModal(false);
      setAlert({
        message: mode === "edit" ? "Employee Updated Successfully!" : "Employee Added Successfully!",
        type: "success",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const formDataCSV = new FormData();
    formDataCSV.append("file", file);

    try {
      await fetch(CSV_UPLOAD_URL, { method: "POST", body: formDataCSV });
      fetchEmployees();
      setAlert({ message: "CSV Uploaded Successfully!", type: "info" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-3">
      <h5 className="mb-3">EMPLOYEE DETAILS</h5>

      {alert.message && (
        <div className={`alert alert-${alert.type} fade show`} role="alert">
          {alert.message}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">

          <div className="d-flex justify-content-between mb-3">
            <input
              type="text"
              placeholder="Search by Name or Emp ID..."
              className="form-control w-25"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div>
              <label htmlFor="csvUpload" className="btn btn-outline-secondary me-2 mb-0">
                <i className="bi bi-upload"></i>
              </label>
              <input id="csvUpload" type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />

              <button className="btn btn-primary" onClick={handleAdd}>
                <i className="bi bi-plus-circle me-2" /> Add Employee
              </button>
            </div>
          </div>

        <div className="table-responsive" style={{ overflowX: "auto" }}>
  <table
    className="table table-bordered table-striped text-center align-middle"
    style={{ whiteSpace: "nowrap", tableLayout: "auto" }}
  >
    <thead className="table-light">
      <tr>
        <th style={{ minWidth: "100px" }}>Emp ID</th>
        <th style={{ minWidth: "150px" }}>Name</th>
        <th style={{ minWidth: "200px" }}>Email</th>
        <th style={{ minWidth: "150px" }}>Designation</th>
        <th style={{ minWidth: "150px" }}>Project</th>
        <th style={{ minWidth: "150px" }}>Manager</th>
        <th style={{ minWidth: "130px" }}>Joining Date</th>
        <th style={{ minWidth: "150px" }}>Department</th>
        <th style={{ minWidth: "180px" }}>Actions</th>
      </tr>
    </thead>

    <tbody>
      {filteredEmployees.map((emp) => (
        <tr key={emp.id}>
          <td>{emp.emp_id}</td>
          <td>{emp.full_name}</td>
          <td>{emp.email}</td>
          <td>{emp.designation}</td>
          <td>{emp.project_name || "-"}</td>
          <td>{emp.manager_name || "Not Assigned"}</td>
          <td>{emp.joining_date}</td>
          <td>{emp.department_name}</td>
          <td className="text-nowrap">
            <div className="d-flex justify-content-center align-items-center gap-2">
              <button
                className="btn btn-sm btn-info"
                onClick={() => handleEdit(emp)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => handleView(emp)}
              >
                View
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

          <div className="d-flex justify-content-center mt-3 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`btn mx-1 ${page === currentPage ? "btn-primary" : "btn-outline-primary"}`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5>
                    {mode === "add" ? "Add New Employee" : mode === "edit" ? "Edit Employee" : "View Employee"}
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>

                <div className="modal-body">
                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label">
                        First Name <span style={{ color: "red" }}>*</span>
                      </label>
                      <input className="form-control" name="first_name" value={formData.first_name} onChange={handleInputChange} readOnly={mode==="view"} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input className="form-control" name="last_name" value={formData.last_name} onChange={handleInputChange} readOnly={mode==="view"} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Email <span style={{ color: "red" }}>*</span>
                      </label>
                      <input className="form-control" type="email" name="email" value={formData.email} onChange={handleInputChange} readOnly={mode==="edit" || mode==="view"} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Department <span style={{ color: "red" }}>*</span>
                      </label>
                      <select className="form-select" name="department_code" value={formData.department_code} onChange={handleInputChange} disabled={mode==="view"}>
                        <option value="">Select Department</option>
                        <option value="HR">HR</option>
                        <option value="FIN">Finance</option>
                        <option value="ENG">Engineering</option>
                        <option value="MKT">Marketing</option>
                        <option value="SALES">Sales</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Role <span style={{ color: "red" }}>*</span>
                      </label>
                      <select className="form-select" name="role" value={formData.role} onChange={handleInputChange} disabled={mode==="view"}>
                        <option value="">Select Role</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Designation</label>
                      <input className="form-control" name="designation" value={formData.designation} onChange={handleInputChange} readOnly={mode==="view"} />
                    </div>

                  
                    <div className="col-md-6">
                      <label className="form-label">Project Name</label>
                      <input className="form-control" name="project_name" value={formData.project_name} onChange={handleInputChange} readOnly={mode==="view"} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Joining Date</label>
                      <input className="form-control" type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} readOnly={mode==="view"} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Manager (Select)</label>
                      <select
                        className="form-select"
                        name="manager"
                        value={formData.manager}
                        onChange={handleInputChange}
                        disabled={mode==="view"}
                      >
                        <option value="">No Manager</option>
                        {managers.map((m) => (
                          <option key={m.emp_id} value={m.emp_id}>
                            {managerLabel(m)}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                <div className="d-flex justy-space-between modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  {mode !== "view" && <button className="btn btn-primary" onClick={handleSave}>{mode === "add" ? "Save" : "Update"}</button>}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255, 255, 255, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
        >
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
        </div>
      )}

    </div>
  );
}

export default EmployeeTables;