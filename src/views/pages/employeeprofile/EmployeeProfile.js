import React, { useEffect, useState } from "react";
import axios from "axios";
import Profile from "../../../components/profile/Profile";
 
const EmployeeProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("userId"); // unique ID from login response
 
  const empId = localStorage.getItem("emp_id");  // from login

    useEffect(() => {
    const fetchEmployeeProfile = async () => {
        try {
        const response = await axios.get(
            `http://127.0.0.1:8000/api/employee/employees/${empId}/`,
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );

        setProfileData({
            title: "EMPLOYEE PROFILE",
            editable: true,

            personal: {
                emp_id: response.data.emp_id,
                first_name: response.data.user.first_name,
                last_name: response.data.user.last_name,
                email: response.data.user.email,
                contact_number: response.data.contact_number || "",
                gender: response.data.gender || "",
                dob: response.data.dob || "",
                profile_picture_url: response.data.profile_picture_url || "",
            },

            professional: {
                role: response.data.user.role,
                department: response.data.department_name,
                department_code: response.data.department_code,
                designation: response.data.designation,
                project_name: response.data.project_name,
                joining_date: response.data.joining_date,
                manager_name: response.data.manager_name,
                reporting_manager_name: response.data.manager_name, // same field
            },

            address: {
                address_line1: response.data.address_line1 || "",
                address_line2: response.data.address_line2 || "",
                city: response.data.city || "",
                state: response.data.state || "",
                pincode: response.data.pincode || "",
            }
            });

        } catch (error) {
        console.error("Failed to fetch employee profile", error);
        } finally {
        setLoading(false);
        }
    };

    fetchEmployeeProfile();
    }, [empId, token]);

 
  if (loading) return <h4 className="text-center mt-4">Loading...</h4>;
  if (!profileData)
    return (
<h4 className="text-center text-danger mt-4">
        Failed to load employee profile
</h4>
    );
 
  return <Profile {...profileData} />;
};
 
export default EmployeeProfile;