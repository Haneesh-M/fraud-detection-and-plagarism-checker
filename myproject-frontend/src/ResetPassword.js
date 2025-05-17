// src/components/ResetPassword.js
import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles.css";

const ResetPassword = () => {
  const { token } = useParams(); // Extract token from URL
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/reset-password",
        { token, newPassword }
      );
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 3000); // Redirect to login after success
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || "Something went wrong")
      );
    }
  };

  return (
    <div className="container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default ResetPassword;
