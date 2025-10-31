import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function EmployeeTables() {
  const [employees, setEmployees] = useState([
    {
      id: "EMP001",
      firstName: "Haritha",
      lastName: "",
      email: "haritha@gmail.com",
      role: "Manager",
      joiningDate: "2023-06-15",
      department: "HR",
      manager: "Mark",
    },
    {
      id: "EMP002",
      firstName: "Eswar",
      lastName: "",
      email: "eswar@gmail.com",
      role: "Developer",
      joiningDate: "2022-09-01",
      department: "IT",
      manager: "Haritha",
    },
  ]);

  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "",
    joiningDate: "",
    manager: "",
  });

  const [mode, setMode] = useState("add"); // "add" | "edit" | "view"
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [showModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = () => {
    setFormData({
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      role: "",
      joiningDate: "",
      manager: "",
    });
    setMode("add");
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setFormData(emp);
    setMode("edit");
    setShowModal(true);
  };

  const handleView = (emp) => {
    setFormData(emp);
    setMode("view");
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setMode("add");
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.email) {
      alert("First name and email are required");
      return;
    }

    if (mode === "edit") {
      setEmployees((prev) => prev.map((emp) => (emp.id === formData.id ? formData : emp)));
    } else {
      const newId = `EMP${String(employees.length + 1).padStart(3, "0")}`;
      setEmployees((prev) => [...prev, { ...formData, id: newId }]);
    }

    setShowModal(false);
    setMode("add");
  };

  // ✅ CSV Upload moved outside modal
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      const rows = csvText.trim().split("\n");
      const headers = rows[0].split(",").map((h) => h.trim());
      const newEmployees = rows.slice(1).map((row, idx) => {
        const values = row.split(",").map((v) => v.trim());
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || "";
        });
        obj.id = `EMP${String(employees.length + idx + 1).padStart(3, "0")}`;
        return obj;
      });

      setEmployees((prev) => [...prev, ...newEmployees]);
      alert("CSV uploaded successfully!");
    };
    reader.readAsText(file);
  };

  return (
    <div className="container py-3">
      <div className="text-dark mb-2">
        <h5>EMPLOYEE DETAILS</h5>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {/* ✅ Search + Add Employee + CSV Icon */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <input type="text" className="form-control w-25" placeholder="Search employees..." />

            <div className="d-flex align-items-center">
              {/* CSV Upload Icon */}
              <label htmlFor="csvUpload" className="btn btn-outline-secondary me-2 mb-0">
                <i className="bi bi-upload" title="Upload CSV"></i>
              </label>
              <input
                id="csvUpload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{ display: "none" }}
              />

              {/* Add Employee Button */}
              <button className="btn btn-primary" onClick={handleAdd}>
                <i className="bi bi-plus-circle me-2" /> Add Employee
              </button>
            </div>
          </div>

          
          <div className="table-responsive">
            <table className="table table-bordered table-striped text-center mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Emp ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Joining Date</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{`${emp.firstName} ${emp.lastName}`.trim()}</td>
                    <td>{emp.email}</td>
                    <td>{emp.role}</td>
                    <td>{emp.joiningDate}</td>
                    <td>{emp.department}</td>
                    <td>{emp.manager}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-info me-2"
                        title="Edit"
                        onClick={() => handleEdit(emp)}
                      >
                        <i className="bi bi-pencil-square text-white" />
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        title="View"
                        onClick={() => handleView(emp)}
                      >
                        <i className="bi bi-eye text-white" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    {mode === "add" ? "Add New Employee" : mode === "edit" ? "Edit Employee" : "View Employee"}
                  </h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
                </div>

                <div className="modal-body">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          readOnly={mode === "view"}
                          className="form-control"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          readOnly={mode === "view"}
                          className="form-control"
                          placeholder="Enter last name"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          readOnly={mode === "view"}
                          type="email"
                          className="form-control"
                          placeholder="Enter email"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          disabled={mode === "view"}
                          className="form-select"
                        >
                          <option value="">Select Department</option>
                          <option>HR</option>
                          <option>IT</option>
                          <option>Finance</option>
                          <option>Marketing</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Designation</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          disabled={mode === "view"}
                          className="form-select"
                        >
                          <option value="">Select Role</option>
                          <option>Frontend</option>
                          <option>Backend</option>
                          <option>Database</option>
                          <option>Testing</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Joining Date</label>
                        <input
                          name="joiningDate"
                          value={formData.joiningDate}
                          onChange={handleInputChange}
                          readOnly={mode === "view"}
                          type="date"
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Manager</label>
                        <select
                          name="manager"
                          value={formData.manager}
                          onChange={handleInputChange}
                          disabled={mode === "view"}
                          className="form-select"
                        >
                          <option value="">Select Manager</option>
                          <option>Mark</option>
                          <option>Vijay Kumar</option>
                          <option>Haritha</option>
                        </select>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    Close
                  </button>
                  {mode !== "view" && (
                    <button type="button" className="btn btn-primary" onClick={handleSave}>
                      {mode === "add" ? "Save" : "Update"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default EmployeeTables;
