const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const natural = require("natural");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure the uploads directory exists for assignments
const assignmentUploadDir = "uploads/assignments/";
if (!fs.existsSync(assignmentUploadDir)) {
  fs.mkdirSync(assignmentUploadDir, { recursive: true });
  console.log("📂 Created assignment upload directory:", assignmentUploadDir);
}

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads/assignments"))
);

// Configure Multer for assignment uploads
const assignmentStorage = multer.diskStorage({
  destination: assignmentUploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const assignmentUpload = multer({ storage: assignmentStorage });

// Configure Multer for plagiarism check uploads
const plagiarismStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "uploads/plagiarism");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const plagiarismUpload = multer({
  storage: plagiarismStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Only TXT, PDF, and DOCX files are allowed."
        )
      );
    }
    cb(null, true);
  },
});

// MySQL Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "karthik31",
  database: process.env.DB_NAME || "mydatabase",
  connectionLimit: 10,
});

// Test database connection
db.getConnection()
  .then(() => console.log("✅ Connected to MySQL database."))
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const usedTokens = new Set();

function isValidPassword(password) {
  return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(password);
}

// Middleware for Authentication
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.user = decoded;
    next();
  });
};

// User Signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    await db.query(
      "INSERT INTO students (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// User Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await db.query("SELECT * FROM students WHERE email = ?", [
      email,
    ]);

    if (results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "student" },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login successful", token, role: "student" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Forgot Password
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const [result] = await db.query("SELECT * FROM students WHERE email = ?", [
    email,
  ]);
  if (result.length === 0)
    return res.status(400).json({ error: "Email not found" });

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  const resetLink = `http://localhost:3000/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    text: `Click the following link to reset your password: ${resetLink}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) return res.status(500).json({ error: "Email not sent" });
    res.json({ message: "Reset link sent to email" });
  });
});

