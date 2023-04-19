const mongoose = require("mongoose");

const shopifyOrderSchema = new mongoose.Schema(
  {
    order_data: {},
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ShopifyOrder", shopifyOrderSchema);
