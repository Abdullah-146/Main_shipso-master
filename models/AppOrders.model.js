const mongoose = require("mongoose");

const AppOrdersSchema = new mongoose.Schema(
  {
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apps",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weight: Number,
    labelType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabelType",
    },
    price: Number,
    orderData: {},
    status: String,
    tracking: String,
  },
  {
    timestamps: true,
  }
);

const AppOrders = mongoose.model("AppOrders", AppOrdersSchema);

module.exports = AppOrders;
