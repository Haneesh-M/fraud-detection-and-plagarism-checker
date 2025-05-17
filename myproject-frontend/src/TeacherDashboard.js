import React from "react";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = ({ token }) => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Teacher Dashboard</h2>

      <nav>
        <button
          style={buttonStyle}
          onClick={() => navigate("/view-assignments")}
        >
          View Assignments
        </button>
        <button
          style={buttonStyle}
          onClick={() => navigate("/plagiarism-checker")}
        >
          Check Plagiarism
        </button>
        <button
          style={backButtonStyle}
          onClick={() => navigate("/teacher-login")}
        >
          Back to Login
        </button>
      </nav>
    </div>
  );
};

// Button styling
const buttonStyle = {
  margin: "10px",
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
};

const backButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#f44336", // Red color for visibility
  color: "white",
};

export default TeacherDashboard;
