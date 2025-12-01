import React, { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function EmployeeTables() {
  const API_URL = "http://127.0.0.1:8000/api/employee/employees/";
  const CSV_UPLOAD_URL = "http://127.0.0.1:8000/api/employee/upload_csv/";
  const MANAGER_LIST_URL = "http://127.0.0.1:8000/api/employee/employees/managers/";
  const DEPARTMENT_LIST_URL = "http://127.0.0.1:8000/api/employee/departments/";


  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchPage, setSearchPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [isSearching, setIsSearching] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [formData, setFormData] = useState({
    id: null,
    emp_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department_code: "",
    role: "",
    designation: "",
    project_name: "",
    joining_date: "",
    manager: "",
  });

  const [errors, setErrors] = useState({});
  const [mode, setMode] = useState("add");
  const [showModal, setShowModal] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [pageLoading, setPageLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const authHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };


  const managerLabel = (m) => {
    return (
      m.full_name ||
      `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim() ||
      "Unknown"
    );
  };

  const fetchManagers = async (deptCode = "") => {
    try {
      const url = deptCode
        ? `${MANAGER_LIST_URL}?department_code=${deptCode}`
        : MANAGER_LIST_URL; // ✅ ALL managers if no dept

      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      setManagers(
        list.map((m) => ({
          emp_id: m.emp_id,
          full_name:
            m.full_name ||
            `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim(),
        }))
      );
    } catch (error) {
      console.error("Error fetching managers:", error);
      setManagers([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(DEPARTMENT_LIST_URL, {
        headers: authHeaders
      });

      const data = await res.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      setDepartments(list);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    }
  };


  const fetchEmployees = async (page = 1, orderingParam = "", search = "") => {
    
    setLoading(true);

    try {
      const url = `${API_URL}?page=${page}&page_size=${pageSize}${orderingParam}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();

      setEmployees(data.results || []);
      setTotalPages(data.total_pages || Math.ceil((data.count || 0) / pageSize));
      setCurrentPage(data.current_page || page);
      setTotalRecords(data.count || 0);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSearchResults = async (page, value) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}?search=${encodeURIComponent(value)}&page=${page}&page_size=${pageSize}`,
        { headers: authHeaders }
      );

      const data = await res.json();

      setEmployees(data.results || []);
      setTotalPages(data.total_pages || Math.ceil((data.count || 0) / pageSize));
      setSearchPage(page);
      setTotalRecords(data.count || 0);
    } catch (error) {
      console.error("Search pagination error:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchAllEmployees = async () => {
    try {
      let allEmployees = [];
      let page = 1;
      while (true) {
        const res = await fetch(`${API_URL}?page=${page}`, {
          headers: authHeaders,
        });
        const data = await res.json();

        if (!data.results || data.results.length === 0) break;

        allEmployees = [...allEmployees, ...data.results];
        if (!data.next) break;
        page++;
      }
      return allEmployees;
    } catch (err) {
      console.error("Error fetching all employees for search:", err);
      return [];
    }
  };


  useEffect(() => {
    const savedPage = sessionStorage.getItem("emp_page");
    const savedSearch = sessionStorage.getItem("emp_search");

    if (savedSearch) {
      setSearchTerm(savedSearch);
      setIsSearching(true);
      loadSearchResults(savedPage || 1, savedSearch);
    } else if (savedPage) {
      setCurrentPage(parseInt(savedPage));
    }
  }, []);

  useEffect(() => {
    setPageLoading(true); 
    let ordering = "";
    if (sortConfig.key) {
      ordering = `&ordering=${
        sortConfig.direction === "asc" ? sortConfig.key : "-" + sortConfig.key
      }`;
    }

    fetchEmployees(1, ordering).finally(() => {
      setPageLoading(false);
    });

    fetchDepartments();
  }, []);


  useEffect(() => {
    if (!isSearching) {
      let ordering = "";
      if (sortConfig.key) {
        ordering = `&ordering=${
          sortConfig.direction === "asc" ? sortConfig.key : "-" + sortConfig.key
        }`;
      }

      fetchEmployees(currentPage, ordering);
    }
  }, [currentPage, sortConfig]);

  useEffect(() => {
    let ordering = "";
    if (sortConfig.key) {
      ordering = `&ordering=${
        sortConfig.direction === "asc" ? sortConfig.key : "-" + sortConfig.key
      }`;
    }

    fetchEmployees(currentPage, ordering);
  }, [pageSize]);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ✅ AUTO-REFRESH MANAGERS WHEN DEPARTMENT CHANGES
  useEffect(() => {
    if (!showModal) return;

    if (formData.department_code) {
      fetchManagers(formData.department_code); // filter by department
    } else {
      fetchManagers(); // load all managers
    }
  }, [formData.department_code, showModal]);


  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchTerm(value);

    // Clear any previous debounce timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce API call by 500ms after typing stops
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // If search box is empty, restore paginated data (no reload flicker)
        if (!value) {
          setIsSearching(false);
          setSearchPage(1);
          setCurrentPage(1);

          let ordering = "";
          if (sortConfig.key) {
            ordering = `&ordering=${
              sortConfig.direction === "asc"
                ? sortConfig.key
                : "-" + sortConfig.key
            }`;
          }

          await fetchEmployees(1, ordering);
          return;
        }

        // Avoid redundant refresh
        if (value === searchTerm && employees.length > 0 && isSearching) return;

        setIsSearching(true);
        setSearchPage(1);
        loadSearchResults(1, value);

      } catch (error) {
        console.error("Error searching employees:", error);
        setAlert({ message: "Failed to search employees", type: "danger" });
      }
    }, 500);
  };

  let filteredEmployees = [...employees];


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAdd = () => {
    fetchManagers([]);

    setFormData({
      id: null,
      emp_id: "",
      first_name: "",
      last_name: "",
      email: "",
      department_code: "",
      role: "",
      designation: "",
      project_name: "",
      joining_date: "",
      manager: "",
    });
    setErrors({});
    setMode("add");
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setManagers([]);

    setFormData({
      id: emp.id,
      emp_id: emp.emp_id,
      first_name:
        emp.first_name ||
        emp.user?.first_name ||
        emp.full_name?.split(" ")[0] ||
        "",
      last_name:
        emp.last_name ||
        emp.user?.last_name ||
        emp.full_name?.split(" ")[1] ||
        "",
      email: emp.email,
      department_code: emp.department_code || emp.department?.code || "",
      role: emp.role || "",
      designation: emp.designation || "",
      project_name: emp.project_name || "",
      joining_date: emp.joining_date || "",
      manager: emp.manager_name !== "Not Assigned" ? emp.manager_name : "",
    });

    setErrors({});
    setMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (empId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}${empId}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      
      if (isSearching) {
        await loadSearchResults(searchPage, searchTerm);
      } else {
        fetchEmployees(currentPage);
      }
      
      setAlert({ message: "Employee Deleted Successfully", type: "success" });
    } catch (error) {
      console.error("Error deleting employee", error);
      setAlert({ message: "Failed to delete employee", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (emp) => {
    handleEdit(emp);
    setMode("view");
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSave = async () => {
    setLoading(true);
    setErrors({});

    const method = mode === "edit" ? "PATCH" : "POST";
    const url = mode === "edit" ? `${API_URL}${formData.emp_id}/` : API_URL;

    const payload = { ...formData };
    delete payload.emp_id;
    delete payload.id;

    const requiredFields = ["first_name", "last_name", "email", "role", "department_code", "joining_date"];
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!payload[field]?.trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (payload.email && !validateEmail(payload.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    // Last name alphabets only (no numbers or special characters)
    if (payload.last_name && !/^[A-Za-z]+$/.test(payload.last_name)) {
      newErrors.last_name = "Last name must contain only alphabets (A–Z).";
    }


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      setAlert({
        message: "Please fill all mandatory fields before saving.",
        type: "warning",
      });
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();


      if (!res.ok) {
        if (data?.errors && typeof data.errors === "object") {
          const backendErrors = {};
          Object.entries(data.errors).forEach(([key, val]) => {
            backendErrors[key] = Array.isArray(val) ? val[0] : val;
          });

          setErrors(backendErrors);
          setLoading(false);
          return;
        }

        setAlert({ message: data?.error || "Failed to save employee.", type: "danger" });
        setLoading(false);
        return;
      }

      if (mode === "add") {
      setIsSearching(false);
      setSearchTerm("");

      //  Get updated total count after successful insert
      const resAll = await fetch(`${API_URL}?page=1`, { headers: authHeaders });
      const dataAll = await resAll.json();

      const totalCount = dataAll.count || 0;
      const lastPage = Math.ceil(totalCount / pageSize);

      //  Jump to the page where last employee exists
      setCurrentPage(lastPage);
      await fetchEmployees(lastPage);
    } else {
        if (isSearching) {
          const allEmployees = await fetchAllEmployees();
          const filtered = allEmployees.filter(
            (emp) =>
              emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setEmployees(filtered);
        } else {
          await fetchEmployees(currentPage);
        }
      }

      setFormData({
        id: null,
        emp_id: "",
        first_name: "",
        last_name: "",
        email: "",
        department_code: "",
        role: "",
        designation: "",
        project_name: "",
        joining_date: "",
        manager: "",
      });

      setShowModal(false);

      setAlert({
        message: mode === "edit" ? "Employee Updated Successfully!" : "Employee Added Successfully!",
        type: "success",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      console.error("Error saving employee:", error);
      setAlert({ message: "Something went wrong while saving.", type: "danger" });
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
      const res = await fetch(CSV_UPLOAD_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataCSV,
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({ message: data.error || "CSV Upload Failed", type: "danger" });
        return;
      }

      // If backend has error rows → show RED alert
      if (data.errors && data.errors.length > 0) {
        setAlert({
          message: `CSV upload failed. ${data.errors.length} errors found.`,
          type: "danger",
        });
        console.error("CSV Upload Errors:", data.errors);
        return;
      }

      // If some rows uploaded
      if (data.uploaded_count > 0) {
        setAlert({
          message: `CSV Uploaded Successfully! ${data.uploaded_count} employees added.`,
          type: "success",
        });
      } else {
        setAlert({
          message: "No records were uploaded.",
          type: "warning",
        });
      }

      // Refresh employee list
      setIsSearching(false);
      setSearchTerm("");
      await fetchEmployees(1);
      setCurrentPage(1);

    } catch (error) {
      console.error("CSV upload error:", error);
      setAlert({ message: "Failed to upload CSV", type: "danger" });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };


  const handleSort = async (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });

    const orderingParam = direction === "asc" ? key : `-${key}`;

    setLoading(true);
    setIsSearching(false);
    setSearchTerm("");

    try {
      const res = await fetch(
      `${API_URL}?ordering=${orderingParam}&page=1`,
      { headers: authHeaders }
    );
      const data = await res.json();

      setEmployees(
        (data.results || []).map((emp) => ({
          ...emp,
          full_name:
            emp.full_name ||
            `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.trim(),
        }))
      );
      setTotalPages(data.total_pages || 1);
      setCurrentPage(1);
      setTotalRecords(data.count || 0);
    } catch (error) {
      console.error("Sorting error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  const SortIcon = ({ column, activeKey, direction }) => {
    const active = activeKey === column;
    const isAsc = direction === "asc";

    const barsClass = !active
      ? "sort-bars default"
      : isAsc
      ? "sort-bars asc"
      : "sort-bars desc";

    return (
      <span className="sort-wrapper">
        <div className={barsClass}><span></span></div>
        <i
          className={`bi ${
            !active ? "bi-arrow-down-up" : isAsc ? "bi-arrow-up" : "bi-arrow-down"
          } sort-arrow ${active ? "active" : ""}`}
        />
      </span>
    );
  };

  const getVisiblePages = () => {
    const activePage = isSearching ? searchPage : currentPage;
    const maxVisible = 5;

    let start = Math.max(activePage - Math.floor(maxVisible / 2), 1);
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const activePage = isSearching ? searchPage : currentPage;

  useEffect(() => {
      sessionStorage.setItem("emp_page", activePage);
      sessionStorage.setItem("emp_search", searchTerm);
    }, [activePage, searchTerm]);

  const highlightText = (text, keyword) => {
    if (!keyword) return text;

    const regex = new RegExp(`(${keyword})`, "gi");
    return text.toString().split(regex).map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={index} style={{ background: "#ffe066", padding: "2px 4px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };


  return (
    <div className="container py-3">
      <h5 className="mb-3">EMPLOYEE DETAILS</h5>

      {alert.message && (
        <div className={`custom-alert alert-${alert.type}`}>
          <div className="alert-icon">
            {alert.type === "success" && <i className="bi bi-check-circle-fill"></i>}
            {alert.type === "danger" && <i className="bi bi-x-octagon-fill"></i>}
            {alert.type === "warning" && <i className="bi bi-exclamation-triangle-fill"></i>}
            {alert.type === "info" && <i className="bi bi-info-circle-fill"></i>}
          </div>

          <div className="alert-content">
            <strong>
              {alert.type === "success" && "Success! "}
              {alert.type === "danger" && "Error! "}
              {alert.type === "warning" && "Warning! "}
              {alert.type === "info" && "Info! "}
            </strong>
            {alert.message}
          </div>

          <button
            className="alert-close"
            onClick={() => setAlert({ message: "", type: "" })}
          >
            &times;
          </button>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          {/* ===== DATATABLE TOOLBAR ===== */}
          <div className="dt-toolbar">

            {/* FIXED WRAPPER - PREVENTS SHIFTING */}
            <div className="dt-toolbar-inner">
              {/* LEFT SIDE */}
              <div className="dt-left">

                <div className="entries-block">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value);
                      setPageSize(size);
                      setCurrentPage(1);
                      setSearchPage(1);
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span>entries</span>
                </div>

                <div className="search-input-wrapper">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search employees..."
                  />

                  {searchTerm && (
                    <span
                      className="search-clear"
                      onClick={() => {
                        setSearchTerm("");
                        setIsSearching(false);
                        setSearchPage(1);
                        fetchEmployees(1);
                      }}
                    >
                      ✕
                    </span>
                  )}
                </div>

                <div className="search-info">
                  <span style={{ visibility: isSearching ? "visible" : "hidden" }}>
                    {totalRecords} result(s) found for "{searchTerm}"
                  </span>
                </div>

              </div>

              {/* RIGHT SIDE - FIXED POSITION */}
              <div className="dt-right d-flex align-items-center gap-2">
                <label htmlFor="csvUpload" className="btn btn-outline-secondary csv-upload-btn">
                  <i className="bi bi-upload me-1"></i> Import
                </label>

                <button className="btn btn-primary" onClick={handleAdd}>
                  <i className="bi bi-plus-circle me-1"></i> Add Employee
                </button>
              </div>

            </div>
          </div>
          <div className="dt-wrapper">
            <div className="table-responsive">
            <table
              className="table dt-table text-center align-middle"
              style={{ whiteSpace: "nowrap", tableLayout: "auto" }}
            >
              <thead>
                <tr>
                  <th onClick={() => handleSort("user__emp_id")} style={{ cursor: "pointer" }}>
                    Emp ID <SortIcon column="user__emp_id" sortConfig={sortConfig} />
                  </th>
                  <th onClick={() => handleSort("user__first_name")} style={{ cursor: "pointer" }}>
                    Name <SortIcon column="user__first_name" sortConfig={sortConfig} />
                  </th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Project</th>
                  <th>Manager</th>
                  <th onClick={() => handleSort("joining_sort")} style={{ cursor: "pointer" }}>
                    Joining Date <SortIcon column="joining_sort" sortConfig={sortConfig} />
                  </th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  [...Array(pageSize)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="10">
                        <div className="skeleton-row"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ccc" }}></i>
                      <p className="mt-3 text-muted mb-0">
                        {searchTerm ? "No employees match your search" : "No employees found"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.emp_id || emp.user?.emp_id || "-"}</td>
                      <td>
                        {highlightText(
                          emp.full_name ||
                            `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.trim(),
                          searchTerm
                        )}
                      </td>
                      <td>{emp.email}</td>
                      <td>{emp.designation}</td>
                      <td>{emp.project_name || "-"}</td>
                      <td>{emp.manager_name || "Not Assigned"}</td>
                      <td>{emp.joining_date}</td>
                      <td>{emp.department_name}</td>
                      <td>
                        <span
                          className={
                            emp.status === "Active" ? "badge bg-success" : "badge bg-danger"
                          }
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="text-nowrap" style={{ minWidth: "120px" }}>
                        <button className="btn btn-sm btn-info me-2" onClick={() => handleEdit(emp)}>
                          <i className="bi bi-pencil-square text-white"></i>
                        </button>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleView(emp)}>
                          <i className="bi bi-eye text-white"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>
                          <i className="bi bi-trash text-white"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
              </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="dt-pagination d-flex justify-content-between align-items-center mt-3">

              {/* LEFT TEXT */}
              <div className="text-muted">
                Showing {(activePage - 1) * pageSize + 1} to{" "}
                {Math.min(activePage * pageSize, totalRecords)} of {totalRecords} entries
              </div>

              {/* RIGHT CONTROLS */}
              <ul className="pagination mb-0">

                {/* First */}
                <li className={`page-item ${activePage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => {
                      if (isSearching) {
                        setSearchPage(1);
                        loadSearchResults(1, searchTerm);
                      } else {
                        setCurrentPage(1);
                      }
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                  >
                    «
                  </button>
                </li>

                {/* Previous */}
                <li className={`page-item ${activePage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => {
                      if (isSearching) {
                        const prev = searchPage - 1;
                        setSearchPage(prev);
                        loadSearchResults(prev, searchTerm);
                      } else {
                        setCurrentPage(currentPage - 1);
                      }
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                  >
                    ‹
                  </button>
                </li>

                {/* LIMITED PAGE NUMBERS */}
                {getVisiblePages().map((page) => (
                  <li
                    key={page}
                    className={`page-item ${
                      page === (isSearching ? searchPage : currentPage) ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => {
                        if (isSearching) {
                          setSearchPage(page);
                          loadSearchResults(page, searchTerm);
                        } else {
                          setCurrentPage(page);
                        }
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                {/* Next */}
                <li className={`page-item ${activePage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => {
                      if (isSearching) {
                        const next = searchPage + 1;
                        setSearchPage(next);
                        loadSearchResults(next, searchTerm);
                      } else {
                        setCurrentPage(currentPage + 1);
                      }
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                  >
                    ›
                  </button>
                </li>

                {/* Last */}
                <li className={`page-item ${activePage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => {
                      if (isSearching) {
                        setSearchPage(totalPages);
                        loadSearchResults(totalPages, searchTerm);
                      } else {
                        setCurrentPage(totalPages);
                      }
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                  >
                    »
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5>
                    {mode === "add"
                      ? "Add New Employee"
                      : mode === "edit"
                      ? "Edit Employee"
                      : "View Employee"}
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    {/* First Name */}
                    <div className="col-md-6">
                      <label className="form-label">
                        First Name <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        readOnly={mode === "view"}
                        placeholder={errors.first_name || ""}
                      />
                      {errors.first_name && (
                        <div className="invalid-feedback">{errors.first_name}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Last Name <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        readOnly={mode === "view"}
                        placeholder={errors.last_name || ""}
                      />
                      {errors.last_name && (
                        <div className="invalid-feedback">{errors.last_name}</div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Email <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        readOnly={mode === "view"}
                        placeholder={errors.email || ""}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>

                    {/* Department */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Department <span style={{ color: "red" }}>*</span>
                      </label>
                      <select
                        className={`form-select ${errors.department_code ? "is-invalid" : ""}`}
                        name="department_code"
                        value={formData.department_code}
                        onChange={handleInputChange}   // ✅ only update state
                        disabled={mode === "view"}
                      >
                        <option value="">Select Department</option>

                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.code}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {errors.department_code && (
                        <div className="invalid-feedback">
                          {errors.department_code}
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Role <span style={{ color: "red" }}>*</span>
                      </label>
                      <select
                        className={`form-select ${errors.role ? "is-invalid" : ""}`}
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                      >
                        <option value="">Select Role</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                      </select>
                      {errors.role && (
                        <div className="invalid-feedback">{errors.role}</div>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="col-md-6">
                      <label className="form-label">Designation</label>
                      <input
                        className="form-control"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        readOnly={mode === "view"}
                      />
                    </div>

                    {/* Project */}
                    <div className="col-md-6">
                      <label className="form-label">Project Name</label>
                      <input
                        className="form-control"
                        name="project_name"
                        value={formData.project_name}
                        onChange={handleInputChange}
                        readOnly={mode === "view"}
                      />
                    </div>

                    {/* Joining Date */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Joining Date <span style={{ color: "red" }}>*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          name="joining_date"
                          className={`form-control ${errors.joining_date ? "is-invalid" : ""}`}
                          value={
                            formData.joining_date
                              ? (() => {
                                  const parts = formData.joining_date.split("-");
                                  if (parts.length === 3 && parts[2].length === 4)
                                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                  return formData.joining_date;
                                })()
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split("-");
                              setFormData({
                                ...formData,
                                joining_date: `${d}-${m}-${y}`,
                              });
                            } else {
                              setFormData({ ...formData, joining_date: "" });
                            }
                            setErrors((prev) => ({ ...prev, joining_date: "" }));
                          }}
                          max={new Date().toISOString().split("T")[0]}
                          placeholder={errors.joining_date || "dd-mm-yyyy"}
                          readOnly={mode === "view"}
                        />
                        {errors.joining_date && (
                          <div className="invalid-feedback d-block">
                            {errors.joining_date}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manager */}
                    <div className="col-md-6">
                      <label className="form-label">Manager</label>
                      <select
                        className="form-select"
                        name="manager"
                        value={formData.manager}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                      >
                        <option value="">Select Manager</option>
                        {managers.map((m) => (
                          <option key={m.emp_id} value={m.emp_id}>
                            {managerLabel(m)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                  {mode !== "view" && (
                    <button className="btn btn-primary" onClick={handleSave}>
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
      {pageLoading && (
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
            zIndex: 2000,
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default EmployeeTables;