import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Keep styling uniform with TeacherLogin

const TeacherSignup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Signing up teacher:", { name, email });

      const response = await axios.post(
        "http://localhost:5000/teacher-signup",
        { name, email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Server Response:", response.data);

      if (response.data.message) {
        alert(response.data.message);
        navigate("/teacher-login"); // Redirect to login after successful signup
      } else {
        alert("Unexpected response from server!");
      }
    } catch (error) {
      console.error("Signup error:", error.response?.data || error);
      alert(error.response?.data?.error || "Signup failed! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSignup}>
        <h1>Teacher Signup</h1>
        <div className="input-box">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <i className="bx bxs-user"></i>
        </div>
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
        <div className="input-box">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i className="bx bxs-lock-alt"></i>
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Signing up..." : "Signup"}
        </button>
        <div className="register-link">
          <p>
            Already have an account? <a href="/teacher-login">Login</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default TeacherSignup;
