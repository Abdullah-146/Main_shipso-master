const Apps = require("../models/Apps.model");
const createError = require("http-errors");
const User = require("../models/User.model");
const { fetchOrders, markOrder } = require("../helpers/ShopifyHelper");
const axios = require("axios");
const LabelType = require("../models/LabelType.model");
const Order = require("../models/Order.model");
const fs = require("fs");
const url = require("url");
const { v4: uuidv4 } = require("uuid");
const AppOrders = require("../models/AppOrders.model");

module.exports = {
  createApp: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) throw createError(404, "User does not exist");

      const app = await Apps.create({
        name: req.body.name,
        domain: req.body.domain,
        token: req.body.token,
        version: req.body.version,
        user: user._id,
      });

      res.send({
        message: "App created successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // Get all apps
  getApps: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) throw createError(404, "User does not exist");

      const apps = await Apps.find({ user: user._id });

      res.send({
        apps,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // read orders of a specific app
  readOrders: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) throw createError(404, "User does not exist");

      const app = await Apps.findById(req.params.id);

      if (!app) throw createError(404, "App does not exist");

      const orders = await fetchOrders(app.domain, app.token);

      const storedOrders = await AppOrders.find({ app: app._id });

      const ordersToStore = orders.orders?.filter((order) => {
        return !storedOrders.find((storedOrder) => {
          return storedOrder.orderData.id == order.id;
        });
      });

      const ordersToStorePromises = ordersToStore.map((order) => {
        return AppOrders.create({
          app: app._id,
          order: null,
          user: user._id,
          weight: null,
          labelType: null,
          orderData: order,
        });
      });

      await Promise.all(ordersToStorePromises);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const ordersToReturn = await AppOrders.find({
        app: app._id,
        $or: [{ status: { $ne: "fulfilled" } }, { status: { $exists: false } }],
      })
        .populate("labelType")
        .skip(skip)
        .limit(limit);

      const total = await AppOrders.countDocuments({
        app: app._id,
        $or: [{ status: { $ne: "fulfilled" } }, { status: { $exists: false } }],
      });

      const totalPages = Math.ceil(total / limit);

      res.send({
        orders: ordersToReturn,
        total,
        totalPages: totalPages === 0 ? 1 : totalPages,
        page,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  readOrdersfulfilled: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) throw createError(404, "User does not exist");

      const app = await Apps.findById(req.params.id);

      if (!app) throw createError(404, "App does not exist");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // search
      const search = req.query.search || "";

      const ordersToReturn = await AppOrders.find({
        app: app._id,
        status: "fulfilled",
        $or: [
          {
            "orderData.billing_address.name": { $regex: search, $options: "i" },
          },
          {
            "orderData.billing_address.address1": {
              $regex: search,
              $options: "i",
            },
          },
          {
            "orderData.billing_address.address2": {
              $regex: search,
              $options: "i",
            },
          },

          {
            "orderData.line_items": {
              $elemMatch: { name: { $regex: search, $options: "i" } },
            },
          },
        ],
      })
        .populate("labelType")
        .populate("order")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await AppOrders.countDocuments({
        app: app._id,
        status: "fulfilled",
      });

      const totalPages = Math.ceil(total / limit);

      res.send({
        orders: ordersToReturn,
        total,
        totalPages: totalPages === 0 ? 1 : totalPages,
        page,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // fulfill order
  fulfillOrder: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const {
        FromCountry,
        FromState,
        FromName,
        FromStreet,
        FromStreet2,
        FromCity,
        FromZip,
        ToAddress,
        price,
        height,
        width,
        length,
        description,
      } = req.body;

      if (user.balance < price) {
        throw createError(400, "Insufficient balance");
      }

      for (let i = 0; i < ToAddress.length; i++) {
        const OrderId = uuidv4();
        const labelType = await LabelType.findById(ToAddress[i].Type);
        const params = {
          provider_code: labelType.name.includes("UPS") ? "ups" : "usps",
          class: labelType.uid,
          weight: parseFloat(ToAddress[i].Weight),
          from_name: FromName,
          from_phone: 2233232,
          from_address1: FromStreet,
          from_address2: FromStreet2 || "",
          from_city: FromCity,
          from_state: FromState,
          from_postcode: FromZip,
          from_country: FromCountry,
          to_name: ToAddress[i].ToName,
          to_phone: 2233232,
          to_address1: ToAddress[i].ToStreet,
          to_address2: ToAddress[i].ToStreet2,
          to_city: ToAddress[i].ToCity,
          to_state: ToAddress[i].ToState,
          to_postcode: ToAddress[i].ToZip,
          to_country: "US",
          length,
          width,
          height,
          callback_url:
            "https://api.shipsao.co/api/v1/webhook/order/" + OrderId,
          notes: description || "",
        };

        const response = await axios.post(
          "https://shipd.bz/api/v1/orders",
          params,
          {
            headers: {
              Auth: process.env.SHIPD_API_KEY,
              "content-type": "application/json",
            },
          }
        );

        console.log(response.data);

        const newOrder = new Order({
          uuid: response.data?.order?.id,
          user: user._id,
          labelType: labelType._id,
          Weight: response.data?.order?.weight,
          FromCountry: response.data?.order?.from_country,
          FromName: response.data?.order?.from_name,
          FromCompany: response.data?.order?.from_company,
          FromStreet: response.data?.order?.from_address1,
          FromStreet2: response.data?.order?.from_address2,
          FromCity: response.data?.order?.from_city,
          FromState: response.data?.order?.from_state,
          FromZip: response.data?.order?.from_postcode,
          ToCountry: response.data?.order?.to_country,
          ToName: response.data?.order?.to_name,
          ToCompany: response.data?.order?.to_company,
          ToStreet: response.data?.order?.to_address1,
          ToStreet2: response.data?.order?.to_address2,
          ToCity: response.data?.order?.to_city,
          ToState: response.data?.order?.to_state,
          ToZip: response.data?.order?.to_postcode,
          price: parseInt(price / ToAddress.length),
          tracking: response.data?.order?.tracking_url,
          order_id: "ORD" + Math.random().toString(36).substr(2, 6),
          OrderId,
          status: "paid",
          description,
        });

        const result = await newOrder.save();
        console.log(result);

        await AppOrders.findOneAndUpdate(
          { _id: ToAddress[i].AppOrderId },
          {
            $set: {
              order: result._id,
            },
          }
        );
      }

      // substract price from user balance
      await User.findByIdAndUpdate(user._id, {
        $inc: { balance: -price },
      });

      res.send({
        message: "Order created successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // calculate price
  calculatePrice: async (req, res, next) => {
    // read price for order
    try {
      const user = await User.findById(req.payload.aud);

      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const { Type, orders } = req.body;

      const labelType = await LabelType.findById(Type);
      if (!labelType) {
        throw createError(400, "Label type not found");
      }

      const selectedOrders = await AppOrders.find({ _id: { $in: orders } });

      const customPricings = user.customPricing;

      for (let i = 0; i < selectedOrders.length; i++) {
        const weight =
          parseInt(selectedOrders[i].orderData.total_weight / 453.6) < 1
            ? 1
            : parseInt(selectedOrders[i].orderData.total_weight / 453.6);

        if (user.customPricingEnabled) {
          const price = customPricings.find(
            (p) => p.labelType == labelType._id && p.weight == weight
          );

          const price1 = labelType.prices.find(
            (price) => price.fromWeight <= weight && price.toWeight >= weight
          );

          if (!price && !price1) {
            await AppOrders.findByIdAndUpdate(selectedOrders[i]._id, {
              $set: {
                price: null,
                labelType: labelType._id,
              },
            });
          }

          if (price) {
            await AppOrders.findByIdAndUpdate(selectedOrders[i]._id, {
              $set: {
                price: price.price,
                labelType: labelType._id,
              },
            });
          } else {
            await AppOrders.findByIdAndUpdate(selectedOrders[i]._id, {
              $set: {
                price: price1.price,
                labelType: labelType._id,
              },
            });
          }
        } else {
          // get price for label type
          const price = labelType.prices.find(
            (price) => price.fromWeight <= weight && price.toWeight >= weight
          );

          if (price) {
            await AppOrders.findByIdAndUpdate(selectedOrders[i]._id, {
              $set: {
                price: price.price,
                labelType: labelType._id,
              },
            });
          } else {
            return res.status(400).send({
              message: "Price not found",
            });
          }
        }
      }

      res.send({
        message: "Price calculated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // delete app
  deleteApp: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);

      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const app = await Apps.findById(req.params.id);

      if (!app) {
        throw createError(400, "App not found");
      }

      await Apps.deleteOne({ _id: req.params.id });

      res.send({
        message: "App deleted successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // override weight of app order
  overrideWeight: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);

      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const { orders, weight } = req.body;

      const selectedOrders = await AppOrders.find({ _id: { $in: orders } });

      for (let i = 0; i < selectedOrders.length; i++) {
        await AppOrders.findByIdAndUpdate(selectedOrders[i]._id, {
          $set: {
            orderData: {
              ...selectedOrders[i].orderData,
              total_weight: weight,
            },
          },
        });
      }

      res.send({
        message: "Weight overridden successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
