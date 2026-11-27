
const mongoose = require("mongoose");
const Employee = require("../models/employee.model");

// 1. CREATE EMPLOYEE
const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            department,
            designation,
            salary,
            joiningDate,
            status
        } = req.body;

        const employee = await Employee.create({
            firstName,
            lastName,
            email,
            phone,
            department,
            designation,
            salary,
            joiningDate,
            status
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: employee
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or Employee ID already exists"
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create employee",
            error: error.message
        });
    }
};


// 2. GET ALL EMPLOYEES
const getAllEmployees = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const employees = await Employee.find()
            .populate("department", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalEmployees = await Employee.countDocuments();

        return res.status(200).json({
            success: true,
            message: "Employees retrieved successfully",
            pagination: {
                totalEmployees,
                currentPage: page,
                totalPages: Math.ceil(totalEmployees / limit),
                pageSize: limit
            },
            data: employees
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve employees",
            error: error.message
        });
    }
};


// 3. GET EMPLOYEE BY ID
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findById(id)
            .populate("department", "name");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Employee retrieved successfully",
            data: employee
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve employee",
            error: error.message
        });
    }
};


// 4. UPDATE EMPLOYEE
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        const allowedFields = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "department",
            "designation",
            "salary",
            "joiningDate",
            "status"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid fields to update"
            });
        }

        const employee = await Employee.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update employee",
            error: error.message
        });
    }
};


// 5. DELETE EMPLOYEE
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete employee",
            error: error.message
        });
    }
};


module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};
