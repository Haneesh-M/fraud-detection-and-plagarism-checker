import React, { useEffect, useState } from "react";
import "./ViewAssignments.css"; // You'll need to create this CSS file

const ViewAssignments = ({ token }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch("http://localhost:5000/teacher-dashboard", {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("Fetched Assignments:", data); // Debug log
                if (data && data.assignments) {
                    setAssignments(data.assignments);
                } else {
                    console.error("Unexpected API response format:", data);
                    setError("Invalid data format received from server");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching assignments:", err);
                setError("Failed to load assignments. " + err.message);
                setLoading(false);
            });
    }, [token]);

    if (loading) return <div className="loading">Loading assignments...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="assignments-container">
            <h2 className="assignments-title">Assignments</h2>
            
            <div className="table-container">
                <table className="assignments-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Filename</th>
                            <th>Submission Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.length > 0 ? (
                            assignments.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td>{assignment.id}</td>
                                    <td>{assignment.student_name}</td>
                                    <td>{assignment.filename}</td>
                                    <td>
                                        {assignment.submitted_at ? 
                                            new Date(assignment.submitted_at).toLocaleString() : 
                                            "N/A"}
                                    </td>
                                    <td>
                                        <a 
                                            href={`http://localhost:5000/download/${assignment.filename}`}
                                            className="download-button"
                                            download
                                        >
                                            Download
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="no-data">No assignments submitted yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ViewAssignments;