import React from "react";

import Profile from "../../../components/Profile";


const AdminProfile = () => {
  const adminData = {
    title: "ADMIN PROFILE",
    editable: true,
    personal: {
      "Employee ID": "ADM001",
      "First Name": "Mark",
      "Last Name": "Kumar",
      Gender: "Male",
      "Date of Birth": "1989-02-15",
      "Contact Number": "9898543219",
      "Email ID": "mark.admin@example.com",
    },
    professional: {
      Department: "Administration",
      "Role / Designation": "System Admin",
      "Date of Joining": "2021-05-10",
      "Access Level": "Full System Access",
    },
    address: {
      "Address Line 1": "Flat 201, ABC Residency",
      City: "Hyderabad",
      State: "Telangana",
      Pincode: "500049",
    },
  };

  return <Profile {...adminData} />;
};

export default AdminProfile;
