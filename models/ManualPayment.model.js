const mongoose = require("mongoose");

const ManualPaymentSchema = new mongoose.Schema(
  {
    name: String,
    logo: String,
    status: Boolean,
    image: String,
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ManualPayment", ManualPaymentSchema);
