CREATE DATABASE mydatabase;
USE mydatabase;

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) 	NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
INSERT INTO students (name, email, password) 
VALUES 
    ('Alice Smith', 'alice@example.com', 'hashed_password1'),
    ('Bob Johnson', 'bob@example.com', 'hashed_password2'),
    ('Charlie Brown', 'charlie@example.com', 'hashed_password3');

