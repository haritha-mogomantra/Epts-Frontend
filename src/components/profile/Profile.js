import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
 
const Profile = ({ title, editable }) => {
  const [personal, setPersonal] = useState({});
  const [professional, setProfessional] = useState({});
  const [address, setAddress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("userId"); // if your backend uses userId
 
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const role = localStorage.getItem("role")?.toLowerCase();

        const API_URL =
        role === "admin"
            ? "http://127.0.0.1:8000/api/employee/admin/profile/"
            : "http://127.0.0.1:8000/api/employee/profile/";

        const res = await axios.get(API_URL, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });
 
        // Assuming backend response format:
        // {
        //   personal: {...},
        //   professional: {...},
        //   address: {...}
        // }
 
        setPersonal(res.data.personal || {});
        setProfessional(res.data.professional || {});
        setAddress(res.data.address || {});
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
 
    fetchProfile();
  }, [userId, token]);
 
  if (loading) return <h4 className="text-center mt-4">Loading...</h4>;
  if (error) return <h4 className="text-center text-danger mt-4">{error}</h4>;
 
  return (
    <div className="container mt-4">
      <div className="card shadow-lg p-4">
        <h3 className="text-center text-primary mb-4">{title}</h3>
 
       
        <section className="mb-4">
          <h5 className="text-secondary mb-2">Personal Details</h5>
          <div className="row">
            {Object.entries(personal).map(([key, value]) => (
              <div className="col-md-6 mb-2" key={key}>
                <strong>{key}: </strong> {value}
              </div>
            ))}
          </div>
        </section>
 
     
        <section className="mb-4">
          <h5 className="text-secondary mb-2">Professional Details</h5>
          <div className="row">
            {Object.entries(professional).map(([key, value]) => (
              <div className="col-md-6 mb-2" key={key}>
                <strong>{key}: </strong> {value}
              </div>
            ))}
          </div>
        </section>
 
       
        <section className="mb-4">
          <h5 className="text-secondary mb-2">Address</h5>
          <div className="row">
            {Object.entries(address).map(([key, value]) => (
              <div className="col-md-6 mb-2" key={key}>
                <strong>{key}: </strong> {value}
              </div>
            ))}
          </div>
        </section>
 
        {editable && (
          <div className="text-end">
            <button className="btn btn-primary">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
};
 
export default Profile;