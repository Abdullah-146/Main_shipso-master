const Faq = require("../models/Faq.model");
const User = require("../models/User.model");
const Admin = require("../models/Admin.model");
const createError = require("http-errors");
module.exports = {
  // create faq
  createFaq: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      const { question, answer } = req.body;

      const faq = new Faq({
        question,
        answer,
      });

      await faq.save();

      res.status(201).json({
        message: "Faq created successfully",
        data: faq,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  //   read faq
  readFaq: async (req, res, next) => {
    try {
      const faq = await Faq.find();
      res.status(200).json({
        message: "Faqs retrieved successfully",
        data: faq,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  //   update faq
  updateFaq: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      const { question, answer } = req.body;

      const faq = await Faq.findByIdAndUpdate(req.params.id, {
        question,
        answer,
      });

      res.status(200).json({
        message: "Faq updated successfully",
        data: faq,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  //   delete faq
  deleteFaq: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }

      const faq = await Faq.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Faq deleted successfully",
        data: faq,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
