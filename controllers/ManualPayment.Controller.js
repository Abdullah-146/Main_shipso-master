const ManualPayment = require("../models/ManualPayment.model");
const Admin = require("../models/Admin.model");
const createError = require("http-errors");
const { upload2 } = require("../helpers/file_upload");

module.exports = {
  // create
  create: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        return next(createError.Unauthorized());
      }

      upload2(req, res, async (err) => {
        if (err) {
          return next(createError.BadRequest(err.message));
        }

        const { name, description } = req.body;
        console.log(req.file);

        const image = req.file.path;
        const manualPayment = new ManualPayment({
          name,
          image,
          description,
        });
        await manualPayment.save();
        res
          .status(201)
          .json({ message: "Manual payment method created successfully" });
      });
    } catch (err) {
      next(err);
    }
  },

  // get all
  getAll: async (req, res, next) => {
    try {
      const manualPayments = await ManualPayment.find();
      res.status(200).json(manualPayments);
    } catch (err) {
      next(err);
    }
  },

  //   delete
  delete: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        return next(createError.Unauthorized());
      }
      const { id } = req.params;
      const manualPayment = await ManualPayment.findById(id);
      if (!manualPayment) {
        return next(createError.NotFound("Manual payment method not found"));
      }
      await manualPayment.remove();
      res
        .status(200)
        .json({ message: "Manual payment method deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
};
