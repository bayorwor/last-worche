-- Creates the database and user that backend/.env.example expects. Safe to run more than once.
-- These credentials are for local development only. The tables and sample data are added by the backend on start.
CREATE DATABASE IF NOT EXISTS lastworche;
CREATE USER IF NOT EXISTS 'lastworche'@'localhost' IDENTIFIED BY 'lastworche';
GRANT ALL PRIVILEGES ON lastworche.* TO 'lastworche'@'localhost';
