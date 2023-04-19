const Order = require("../models/Order.model");
const createError = require("http-errors");
const { validateAddress } = require("../helpers/Address_validation");
const LabelType = require("../models/LabelType.model");
const ShopifyOrder = require("./ShopifyOrder.model");
const url = require("url");
const axios = require("axios");

module.exports = {
  // create order
  createOrder: async (req, res, next) => {
    try {
      const {
        Weight,
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
        uid,
      } = req.body;

      //   find labeltype
      const labelType = await LabelType.findOne({ uid: uid });

      if (!labelType) return next(createError.NotFound("Label type not found"));

      var price = {};

      // check if weight is valid
      if (!labelType.name.includes("UPSv3")) {
        if (Weight <= 0) {
          next(createError.BadRequest("Weight must be greater than 0"));
        }

        // check price range for weight
        price = labelType.prices.find(
          (price) => price.fromWeight <= Weight && price.toWeight >= Weight
        );
        if (!price) {
          next(createError(400, "Weight is out of range"));
        }
      } else {
        price = labelType.prices[0];
      }

      // check if user has enough balance
      if (req.user.balance < price.price) {
        next(createError(400, "Not enough balance"));
      }

      const params = new url.URLSearchParams({
        FromCountry: FromCountry,
        FromName: FromName,
        FromCompany: FromCompany || "",
        FromStreet: FromStreet,
        FromStreet2: FromStreet2,
        FromCity: FromCity,
        FromState: FromState,
        FromZip: FromZip,
        ToCountry: ToCountry,
        ToName: ToName,
        ToCompany: ToCompany || "",
        ToStreet: ToStreet,
        ToStreet2: ToStreet2,
        ToCity: ToCity,
        ToState: ToState,
        ToZip: ToZip,
        Weight: parseInt(Weight),
        Type: uid,
      });

      const response = await axios.post(
        "https://labelsupply.io/api/order",
        params,
        {
          headers: {
            "X-API-Auth": process.env.LABEL_SUPPLY_API_KEY,
            "content-type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.data.Success)
        return next(createError.BadRequest(response.data.Error));

      const order = new ShopifyOrder({
        order_data: response?.data?.Data?.Order,
        user: req.user._id,
      });

      const result = await order.save();

      await User.updateOne(
        { _id: req.user._id },
        { $inc: { balance: -price.price } }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      if (!err.response?.data?.Success) {
        res.status(400).json({
          success: false,
          message: err.response?.data?.Error,
        });
      } else {
        next(err);
      }
    }
  },

  // read order
  readOrder: async (req, res, next) => {
    try {
      const { id } = req.params;

      const order = await ShopifyOrder.findOne({ _id: id });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  // cancel order
  cancelOrder: async (req, res, next) => {
    try {
      const { id } = req.params;

      const order = await ShopifyOrder.findOne({ _id: id });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

      const response = await axios.get(
        `https://labelsupply.io/api/${order.order_data?.ID}/cancel`,
        {
          headers: {
            "X-API-Auth": process.env.LABEL_SUPPLY_API_KEY,
            "content-type": "application/json",
          },
        }
      );

      if (!response.data.Success)
        return next(createError.BadRequest(response.data.Error));

      res.status(200).json({
        success: true,
        data: response.data.Data,
      });
    } catch (err) {
      if (!err.response.data.Success) {
        res.status(400).json({
          success: false,
          message: err?.response?.data?.Error,
        });
      } else {
        next(err);
      }
    }
  },

  // duplicate order
  duplicateOrder: async (req, res, next) => {
    try {
      const { id } = req.params;

      const order = await ShopifyOrder.findOne({ _id: id });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

      console.log(order.order_data?.ID);

      const response = await axios.get(
        `https://labelsupply.io/api/order/${order.order_data?.ID}/duplicate`,
        {
          headers: {
            "X-API-Auth": process.env.LABEL_SUPPLY_API_KEY,
            "content-type": "application/json",
          },
        }
      );

      if (!response.data.Success)
        return next(createError.BadRequest(response.data.Error));

      const Neworder = new ShopifyOrder({
        order_data: response?.data?.Data?.Order,
      });

      const result = await Neworder.save();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.log(err);
      if (!err.response.data.Success) {
        res.status(400).json({
          success: false,
          message: err.response.data.Error,
        });
      } else {
        next(err);
      }
    }
  },

  // download pdf
  downloadPdf: async (req, res, next) => {
    try {
      const { id } = req.params;

      const order = await ShopifyOrder.findOne({ _id: id });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

      if (order.order_data.class) {
        const response = await axios.get(
          `https://aio.gg/api/upsv3/order/${order.order_data?.ID}/file`,
          {
            responseType: "stream",
            headers: {
              "X-API-Auth": process.env.AIO_API_KEY,
              "content-type": "application/json",
            },
          }
        );

        // send file to user
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${order.uuid}.pdf`
        );
        res.setHeader("Content-type", "application/pdf");
        response.data.pipe(res);
      } else {
        const response = await axios.get(
          `https://labelsupply.io/api/${order.order_data?.ID}/file`,
          {
            responseType: "stream",
            headers: {
              "X-API-Auth": process.env.LABEL_SUPPLY_API_KEY,
              "content-type": "application/json",
            },
          }
        );

        // send file to user
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${order.uuid}.pdf`
        );
        res.setHeader("Content-type", "application/pdf");
        response.data.pipe(res);
      }
    } catch (err) {
      console.log(err);
      res.status(400).json(createError(400, err.response.data.Error));
    }
  },

  // read all labelTypes
  readLabelTypes: async (req, res, next) => {
    try {
      const labels = await LabelType.find();
      res.status(200).json({
        success: true,
        data: labels,
      });
    } catch (err) {
      next(err);
    }
  },

  // create UPS label
  createUpsLabel: async (req, res, next) => {
    try {
      const {
        Weight,
        Height,
        Width,
        Length,
        Description,
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
        uid,
        FromPhone,
        ToPhone,
      } = req.body;

      const labelType = await LabelType.findOne({ uid: uid });

      if (!labelType) return next(createError.NotFound("Label type not found"));

      var price = {};

      if (!labelType.name.includes("UPSv3")) {
        return next(createError.BadRequest("Label type not supported"));
      }
      if (Weight <= 0) {
        return next(createError.BadRequest("Weight must be greater than 0"));
      }

      // check price range for weight
      price = labelType.prices.find(
        (price) => price.fromWeight <= Weight && price.toWeight >= Weight
      );
      if (!price) {
        return next(createError(400, "Weight is out of range"));
      }

      if (req.user.balance < price.price) {
        next(createError(400, "Not enough balance"));
      }

      const params = new url.URLSearchParams({
        FromCountry: FromCountry,
        FromName: FromName,
        FromCompany: FromCompany || "",
        FromAddress: FromStreet,
        FromAddress2: FromStreet2,
        FromCity: FromCity,
        FromState: FromState,
        FromZip: FromZip,
        FromPhone: FromPhone,
        ToCountry: ToCountry,
        ToName: ToName,
        ToCompany: ToCompany || "",
        ToAddress: ToStreet,
        ToAddress2: ToStreet2,
        ToCity: ToCity,
        ToState: ToState,
        ToPhone: ToPhone,
        ToZip: ToZip,
        Weight: parseInt(Weight),
        Length: parseInt(Length),
        Width: parseInt(Width),
        Height: parseInt(Height),
        Description: Description,
        Class: labelType.uid,
      });

      const response = await axios.post(
        "https://aio.gg/api/upsv3/order",
        params,
        {
          headers: {
            Auth: process.env.AIO_API_KEY,
            "content-type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.data.Success)
        return next(createError.BadRequest(response.data.Error));

      const order = new ShopifyOrder({
        order_data: response?.data?.Data?.Order,
        user: req.user._id,
      });

      const result = await order.save();
      await User.updateOne(
        { _id: req.user._id },
        { $inc: { balance: -price.price } }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.log(err.message);
      if (!err.response?.data?.Success) {
        res.status(400).json({
          success: false,
          message: err.response?.data?.Error,
        });
      }
    }
  },
};
