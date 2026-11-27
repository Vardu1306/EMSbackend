
const express = require("express");
const router = express.Router();

const {
  getEmployeeReport,
  getDepartmentReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport
} = require("../controllers/report.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Authentication and authorization
router.use(protect);
router.use(authorize("Admin", "HR"));

// Report APIs
router.get("/employees", getEmployeeReport);
router.get("/departments", getDepartmentReport);
router.get("/attendance", getAttendanceReport);
router.get("/leaves", getLeaveReport);
router.get("/payroll", getPayrollReport);

module.exports = router;
