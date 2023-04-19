const User = require("../models/User.model");
const CustomOrder = require("../models/CustomOrder.model");
const createError = require("http-errors");

module.exports = {
  // create order
  createOrder: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);

      if (!user) {
        throw createError(404, "User not found.");
      }

      const {
        FromCountry,
        FromState,
        FromName,
        FromCompany,
        FromStreet,
        FromStreet2,
        FromCity,
        FromZip,
        ToCountry,
        ToName,
        ToCompany,
        ToStreet,
        ToStreet2,
        ToCity,
        ToState,
        ToZip,
        price,
        FromPhone,
        ToPhone,
        labelType,
        packages,
        product,
        dropoff,
        content_summary,
        value,
      } = req.body;

      if (user.balance < price) {
        throw createError(400, "Insufficient balance.");
      }

      const addressDetails = {
        FromCountry,
        FromState,
        FromName,
        FromCompany,
        FromStreet,
        FromStreet2,
        FromCity,
        FromZip,
        ToCountry,
        ToName,
        ToCompany,
        ToStreet,
        ToStreet2,
        ToCity,
        ToState,
        ToZip,
        FromPhone,
        ToPhone,
      };

      const order = new CustomOrder({
        user: user._id,
        addressDetails,
        labelType,
        packages,
        price,
        product,
        dropoff,
        content_summary,
        value,
      });

      const result = await order.save();

      // bot.telegram.sendMessage(
      //   process.env.GROUP_ID,
      //   `New custom order created by ${user.email} with id ${result._id}`,
      //   {
      //     parse_mode: "Markdown",
      //     disable_web_page_preview: true,
      //   }
      // );

      await User.findByIdAndUpdate(user._id, {
        $inc: { balance: -price },
      });

      res.status(201).json({
        message: "Order created successfully.",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // read all orders
  readOrders: async (req, res, next) => {
    try {
      const orders = await CustomOrder.find({ user: req.payload.aud })
        .populate("labelType")
        .sort({ createdAt: -1 });

      res.json({
        orders,
      });
    } catch (err) {
      next(err);
    }
  },
};
