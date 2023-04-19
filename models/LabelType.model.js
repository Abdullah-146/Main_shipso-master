const mongoose = require("mongoose");

const labelType = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    uid: String,
    maxWeight: Number,
    prices: [
      {
        price: Number,
        fromWeight: Number,
        toWeight: Number,
      },
    ],
    type: String,
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LabelType", labelType);
