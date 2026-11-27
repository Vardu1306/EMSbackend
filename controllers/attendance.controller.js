
const Attendance = require("../models/attendance.model");
const Employee = require("../models/employee.model");

// Helper: Get today's date at midnight
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// 1. Employee Check-In
const checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    if (employee.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Inactive employees cannot check in"
      });
    }

    const today = getToday();

    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today"
      });
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      date: today,
      checkIn: new Date(),
      status: "Present"
    });

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      data: attendance
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today"
      });
    }

    res.status(500).json({
      success: false,
      message: "Check-in failed",
      error: error.message
    });
  }
};

// 2. Employee Check-Out
const checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const today = getToday();

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Please check in first"
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        success: false,
        message: "Already checked out today"
      });
    }

    const checkOutTime = new Date();

    if (checkOutTime <= attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-out time"
      });
    }

    const workingHours =
      (checkOutTime - attendance.checkIn) / (1000 * 60 * 60);

    attendance.checkOut = checkOutTime;
    attendance.workingHours = Number(workingHours.toFixed(2));

    if (workingHours < 4) {
      attendance.status = "Half Day";
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-out successful",
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Check-out failed",
      error: error.message
    });
  }
};
// 3. Get All Attendance Records
const getAllAttendance = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find()
      .populate("employee", "employeeId firstName lastName email department")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Attendance.countDocuments();

    res.status(200).json({
      success: true,
      count: attendance.length,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit
      },
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records",
      error: error.message
    });
  }
};
// 4. Get Attendance History by Employee ID
const getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const attendance = await Attendance.find({
      employee: employee._id
    })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      employee: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`
      },
      count: attendance.length,
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee attendance",
      error: error.message
    });
  }
};
module.exports = {
  checkIn,
  checkOut,
  getAllAttendance,
  getAttendanceByEmployee
};