
const mongoose = require("mongoose");

const Employee = require("../models/employee.model");
const Department = require("../models/department.model");
const Attendance = require("../models/attendance.model");
const Leave = require("../models/leave.model");
const Payroll = require("../models/payroll.model");
const User = require("../models/user.model");

const bcrypt = require("bcryptjs");

// -------------------- HELPER FUNCTIONS --------------------

const escapeRegex = (value) => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const validateObjectId = (id, fieldName = "ID") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return id;
};

const validatePage = (page = 1, limit = 10) => {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    return {
        page: currentPage,
        limit: pageSize,
        skip: (currentPage - 1) * pageSize
    };
};

const getMonthRange = (month, year) => {
    const currentDate = new Date();

    const selectedMonth = Number(month) || currentDate.getMonth() + 1;
    const selectedYear = Number(year) || currentDate.getFullYear();

    return {
        startDate: new Date(selectedYear, selectedMonth - 1, 1),
        endDate: new Date(selectedYear, selectedMonth, 1)
    };
};

const validateDate = (date, fieldName = "Date") => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return parsedDate;
};

const populateEmployee = (query) => {
    return query.populate({
        path: "employee",
        select: "employeeId firstName lastName email phoneNumber department designation salary status"
    });
};

const ensureUserContext = (context) => {
    if (!context || !context.user) {
        throw new Error("Authentication required");
    }

    return context.user;
};

const buildPagination = (totalItems, page, limit) => {
    return {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        pageSize: limit
    };
};

const EMPLOYEE_STATUSES = ["Active", "Inactive", "On Leave"];

const ATTENDANCE_STATUSES = [
    "Present",
    "Absent",
    "Half Day",
    "Leave"
];

const LEAVE_STATUSES = [
    "Pending",
    "Approved",
    "Rejected"
];

const PAYROLL_STATUSES = [
    "Pending",
    "Paid"
];

