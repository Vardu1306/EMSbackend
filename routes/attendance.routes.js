const express = require("express");
const router = express.Router();

const {
  checkIn,
  checkOut,
  getAllAttendance,
  getAttendanceByEmployee
} = require("../controllers/attendance.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.use(protect);
router.use(authorize("Admin", "HR"));

// Attendance APIs
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/", getAllAttendance);
router.get("/employee/:employeeId", getAttendanceByEmployee);

module.exports = router;