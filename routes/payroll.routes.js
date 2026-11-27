
const express = require("express");
const router = express.Router();

const {
  generatePayroll,
  getAllPayroll,
  getPayrollByEmployee,
  updatePayrollStatus
} = require("../controllers/payroll.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Authentication and authorization
router.use(protect);
router.use(authorize("Admin", "HR"));

// Payroll Management APIs
router.post("/", generatePayroll);
router.get("/", getAllPayroll);
router.get("/employee/:employeeId", getPayrollByEmployee);
router.put("/:id/status", updatePayrollStatus);

module.exports = router;