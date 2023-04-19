const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    OrderId: String,
    uuid: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Weight: Number,
    FromCountry: String,
    FromName: String,
    FromCompany: String,
    FromStreet: String,
    FromStreet2: String,
    FromState: String,
    FromCity: String,
    FromZip: String,
    FromPhone: String,
    ToCountry: String,
    ToName: String,
    ToCompany: String,
    ToStreet: String,
    ToStreet2: String,
    ToCity: String,
    ToState: String,
    ToZip: String,
    ToPhone: String,
    labelType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabelType",
    },
    Weight: {
      type: Number,
    },
    price: {
      type: Number,
    },
    order_data: {},
    status: {
      type: String,
      default: "paid",
    },
    tracking: String,
    order_id: String,
    appToken: String,
    description: String,
    ref1: String,
    ref2: String,
    items: String,
    orderId: String,
    pdf: String,
  },
  {
    timestamps: true,
  }
);

// generate order_id
OrderSchema.pre("save", function (next) {
  // 6 letter random string
  this.order_id = "ORD" + Math.random().toString(36).substr(2, 6);
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
