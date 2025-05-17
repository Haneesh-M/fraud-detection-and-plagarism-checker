import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import RoleSelection from "./Roleselection";
import Signup from "./Signup";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Dashboard from "./Dashboard";
import TeacherDashboard from "./TeacherDashboard";
import TeacherLogin from "./TeacherLogin";
import TeacherSignup from "./TeacherSignup";
import PlagiarismChecker from "./PlagiarismChecker";
import ViewAssignments from "./view_assignments"; // Ensure the correct file name
import "./Dashboard.css";
import "./App.css";
import "./Login.css";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");
  }, [role]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/login"
          element={<Login setToken={setToken} setRole={setRole} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Student Routes (Protected) */}
        <Route
          path="/dashboard"
          element={
            token && role === "student" ? (
              <Dashboard token={token} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Teacher Routes (Protected) */}
        <Route
          path="/teacher-login"
          element={<TeacherLogin setToken={setToken} setRole={setRole} />}
        />
        <Route path="/teacher-signup" element={<TeacherSignup />} />

        <Route
          path="/teacher-dashboard"
          element={
            token && role === "teacher" ? (
              <TeacherDashboard token={token} />
            ) : (
              <Navigate to="/teacher-login" />
            )
          }
        />
        <Route
          path="/view-assignments"
          element={
            token && role === "teacher" ? (
              <ViewAssignments token={token} />
            ) : (
              <Navigate to="/teacher-login" />
            )
          }
        />

        {/* Plagiarism Checker Route (Teacher Only) */}
        <Route
          path="/plagiarism-checker"
          element={
            token && role === "teacher" ? (
              <PlagiarismChecker />
            ) : (
              <Navigate to="/teacher-login" />
            )
          }
        />

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
