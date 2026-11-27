
const express = require("express");
const router = express.Router();

const {
  applyLeave,
  getAllLeaves,
  getLeavesByEmployee,
  updateLeaveStatus
} = require("../controllers/leave.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Authentication and authorization
router.use(protect);
router.use(authorize("Admin", "HR"));

// Leave Management APIs
router.post("/", applyLeave);
router.get("/", getAllLeaves);
router.get("/employee/:employeeId", getLeavesByEmployee);
router.put("/:id/status", updateLeaveStatus);

module.exports = router;
