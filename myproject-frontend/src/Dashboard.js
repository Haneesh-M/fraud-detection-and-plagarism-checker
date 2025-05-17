import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dashboardBackground from "./uni1.jpg"; // Import background image

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.background = `url(${dashboardBackground}) no-repeat center center fixed`;
        document.body.style.backgroundSize = "cover";

        return () => {
            document.body.style.background = "";
        };
    }, []);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token"); // Get JWT token
            const response = await fetch("http://localhost:5000/submit-assignment", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Send JWT token
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Assignment uploaded successfully: ${data.filename}`);
                setFile(null); // Reset file input
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload assignment.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token"); // Clear token on logout
        alert("You have been logged out.");
        navigate("/login"); // Redirect to Login page
    };

    return (
        <div className="dashboard-container-dashboard">
            <h2>Upload Assignment</h2>
            <input type="file" className="file-input-dashboard" onChange={handleFileChange} />
            <button className="upload-button-dashboard" onClick={handleUpload}>Upload</button>
            <button className="logout-button-dashboard" onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Dashboard;
