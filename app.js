
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employee.routes");
const userRoutes = require("./routes/user.routes");
dotenv.config();

const app = express();

// Database connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/employees", employeeRoutes);

const departmentRoutes = require("./routes/department.routes");
app.use("/api/departments", departmentRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
const attendanceRoutes = require("./routes/attendance.routes");
app.use("/api/attendance", attendanceRoutes);

const leaveRoutes = require("./routes/leave.routes");
app.use("/api/leaves", leaveRoutes);
const payrollRoutes = require("./routes/payroll.routes");
app.use("/api/payroll", payrollRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);

const reportRoutes = require("./routes/report.routes");
app.use("/api/reports", reportRoutes);
// Test API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "EMS Backend API is running",
    });
});

module.exports = app;