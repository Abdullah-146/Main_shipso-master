const User = require("../models/User.model");
const Address = require("../models/Address.model");
const createError = require("http-errors");
const { AddressSchema } = require("../helpers/Address_validation");
module.exports = {
  // create
  create: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);

      const address = new Address({
        ...req.body,
        user: user._id,
      });

      await address.save();

      res.status(201).json({
        message: "Address created successfully",
        address,
      });
    } catch (error) {
      next(error);
    }
  },

  //   read all
  readAll: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      const addresses = await Address.find({ user: user._id });
      res.status(200).json({
        message: "Addresses fetched successfully",
        addresses,
      });
    } catch (error) {
      next(error);
    }
  },

  // update address
  update: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      const address = await Address.findById(req.params.id);
      if (address.user.toString() !== user._id.toString()) {
        throw createError(403, "Unauthorized");
      }

      await Address.findByIdAndUpdate(req.params.id, {
        ...req.body,
        user: user._id,
      });
      res.status(200).json({
        message: "Address updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // delete address
  delete: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      const address = await Address.findById(req.params.id);
      if (address.user.toString() !== user._id.toString()) {
        throw createError.Unauthorized("Unauthorized");
      }
      await Address.findByIdAndDelete(req.params.id);
      res.status(200).json({
        message: "Address deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
