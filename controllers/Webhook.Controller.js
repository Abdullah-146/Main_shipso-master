const User = require("../models/User.model");
const Invoice = require("../models/Invoice.model");
const createError = require("http-errors");
var coinbase = require("coinbase-commerce-node");
var Webhook = coinbase.Webhook;
const Order = require("../models/Order.model");
const Apps = require("../models/Apps.model");
const AppOrders = require("../models/AppOrders.model");
const { markOrder } = require("../helpers/ShopifyHelper");

module.exports = {
  // webhook for coinbase
  coinbase: async (req, res, next) => {
    try {
      const event = Webhook.verifyEventBody(
        JSON.stringify(req.body),
        req.headers["x-cc-webhook-signature"],
        process.env.COINBASE_WEBHOOK_SECRET
      );

      if (event.type === "charge:confirmed") {
        const invoice = await Invoice.findById(
          event.data.metadata.savedInvoice
        );
        if (!invoice) {
          throw createError.BadRequest("Invoice not found");
        }
        await Invoice.updateOne(
          { _id: invoice._id },
          { $set: { status: "paid" } }
        );

        // update user
        await User.findByIdAndUpdate(invoice.user, {
          $inc: { balance: invoice.amount },
        });
        return res.status(200).send("Signed Webhook Received: " + event.id);
      } else {
        return res.status(200).send("Signed Webhook Received: " + event.id);
      }
    } catch (error) {
      console.log(error.message);
      return res.status(400).send("Webhook Error:" + error.message);
    }
  },

  order: async (req, res, next) => {
    try {
      const order = await Order.findOne({ OrderId: req.params.id });
      if (!order) {
        throw createError(404, "Order not found");
      }

      // find app

      // find order in app
      const appOrder = await AppOrders.findOne({ order: order._id }).populate(
        "app"
      );

      // update order
      if (appOrder) {
        // update shopify order
        if (req.body.status === 2) {
          const tracking_info = {
            number: req.body.tracking || "",
            company: "",
            url: "",
          };

          await markOrder(
            appOrder.app.domain,
            appOrder.app.token,
            tracking_info,
            appOrder.orderData?.id,
            "fulfilled",
            ""
          );

          // update order
          await AppOrders.updateOne(
            { order: order._id },
            {
              $set: {
                status: "fulfilled",
                tracking: req.body.tracking || "",
              },
            }
          );
        }
      }

      if (req.body.status === 2) {
        order.status = "completed";
        order.tracking = req.body.tracking;
        await order.save();
      } else if (req.body.status === 3) {
        console.log(req.body);

        order.status = "cancelled";
        await order.save();

        // refund the user
        await User.findByIdAndUpdate(
          order.user,
          {
            $inc: { balance: order.price },
          },
          { new: true }
        );
      } else if (req.body.status === 1) {
        order.status = "processing";
        await order.save();
      } else {
        order.status = "paid";
        await order.save();
      }

      res.status(200).json({ message: "Webhook received" });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