const resolvers = {
    Query: {

        // -------------------- EMPLOYEE QUERIES --------------------

        employees: async () => {
            return await Employee.find()
                .populate("department", "name")
                .sort({ createdAt: -1 });
        },

        employee: async (_, { id }) => {
            validateObjectId(id, "Employee ID");

            return await Employee.findById(id)
                .populate("department", "name");
        },

        employeesPaginated: async (_, args) => {
            const {
                page,
                limit,
                search,
                status,
                department,
                sortBy = "createdAt",
                sortOrder = "desc"
            } = args;

            const pagination = validatePage(page, limit);
            const filter = {};

            if (search) {
                const searchRegex = new RegExp(escapeRegex(search), "i");

                filter.$or = [
                    { employeeId: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    { phoneNumber: searchRegex },
                    { designation: searchRegex }
                ];
            }

            if (status) {
                filter.status = status;
            }

            if (department) {
                validateObjectId(department, "Department ID");
                filter.department = department;
            }

            const allowedSortFields = [
                "createdAt",
                "firstName",
                "lastName",
                "employeeId",
                "salary"
            ];

            const safeSortBy = allowedSortFields.includes(sortBy)
                ? sortBy
                : "createdAt";

            const sortDirection = sortOrder === "asc" ? 1 : -1;

            const [totalEmployees, employees] = await Promise.all([
                Employee.countDocuments(filter),

                Employee.find(filter)
                    .populate("department", "name")
                    .sort({ [safeSortBy]: sortDirection })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalEmployees,
                currentPage: pagination.page,
                totalPages: Math.ceil(
                    totalEmployees / pagination.limit
                ),
                pageSize: pagination.limit,
                employees
            };
        },

        // -------------------- DEPARTMENT QUERIES --------------------

        departments: async () => {
            return await Department.find()
                .sort({ createdAt: -1 });
        },

        department: async (_, { id }) => {
            validateObjectId(id, "Department ID");

            return await Department.findById(id);
        },

        departmentsPaginated: async (_, args) => {
            const {
                page,
                limit,
                search,
                status,
                sortBy = "createdAt",
                sortOrder = "desc"
            } = args;

            const pagination = validatePage(page, limit);
            const filter = {};

            if (search) {
                const searchRegex = new RegExp(escapeRegex(search), "i");

                filter.$or = [
                    { name: searchRegex },
                    { description: searchRegex }
                ];
            }

            if (status) {
                filter.status = status;
            }

            const allowedSortFields = [
                "createdAt",
                "name",
                "status"
            ];

            const safeSortBy = allowedSortFields.includes(sortBy)
                ? sortBy
                : "createdAt";

            const sortDirection = sortOrder === "asc" ? 1 : -1;

            const [totalDepartments, departments] = await Promise.all([
                Department.countDocuments(filter),

                Department.find(filter)
                    .sort({ [safeSortBy]: sortDirection })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalDepartments,
                currentPage: pagination.page,
                totalPages: Math.ceil(
                    totalDepartments / pagination.limit
                ),
                pageSize: pagination.limit,
                departments
            };
        },

        // -------------------- DASHBOARD QUERY --------------------

        dashboardOverview: async () => {
            const now = new Date();

            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);

            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            const attendanceFilter = {
                date: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            };

            const [
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                onLeaveEmployees,
                totalDepartments,
                totalMarked,
                present,
                halfDay,
                absent,
                attendanceLeave,
                pendingLeaves,
                payrollResult,
                departmentDistribution,
                employeeStatusResult
            ] = await Promise.all([
                Employee.countDocuments(),

                Employee.countDocuments({ status: "Active" }),

                Employee.countDocuments({ status: "Inactive" }),

                Employee.countDocuments({ status: "On Leave" }),

                Department.countDocuments(),

                Attendance.countDocuments(attendanceFilter),

                Attendance.countDocuments({
                    ...attendanceFilter,
                    status: "Present"
                }),

                Attendance.countDocuments({
                    ...attendanceFilter,
                    status: "Half Day"
                }),

                Attendance.countDocuments({
                    ...attendanceFilter,
                    status: "Absent"
                }),

                Attendance.countDocuments({
                    ...attendanceFilter,
                    status: "Leave"
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
                            totalRecords: { $sum: 1 },
                            grossSalary: { $sum: "$grossSalary" },
                            netSalary: { $sum: "$netSalary" },
                            paidAmount: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$paymentStatus", "Paid"] },
                                        "$netSalary",
                                        0
                                    ]
                                }
                            },
                            pendingAmount: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$paymentStatus", "Pending"] },
                                        "$netSalary",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ]),

                Employee.aggregate([
                    {
                        $group: {
                            _id: "$department",
                            employeeCount: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: Department.collection.name,
                            localField: "_id",
                            foreignField: "_id",
                            as: "department"
                        }
                    },
                    {
                        $unwind: {
                            path: "$department",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            departmentName: {
                                $ifNull: ["$department.name", "Unassigned"]
                            },
                            employeeCount: 1
                        }
                    },
                    {
                        $sort: {
                            employeeCount: -1,
                            departmentName: 1
                        }
                    }
                ]),

                Employee.aggregate([
                    {
                        $group: {
                            _id: "$status",
                            employeeCount: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const payroll = payrollResult[0] || {
                totalRecords: 0,
                grossSalary: 0,
                netSalary: 0,
                paidAmount: 0,
                pendingAmount: 0
            };

            return {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: inactiveEmployees,
                    onLeave: onLeaveEmployees
                },
                departments: {
                    total: totalDepartments
                },
                attendance: {
                    totalMarked,
                    present,
                    halfDay,
                    absent,
                    leave: attendanceLeave
                },
                leaves: {
                    pending: pendingLeaves
                },
                payroll: {
                    month: currentMonth,
                    year: currentYear,
                    totalRecords: payroll.totalRecords,
                    grossSalary: payroll.grossSalary,
                    netSalary: payroll.netSalary,
                    paidAmount: payroll.paidAmount,
                    pendingAmount: payroll.pendingAmount
                },
                departmentDistribution,
                employeeStatusDistribution: employeeStatusResult.map(item => ({
                    status: item._id || "Unknown",
                    employeeCount: item.employeeCount
                }))
            };
        },

        // -------------------- EMPLOYEE REPORT --------------------

        employeeReport: async (_, args) => {
            const { search, status, department } = args;
            const filter = {};

            if (search) {
                const searchRegex = new RegExp(escapeRegex(search), "i");

                filter.$or = [
                    { employeeId: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex }
                ];
            }

            if (status) {
                filter.status = status;
            }

            if (department) {
                validateObjectId(department, "Department ID");
                filter.department = department;
            }

            const [totalEmployees, employees] = await Promise.all([
                Employee.countDocuments(filter),
                Employee.find(filter)
                    .populate("department", "name")
                    .sort({ createdAt: -1 })
            ]);

            return {
                totalEmployees,
                employees
            };
        },

        // -------------------- DEPARTMENT REPORT --------------------

        departmentReport: async (_, { status }) => {
            const departmentFilter = {};

            if (status) {
                departmentFilter.status = status;
            }

            const departments = await Department.find(departmentFilter)
                .sort({ name: 1 });

            const employeeGroups = await Employee.aggregate([
                {
                    $group: {
                        _id: "$department",
                        employeesCount: { $sum: 1 },
                        totalSalary: { $sum: "$salary" },
                        averageSalary: { $avg: "$salary" }
                    }
                }
            ]);

            const groupMap = new Map(
                employeeGroups.map(item => [
                    String(item._id),
                    item
                ])
            );

            const reportDepartments = departments.map(department => {
                const group = groupMap.get(String(department._id));

                return {
                    _id: department._id,
                    name: department.name,
                    description: department.description,
                    status: department.status,
                    employeesCount: group ? group.employeesCount : 0,
                    totalSalary: group ? group.totalSalary : 0,
                    averageSalary: group ? group.averageSalary : 0
                };
            });

            const totalEmployees = reportDepartments.reduce(
                (sum, item) => sum + item.employeesCount,
                0
            );

            const totalSalary = reportDepartments.reduce(
                (sum, item) => sum + item.totalSalary,
                0
            );

            return {
                totalDepartments: reportDepartments.length,
                totalEmployees,
                totalSalary,
                departments: reportDepartments
            };
        },

        // -------------------- ATTENDANCE REPORT --------------------

        attendanceReport: async (_, args) => {
            const { month, year, employee, status } = args;
            const filter = {};

            if (month || year) {
                const range = getMonthRange(month, year);

                filter.date = {
                    $gte: range.startDate,
                    $lt: range.endDate
                };
            }

            if (employee) {
                validateObjectId(employee, "Employee ID");
                filter.employee = employee;
            }

            if (status) {
                filter.status = status;
            }

            const [records, totalRecords, present, halfDay, absent, leave] =
                await Promise.all([
                    Attendance.find(filter)
                        .populate("employee", "employeeId firstName lastName email")
                        .sort({ date: -1 }),

                    Attendance.countDocuments(filter),
                    Attendance.countDocuments({ ...filter, status: "Present" }),
                    Attendance.countDocuments({ ...filter, status: "Half Day" }),
                    Attendance.countDocuments({ ...filter, status: "Absent" }),
                    Attendance.countDocuments({ ...filter, status: "Leave" })
                ]);

            return {
                totalRecords,
                present,
                halfDay,
                absent,
                leave,
                records
            };
        },

        // -------------------- LEAVE REPORT --------------------

        leaveReport: async (_, args) => {
            const { month, year, employee, status, leaveType } = args;
            const filter = {};

            if (employee) {
                validateObjectId(employee, "Employee ID");
                filter.employee = employee;
            }

            if (status) {
                filter.status = status;
            }

            if (leaveType) {
                filter.leaveType = leaveType;
            }

            if (month || year) {
                const range = getMonthRange(month, year);

                filter.startDate = {
                    $lt: range.endDate
                };

                filter.endDate = {
                    $gte: range.startDate
                };
            }

            const [records, totalLeaves, pending, approved, rejected] =
                await Promise.all([
                    Leave.find(filter)
                        .populate("employee", "employeeId firstName lastName email")
                        .sort({ createdAt: -1 }),

                    Leave.countDocuments(filter),
                    Leave.countDocuments({ ...filter, status: "Pending" }),
                    Leave.countDocuments({ ...filter, status: "Approved" }),
                    Leave.countDocuments({ ...filter, status: "Rejected" })
                ]);

            const totalDays = records.reduce(
                (sum, item) => sum + (Number(item.totalDays) || 0),
                0
            );

            return {
                totalLeaves,
                pending,
                approved,
                rejected,
                totalDays,
                records
            };
        },

        // -------------------- PAYROLL REPORT --------------------

        payrollReport: async (_, args) => {
            const { month, year, employee, status } = args;
            const filter = {};

            if (month) {
                filter.month = Number(month);
            }

            if (year) {
                filter.year = Number(year);
            }

            if (employee) {
                validateObjectId(employee, "Employee ID");
                filter.employee = employee;
            }

            if (status) {
                filter.paymentStatus = status;
            }

            const [records, totalRecords, totals] = await Promise.all([
                Payroll.find(filter)
                    .populate("employee", "employeeId firstName lastName email")
                    .sort({ year: -1, month: -1 }),

                Payroll.countDocuments(filter),

                Payroll.aggregate([
                    { $match: filter },
                    {
                        $group: {
                            _id: null,
                            grossSalary: { $sum: "$grossSalary" },
                            netSalary: { $sum: "$netSalary" },
                            paidAmount: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$paymentStatus", "Paid"] },
                                        "$netSalary",
                                        0
                                    ]
                                }
                            },
                            pendingAmount: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$paymentStatus", "Pending"] },
                                        "$netSalary",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ])
            ]);

            const summary = totals[0] || {
                grossSalary: 0,
                netSalary: 0,
                paidAmount: 0,
                pendingAmount: 0
            };

            return {
                totalRecords,
                grossSalary: summary.grossSalary,
                netSalary: summary.netSalary,
                paidAmount: summary.paidAmount,
                pendingAmount: summary.pendingAmount,
                records
            };
        },

        // -------------------- SALARY REPORT --------------------

        salaryReport: async (_, args) => {
            const { department, status } = args;
            const filter = {};

            if (department) {
                validateObjectId(department, "Department ID");
                filter.department = department;
            }

            if (status) {
                filter.status = status;
            }

            const employees = await Employee.find(filter)
                .populate("department", "name")
                .sort({ salary: -1 });

            const totalSalary = employees.reduce(
                (sum, employee) => sum + (Number(employee.salary) || 0),
                0
            );

            const totalEmployees = employees.length;

            return {
                totalEmployees,
                totalSalary,
                averageSalary: totalEmployees
                    ? totalSalary / totalEmployees
                    : 0,
                employees: employees.map(employee => ({
                    employee,
                    designation: employee.designation || "",
                    salary: Number(employee.salary) || 0,
                    status: employee.status || "Unknown"
                }))
            };
        },

        // -------------------- ATTENDANCE QUERIES --------------------

        attendance: async (_, { id }) => {
            validateObjectId(id, "Attendance ID");

            return await populateEmployee(
                Attendance.findById(id)
            );
        },

        attendancesPaginated: async (_, args) => {
            const {
                page,
                limit,
                employee,
                status,
                fromDate,
                toDate,
                sortOrder = "desc"
            } = args;

            const pagination = validatePage(page, limit);
            const filter = {};

            if (employee) {
                validateObjectId(employee, "Employee ID");
                filter.employee = employee;
            }

            if (status) {
                filter.status = status;
            }

            if (fromDate || toDate) {
                filter.date = {};

                if (fromDate) {
                    filter.date.$gte = validateDate(fromDate, "From date");
                }

                if (toDate) {
                    filter.date.$lte = validateDate(toDate, "To date");
                }
            }

            const sortDirection = sortOrder === "asc" ? 1 : -1;

            const [totalRecords, attendance] = await Promise.all([
                Attendance.countDocuments(filter),

                populateEmployee(
                    Attendance.find(filter)
                        .sort({ date: sortDirection })
                        .skip(pagination.skip)
                        .limit(pagination.limit)
                )
            ]);

            return {
                totalRecords,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalRecords / pagination.limit),
                pageSize: pagination.limit,
                attendance
            };
        },

        employeeAttendanceHistory: async (_, args) => {
            const { employee, page, limit } = args;

            validateObjectId(employee, "Employee ID");

            const pagination = validatePage(page, limit);
            const filter = { employee };

            const [totalRecords, attendance] = await Promise.all([
                Attendance.countDocuments(filter),

                Attendance.find(filter)
                    .populate("employee", "employeeId firstName lastName email")
                    .sort({ date: -1 })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalRecords,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalRecords / pagination.limit),
                pageSize: pagination.limit,
                attendance
            };
        },

        // -------------------- LEAVE QUERIES --------------------

        leave: async (_, { id }) => {
            validateObjectId(id, "Leave ID");

            return await Leave.findById(id)
                .populate("employee", "employeeId firstName lastName email");
        },

        leavesPaginated: async (_, args) => {
            const {
                page,
                limit,
                employee,
                status,
                leaveType,
                month,
                year,
                sortOrder = "desc"
            } = args;

            const pagination = validatePage(page, limit);
            const filter = {};

            if (employee) {
                validateObjectId(employee, "Employee ID");
                filter.employee = employee;
            }

            if (status) {
                filter.status = status;
            }

            if (leaveType) {
                filter.leaveType = leaveType;
            }

            if (month || year) {
                const range = getMonthRange(month, year);

                filter.startDate = { $lt: range.endDate };
                filter.endDate = { $gte: range.startDate };
            }

            const sortDirection = sortOrder === "asc" ? 1 : -1;

            const [totalLeaves, leaves] = await Promise.all([
                Leave.countDocuments(filter),

                Leave.find(filter)
                    .populate("employee", "employeeId firstName lastName email")
                    .sort({ createdAt: sortDirection })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalLeaves,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalLeaves / pagination.limit),
                pageSize: pagination.limit,
                leaves
            };
        },

        employeeLeaveHistory: async (_, args) => {
            const { employee, page, limit } = args;

            validateObjectId(employee, "Employee ID");

            const pagination = validatePage(page, limit);
            const filter = { employee };

            const [totalLeaves, leaves] = await Promise.all([
                Leave.countDocuments(filter),

                Leave.find(filter)
                    .populate("employee", "employeeId firstName lastName email")
                    .sort({ createdAt: -1 })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalLeaves,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalLeaves / pagination.limit),
                pageSize: pagination.limit,
                leaves
            };
        },

        // -------------------- PAYROLL QUERIES --------------------

        payroll: async (_, { id }) => {
            validateObjectId(id, "Payroll ID");

            return await Payroll.findById(id)
                .populate("employee", "employeeId firstName lastName email");
        },

        payrollsPaginated: async (_, args) => {
            const {
                page,
                limit,
                employee,
                month,
                year,
                paymentStatus,
                sortOrder = "desc"
            } = args;

            const pagination = validatePage(page, limit);
            const filter = {};

            if (employee) {
                validateObjectId(employee, "Employee ID");
                filter.employee = employee;
            }

            if (month) {
                filter.month = Number(month);
            }

            if (year) {
                filter.year = Number(year);
            }

            if (paymentStatus) {
                filter.paymentStatus = paymentStatus;
            }

            const sortDirection = sortOrder === "asc" ? 1 : -1;

            const [totalRecords, payrolls] = await Promise.all([
                Payroll.countDocuments(filter),

                Payroll.find(filter)
                    .populate("employee", "employeeId firstName lastName email")
                    .sort({ year: sortDirection, month: sortDirection })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalRecords,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalRecords / pagination.limit),
                pageSize: pagination.limit,
                payrolls
            };
        },

        employeePayrollHistory: async (_, args) => {
            const { employee, page, limit } = args;

            validateObjectId(employee, "Employee ID");

            const pagination = validatePage(page, limit);
            const filter = { employee };

            const [totalRecords, payrolls] = await Promise.all([
                Payroll.countDocuments(filter),

                Payroll.find(filter)
                    .populate("employee", "employeeId firstName lastName email")
                    .sort({ year: -1, month: -1 })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalRecords,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalRecords / pagination.limit),
                pageSize: pagination.limit,
                payrolls
            };
        },

        // -------------------- USER QUERIES --------------------

        user: async (_, { id }) => {
            validateObjectId(id, "User ID");

            return await User.findById(id).select("-password");
        },

        usersPaginated: async (_, args) => {
            const {
                page,
                limit,
                search,
                role,
                status,
                sortOrder = "desc"
            } = args;

            const pagination = validatePage(page, limit);
            const filter = {};

            if (search) {
                const searchRegex = new RegExp(escapeRegex(search), "i");

                filter.$or = [
                    { name: searchRegex },
                    { email: searchRegex }
                ];
            }

            if (role) {
                filter.role = role;
            }

            if (status) {
                filter.status = status;
            }

            const sortDirection = sortOrder === "asc" ? 1 : -1;

            const [totalUsers, users] = await Promise.all([
                User.countDocuments(filter),

                User.find(filter)
                    .select("-password")
                    .sort({ createdAt: sortDirection })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
            ]);

            return {
                totalUsers,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalUsers / pagination.limit),
                pageSize: pagination.limit,
                users
            };
        }
    },

    // ==================== MUTATIONS ====================

    Mutation: {

        // -------------------- EMPLOYEE MUTATIONS --------------------

        createEmployee: async (_, { input }) => {
            const employee = new Employee(input);
            await employee.save();

            return await employee.populate("department", "name");
        },

        updateEmployee: async (_, { id, input }) => {
            validateObjectId(id, "Employee ID");

            const employee = await Employee.findByIdAndUpdate(
                id,
                { $set: input },
                { new: true, runValidators: true }
            ).populate("department", "name");

            if (!employee) {
                throw new Error("Employee not found");
            }

            return employee;
        },

        deleteEmployee: async (_, { id }) => {
            validateObjectId(id, "Employee ID");

            const employee = await Employee.findByIdAndDelete(id);

            if (!employee) {
                throw new Error("Employee not found");
            }

            return "Employee deleted successfully";
        },

        // -------------------- DEPARTMENT MUTATIONS --------------------

        createDepartment: async (_, { input }) => {
            const department = new Department(input);
            return await department.save();
        },

        updateDepartment: async (_, { id, input }) => {
            validateObjectId(id, "Department ID");

            const department = await Department.findByIdAndUpdate(
                id,
                { $set: input },
                { new: true, runValidators: true }
            );

            if (!department) {
                throw new Error("Department not found");
            }

            return department;
        },

        deleteDepartment: async (_, { id }) => {
            validateObjectId(id, "Department ID");

            const department = await Department.findByIdAndDelete(id);

            if (!department) {
                throw new Error("Department not found");
            }

            return "Department deleted successfully";
        },

        // -------------------- ATTENDANCE MUTATIONS --------------------

        checkIn: async (_, { employee, date, remarks }) => {
            validateObjectId(employee, "Employee ID");

            const employeeExists = await Employee.findById(employee);

            if (!employeeExists) {
                throw new Error("Employee not found");
            }

            const attendanceDate = date
                ? validateDate(date, "Attendance date")
                : new Date();

            attendanceDate.setHours(0, 0, 0, 0);

            const existingAttendance = await Attendance.findOne({
                employee,
                date: attendanceDate
            });

            if (existingAttendance) {
                throw new Error("Attendance already marked for this date");
            }

            const attendance = new Attendance({
                employee,
                date: attendanceDate,
                checkIn: new Date(),
                status: "Present",
                remarks
            });

            return await attendance.save();
        },

        checkOut: async (_, { attendanceId }) => {
            validateObjectId(attendanceId, "Attendance ID");

            const attendance = await Attendance.findById(attendanceId);

            if (!attendance) {
                throw new Error("Attendance not found");
            }

            if (!attendance.checkIn) {
                throw new Error("Employee has not checked in");
            }

            if (attendance.checkOut) {
                throw new Error("Employee has already checked out");
            }

            attendance.checkOut = new Date();

            const duration =
                attendance.checkOut.getTime() -
                new Date(attendance.checkIn).getTime();

            attendance.workingHours = Number(
                (duration / (1000 * 60 * 60)).toFixed(2)
            );

            if (attendance.workingHours < 4) {
                attendance.status = "Half Day";
            }

            return await attendance.save();
        },

        createAttendance: async (_, { input }) => {
            validateObjectId(input.employee, "Employee ID");

            const employeeExists = await Employee.findById(input.employee);

            if (!employeeExists) {
                throw new Error("Employee not found");
            }

            const attendance = new Attendance(input);
            return await attendance.save();
        },

        updateAttendance: async (_, { id, input }) => {
            validateObjectId(id, "Attendance ID");

            const attendance = await Attendance.findByIdAndUpdate(
                id,
                { $set: input },
                { new: true, runValidators: true }
            );

            if (!attendance) {
                throw new Error("Attendance not found");
            }

            return attendance;
        },

        deleteAttendance: async (_, { id }) => {
            validateObjectId(id, "Attendance ID");

            const attendance = await Attendance.findByIdAndDelete(id);

            if (!attendance) {
                throw new Error("Attendance not found");
            }

            return "Attendance deleted successfully";
        },

        // -------------------- LEAVE MUTATIONS --------------------

        applyLeave: async (_, { input }) => {
            validateObjectId(input.employee, "Employee ID");

            const employeeExists = await Employee.findById(input.employee);

            if (!employeeExists) {
                throw new Error("Employee not found");
            }

            const startDate = validateDate(input.startDate, "Start date");
            const endDate = validateDate(input.endDate, "End date");

            if (endDate < startDate) {
                throw new Error("End date cannot be before start date");
            }

            const leave = new Leave({
                ...input,
                startDate,
                endDate,
                status: "Pending"
            });

            return await leave.save();
        },

        updateLeave: async (_, { id, input }) => {
            validateObjectId(id, "Leave ID");

            const leave = await Leave.findByIdAndUpdate(
                id,
                { $set: input },
                { new: true, runValidators: true }
            );

            if (!leave) {
                throw new Error("Leave not found");
            }

            return leave;
        },

        reviewLeave: async (_, { id, status, adminRemarks }, context) => {
            validateObjectId(id, "Leave ID");

            if (!["Approved", "Rejected"].includes(status)) {
                throw new Error("Status must be Approved or Rejected");
            }

            ensureUserContext(context);

            const leave = await Leave.findById(id);

            if (!leave) {
                throw new Error("Leave not found");
            }

            leave.status = status;
            leave.adminRemarks = adminRemarks || "";
            leave.reviewedAt = new Date();

            return await leave.save();
        },

        deleteLeave: async (_, { id }) => {
            validateObjectId(id, "Leave ID");

            const leave = await Leave.findByIdAndDelete(id);

            if (!leave) {
                throw new Error("Leave not found");
            }

            return "Leave deleted successfully";
        },

        // -------------------- PAYROLL MUTATIONS --------------------

        generatePayroll: async (_, { input }, context) => {
            validateObjectId(input.employee, "Employee ID");

            const employee = await Employee.findById(input.employee);

            if (!employee) {
                throw new Error("Employee not found");
            }

            const existingPayroll = await Payroll.findOne({
                employee: input.employee,
                month: input.month,
                year: input.year
            });

            if (existingPayroll) {
                throw new Error("Payroll already exists for this employee and month");
            }

            const basicSalary = Number(
                input.basicSalary ?? employee.salary ?? 0
            );

            const allowances = Number(input.allowances || 0);
            const deductions = Number(input.deductions || 0);

            const grossSalary = basicSalary + allowances;
            const netSalary = grossSalary - deductions;

            const payrollData = {
                ...input,
                basicSalary,
                allowances,
                deductions,
                grossSalary,
                netSalary,
                paymentStatus: input.paymentStatus || "Pending"
            };

            if (context && context.user) {
                payrollData.generatedBy = context.user._id;
            }

            const payroll = new Payroll(payrollData);

            return await payroll.save();
        },

        updatePayroll: async (_, { id, input }) => {
            validateObjectId(id, "Payroll ID");

            const existingPayroll = await Payroll.findById(id);

            if (!existingPayroll) {
                throw new Error("Payroll not found");
            }

            const updatedData = {
                ...input
            };

            const basicSalary = Number(
                input.basicSalary ?? existingPayroll.basicSalary
            );

            const allowances = Number(
                input.allowances ?? existingPayroll.allowances
            );

            const deductions = Number(
                input.deductions ?? existingPayroll.deductions
            );

            updatedData.basicSalary = basicSalary;
            updatedData.allowances = allowances;
            updatedData.deductions = deductions;
            updatedData.grossSalary = basicSalary + allowances;
            updatedData.netSalary =
                updatedData.grossSalary - deductions;

            Object.assign(existingPayroll, updatedData);

            return await existingPayroll.save();
        },

        updatePayrollPaymentStatus: async (_, { id, paymentStatus }) => {
            validateObjectId(id, "Payroll ID");

            if (!PAYROLL_STATUSES.includes(paymentStatus)) {
                throw new Error("Invalid payroll payment status");
            }

            const updateData = {
                paymentStatus
            };

            if (paymentStatus === "Paid") {
                updateData.paymentDate = new Date();
            } else {
                updateData.paymentDate = null;
            }

            const payroll = await Payroll.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!payroll) {
                throw new Error("Payroll not found");
            }

            return payroll;
        },

        deletePayroll: async (_, { id }) => {
            validateObjectId(id, "Payroll ID");

            const payroll = await Payroll.findByIdAndDelete(id);

            if (!payroll) {
                throw new Error("Payroll not found");
            }

            return "Payroll deleted successfully";
        },

        // -------------------- USER MUTATIONS --------------------

        createUser: async (_, { input }) => {
            const existingUser = await User.findOne({
                email: input.email
            });

            if (existingUser) {
                throw new Error("Email already exists");
            }

            const hashedPassword = await bcrypt.hash(input.password, 12);

            const user = new User({
                ...input,
                password: hashedPassword
            });

            const savedUser = await user.save();

            return await User.findById(savedUser._id).select("-password");
        },

        updateUser: async (_, { id, input }) => {
            validateObjectId(id, "User ID");

            const user = await User.findById(id);

            if (!user) {
                throw new Error("User not found");
            }

            const updateData = {
                ...input
            };

            if (input.password) {
                updateData.password = await bcrypt.hash(
                    input.password,
                    12
                );
            }

            if (input.email) {
                const existingUser = await User.findOne({
                    email: input.email,
                    _id: { $ne: id }
                });

                if (existingUser) {
                    throw new Error("Email already exists");
                }
            }

            Object.assign(user, updateData);
            await user.save();

            return await User.findById(user._id).select("-password");
        },

        deleteUser: async (_, { id }, context) => {
            validateObjectId(id, "User ID");

            const currentUser = ensureUserContext(context);

            if (String(currentUser._id) === String(id)) {
                throw new Error("You cannot delete your own account");
            }

            const user = await User.findByIdAndDelete(id);

            if (!user) {
                throw new Error("User not found");
            }

            return "User deleted successfully";
        }
    }
};

module.exports = resolvers;
