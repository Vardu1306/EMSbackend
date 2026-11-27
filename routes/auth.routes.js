
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser
} = require("../controllers/auth.controller");

const protect = require("../middleware/auth.middleware");

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// PROTECTED PROFILE
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: req.user
  });
});

module.exports = router;
