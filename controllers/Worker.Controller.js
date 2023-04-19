const Admin = require("../models/Admin.model");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");

module.exports = {
  // create a new worker
  create: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      //   check if the username already exists
      const admin = await Admin.findOne({ username });
      if (admin) {
        throw createError(400, "Username already exists");
      }

      //   hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      //   create a new worker
      const newAdmin = new Admin({
        username,
        password: hashedPassword,
        role: "worker",
      });

      //   save the new worker
      const savedAdmin = await newAdmin.save();

      //   send the response
      res.status(201).json({
        message: "Worker created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  //   read all workers
  read: async (req, res, next) => {
    try {
      const admins = await Admin.find({ role: "worker" });
      res.json({
        message: "Workers fetched successfully",
        admins,
      });
    } catch (error) {
      next(error);
    }
  },

  //  update a worker
  update: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const { id } = req.params;

      //   check if the worker exists
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError(404, "Worker not found");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      //   update the worker
      const updatedAdmin = await Admin.findByIdAndUpdate(
        id,
        {
          username,
          password: hashedPassword,
        },
        { new: true }
      );

      //   send the response
      res.json({
        message: "Worker updated successfully",
        updatedAdmin,
      });
    } catch (error) {
      next(error);
    }
  },

  //  delete a worker
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      //   check if the worker exists
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError(404, "Worker not found");
      }

      //   delete the worker
      await Admin.findByIdAndDelete(id);

      //   send the response
      res.json({
        message: "Worker deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
