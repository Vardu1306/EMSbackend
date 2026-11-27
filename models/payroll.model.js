
const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"]
    },

    month: {
      type: Number,
      required: [true, "Payroll month is required"],
      min: 1,
      max: 12
    },

    year: {
      type: Number,
      required: [true, "Payroll year is required"],
      min: 2020
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0
    },

    allowances: {
      type: Number,
      default: 0,
      min: 0
    },

    deductions: {
      type: Number,
      default: 0,
      min: 0
    },

    grossSalary: {
      type: Number,
      required: true,
      min: 0
    },

    netSalary: {
      type: Number,
      required: true,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending"
    },

    paymentDate: {
      type: Date,
      default: null
    },

    remarks: {
      type: String,
      trim: true,
      default: ""
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate payroll for the same employee and month
payrollSchema.index(
  { employee: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
