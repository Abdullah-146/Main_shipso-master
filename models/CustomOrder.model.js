const mongoose = require("mongoose");

const customOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    addressDetails: {},
    labelType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomLabelType",
    },
    packages: [],
    price: Number,
    status: {
      type: String,
      default: "pending",
    },
    file: String,
    product: String,
    dropoff: String,
    content_summary: String,
    value: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CustomOrder", customOrderSchema);