// Reset Password
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (usedTokens.has(token))
    return res
      .status(400)
      .json({ error: "This reset link has already been used" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (!isValidPassword(newPassword)) {
      return res
        .status(400)
        .json({
          error:
            "Password must contain at least 8 characters, a number, and a special character",
        });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.query("UPDATE students SET password = ? WHERE email = ?", [
      hashedPassword,
      decoded.email,
    ]);
    usedTokens.add(token);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// Teacher Signup
app.post("/teacher-signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    await db.query(
      "INSERT INTO teachers (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    res.json({ message: "Teacher registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// Teacher Login
app.post("/teacher-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await db.query("SELECT * FROM teachers WHERE email = ?", [
      email,
    ]);

    if (results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "teacher" },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login successful", token, role: "teacher" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Assignment Submission
app.post(
  "/submit-assignment",
  verifyToken,
  assignmentUpload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const email = req.user.email;
    const [results] = await db.query(
      "SELECT id FROM students WHERE email = ?",
      [email]
    );
    if (results.length === 0)
      return res.status(400).json({ error: "Student not found" });

    const student_id = results[0].id;
    const filename = req.file.filename;
    const submitted_at = new Date();

    try {
      await db.query(
        "INSERT INTO assignments (student_id, filename, submitted_at) VALUES (?, ?, ?)",
        [student_id, filename, submitted_at]
      );
      res.json({ message: "Assignment submitted successfully", filename });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  }
);

// Student Dashboard
app.get("/student-dashboard", verifyToken, async (req, res) => {
  const studentId = req.user.id;
  try {
    const [results] = await db.query(
      "SELECT * FROM assignments WHERE student_id = ?",
      [studentId]
    );
    res.json({ message: "Student Dashboard", assignments: results });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Teacher Dashboard
app.get("/teacher-dashboard", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher")
    return res.status(403).json({ error: "Access denied" });

  try {
    const [results] = await db.query(
      "SELECT assignments.*, students.name AS student_name FROM assignments JOIN students ON assignments.student_id = students.id"
    );
    res.json({ message: "Teacher Dashboard", assignments: results });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Plagiarism Checking Functions
async function extractText(filePath, mimetype) {
  try {
    if (mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const data = await mammoth.extractRawText({ path: filePath });
      return data.value;
    } else if (mimetype === "text/plain") {
      return fs.readFileSync(filePath, "utf8");
    }
    throw new Error("Unsupported file format.");
  } catch (error) {
    throw new Error("Error extracting text: " + error.message);
  }
}

function splitIntoParagraphs(text) {
  return text.split(/\n\s*\n/).filter((para) => para.trim().length > 0);
}

function calculateSimilarity(text1, text2) {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  tfidf.addDocument(text1);
  tfidf.addDocument(text2);

  const vector1 = {},
    vector2 = {};
  tfidf.listTerms(0).forEach((item) => (vector1[item.term] = item.tfidf));
  tfidf.listTerms(1).forEach((item) => (vector2[item.term] = item.tfidf));

  const terms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
  let dotProduct = 0,
    magnitude1 = 0,
    magnitude2 = 0;

  terms.forEach((term) => {
    const v1 = vector1[term] || 0;
    const v2 = vector2[term] || 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  return magnitude1 === 0 || magnitude2 === 0
    ? 0
    : (dotProduct / (magnitude1 * magnitude2)) * 100;
}

async function getDatabaseAssignments() {
  try {
    const [rows] = await db.query("SELECT id, filename FROM assignments");
    const uniqueAssignments = new Map(); // Use Map to keep latest entry per filename
    await Promise.all(
      rows.map(async (row) => {
        const filePath = path.join(
          __dirname,
          "uploads/assignments",
          row.filename
        );
        if (fs.existsSync(filePath)) {
          const mimetype =
            path.extname(row.filename).toLowerCase() === ".pdf"
              ? "application/pdf"
              : path.extname(row.filename).toLowerCase() === ".txt"
              ? "text/plain"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          const content = await extractText(filePath, mimetype);
          uniqueAssignments.set(row.filename, {
            id: row.id,
            filename: row.filename,
            content,
          });
        }
      })
    );
    return Array.from(uniqueAssignments.values());
  } catch (error) {
    console.error("Database assignments error:", error);
    return [];
  }
}

// Plagiarism Check Endpoint with Database Storage
app.post(
  "/api/check-plagiarism",
  verifyToken,
  plagiarismUpload.single("document"),
  async (req, res) => {
    if (req.user.role !== "teacher")
      return res.status(403).json({ error: "Access denied" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const teacherId = req.user.id;
    const checkedAt = new Date();

    try {
      const uploadedText = await extractText(filePath, req.file.mimetype);
      const uploadedChunks = splitIntoParagraphs(uploadedText);
      const dbAssignments = await getDatabaseAssignments();

      const results = {
        totalChunks: uploadedChunks.length,
        plagiarizedChunks: 0,
        matches: [],
        overallSimilarity: 0,
      };

      const uniqueMatches = new Set(); // To track unique assignment names

      for (const assignment of dbAssignments) {
        const assignmentChunks = splitIntoParagraphs(assignment.content);

        for (const uploadedChunk of uploadedChunks) {
          if (uploadedChunk.length < 50) continue;

          for (const assignmentChunk of assignmentChunks) {
            if (assignmentChunk.length < 50) continue;

            const similarity = calculateSimilarity(
              uploadedChunk,
              assignmentChunk
            );
            if (similarity > 60) {
              const matchEntry = {
                matchedWith: `Assignment: ${assignment.filename}`,
                assignmentId: assignment.id,
                similarity: similarity.toFixed(2),
                content: uploadedChunk.substring(0, 100) + "...",
              };
              // Use a stringified version of matchedWith as a unique key
              uniqueMatches.add(matchEntry.matchedWith);
              results.plagiarizedChunks++;
              break; // Stop after finding a match for this chunk in this assignment
            }
          }
        }

        const fullTextSimilarity = calculateSimilarity(
          uploadedText,
          assignment.content
        );
        results.overallSimilarity = Math.max(
          results.overallSimilarity,
          fullTextSimilarity
        );
      }

      // Convert Set to array of objects with only matchedWith
      results.matches = Array.from(uniqueMatches).map((matchedWith) => ({
        matchedWith,
      }));

      const plagiarismScore =
        uploadedChunks.length > 0
          ? Math.round((results.plagiarizedChunks / results.totalChunks) * 100)
          : 0;

      const [insertResult] = await db.query(
        "INSERT INTO plagiarism_checks (teacher_id, filename, plagiarism_score, overall_similarity, matches, checked_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          teacherId,
          req.file.originalname,
          plagiarismScore,
          results.overallSimilarity,
          JSON.stringify(results.matches),
          checkedAt,
        ]
      );

      fs.unlinkSync(filePath);

      res.json({
        checkId: insertResult.insertId,
        plagiarismScore,
        overallSimilarity: results.overallSimilarity.toFixed(2),
        matches: results.matches,
        totalMatches: results.plagiarizedChunks,
        message:
          results.plagiarizedChunks > 0
            ? "Potential plagiarism detected"
            : "No significant similarities found",
      });
    } catch (error) {
      console.error("Plagiarism check error:", error);
      fs.unlinkSync(filePath);
      res
        .status(500)
        .json({ error: "Failed to process file: " + error.message });
    }
  }
);

// Get Plagiarism Check History
app.get("/api/plagiarism-history", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher")
    return res.status(403).json({ error: "Access denied" });

  try {
    const [results] = await db.query(
      "SELECT * FROM plagiarism_checks WHERE teacher_id = ? ORDER BY checked_at DESC",
      [req.user.id]
    );
    res.json({ history: results });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch plagiarism history: " + error.message });
  }
});

// // Route to handle file downloads
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads/assignments", req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, req.params.filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Error downloading file.");
      }
    });
  } else {
    res.status(404).send("File not found.");
  }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
