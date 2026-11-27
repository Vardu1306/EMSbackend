
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            unique: true,
            index: true
        },

        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true
        },

        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department"
        },

        designation: {
            type: String,
            required: [true, "Designation is required"],
            trim: true
        },

        salary: {
            type: Number,
            required: [true, "Salary is required"],
            min: 0
        },

        joiningDate: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: ["Active", "Inactive", "On Leave"],
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

employeeSchema.pre("validate", async function () {
    if (!this.isNew || this.employeeId) return;

    const Counter = require("./counter.model");

    const counter = await Counter.findOneAndUpdate(
        { _id: "employeeId" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );

    this.employeeId = `EMS${String(counter.sequence).padStart(3, "0")}`;
});

module.exports = mongoose.model("Employee", employeeSchema);
