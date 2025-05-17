import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css"; // Ensure background image is handled in CSS

const TeacherLogin = ({ setToken, setRole }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [localToken, setLocalToken] = useState(null);
    const [localRole, setLocalRole] = useState(null);

    const navigate = useNavigate();

    // Redirect to Teacher Dashboard once token & role are set
    useEffect(() => {
        if (localToken && localRole === "teacher") {
            console.log("Teacher authenticated, navigating to teacher dashboard...");
            setTimeout(() => navigate("/teacher-dashboard"), 100);
        }
    }, [localToken, localRole, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("Logging in teacher:", email);

            const response = await axios.post(
                "http://localhost:5000/teacher-login",
                { email, password },
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Server Response:", response.data);

            const { token, role, message } = response.data;

            if (token && role === "teacher") {
                console.log("Login successful! Storing token & role...");
                alert(message || "Login Successful!");

                setToken(token);  
                setRole(role);  
                setLocalToken(token);  
                setLocalRole(role);
            } else {
                console.log("Unauthorized attempt. Access denied.");
                alert("Access Denied: Only teachers can log in here.");
            }
        } catch (error) {
            console.error("Login error:", error.response?.data || error);
            alert(error.response?.data?.error || "Login failed! Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container"> {/* CSS handles background */}
            <div className="login-wrapper">
                <form onSubmit={handleLogin}>
                    <h1>Teacher Login</h1>
                    <div className="input-box">
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                        <i className='bx bxs-user'></i>
                    </div>
                    <div className="input-box">
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                        <i className='bx bxs-lock-alt'></i>
                    </div>
                    <div className="remember-forgot">
                        {/* <label>
                            <input type="checkbox" /> Remember Me
                        </label> */}
                        <a href="/forgot-password">Forgot Password?</a>
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <div className="register-link">
                        <p>Don't have an account? <a href="/teacher-signup">Sign up</a></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherLogin;