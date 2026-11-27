
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"]
    },

    leaveType: {
      type: String,
      enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"],
      required: [true, "Leave type is required"]
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"]
    },

    totalDays: {
      type: Number,
      required: true,
      min: 1
    },

    reason: {
      type: String,
      required: [true, "Leave reason is required"],
      trim: true
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    adminRemarks: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Validate dates and calculate total leave days
leaveSchema.pre("validate", function () {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      this.invalidate("endDate", "End date cannot be before start date");
      return;
    }

    const difference = end.getTime() - start.getTime();
    this.totalDays = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
  }
});

module.exports = mongoose.model("Leave", leaveSchema);
