
const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employee.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Authentication required for all employee routes
router.use(protect);

// Admin and HR access
router.use(authorize("Admin", "HR"));

// Employee CRUD APIs
router.post("/", createEmployee);
router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;