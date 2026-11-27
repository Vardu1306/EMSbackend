
const Department = require("../models/department.model");
const Employee = require("../models/employee.model");
// CREATE DEPARTMENT
const createDepartment = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const department = await Department.create({
      name,
      description,
      status
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Department already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET ALL DEPARTMENTS
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET DEPARTMENT BY ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid department ID"
    });
  }
};

// UPDATE DEPARTMENT
const updateDepartment = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Department name already exists"
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE DEPARTMENT

const deleteDepartment = async (req, res) => {
  try {
    // Step 1: Find the department
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // Step 2: Check whether employees are assigned
    const employeeExists = await Employee.exists({
      department: department._id
    });

    if (employeeExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete department. Employees are assigned to this department."
      });
    }

    // Step 3: Delete the department
    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully"
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid department ID"
    });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
