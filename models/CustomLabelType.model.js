const mongoose = require("mongoose");

const customLabelTypeSchema = new mongoose.Schema(
  {
    name: String,
    prices: [
      {
        fromWeight: Number,
        toWeight: Number,
        price: Number,
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CustomLabelType", customLabelTypeSchema);
