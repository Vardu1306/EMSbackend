const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({
      role: "Admin"
    });

    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      "Admin@12345",
      12
    );

    await User.create({
      name: "EMS Admin",
      email: "admin.ems@example.com",
      password: hashedPassword,
      role: "Admin"
    });

    console.log("Admin account created successfully");

  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();