import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Profile = ({ title, editable, personal, professional, address }) => {
  return (
    <div className="container mt-4">
      <div className="card shadow-lg p-4">
        <h3 className="text-center text-primary mb-4">{title}</h3>

        {/* Personal Details */}
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

        {/* Professional Details */}
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

        {/* Address */}
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
