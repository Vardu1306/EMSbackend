
const Employee = require("../models/employee.model");
const Department = require("../models/department.model");
const Attendance = require("../models/attendance.model");
const Leave = require("../models/leave.model");
const Payroll = require("../models/payroll.model");

// Get Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {
    // Today's date range (server's local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Current month and year
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Fetch dashboard statistics in parallel
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      employeesOnLeave,
      totalDepartments,
      todayAttendance,
      pendingLeaves,
      monthlyPayroll
    ] = await Promise.all([

      Employee.countDocuments(),

      Employee.countDocuments({ status: "Active" }),

      Employee.countDocuments({ status: "Inactive" }),

      Employee.countDocuments({ status: "On Leave" }),

      Department.countDocuments(),

      Attendance.find({
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }),

      Leave.countDocuments({ status: "Pending" }),

      Payroll.aggregate([
        {
          $match: {
            month: currentMonth,
            year: currentYear
          }
        },
        {
          $group: {
            _id: null,
            totalPayroll: { $sum: "$grossSalary" },
            totalNetSalary: { $sum: "$netSalary" },
            totalPaid: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "Paid"] },
                  "$netSalary",
                  0
                ]
              }
            },
            totalPending: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "Pending"] },
                  "$netSalary",
                  0
                ]
              }
            },
            payrollCount: { $sum: 1 }
          }
        }
      ])
    ]);

    // Attendance summary
    const attendanceSummary = {
      totalMarked: todayAttendance.length,
      present: todayAttendance.filter(
        item => item.status === "Present"
      ).length,
      halfDay: todayAttendance.filter(
        item => item.status === "Half Day"
      ).length,
      absent: todayAttendance.filter(
        item => item.status === "Absent"
      ).length,
      leave: todayAttendance.filter(
        item => item.status === "Leave"
      ).length
    };

    // Payroll summary
    const payrollSummary = monthlyPayroll[0] || {
      totalPayroll: 0,
      totalNetSalary: 0,
      totalPaid: 0,
      totalPending: 0,
      payrollCount: 0
    };

    res.status(200).json({
      success: true,
      message: "Dashboard overview fetched successfully",

      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees,
          onLeave: employeesOnLeave
        },

        departments: {
          total: totalDepartments
        },

        attendance: attendanceSummary,

        leaves: {
          pending: pendingLeaves
        },

        payroll: {
          month: currentMonth,
          year: currentYear,
          totalRecords: payrollSummary.payrollCount,
          grossSalary: payrollSummary.totalPayroll,
          netSalary: payrollSummary.totalNetSalary,
          paidAmount: payrollSummary.totalPaid,
          pendingAmount: payrollSummary.totalPending
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview",
      error: error.message
    });
  }
};

module.exports = {
  getDashboardOverview
};
