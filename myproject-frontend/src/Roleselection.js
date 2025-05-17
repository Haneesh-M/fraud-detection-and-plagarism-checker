import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
                <h1 className="welcome-title">Welcome to Our Portal</h1>
                <p className="welcome-text">Securely login or sign up to access your dashboard.</p>
            <button onClick={() => navigate("/login")} style={styles.button}>Login</button>
            <button onClick={() => navigate("/signup")} style={styles.button}>Signup</button>
        </div>
    );
};

const styles = {
    container: { textAlign: "center", marginTop: "50px" },
    button: { margin: "10px", padding: "10px 20px", fontSize: "16px", cursor: "pointer" }
};

export default Home;