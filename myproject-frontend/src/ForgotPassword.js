import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/forgot-password",
        { email }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || "Something went wrong")
      );
    }
    setLoading(false);
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h1>Forgot Password</h1>
        <p className="info-text">
          Enter your registered email to receive a password reset link.
        </p>
        <div className="input-box">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <i className="bx bxs-envelope"></i>
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default ForgotPassword;
