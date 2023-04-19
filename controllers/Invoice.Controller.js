const User = require("../models/User.model");
const Invoice = require("../models/Invoice.model");
var coinbase = require("coinbase-commerce-node");
var Charge = coinbase.resources.Charge;
const createError = require("http-errors");

module.exports = {
  // create invoice
  createInvoice: async (req, res, next) => {
    try {
      const id = req.payload.aud;

      //   find user
      const user = await User.findById(id);
      if (!user) {
        throw createError.BadRequest("User not found");
      }

      //   create invoice
      const invoice = new Invoice({
        hosted_url: "",
        user: user._id,
        amount: req.body.amount,
        payment_method: req.body.type,
        status: "pending",
      });

      //   save invoice
      const saved = await invoice.save();

      var chargeData = {
        name: "Label Service ",
        description: "Add Funds to account",
        local_price: {
          amount: saved.amount,
          currency: "USD",
        },
        pricing_type: "fixed_price",
        metadata: {
          savedInvoice: saved._id,
          userId: saved.user,
        },
      };

      if (req.body.type === "coinbase") {
        Charge.create(chargeData, async function (error, response) {
          console.log(error);

          await Invoice.updateOne(
            { _id: saved._id },
            { $set: { hosted_url: response?.hosted_url } }
          );

          return res.status(200).json({
            message: "Invoice created successfully",
            data: {
              invoice: saved,
              hosted_url: response?.hosted_url,
            },
          });
        });
      } else {
        res.status(200).json({
          message: "Invoice created successfully",
          data: {
            invoice: saved,
          },
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // get all invoices
  getAllInvoices: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError(401, "Unauthorized");
      }

      // pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const invoices = await Invoice.find({ user: req.payload.aud })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

      const total = await Invoice.countDocuments({ user: user._id });
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        message: "All invoices fetched successfully",
        invoices,
        total,
        totalPages,
        page,
      });
    } catch (err) {
      next(err);
    }
  },

  // add comment to invoice
  addComment: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);

      if (!user) {
        throw createError(401, "Unauthorized");
      }

      const { invoice, comment } = req.body;

      const invoiceData = await Invoice.findOne({
        _id: invoice,
        user: req.payload.aud,
      });

      if (!invoiceData) {
        throw createError.BadRequest("Invoice not found");
      }

      await Invoice.updateOne({ _id: invoice }, { $set: { comment: comment } });

      res.status(200).json({
        message: "Comment added successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
