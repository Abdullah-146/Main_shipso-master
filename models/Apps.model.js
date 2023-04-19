const mongoose = require("mongoose");

const AppsSchema = new mongoose.Schema(
  {
    name: String,
    domain: String,
    token: String,
    version: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orders: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        labelType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabelType",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Apps", AppsSchema);
