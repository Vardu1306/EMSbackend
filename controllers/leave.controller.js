
const Leave = require("../models/leave.model");
const Employee = require("../models/employee.model");

// 1. Apply for Leave
const applyLeave = async (req, res) => {
  try {
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
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
        message: "Inactive employees cannot apply for leave"
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      data: leave
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to apply for leave",
      error: error.message
    });
  }
};

// 2. Get All Leave Applications
const getAllLeaves = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const leaves = await Leave.find()
      .populate("employee", "employeeId firstName lastName email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Leave.countDocuments();

    res.status(200).json({
      success: true,
      count: leaves.length,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit
      },
      data: leaves
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave applications",
      error: error.message
    });
  }
};

// 3. Get Leave Applications by Employee ID
const getLeavesByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeId: req.params.employeeId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const leaves = await Leave.find({
      employee: employee._id
    })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      employee: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`
      },
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee leave applications",
      error: error.message
    });
  }
};

// 4. Approve or Reject Leave
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected"
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave application not found"
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave applications can be reviewed"
      });
    }

    leave.status = status;
    leave.adminRemarks = adminRemarks || "";
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      data: leave
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update leave status",
      error: error.message
    });
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  getLeavesByEmployee,
  updateLeaveStatus
};
