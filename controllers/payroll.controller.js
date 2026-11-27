
const Payroll = require("../models/payroll.model");
const Employee = require("../models/employee.model");

// 1. Generate Monthly Payroll
const generatePayroll = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      allowances = 0,
      deductions = 0,
      remarks = ""
    } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, month and year are required"
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
        message: "Payroll cannot be generated for inactive employees"
      });
    }

    const basicSalary = Number(employee.salary);
    const allowanceAmount = Number(allowances);
    const deductionAmount = Number(deductions);

    if (
      !Number.isFinite(allowanceAmount) ||
      !Number.isFinite(deductionAmount) ||
      allowanceAmount < 0 ||
      deductionAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Allowances and deductions must be valid non-negative numbers"
      });
    }

    const grossSalary = basicSalary + allowanceAmount;
    const netSalary = grossSalary - deductionAmount;

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Deductions cannot exceed gross salary"
      });
    }

    const payroll = await Payroll.create({
      employee: employee._id,
      month,
      year,
      basicSalary,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      grossSalary,
      netSalary,
      remarks,
      generatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Payroll generated successfully",
      data: payroll
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Payroll already exists for this employee and month"
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate payroll",
      error: error.message
    });
  }
};

// 2. Get All Payroll Records
const getAllPayroll = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const payrolls = await Payroll.find()
      .populate("employee", "employeeId firstName lastName email")
      .populate("generatedBy", "name email")
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Payroll.countDocuments();

    res.status(200).json({
      success: true,
      count: payrolls.length,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit
      },
      data: payrolls
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payroll records",
      error: error.message
    });
  }
};

// 3. Get Payroll History by Employee ID
const getPayrollByEmployee = async (req, res) => {
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

    const payrolls = await Payroll.find({
      employee: employee._id
    })
      .populate("generatedBy", "name email")
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      employee: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`
      },
      count: payrolls.length,
      data: payrolls
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee payroll history",
      error: error.message
    });
  }
};

// 4. Update Payroll Payment Status
const updatePayrollStatus = async (req, res) => {
  try {
    const { paymentStatus, remarks } = req.body;

    if (!["Pending", "Paid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment status must be Pending or Paid"
      });
    }

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found"
      });
    }

    if (payroll.paymentStatus === "Paid" && paymentStatus === "Pending") {
      return res.status(400).json({
        success: false,
        message: "Paid payroll cannot be changed back to Pending"
      });
    }

    payroll.paymentStatus = paymentStatus;

    if (remarks !== undefined) {
      payroll.remarks = remarks;
    }

    payroll.paymentDate =
      paymentStatus === "Paid" ? new Date() : null;

    await payroll.save();

    res.status(200).json({
      success: true,
      message: `Payroll marked as ${paymentStatus}`,
      data: payroll
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payroll status",
      error: error.message
    });
  }
};

module.exports = {
  generatePayroll,
  getAllPayroll,
  getPayrollByEmployee,
  updatePayrollStatus
};