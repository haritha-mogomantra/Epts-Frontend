import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const DEFAULT_PROFILE = "/default-profile.png";

const labelMap = {
  emp_id: "Employee ID",
  first_name: "First Name",
  last_name: "Last Name",
  gender: "Gender",
  dob: "Date of Birth",
  contact_number: "Contact Number",
  email: "Email ID",
  profile_picture_url: "Profile Picture",

  department: "Department",
  department_code: "Department Code",
  designation: "Role / Designation",
  role: "Role",
  project_name: "Project Name",
  joining_date: "Date of Joining",
  manager_name: "Manager Name",
  status: "Status",

  address_line1: "Address Line 1",
  address_line2: "Address Line 2",
  city: "City",
  state: "State",
  pincode: "Pincode",
};

const LOCKED_PERSONAL_FIELDS = ["emp_id", "first_name", "last_name", "email"];

const Profile = ({ title, editable, personal = {}, professional = {}, address = {} }) => {
  // unified input height + look
  const inputStyle = {
    height: "42px",
    fontSize: "0.9rem",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    personal,
    professional,
    address,
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");

      const updateUrl =
        role === "Admin"
          ? "http://127.0.0.1:8000/api/employee/admin/profile/"
          : "http://127.0.0.1:8000/api/employee/profile/";

      await axios.patch(
        updateUrl,
        {
          ...formData.personal,
          ...formData.professional,
          ...formData.address,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };


  /** Render Field */
  const renderField = (section, key, value) => {

    // hide profile picture inside personal section
    if (section === "personal" && key === "profile_picture_url") return null;

    const isLockedPersonal =
      section === "personal" && LOCKED_PERSONAL_FIELDS.includes(key);

    const isEditable =
      isEditing &&
      ((section === "personal" && !isLockedPersonal) ||
       section === "address");

    const isGrey =
      isEditing &&
      ((section === "personal" && isLockedPersonal) ||
       section === "professional");

    return (
      <div className="col-md-6 mb-4" key={key}>
        <label className="fw-semibold text-secondary small mb-1">
          {labelMap[key]}
        </label>

        {isEditable ? (
          <input
            type="text"
            className="form-control"
            style={inputStyle}
            value={formData[section][key] || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                [section]: {
                  ...formData[section],
                  [key]: e.target.value,
                },
              })
            }
          />
        ) : isGrey ? (
          <input
            type="text"
            className="form-control"
            style={{
              ...inputStyle,
              backgroundColor: "#f0f0f0",
              color: "#6c757d",
              border: "1px solid #ddd",
            }}
            value={value || ""}
            disabled
          />
        ) : (
          <div
            className="form-control"
            style={{
                ...inputStyle,
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                color: "#111827",
            }}
            >
            {value || "—"}
            </div>
        )}
      </div>
    );
  };


  return (
    <div className="container py-4">

      {/* ------- HEADER CARD ------- */}
        <div
        className="p-4 rounded shadow-sm mb-4"
        style={{
            background: "linear-gradient(to right, #eef2ff, #f7faff)",
            border: "1px solid #e2e8f0",
        }}
        >
        <div className="d-flex align-items-center w-100">

            <input
                type="file"
                id="headerProfileUpload"
                hidden
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                    const previewURL = URL.createObjectURL(file);

                    setFormData((prev) => ({
                        ...prev,
                        personal: {
                        ...prev.personal,
                        profile_picture_url: previewURL,   // UI preview
                        profile_picture_file: file,        // real file for backend
                        },
                    }));
                    }
                }}
                />

                <img
                src={formData.personal.profile_picture_url || DEFAULT_PROFILE}
                alt="Profile"
                className="rounded-circle shadow"
                style={{
                    width: 70,
                    height: 70,
                    objectFit: "cover",
                    cursor: isEditing ? "pointer" : "default",
                }}
                onClick={() => {
                  if (editable && isEditing)
                      document.getElementById("headerProfileUpload").click();
              }}
                />

            <div className="ms-3">
            <h5 className="mb-0">
                {formData.personal.first_name} {formData.personal.last_name}
            </h5>
            <div className="text-muted small">{formData.personal.email}</div>
            <div className="text-muted small">{formData.professional.role}</div>
            </div>

            {editable && (
            <button
                className="btn btn-primary ms-auto px-4"
                onClick={() => setIsEditing(true)}
                style={{ borderRadius: "6px" }}
            >
                Edit
            </button>
            )}

        </div>
        </div>

      {/* ------- MAIN DETAILS CARD ------- */}
      <div className="card shadow-sm border-0 p-4">

        <h4 className="mb-3" style={{ color: "#4B49AC", fontWeight: 700 }}>
          {title}
        </h4>

        {/* PERSONAL */}
        <h6 className="mt-4 mb-3 text-secondary fw-bold">Personal Information</h6>
        <div className="row px-2">
            {Object.entries(formData.personal).map(([k, v]) => renderField("personal", k, v))}
        </div>

        {/* PROFESSIONAL */}
        <h6 className="mt-4 mb-3 text-secondary fw-bold">Professional Information</h6>
        <div className="row px-2">
            {Object.entries(formData.professional).map(([k, v]) => renderField("professional", k, v))}
        </div>

        {/* ADDRESS */}
        <h6 className="mt-4 mb-3 text-secondary fw-bold">Address</h6>
        <div className="row px-2">
            {Object.entries(formData.address).map(([k, v]) => renderField("address", k, v))}
        </div>

        {/* BUTTONS */}
        {editable && isEditing && (
            <div className="d-flex justify-content-end gap-2 mt-4">

                <button
                className="btn btn-secondary px-4"
                style={{ borderRadius: 6 }}
                onClick={() => setIsEditing(false)}
                >
                Cancel
                </button>

                <button
                className="btn btn-primary px-4"
                style={{ borderRadius: 6 }}
                disabled={saving}
                onClick={handleSave}
                >
                {saving ? "Saving..." : "Save"}
                </button>

            </div>
            )}
      </div>
    </div>
  );
};

export default Profile;
