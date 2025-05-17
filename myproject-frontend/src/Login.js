import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import newBackground from "./new1.jpg"; // Import the image

const Login = ({ setToken, setRole }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.background = `url(${newBackground}) no-repeat center center fixed`;
        document.body.style.backgroundSize = "cover";

        return () => {
            document.body.style.background = "";
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        let response;
        try {
            response = await axios.post("http://localhost:5000/login", { email, password });
            console.log(JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error("Error:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            alert(error.response?.data?.error || "Login failed!");
            setLoading(false);
            return;
        }

        const { token, role } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);

        setToken(token);
        setRole(role);
        setLoading(false);
        alert(response.data.message);

        if (role === "student") {
            navigate("/dashboard");
        } else if (role === "teacher") {
            navigate("/teacher-dashboard");
        }
    };

    return (
        <div
            className="container-login"
        >
            <div className="wrapper-login">
                <form onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <div className="input-box-login">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <i className="bx bxs-user"></i>
                    </div>
                    <div className="input-box-login">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <i className="bx bxs-lock-alt"></i>
                    </div>
                    <div className="remember-forgot-login">
                        
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <div className="register-link-login">
                        <p>
                            Don't have an account? <Link to="/signup">Sign up</Link>
                        </p>
                        <p>
                            Are you a teacher? <Link to="/teacher-login">Click here</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
