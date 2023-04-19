const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatar: {
    type: String,
    default: "uploads/default.png",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  customPricing: [],
  balance: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  OTP: {
    type: String,
  },
  OTP_expiry: {
    type: Date,
  },
  status: {
    type: Boolean,
    default: true,
  },
  customPricingEnabled: {
    type: Boolean,
    default: false,
  },
  api_key: {
    type: String,
  },
  api_enabled: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
