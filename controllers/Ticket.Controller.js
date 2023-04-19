const Ticket = require("../models/Ticket.model");
const createError = require("http-errors");
const User = require("../models/User.model");

module.exports = {
  // create a new ticket
  create: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const user = await User.findById(id);

      const { message, order, subject } = req.body;

      const ticket = new Ticket({
        messages: [{ username: user.username, message }],
        user: id,
        subject,
        order_uuid: order,
        status: "open",
      });
      await ticket.save();

      return res.send({
        message: "Ticket created successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // get all tickets
  read: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const user = await User.findById(id);
      if (!user) {
        return next(createError(404, "User not found"));
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
          sort.lastMessage = 1;
        } else {
          sort.lastMessage = -1;
        }
      }

      //   find tickets
      const tickets = await Ticket.find({ user: id, ...filter })
        .skip(skip)
        .limit(limit)
        .sort(sort);

      // find total tickets
      const total = await Ticket.countDocuments({ user: id });

      // find total pages
      const totalPages = Math.ceil(total / limit);

      res.send({
        tickets,
        total,
        totalPages,
        page,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // send message to ticket
  sendMessage: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const user = await User.findById(id);

      const { message, ticketId } = req.body;

      const ticket = await Ticket.findById(ticketId);

      ticket.messages.push({ username: user.name, message });
      ticket.messages = JSON.parse(JSON.stringify(ticket.messages));
      ticket.status = "open";
      ticket.updatedAt = Date.now();
      ticket.lastMessage = Date.now();
      await ticket.save();

      res.send({
        message: "Message sent successfully",
        ticket,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // update status of ticket
  update: async (req, res, next) => {
    try {
      const id = req.payload.aud;

      const { ticketId, status } = req.body;

      const ticket = await Ticket.findOne({ _id: ticketId, user: id });

      if (!ticket) {
        throw createError(404, "Ticket not found");
      }

      await Ticket.updateOne({ _id: ticketId, user: id }, { status });

      res.send({
        message: "Ticket updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
