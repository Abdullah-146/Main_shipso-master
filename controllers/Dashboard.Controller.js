const Order = require("../models/Order.model");
const User = require("../models/User.model");
const Invoice = require("../models/Invoice.model");
const LabelType = require("../models/LabelType.model");
const Admin = require("../models/Admin.model");
const createError = require("http-errors");
const moment = require("moment");

module.exports = {
  read: async (req, res, next) => {
    try {
      // get recent 5 orders
      const orders = await Order.find({ user: req.payload.aud })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("labelType");

      // get recent 5 deposits
      const deposits = await Invoice.find({ user: req.payload.aud })
        .sort({
          createdAt: -1,
        })
        .limit(5);

      // res
      res.status(200).json({
        orders,
        deposits,
      });
    } catch (err) {
      next(err);
    }
  },
  // read all orders and filter them by today, this week, this month, all time
  readOrdersStats: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      const today = new Date();
      const thisWeek = new Date();
      const thisMonth = new Date();

      today.setHours(0, 0, 0, 0);
      thisWeek.setDate(thisWeek.getDate() - 7);
      thisMonth.setDate(thisMonth.getDate() - 30);

      const todayOrders = await Order.find({
        createdAt: { $gte: today },
      });
      const thisWeekOrders = await Order.find({
        createdAt: { $gte: thisWeek },
      });
      const thisMonthOrders = await Order.find({
        createdAt: { $gte: thisMonth },
      });
      const allTimeOrders = await Order.find();

      const todayOrdersCount = todayOrders.length;
      const thisWeekOrdersCount = thisWeekOrders.length;
      const thisMonthOrdersCount = thisMonthOrders.length;
      const allTimeOrdersCount = allTimeOrders.length;

      res.status(200).json({
        todayOrdersCount,
        thisWeekOrdersCount,
        thisMonthOrdersCount,
        allTimeOrdersCount,
      });
    } catch (err) {
      next(err);
    }
  },

  //   read all revneue and filter them by today, this week, this month, all time
  readRevenueStats: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      const today = new Date();
      const thisWeek = new Date();
      const thisMonth = new Date();

      today.setHours(0, 0, 0, 0);
      thisWeek.setDate(thisWeek.getDate() - 7);
      thisMonth.setDate(thisMonth.getDate() - 30);

      const todayOrders = await Order.find({
        createdAt: { $gte: today },
      });
      const thisWeekOrders = await Order.find({
        createdAt: { $gte: thisWeek },
      });
      const thisMonthOrders = await Order.find({
        createdAt: { $gte: thisMonth },
      });
      const allTimeOrders = await Order.find();

      const todayRevenue = todayOrders.reduce((acc, order) => {
        return acc + order.price;
      }, 0);

      const thisWeekRevenue = thisWeekOrders.reduce((acc, order) => {
        return acc + order.price;
      }, 0);

      const thisMonthRevenue = thisMonthOrders.reduce((acc, order) => {
        return acc + order.price;
      }, 0);

      const allTimeRevenue = allTimeOrders.reduce((acc, order) => {
        return acc + order.price;
      }, 0);

      res.status(200).json({
        todayRevenue,
        thisWeekRevenue,
        thisMonthRevenue,
        allTimeRevenue,
      });
    } catch (err) {
      next(err);
    }
  },

  //   read all users and filter them by today, this week, this month, all time
  readUsersStats: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      const today = new Date();
      const thisWeek = new Date();
      const thisMonth = new Date();

      today.setHours(0, 0, 0, 0);
      thisWeek.setDate(thisWeek.getDate() - 7);
      thisMonth.setDate(thisMonth.getDate() - 30);

      const todayUsers = await User.find({
        createdAt: { $gte: today },
      });
      const thisWeekUsers = await User.find({
        createdAt: { $gte: thisWeek },
      });
      const thisMonthUsers = await User.find({
        createdAt: { $gte: thisMonth },
      });

      const allTimeUsers = await User.find();

      const todayUsersCount = todayUsers.length;
      const thisWeekUsersCount = thisWeekUsers.length;
      const thisMonthUsersCount = thisMonthUsers.length;
      const allTimeUsersCount = allTimeUsers.length;

      res.status(200).json({
        todayUsersCount,
        thisWeekUsersCount,
        thisMonthUsersCount,
        allTimeUsersCount,
      });
    } catch (err) {
      next(err);
    }
  },

  //   read invoices and filter them by today, this week, this month, all time
  readInvoicesStats: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      const today = new Date();
      const thisWeek = new Date();
      const thisMonth = new Date();

      today.setHours(0, 0, 0, 0);
      thisWeek.setDate(thisWeek.getDate() - 7);
      thisMonth.setDate(thisMonth.getDate() - 30);

      const todayInvoices = await Invoice.find({
        createdAt: { $gte: today },
        status: "paid",
      });

      const thisWeekInvoices = await Invoice.find({
        createdAt: { $gte: thisWeek },
        status: "paid",
      });

      const thisMonthInvoices = await Invoice.find({
        createdAt: { $gte: thisMonth },
        status: "paid",
      });

      const allTimeInvoices = await Invoice.find({
        status: "paid",
      });

      const todayInvoicesAmount = todayInvoices.reduce((acc, invoice) => {
        return acc + invoice.amount;
      }, 0);

      const thisWeekInvoicesAmount = thisWeekInvoices.reduce((acc, invoice) => {
        return acc + invoice.amount;
      }, 0);

      const thisMonthInvoicesAmount = thisMonthInvoices.reduce(
        (acc, invoice) => {
          return acc + invoice.amount;
        },
        0
      );

      const allTimeInvoicesAmount = allTimeInvoices.reduce((acc, invoice) => {
        return acc + invoice.amount;
      }, 0);

      res.status(200).json({
        todayInvoicesAmount,
        thisWeekInvoicesAmount,
        thisMonthInvoicesAmount,
        allTimeInvoicesAmount,
      });
    } catch (err) {
      next(err);
    }
  },

  //   read all labeltypes and orders created by them and filter them by today, this week, this month, all time
  readLabelTypesStats: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      const today = new Date();
      const thisWeek = new Date();
      const thisMonth = new Date();

      today.setHours(0, 0, 0, 0);
      thisWeek.setDate(thisWeek.getDate() - 7);
      thisMonth.setDate(thisMonth.getDate() - 30);

      const labeltypes = await LabelType.find();

      const labelTypesData = await Promise.all(
        labeltypes.map(async (labeltype) => {
          const todayOrders = await Order.find({
            labelType: labeltype._id,
            createdAt: { $gte: today },
          });

          const thisWeekOrders = await Order.find({
            labelType: labeltype._id,
            createdAt: { $gte: thisWeek },
          });

          const thisMonthOrders = await Order.find({
            labelType: labeltype._id,
            createdAt: { $gte: thisMonth },
          });

          const allTimeOrders = await Order.find({
            labelType: labeltype._id,
          });

          const todayOrdersCount = todayOrders.length;
          const thisWeekOrdersCount = thisWeekOrders.length;
          const thisMonthOrdersCount = thisMonthOrders.length;
          const allTimeOrdersCount = allTimeOrders.length;

          return {
            labeltype,
            todayOrdersCount,
            thisWeekOrdersCount,
            thisMonthOrdersCount,
            allTimeOrdersCount,
          };
        })
      );

      res.status(200).json({
        labelTypesData,
      });
    } catch (err) {
      next(err);
    }
  },

  // read bar chart data for orders
  readOrdersBarChartData: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      // read orders created in last 7 days

      const orders = await Order.find({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      });

      // create an array of dates for last 7 days

      const dates = [];
      for (let i = 6; i >= 0; i--) {
        dates.push(moment(new Date()).subtract(i, "days").format("DD MMM"));
      }

      // create an array of orders count for last 7 days

      const ordersCount = [];
      for (let i = 0; i < dates.length; i++) {
        ordersCount.push(
          orders.filter((order) => {
            return moment(order.createdAt).format("DD MMM") === dates[i];
          }).length
        );
      }

      res.status(200).json({
        labels: dates,
        data: ordersCount,
      });
    } catch (err) {
      next(err);
    }
  },

  // read bar chart data for users
  readUsersBarChartData: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      // read users created in last 7 days

      const users = await User.find({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      });

      // create an array of dates for last 7 days

      const dates = [];
      for (let i = 6; i >= 0; i--) {
        dates.push(moment(new Date()).subtract(i, "days").format("DD MMM"));
      }

      // create an array of users count for last 7 days

      const usersCount = [];

      for (let i = 0; i < dates.length; i++) {
        usersCount.push(
          users.filter((user) => {
            return moment(user.createdAt).format("DD MMM") === dates[i];
          }).length
        );
      }

      res.status(200).json({
        labels: dates,
        data: usersCount,
      });
    } catch (err) {
      next(err);
    }
  },

  // read bar chart data for invoices
  readInvoicesBarChartData: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      // read invoices created in last 7 days

      const invoices = await Invoice.find({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
        status: "paid",
      });

      // create an array of dates for last 7 days

      const dates = [];
      for (let i = 6; i >= 0; i--) {
        dates.push(moment(new Date()).subtract(i, "days").format("DD MMM"));
      }

      // create an array of invoices count for last 7 days

      const invoicesCount = [];

      for (let i = 0; i < dates.length; i++) {
        invoicesCount.push(
          invoices.filter((invoice) => {
            return moment(invoice.createdAt).format("DD MMM") === dates[i];
          }).length
        );
      }

      res.status(200).json({
        labels: dates,
        data: invoicesCount,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // read revenue data for last 7 days
  readRevenueData: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      // read orders created in last 7 days

      const orders = await Order.find({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      });

      // create an array of dates for last 7 days

      const dates = [];
      for (let i = 6; i >= 0; i--) {
        dates.push(moment(new Date()).subtract(i, "days").format("DD MMM"));
      }

      // create an array of revenue for last 7 days

      const revenue = [];
      for (let i = 0; i < dates.length; i++) {
        revenue.push(
          orders
            .filter((order) => {
              return moment(order.createdAt).format("DD MMM") === dates[i];
            })
            .reduce((acc, order) => {
              return acc + order.price;
            }, 0)
        );
      }

      res.status(200).json({
        labels: dates,
        data: revenue,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all orders accoring to label type
  readHighestSoldLabelTypeData: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      // read all orders

      const orders = await Order.find();

      // create an array of label types

      const labelTypes = await LabelType.find();

      // create an array of label types data

      const labelTypesData = labelTypes.map((labelType) => {
        return {
          labelType: labelType.name,
          count: orders.filter((order) => {
            return order.labelType.toString() === labelType._id.toString();
          }).length,
        };
      });

      // sort label types data according to count

      labelTypesData.sort((a, b) => {
        return b.count - a.count;
      });
      res.status(200).json({
        labelTypesData,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all paymentGateways accoring to invoices
  readHighestPaidPaymentGatewayData: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        next(createError(404, "Admin not found"));
      }

      // read all invoices

      const invoices = await Invoice.find();

      // create an array of payment gateways

      const paymentGateways = ["coinbase", "manual"];

      // create an array of payment gateways data

      const paymentGatewaysData = paymentGateways.map((paymentGateway) => {
        return {
          paymentGateway,
          count: invoices.filter((invoice) => {
            return invoice.payment_method === paymentGateway;
          }).length,
        };
      });

      // sort payment gateways data according to count

      paymentGatewaysData.sort((a, b) => {
        return b.count - a.count;
      });

      res.status(200).json({
        paymentGatewaysData,
      });
    } catch (err) {
      next(err);
    }
  },
};
