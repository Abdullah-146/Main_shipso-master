const Order = require("../models/Order.model");

module.exports = {
  // generate order_id for all orders
  generate: async () => {
    try {
      const orders = await Order.find();
      orders.forEach(async (order) => {
        if (!order.order_id) {
          order.order_id = "ORD" + Math.random().toString(36).substr(2, 6);
          await order.save();
        }
      });
    } catch (err) {
      console.log(err);
    }
  },
};
