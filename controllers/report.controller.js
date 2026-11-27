
const Employee = require("../models/employee.model");
const Department = require("../models/department.model");
const Attendance = require("../models/attendance.model");
const Leave = require("../models/leave.model");
const Payroll = require("../models/payroll.model");

// Helper: Validate month and year
const getMonthDateRange = (month, year) => {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    !Number.isInteger(yearNumber) ||
    yearNumber < 2020
  ) {
    return null;
  }

  return {
    month: monthNumber,
    year: yearNumber,
    startDate: new Date(yearNumber, monthNumber - 1, 1),
    endDate: new Date(yearNumber, monthNumber, 1)
  };
};

// 1. Employee Report
const getEmployeeReport = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.department) {
      const department = await Department.findById(req.query.department);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }

      filter.department = department._id;
    }

    const employees = await Employee.find(filter)
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate employee report",
      error: error.message
    });
  }
};

// 2. Department-wise Employee Report
const getDepartmentReport = async (req, res) => {
  try {
    const report = await Department.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "department",
          as: "employees"
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          status: 1,
          totalEmployees: { $size: "$employees" },
          activeEmployees: {
            $size: {
              $filter: {
                input: "$employees",
                as: "employee",
                cond: {
                  $eq: ["$$employee.status", "Active"]
                }
              }
            }
          }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate department report",
      error: error.message
    });
  }
};

// 3. Monthly Attendance Report
const getAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const dateRange = getMonthDateRange(month, year);

    if (!dateRange) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid month (1-12) and year (2020 or later)"
      });
    }

    const attendance = await Attendance.find({
      date: {
        $gte: dateRange.startDate,
        $lt: dateRange.endDate
      }
    })
      .populate("employee", "employeeId firstName lastName department")
      .sort({ date: 1 });

    const summary = {
      totalRecords: attendance.length,
      present: attendance.filter(item => item.status === "Present").length,
      absent: attendance.filter(item => item.status === "Absent").length,
      halfDay: attendance.filter(item => item.status === "Half Day").length,
      leave: attendance.filter(item => item.status === "Leave").length
    };

    res.status(200).json({
      success: true,
      month: dateRange.month,
      year: dateRange.year,
      summary,
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate attendance report",
      error: error.message
    });
  }
};

// 4. Leave Report
const getLeaveReport = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!["Pending", "Approved", "Rejected"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave status"
        });
      }

      filter.status = req.query.status;
    }

    if (req.query.month || req.query.year) {
      const { month, year } = req.query;

      const dateRange = getMonthDateRange(month, year);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid month (1-12) and year (2020 or later)"
        });
      }

      filter.startDate = {
        $lt: dateRange.endDate
      };

      filter.endDate = {
        $gte: dateRange.startDate
      };
    }

    const leaves = await Leave.find(filter)
      .populate("employee", "employeeId firstName lastName department")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate leave report",
      error: error.message
    });
  }
};

// 5. Payroll Report
const getPayrollReport = async (req, res) => {
  try {
    const { month, year, paymentStatus } = req.query;

    const filter = {};

    if (month || year) {
      const dateRange = getMonthDateRange(month, year);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid month (1-12) and year (2020 or later)"
        });
      }

      filter.month = dateRange.month;
      filter.year = dateRange.year;
    }

    if (paymentStatus) {
      if (!["Pending", "Paid"].includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status"
        });
      }

      filter.paymentStatus = paymentStatus;
    }

    const payrolls = await Payroll.find(filter)
      .populate("employee", "employeeId firstName lastName department")
      .populate("generatedBy", "name email")
      .sort({ year: -1, month: -1 });

    const summary = payrolls.reduce(
      (result, item) => {
        result.totalGrossSalary += item.grossSalary;
        result.totalNetSalary += item.netSalary;

        if (item.paymentStatus === "Paid") {
          result.paidAmount += item.netSalary;
        } else {
          result.pendingAmount += item.netSalary;
        }

        return result;
      },
      {
        totalGrossSalary: 0,
        totalNetSalary: 0,
        paidAmount: 0,
        pendingAmount: 0
      }
    );

    res.status(200).json({
      success: true,
      count: payrolls.length,
      summary,
      data: payrolls
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate payroll report",
      error: error.message
    });
  }
};

module.exports = {
  getEmployeeReport,
  getDepartmentReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport
};
