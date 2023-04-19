const User = require("../models/User.model");
const Admin = require("../models/Admin.model");
const createError = require("http-errors");
const Order = require("../models/Order.model");
const Invoice = require("../models/Invoice.model");
const Ticket = require("../models/Ticket.model");
const moment = require("moment");
const ShopifyOrder = require("../Customapi/ShopifyOrder.model");
const CustomOrder = require("../models/CustomOrder.model");
const { upload } = require("../helpers/file_upload");
const { generateApiKey } = require("../helpers/random_helper");

module.exports = {
  // GET /admin/users
  // read users
  readUsers: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // pagination
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      // search
      const search = req.query.search || "";

      // get users
      const users = await User.find({
        $or: [
          {
            username: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      })
        .skip(skip)
        .limit(limit);

      // get total users
      const totalUsers = await User.countDocuments();

      // get total pages
      const totalPages = Math.ceil(totalUsers / limit);

      res.send({
        users,
        totalPages,
        totalUsers,
        page,
      });
    } catch (error) {
      next(error);
    }
  },

  // add user
  addUser: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if user exists
      const user = await User.findOne({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      });

      if (user) {
        throw createError.Conflict("User already exists");
      }

      // create user
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        avatar: "uploads/default.png",
        isVerified: true,
      });

      await newUser.save();

      res.send({
        message: "User created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  //   add balance to user
  addBalance: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }
      // const user = await User.findById(req.body.userId);

      // user.balance += parseInt(req.body.balance);
      // await user.save();

      await User.updateOne(
        { _id: req.params.id },
        {
          $inc: {
            balance: parseInt(req.body.balance),
          },
        }
      );

      res.send({
        message: "Balance added successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // read orders
  readOrders: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }
      // pagination
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      // search
      const search = req.query.search || "";
      const searchRegEx = new RegExp(search, "i");

      const users = await User.find({
        $or: [{ username: searchRegEx }, { email: searchRegEx }],
      });

      // get orders
      const orders = await Order.find({
        $or: [
          {
            user: {
              $in: users.map((user) => user._id),
            },
          },
          {
            uuid: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "-password")
        .populate("labelType", "name");

      //   find total orders
      const total = await Order.countDocuments();

      //   find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        orders,
        total,
        totalPages,
        page,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // read invoices
  readInvoices: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // pagination
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      // search
      const search = req.query.search || "";
      const searchRegEx = new RegExp(search, "i");

      const users = await User.find({
        $or: [{ username: searchRegEx }, { email: searchRegEx }],
      });

      // get invoices
      const invoices = await Invoice.find({
        $or: [
          {
            user: {
              $in: users.map((user) => user._id),
            },
          },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "-password");

      //   find total invoices
      const total = await Invoice.countDocuments();

      //   find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        invoices,
        total,
        totalPages,
        page,
      });
    } catch (err) {
      next(err);
    }
  },

  // mark as paid
  markAsPaid: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        throw createError.NotFound("Invoice not found");
      }

      invoice.status = "paid";
      await invoice.save();

      // update user
      const user = await User.updateOne(
        { _id: invoice.user },
        {
          $inc: {
            balance: +parseInt(invoice.amount),
          },
        }
      );

      res.send({
        message: "Invoice marked as paid",
      });
    } catch (err) {
      next(err);
    }
  },

  // read tickets
  readTickets: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // filter
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
        } else if (req.query.sort === "desc") {
          sort.createdAt = -1;
        } else if (req.query.sort === "asc1") {
          sort.lastMessage = 1;
        } else {
          sort.lastMessage = -1;
        }
      }

      // get tickets
      const tickets = await Ticket.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("user", "-password");

      // get total tickets
      const total = await Ticket.countDocuments();

      // find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        tickets,
        total,
        totalPages,
        page,
      });
    } catch (error) {
      next(error);
    }
  },

  // update ticket status
  updateTicketStatus: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }
      const updated = await Ticket.updateOne(
        { _id: req.params.id },
        {
          $set: {
            status: req.body.status,
          },
        }
      );

      res.send({
        message: "Status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // reply to ticket
  replyTicket: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }
      const ticket = await Ticket.findById(req.body.ticketId).populate("user");

      ticket.messages.push({
        username: admin.username,
        message: req.body.message,
      });
      ticket.messages = JSON.parse(JSON.stringify(ticket.messages));
      ticket.status = "waiting for customer response";
      ticket.updatedAt = Date.now();
      ticket.lastMessage = Date.now();
      await ticket.save();

      res.send({
        message: "Ticket updated successfully",
        ticket,
      });
    } catch (error) {
      next(error);
    }
  },

  // read stats
  readDashboard: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // net revenue
      const orders = await Order.find();
      const netRevenue = orders.reduce((acc, order) => {
        return acc + order.price;
      }, 0);

      // total orders
      const totalOrders = orders.length;

      // total users
      const totalUsers = await User.countDocuments();

      res.send({
        netRevenue,
        totalOrders,
        totalUsers,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // read revenue chart
  readRevenueChart: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // get orders
      const orders = await Order.find();

      const span = req.query.span || "day";
      let data = [];
      let labels = [];

      if (span === "day") {
        const orders = await Order.find({
          // created at  between today and yesterday
          createdAt: {
            // use moment
            $gte: moment().subtract(1, "days").toDate(),
          },
        });

        for (let i = 0; i < 24; i++) {
          const hour = moment().subtract(i, "hours").format("HH");
          // get orders total price for each hour
          const total = orders.reduce((acc, order) => {
            if (moment(order.createdAt).format("HH") === hour) {
              return acc + order.price;
            } else {
              return acc;
            }
          }, 0);

          data.push(total);
          labels.push(hour);
        }
      }

      res.send({
        data,
        labels,
      });
    } catch (err) {
      next(err);
    }
  },

  // disable or enable user
  disableUser: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // disable user
      const user = await User.findById(req.params.id);
      if (!user) {
        throw createError.NotFound("User not found");
      }

      await User.updateOne(
        { _id: req.params.id },
        {
          $set: {
            status: !user.status,
          },
        }
      );

      res.send({
        message: "User updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // read api orders
  readApiOrders: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // pagination
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      // get orders
      const orders = await ShopifyOrder.find()
        .populate("user", "-password")
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

  // add custom pricing for user
  addCustomPricing: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        throw createError.NotFound("User not found");
      }

      const updated = await User.updateOne(
        { _id: req.params.id },
        {
          //  push
          $push: {
            customPricing: {
              labelType: req.body.labelType,
              price: req.body.price,
              fromWeight: req.body.fromWeight,
              toWeight: req.body.toWeight,
            },
          },
        }
      );

      res.send({
        message: "Pricing created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // read single user
  readSingleUser: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if user exists
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
        throw createError.NotFound("User not found");
      }

      res.send({
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete custom pricing
  deleteCustomPricing: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        throw createError.NotFound("User not found");
      }

      const existingPricing = user.customPricing;
      const updatedPricing = existingPricing.filter(
        (pricing, index) => index !== parseInt(req.body.index)
      );

      const updated = await User.updateOne(
        { _id: req.params.id },
        {
          $set: {
            customPricing: updatedPricing,
          },
        }
      );

      // pull out the pricing which matches the index from req.body

      res.send({
        message: "Pricing deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // enable or disable custom pricing
  enableDisableCustomPricing: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        throw createError.NotFound("User not found");
      }

      const updated = await User.updateOne(
        { _id: req.params.id },
        {
          $set: {
            customPricingEnabled: !user.customPricingEnabled,
          },
        }
      );

      res.send({
        message: "Pricing updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // custom labeltype pricing
  customLabelTypePricing: async (req, res, next) => {},

  // read all custom orders
  readAllCustomOrders: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // pagination
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      // get orders
      const orders = await CustomOrder.find()
        .populate("user", "-password")
        .populate("labelType")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      // get total orders
      const total = await CustomOrder.countDocuments();

      // find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        orders,
        total,
        totalPages,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // custom order fulfill
  customOrderFulfill: async (req, res, next) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).send({
            message: err,
          });
        }
        const id = req.payload.aud;

        // check if admin
        const admin = await Admin.findById(id);
        if (!admin) {
          throw createError.Unauthorized("Invalid access token");
        }

        const order = await CustomOrder.findById(req.params.id);
        if (!order) {
          throw createError.BadRequest("Order not found");
        }

        // update order
        order.status = "fulfilled";
        order.file = req.file.path;
        await order.save();

        res.send({
          message: "Order fulfilled successfully",
        });
      });
    } catch (error) {
      next(error);
    }
  },

  // enable or diable api_enabled for user
  enableDisableApi: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      // check if admin
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        throw createError.NotFound("User not found");
      }

      const newKey = generateApiKey();

      const updated = await User.updateOne(
        { _id: req.params.id },
        {
          $set: {
            api_enabled: !user.api_enabled,
            api_key: user.api_enabled ? null : newKey,
          },
        }
      );

      res.send({
        message: "API updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
