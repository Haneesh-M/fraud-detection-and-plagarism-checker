import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./plagiarismChecker.css";

const PlagiarismChecker = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    fetchHistory();
  }, []);
//results history
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(
        "http://localhost:5000/api/plagiarism-history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHistory(response.data.history || []);
    } catch (err) {
      console.error("Error fetching plagiarism history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login first");

      const response = await axios.post(
        "http://localhost:5000/api/check-plagiarism",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(response.data);
      fetchHistory();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Plagiarism check failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError("");
    document.querySelector('input[type="file"]').value = null;
  };

  return (
    <div className="plagiarism-checker">
      <h2>Plagiarism Checker</h2>

      {/* File Upload Form */}
      <form onSubmit={handleSubmit} className="plagiarism-form">
        <input
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFileChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Upload & Check"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {/* Display Result */}
      {result && (
        <div className="results-container">
          <h3>Plagiarism Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Check ID</th>
                <th>Plagiarism Score (%)</th>
                <th>Overall Similarity (%)</th>
                <th>Total Matches</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{result.checkId}</td>
                <td>{result.plagiarismScore}%</td>
                <td>{result.overallSimilarity}%</td>
                <td>{result.totalMatches}</td>
                <td>{result.message}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Display History */}
      <div className="history-container">
        <h2>Plagiarism Check History</h2>
        {loading ? (
          <p>Loading history...</p>
        ) : history.length > 0 ? (
          <table className="plagiarism-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Plagiarism Score</th>
                <th>Overall Similarity</th>
                <th>Checked At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((check) => (
                <tr key={check.id}>
                  <td>{check.id}</td>
                  <td>{check.filename}</td>
                  <td>{check.plagiarism_score}%</td>
                  <td>{check.overall_similarity}%</td>
                  <td>{new Date(check.checked_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No previous checks found.</p>
        )}
      </div>

      <button onClick={handleClear} className="clear-button">
        Clear Results
      </button>

      {/* Back Button to Teacher Dashboard */}
      <button
        onClick={() => navigate("/teacher-dashboard")}
        className="back-button"
      >
        Back to Teacher Dashboard
      </button>
    </div>
  );
};

export default PlagiarismChecker;
