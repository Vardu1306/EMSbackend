const typeDefs = `

    # ==========================================
    # EMPLOYEE AND DEPARTMENT TYPES
    # ==========================================

    type Employee {
        _id: ID!
        employeeId: String
        firstName: String!
        lastName: String!
        email: String!
        phone: String!
        designation: String!
        salary: Float!
        status: String!
        joiningDate: String
        department: Department
    }

    type Department {
        _id: ID!
        name: String!
        description: String
        status: String!
    }

    type DepartmentWithEmployeeCount {
        _id: ID!
        name: String!
        description: String
        status: String!
        employeesCount: Int!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        role: String!
        status: String!
        createdAt: String
        updatedAt: String
    }

    type Attendance {
        _id: ID!
        employee: Employee
        date: String!
        checkIn: String
        checkOut: String
        status: String!
        workingHours: Float!
        remarks: String
        createdAt: String
        updatedAt: String
    }

    type Leave {
        _id: ID!
        employee: Employee
        leaveType: String!
        startDate: String!
        endDate: String!
        totalDays: Int!
        reason: String!
        status: String!
        reviewedBy: User
        reviewedAt: String
        adminRemarks: String
        createdAt: String
        updatedAt: String
    }

    type Payroll {
        _id: ID!
        employee: Employee
        month: Int!
        year: Int!
        basicSalary: Float!
        allowances: Float!
        deductions: Float!
        grossSalary: Float!
        netSalary: Float!
        paymentStatus: String!
        paymentDate: String
        remarks: String
        generatedBy: User
        createdAt: String
        updatedAt: String
    }

    # ==========================================
    # INPUT TYPES
    # ==========================================

    input EmployeeInput {
        firstName: String!
        lastName: String!
        email: String!
        phone: String!
        designation: String!
        salary: Float!
        department: ID
        joiningDate: String
        status: String
    }

    input EmployeeUpdateInput {
        firstName: String
        lastName: String
        email: String
        phone: String
        designation: String
        salary: Float
        department: ID
        joiningDate: String
        status: String
    }

    input DepartmentInput {
        name: String!
        description: String
        status: String
    }

    input DepartmentUpdateInput {
        name: String
        description: String
        status: String
    }

    input AttendanceInput {
        employee: ID!
        date: String!
        checkIn: String
        checkOut: String
        status: String
        remarks: String
    }

    input AttendanceUpdateInput {
        date: String
        checkIn: String
        checkOut: String
        status: String
        workingHours: Float
        remarks: String
    }

    input LeaveInput {
        employee: ID!
        leaveType: String!
        startDate: String!
        endDate: String!
        reason: String!
        adminRemarks: String
    }

    input LeaveUpdateInput {
        leaveType: String
        startDate: String
        endDate: String
        reason: String
        adminRemarks: String
    }

    input PayrollInput {
        employee: ID!
        month: Int!
        year: Int!
        allowances: Float
        deductions: Float
        remarks: String
    }

    input PayrollUpdateInput {
        allowances: Float
        deductions: Float
        remarks: String
    }

    input UserInput {
        name: String!
        email: String!
        password: String!
        role: String
        status: String
    }

    input UserUpdateInput {
        name: String
        email: String
        password: String
        role: String
        status: String
    }

    # ==========================================
    # PAGINATION TYPES
    # ==========================================

    type EmployeePagination {
        totalEmployees: Int!
        currentPage: Int!
        totalPages: Int!
        pageSize: Int!
        employees: [Employee!]!
    }

    type DepartmentPagination {
        totalDepartments: Int!
        currentPage: Int!
        totalPages: Int!
        pageSize: Int!
        departments: [DepartmentWithEmployeeCount!]!
    }

    type AttendancePagination {
        totalRecords: Int!
        currentPage: Int!
        totalPages: Int!
        pageSize: Int!
        attendances: [Attendance!]!
    }

    type LeavePagination {
        totalLeaves: Int!
        currentPage: Int!
        totalPages: Int!
        pageSize: Int!
        leaves: [Leave!]!
    }

    type PayrollPagination {
        totalRecords: Int!
        currentPage: Int!
        totalPages: Int!
        pageSize: Int!
        payrolls: [Payroll!]!
    }

    type UserPagination {
        totalUsers: Int!
        currentPage: Int!
        totalPages: Int!
        pageSize: Int!
        users: [User!]!
    }

    # ==========================================
    # DASHBOARD TYPES
    # ==========================================

    type DashboardEmployeeSummary {
        total: Int!
        active: Int!
        inactive: Int!
        onLeave: Int!
    }

    type DashboardDepartmentSummary { total: Int! }

    type DashboardAttendanceSummary {
        totalMarked: Int!
        present: Int!
        halfDay: Int!
        absent: Int!
        leave: Int!
    }

    type DashboardLeaveSummary { pending: Int! }

    type DashboardPayrollSummary {
        month: Int!
        year: Int!
        totalRecords: Int!
        grossSalary: Float!
        netSalary: Float!
        paidAmount: Float!
        pendingAmount: Float!
    }

    type DepartmentEmployeeDistribution {
        departmentName: String!
        employeeCount: Int!
    }

    type EmployeeStatusDistribution {
        status: String!
        employeeCount: Int!
    }

    type DashboardOverview {
        employees: DashboardEmployeeSummary!
        departments: DashboardDepartmentSummary!
        attendance: DashboardAttendanceSummary!
        leaves: DashboardLeaveSummary!
        payroll: DashboardPayrollSummary!
        departmentDistribution: [DepartmentEmployeeDistribution!]!
        employeeStatusDistribution: [EmployeeStatusDistribution!]!
    }

    # ==========================================
    # REPORT TYPES
    # ==========================================

    type EmployeeReport {
        totalEmployees: Int!
        employees: [Employee!]!
    }

    type DepartmentReportItem {
        _id: ID!
        name: String!
        description: String
        status: String!
        employeesCount: Int!
        totalSalary: Float!
        averageSalary: Float!
    }

    type DepartmentReport {
        totalDepartments: Int!
        totalEmployees: Int!
        totalSalary: Float!
        departments: [DepartmentReportItem!]!
    }

    type AttendanceReportItem {
        _id: ID!
        employee: Employee
        date: String
        checkIn: String
        checkOut: String
        status: String
        workingHours: Float
        remarks: String
    }

    type AttendanceReport {
        totalRecords: Int!
        present: Int!
        halfDay: Int!
        absent: Int!
        leave: Int!
        records: [AttendanceReportItem!]!
    }

    type LeaveReportItem {
        _id: ID!
        employee: Employee
        leaveType: String
        startDate: String
        endDate: String
        totalDays: Int
        reason: String
        status: String
        adminRemarks: String
        reviewedAt: String
    }

    type LeaveReport {
        totalLeaves: Int!
        pending: Int!
        approved: Int!
        rejected: Int!
        totalDays: Int!
        records: [LeaveReportItem!]!
    }

    type PayrollReportItem {
        _id: ID!
        employee: Employee
        month: Int
        year: Int
        basicSalary: Float
        allowances: Float
        deductions: Float
        grossSalary: Float
        netSalary: Float
        paymentStatus: String
        paymentDate: String
        remarks: String
    }

    type PayrollReport {
        totalRecords: Int!
        grossSalary: Float!
        netSalary: Float!
        paidAmount: Float!
        pendingAmount: Float!
        records: [PayrollReportItem!]!
    }

    type SalaryReportItem {
        employee: Employee
        designation: String
        salary: Float!
        status: String
    }

    type SalaryReport {
        totalEmployees: Int!
        totalSalary: Float!
        averageSalary: Float!
        employees: [SalaryReportItem!]!
    }

    # ==========================================
    # QUERIES
    # ==========================================

    type Query {
        employees: [Employee]
        employee(id: ID!): Employee
        employeesPaginated(page: Int, limit: Int, search: String, status: String, department: ID, sortBy: String, sortOrder: String): EmployeePagination!

        departments: [Department]
        department(id: ID!): Department
        departmentsPaginated(page: Int, limit: Int, search: String, status: String, sortBy: String, sortOrder: String): DepartmentPagination!

        dashboardOverview: DashboardOverview!

        employeeReport(search: String, status: String, department: ID): EmployeeReport!
        departmentReport(status: String): DepartmentReport!
        attendanceReport(month: Int, year: Int, employee: ID, status: String): AttendanceReport!
        leaveReport(month: Int, year: Int, employee: ID, status: String, leaveType: String): LeaveReport!
        payrollReport(month: Int, year: Int, employee: ID, status: String): PayrollReport!
        salaryReport(department: ID, status: String): SalaryReport!

        # Attendance queries
        attendance(id: ID!): Attendance
        attendancesPaginated(page: Int, limit: Int, employee: ID, status: String, fromDate: String, toDate: String, sortOrder: String): AttendancePagination!
        employeeAttendanceHistory(employee: ID!, page: Int, limit: Int): AttendancePagination!

        # Leave queries
        leave(id: ID!): Leave
        leavesPaginated(page: Int, limit: Int, employee: ID, status: String, leaveType: String, month: Int, year: Int, sortOrder: String): LeavePagination!
        employeeLeaveHistory(employee: ID!, page: Int, limit: Int): LeavePagination!

        # Payroll queries
        payroll(id: ID!): Payroll
        payrollsPaginated(page: Int, limit: Int, employee: ID, month: Int, year: Int, paymentStatus: String, sortOrder: String): PayrollPagination!
        employeePayrollHistory(employee: ID!, page: Int, limit: Int): PayrollPagination!

        # User queries
        user(id: ID!): User
        usersPaginated(page: Int, limit: Int, search: String, role: String, status: String, sortOrder: String): UserPagination!
    }

    # ==========================================
    # MUTATIONS
    # ==========================================

    type Mutation {
        createEmployee(input: EmployeeInput!): Employee
        updateEmployee(id: ID!, input: EmployeeUpdateInput!): Employee
        deleteEmployee(id: ID!): String

        createDepartment(input: DepartmentInput!): Department
        updateDepartment(id: ID!, input: DepartmentUpdateInput!): Department
        deleteDepartment(id: ID!): String

        # Attendance mutations
        checkIn(employee: ID!, date: String, remarks: String): Attendance
        checkOut(attendanceId: ID!): Attendance
        createAttendance(input: AttendanceInput!): Attendance
        updateAttendance(id: ID!, input: AttendanceUpdateInput!): Attendance
        deleteAttendance(id: ID!): String

        # Leave mutations
        applyLeave(input: LeaveInput!): Leave
        updateLeave(id: ID!, input: LeaveUpdateInput!): Leave
        reviewLeave(id: ID!, status: String!, adminRemarks: String): Leave
        deleteLeave(id: ID!): String

        # Payroll mutations
        generatePayroll(input: PayrollInput!): Payroll
        updatePayroll(id: ID!, input: PayrollUpdateInput!): Payroll
        updatePayrollPaymentStatus(id: ID!, paymentStatus: String!): Payroll
        deletePayroll(id: ID!): String

        # User mutations
        createUser(input: UserInput!): User
        updateUser(id: ID!, input: UserUpdateInput!): User
        deleteUser(id: ID!): String
    }

`;

module.exports = typeDefs;