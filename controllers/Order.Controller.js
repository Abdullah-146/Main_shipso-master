const User = require("../models/User.model");
const axios = require("axios");
const LabelType = require("../models/LabelType.model");
const Order = require("../models/Order.model");
const createError = require("http-errors");
const { uploadCSV } = require("../helpers/file_upload");
const csv = require("csvtojson");
const fs = require("fs");
const url = require("url");
const { validateAddress } = require("../helpers/Address_validation");
const FormData = require("form-data");
const ShopifyOrder = require("../Customapi/ShopifyOrder.model");
var AdmZip = require("adm-zip");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { calculatePrice } = require("../helpers/Order_helper");

module.exports = {
  // create
  create: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

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
        Type,
        price,
        height,
        width,
        length,
        description,
        FromPhone,
        ToPhone,
        items,
        ref1,
        ref2,
        orderId,
      } = req.body;

      if (user.balance < price) {
        throw createError(400, "Insufficient balance");
      }

      const labelType = await LabelType.findById(Type);
      if (!labelType) {
        throw createError(400, "Label type not found");
      }

      if (labelType.type === "aio.gg") {
        const OrderId = uuidv4();
        if (labelType.name.includes("UPS")) {
          params = new url.URLSearchParams({
            from_country: FromCountry,
            from_name: FromName,
            from_address1: FromStreet,
            from_address2: FromStreet2 || "",
            from_city: FromCity,
            from_state: FromState,
            from_postcode: FromZip,
            from_phone: FromPhone,
            to_country: ToCountry,
            to_name: ToName,
            to_address1: ToStreet,
            to_address2: ToStreet2,
            to_city: ToCity,
            to_state: ToState,
            to_phone: ToPhone,
            to_postcode: ToZip,
            weight: parseInt(Weight),
            length: parseInt(length),
            width: parseInt(width),
            height: parseInt(height),
            notes: description,
            class: labelType.uid,
            provider_code: "ups",
            ref1: ref1,
            ref2: ref2,
            callback_url:
              "https://api.shipsao.co/api/v1/webhook/order/" + OrderId,
          });
        } else {
          params = new url.URLSearchParams({
            from_country: FromCountry,
            from_name: FromName,
            from_address1: FromStreet,
            from_address2: FromStreet2 || "",
            from_city: FromCity,
            from_state: FromState,
            from_postcode: FromZip,
            from_phone: FromPhone,
            from_company: FromCompany || "",
            to_country: ToCountry,
            to_name: ToName,
            to_address1: ToStreet,
            to_address2: ToStreet2 || "",
            to_company: ToCompany || "",
            to_city: ToCity,
            to_state: ToState,
            to_phone: ToPhone,
            to_postcode: ToZip,
            weight: parseInt(Weight),
            length: parseInt(length),
            width: parseInt(width),
            height: parseInt(height),
            notes: description,
            class: labelType.uid,
            provider_code: "usps",
            callback_url:
              "https://api.shipsao.co/api/v1/webhook/order/" + OrderId,
          });
        }

        response = await axios.post("https://shipd.bz/api/v1/orders", params, {
          headers: {
            Auth: process.env.SHIPD_API_KEY,
            "content-type": "application/x-www-form-urlencoded",
          },
        });

        const order = await Order.create({
          user,
          Weight,
          FromCountry,
          FromName,
          FromCompany,
          FromStreet,
          FromStreet2,
          FromCity,
          FromState,
          FromZip,
          ToCountry,
          ToName,
          ToCompany,
          ToStreet,
          ToStreet2,
          ToCity,
          ToState,
          ToZip,
          labelType,
          Weight,
          price,
          order_data: req.body,
          status: "paid",
          uuid: response?.data?.order?.id,
          OrderId,
          description,
        });

        // substract price from user balance
        await User.findByIdAndUpdate(user._id, {
          $inc: { balance: -price },
        });

        res.send({
          message: "Order created successfully",
          order,
        });
      } else {
        const params = {
          fromCountry: FromCountry,
          fromName: FromName,
          fromRefNumber: FromCompany || "",
          fromStreetNumber: FromStreet,
          fromStreetNumber2: FromStreet2 || "",
          fromCity: FromCity,
          fromState: FromState,
          fromZip: FromZip,
          toCountry: ToCountry,
          toName: ToName,
          toRefNumber: ToCompany || "",
          toStreetNumber: ToStreet,
          toStreetNumber2: ToStreet2 || "",
          toCity: ToCity,
          toState: ToState,
          toZip: ToZip,
          weight: parseInt(Weight),
          type: labelType.uid,
          date: new Date().toISOString(),
          items: items,
          orderId,
        };

        await axios
          .post(
            labelType.type === "shipz"
              ? "https://api.shipz.biz/api/label/generate"
              : "https://api.shipsaosupply.biz/api/label/generate",
            params,
            {
              headers: {
                "x-api-key":
                  labelType.type === "shipz"
                    ? process.env.SHIPZ_API_KEY
                    : process.env.SHIPSAO_SUPPLY_API_KEY,
              },
            }
          )
          .then(async (response) => {
            console.log(response.data.payload);

            const order = await Order.create({
              user,
              Weight,
              FromCountry,
              FromName,
              FromCompany,
              FromStreet,
              FromStreet2,
              FromCity,
              FromZip,
              FromPhone,
              ToPhone,
              FromState,
              ToCountry,
              ToName,
              ToCompany,
              ToStreet,
              ToStreet2,
              ToCity,
              ToState,
              ToZip,
              labelType,
              Weight,
              price,
              status: "completed",
              uuid: response.data.payload.id,
              pdf: response.data.payload.pdf,
              tracking: response.data.payload.code,
              orderId,
              items,
            });

            // substract price from user balance
            await User.findByIdAndUpdate(user._id, {
              $inc: { balance: -price },
            });

            res.send({
              message: "Order created successfully",
              order,
            });
          });
      }
    } catch (err) {
      console.log(err.response.data);
      next(err);
    }
  },

  // read all orders
  readAll: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

      // pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      //filter
      const filter = {};
      if (req.query.status) {
        if (req.query.status === "All") {
        } else {
          filter.status = req.query.status.toLowerCase();
        }
      }

      // sort
      const sort = {};
      if (req.query.sort) {
        if (req.query.sort === "asc") {
          sort.createdAt = 1;
        } else {
          sort.createdAt = -1;
        }
      }

      const orders = await Order.find({ user: user._id })
        .populate("labelType")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments({ user: user._id });

      //   find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        orders,
        total,
        totalPages: totalPages === 0 ? 1 : totalPages,
        page,
      });
    } catch (err) {
      next(err);
    }
  },

  // download label
  downloadLabel: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const order = await Order.findById(req.params.id).populate("labelType");
      if (!order) {
        throw createError(400, "Order not found");
      }

      if (order.labelType?.type === "labelsupply") {
        response = await axios.get(
          `https://labelsupply.io/api/order/${order.uuid}/file`,
          {
            responseType: "stream",
            headers: {
              "X-API-Auth": process.env.LABEL_SUPPLY_API_KEY,
              "content-type": "application/x-www-form-urlencoded",
            },
          }
        );
      } else if (order.labelType?.type === "aio.gg") {
        try {
          response = await axios.get(
            order.labelType.name.includes("UPS")
              ? `https://aio.gg/api/upsv3/order/${order.uuid}/file`
              : `https://aio.gg/api/uspsv4/order/${order.uuid}/file`,
            {
              responseType: "stream",
              headers: {
                Auth: process.env.AIO_API_KEY,
                "content-type": "application/x-www-form-urlencoded",
              },
            }
          );

          res.setHeader(
            "Content-Disposition",
            `attachment; filename=${order.uuid}.pdf`
          );
          res.setHeader("Content-Type", "application/pdf");
          response.data.pipe(res);
        } catch (err) {
          response = await axios.get(
            `https://shipd.bz/api/v1/orders/${order.uuid}.pdf`,
            {
              responseType: "stream",
              headers: {
                Auth: process.env.SHIPD_API_KEY,
                "content-type": "application/x-www-form-urlencoded",
              },
            }
          );

          res.setHeader(
            "Content-Disposition",
            `attachment; filename=${order.uuid}.pdf`
          );
          res.setHeader("Content-Type", "application/pdf");
          response.data.pipe(res);
        }
      } else {
        response = await axios.get(order.pdf, {
          responseType: "stream",
        });

        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${order.uuid}.pdf`
        );
        res.setHeader("Content-Type", "application/pdf");
        response.data.pipe(res);
      }
    } catch (err) {
      console.log(err);
      res.status(400).json(createError(400, err.response.data.Error));
    }
  },

  // read price for order
  readPrice: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);

      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const { Type, Weight } = req.body;

      if (!Type || !Weight) {
        throw createError(400, "Type and Weight are required");
      }

      const labelType = await LabelType.findById(Type);
      if (!labelType) {
        throw createError(400, "Label type not found");
      }

      const customPricings = user.customPricing;

      if (!labelType.name.includes("UPS")) {
        if (Weight <= 0) {
          throw createError(400, "Weight must be greater than 0");
        }

        // check price range for weight
        price = labelType.prices.find(
          (price) => price.fromWeight <= Weight && price.toWeight >= Weight
        );
        if (!price) {
          throw createError(400, "Price not found");
        }
      } else {
        price = labelType.prices[0];
      }

      if (user.customPricingEnabled) {
        // find custom pricing for label type
        const customPricing = customPricings.find(
          (pricing) =>
            pricing.labelType.toString() === labelType.name.toString() &&
            parseInt(pricing.fromWeight) <= Weight &&
            parseInt(pricing.toWeight) >= Weight
        );

        if (customPricing) {
          res.send({
            price: customPricing.price,
          });

          return;
        }
      }

      res.send({
        price: price.price,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // validate csv file
  validateCSV: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const { type } = req.body;
      const path = req.file.path;

      // calculate price
      const labelType = await LabelType.findById(type);
      if (!labelType) {
        throw createError(400, "Label type not found");
      }
      // convert csv to json
      const json = await csv().fromFile(path);

      // check if each row has length,height,width,weight
      const errors = [];

      if (labelType.name.includes("UPS")) {
        json.forEach((row, index) => {
          if (!row.Length || !row.Height || !row.Width || !row.Weight) {
            errors.push({
              row: index + 1,
              error: "Missing length, height, width or weight",
            });
          }
        });
      } else if (labelType.name.includes("USPS")) {
        json.forEach((row, index) => {
          if (!row.Weight) {
            errors.push({
              row: index + 1,
              error: "Missing weight",
            });
          }
        });
      }

      if (errors.length > 0) {
        throw createError(
          400,
          "File validation failed" + JSON.stringify(errors[0])
        );
      }

      var totalPrice = 0;

      var verifiedOrders = [];

      for (const order of json) {
        const price = await calculatePrice(order.Weight, labelType._id, user);

        if (!price) {
          throw createError(400, "Price not found");
        }

        totalPrice += parseFloat(price);
        verifiedOrders.push({
          ...order,
          price,
        });
      }

      return res.send({
        message: "File validated successfully",
        totalPrice,
        verifiedOrders,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // create bulk orders
  createCSVOrder: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }
      const { total_price, type } = req.body;
      const path = req.file.path;

      // read csv
      const json = await csv().fromFile(path);

      const labelType = await LabelType.findById(type);

      // calculate price
      for (const order of json) {
        const price = await calculatePrice(order.Weight, labelType.uuid, user);
        if (!price) {
          throw createError(400, "Price not found");
        }
      }

      // throw error if balance is not enough
      if (parseInt(user.balance) < parseInt(total_price)) {
        throw createError(400, "Insufficient balance");
      }

      // find label type

      if (labelType.type === "aio.gg") {
        const params = json.map((row) => {
          const OrderId = uuidv4();
          return {
            provider_code: labelType.name.includes("UPS") ? "ups" : "usps",
            class: labelType.uid,
            weight: parseFloat(row.Weight),
            from_name: row.FromName,
            from_phone: row.FromPhone,
            from_address1: row.FromStreet1,
            from_address2: row.FromStreet2 || "",
            from_city: row.FromCity,
            from_state: row.FromState,
            from_postcode: row.FromZip,
            from_country: row.FromCountry,
            from_company: row.FromCompany || "",
            to_name: row.ToName,
            to_phone: row.ToPhone,
            to_address1: row.ToStreet1,
            to_address2: row.ToStreet2 || "",
            to_city: row.ToCity,
            to_state: row.ToState,
            to_postcode: row.ToZip,
            to_country: row.ToCountry,
            to_company: row.ToCompany || "",
            length: parseFloat(row.Length),
            width: parseFloat(row.Width),
            height: parseFloat(row.Height),
            ref1: row.ref1,
            ref2: row.ref2,
            callback_url:
              "https://api.shipsao.co/api/v1/webhook/order/" + OrderId,
            notes: row.Notes,
          };
        });

        const response = await axios.post(
          "https://shipd.bz/api/v1/bulk-orders",
          params,
          {
            headers: {
              Auth: process.env.SHIPD_API_KEY,
              "content-type": "application/json",
            },
          }
        );

        // create orders
        const orders = response.data.orders.map((order) => {
          const newOrderId = order.callback_url.split("/")[7];
          return {
            uuid: order.id,
            user: user._id,
            labelType: labelType._id,
            Weight: order.weight,
            FromCountry: order.from_country,
            FromName: order.from_name,
            FromCompany: order.from_company,
            FromStreet: order.from_address1,
            FromStreet2: order.from_address2,
            FromCity: order.from_city,
            FromState: order.from_state,
            FromZip: order.from_postcode,
            FromPhone: order.from_phone,
            ToCountry: order.to_country,
            ToName: order.to_name,
            ToCompany: order.to_company,
            ToStreet: order.to_address1,
            ToStreet2: order.to_address2,
            ToCity: order.to_city,
            ToState: order.to_state,
            ToZip: order.to_postcode,
            ToPhone: order.to_phone,
            price: parseInt(total_price / json.length),
            tracking: order.tracking_url,
            order_id: "ORD" + Math.random().toString(36).substr(2, 6),
            OrderId: newOrderId,
            status: "paid",
            description: order.notes,
            ref1: order.ref1,
            ref2: order.ref2,
          };
        });

        await Order.insertMany(orders);

        // deduct balance
        await User.findByIdAndUpdate(user._id, {
          $inc: { balance: -parseInt(total_price) },
        });

        res.send({
          message: "Order created successfully",
        });
      } else {
        const params = {
          type: labelType.uid,
          orders: json.map((row) => {
            return {
              toCountry: row.ToCountry,
              toName: row.ToName,
              toRefNumber: row.ToCompany || "",
              toStreetNumber: row.ToStreet1,
              toStreetNumber2: row.ToStreet2 || "",
              toCity: row.ToCity,
              toState: row.ToState,
              toZip: row.ToZip,
              fromCountry: row.FromCountry,
              fromName: row.FromName,
              fromRefNumber: row.FromCompany || "",
              fromStreetNumber: row.FromStreet1,
              fromStreetNumber2: row.FromStreet2 || "",
              fromCity: row.FromCity,
              fromState: row.FromState,
              fromZip: row.FromZip,
              weight: parseInt(row.Weight),
              date: new Date().toISOString(),
            };
          }),
        };

        await axios
          .post(
            labelType.type === "shipz"
              ? "https://api.shipz.biz/api/label/generate-bulk"
              : "https://api.shipsaosupply.biz/api/label/generate-bulk",
            params,
            {
              headers: {
                "x-api-key":
                  labelType.type === "shipsaoSupply"
                    ? process.env.SHIPSAO_SUPPLY_API_KEY
                    : process.env.SHIPZ_API_KEY,
              },
            }
          )
          .then(async (response) => {
            const newOrders = await response.data?.payload?.labels?.map(
              (order) => {
                return {
                  user,
                  Weight: order.weight,
                  FromCountry: order.fromCountry,
                  FromName: order.fromName,
                  FromCompany: order.fromRefNumber,
                  FromStreet: order.fromStreetNumber,
                  FromStreet2: order.fromStreetNumber2,
                  FromCity: order.fromCity,
                  FromZip: order.fromZip,
                  ToCountry: "US",
                  ToName: order.toName,
                  ToCompany: order.toRefNumber,
                  ToStreet: order.toStreetNumber,
                  ToStreet2: order.toStreetNumber2,
                  ToCity: order.toCity,
                  ToState: order.toState,
                  ToZip: order.toZip,
                  labelType,

                  price: parseInt(
                    total_price / response.data?.payload?.labels?.length
                  ),
                  status: "completed",
                  uuid: order.id,
                  pdf: order.pdf,
                  tracking: order.barcodeOCR,
                };
              }
            );

            await Order.insertMany(newOrders);

            // substract price from user balance
            await User.findByIdAndUpdate(user._id, {
              $inc: { balance: -parseInt(total_price) },
            });

            res.send({
              message: "Order created successfully",
            });
          })
          .catch((err) => {
            console.log(err);
            next(err);
          });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // download label for selected orders
  downloadLabelbulk: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const { orders } = req.body;

      const orderList = await Order.find({
        _id: { $in: orders },
      }).populate("labelType");
      console.log(orderList);

      if (!orderList) {
        throw createError(400, "Order not found");
      }

      const saveFile = async (url, order) => {
        // create user folder if not exist in public folder

        return new Promise((resolve, reject) => {
          if (!fs.existsSync("./public/labels/" + user._id)) {
            fs.mkdirSync("./public/labels/" + user._id);
          }
          const file = fs
            .createWriteStream(
              `./public/labels/${user._id}/${order.ToName}.pdf`
            )
            .on("finish", () => {
              resolve();
            });

          url.pipe(file);
        });
      };

      await Promise.all(
        orderList.map(async (order) => {
          if (order.labelType?.type === "aio.gg") {
            response = await axios.get(
              `https://shipd.bz/api/v1/orders/${order.uuid}.pdf`,
              {
                responseType: "stream",
                headers: {
                  Auth: process.env.SHIPD_API_KEY,
                  "content-type": "application/x-www-form-urlencoded",
                },
              }
            );
          } else {
            response = await axios.get(order.pdf, {
              responseType: "stream",
            });
          }

          await saveFile(response.data, order);
        })
      );

      const zip = new AdmZip();
      const files = fs.readdirSync("./public/labels/" + user._id);

      const addFileToZIp = async (file, zip) => {
        // promise
        return new Promise((resolve, reject) => {
          zip.addLocalFile(`./public/labels/${user._id}/${file}`);
          resolve();
        });
      };

      for (const file of files) {
        // console index
        const index = files.indexOf(file);
        console.log(index);
        await addFileToZIp(file, zip);
      }

      zip.writeZip(`./public/labels/${user._id}/labels.zip`);

      res.download(`./public/labels/${user._id}/labels.zip`, async (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.rmSync("./public/labels/" + user._id, {
            recursive: true,
            force: true,
          });
        }
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  readApiOrders: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin

      // pagination
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      // get orders
      const orders = await ShopifyOrder.find({ user: id })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      // get total orders
      const total = await ShopifyOrder.countDocuments();

      // find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        orders,
        total,
        totalPages,
      });
    } catch (error) {
      next(error);
    }
  },

  // download api-order label
  downloadApiPdf: async (req, res, next) => {
    try {
      const { id } = req.params;

      const order = await ShopifyOrder.findOne({ _id: id });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

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
    } catch (err) {
      console.log(err);
      res.status(400).json(createError(400, err.response.data.Error));
    }
  },
};
