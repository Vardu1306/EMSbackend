
const express = require("express");
const router = express.Router();

const {
  getDashboardOverview
} = require("../controllers/dashboard.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Authentication and authorization
router.use(protect);
router.use(authorize("Admin", "HR"));

// Dashboard API
router.get("/overview", getDashboardOverview);

module.exports = router;
