import React from "react";

import Profile from "../../../components/Profile";

const EmployeeProfile = () => {
  const employeeData = {
    title: "EMPLOYEE PROFILE",
    editable: false,
    personal: {
      "Employee ID": "EMP102",
      "First Name": "John",
      "Last Name": "Doe",
      Gender: "Male",
      "Date of Birth": "1994-09-21",
      "Contact Number": "9876543210",
      "Email ID": "john.doe@company.com",
    },
    professional: {
      Department: "Development",
      "Role / Designation": "Software Engineer",
      "Date of Joining": "2022-03-15",
      "Reporting Manager": "Mark Kumar",
    },
    address: {
      "Address Line 1": "Flat 401, DEF Residency",
      City: "Bangalore",
      State: "Karnataka",
      Pincode: "560034",
    },
  };

  return <Profile {...employeeData} />;
};

export default EmployeeProfile;
