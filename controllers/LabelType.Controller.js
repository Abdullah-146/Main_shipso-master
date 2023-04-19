const User = require("../models/User.model");
const Admin = require("../models/Admin.model");
const LabelType = require("../models/LabelType.model");
const createError = require("http-errors");
const CustomLabelType = require("../models/CustomLabelType.model");

module.exports = {
  // create a type
  createLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const { name, uid, maxWeight, type } = req.body;

      const labelType = await LabelType.create({
        name,
        uid,
        maxWeight,
        type,
      });

      res.send({
        message: "Label type created successfully",
        labelType,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  //   read all types
  getAllLabelTypes: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      const admin = await Admin.findById(req.payload.aud);
      var labelTypes;
      if (user) {
        labelTypes = await LabelType.find({ status: true });
      } else if (admin) {
        labelTypes = await LabelType.find({});
      } else {
        throw createError(401, "Unauthorized");
      }

      res.send({
        message: "Label types fetched successfully",
        labelTypes,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  //   update a type
  updateLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const { name, uid, maxWeight, type } = req.body;

      const labelType = await LabelType.updateOne(
        { _id: req.params.id },
        {
          $set: {
            name,
            uid,
            maxWeight,
            type,
          },
        }
      );
      res.send({
        message: "Label type updated successfully",
        labelType,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // get a single type
  getLabelType: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      const admin = await Admin.findById(req.payload.aud);
      if (!user && !admin) {
        throw createError(401, "Unauthorized");
      }
      const labelType = await LabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      res.send({
        message: "Label type fetched successfully",
        labelType,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // add a weight to a type
  addWeightToLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const labelType = await LabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      const { fromWeight, toWeight, price } = req.body;
      console.log(fromWeight, toWeight);

      if (parseInt(fromWeight) > parseInt(toWeight)) {
        throw createError(400, "From weight cannot be greater than to weight");
      }

      // if these weights lie between existing weights, throw error
      if (labelType.prices.length > 0) {
        for (let i = 0; i < labelType.prices.length; i++) {
          if (
            parseInt(fromWeight) >= parseInt(labelType.prices[i].fromWeight) &&
            parseInt(fromWeight) <= parseInt(labelType.prices[i].toWeight)
          ) {
            throw createError(
              400,
              "From weight already lie between existing weights"
            );
          }
          if (
            parseInt(toWeight) >= parseInt(labelType.prices[i].fromWeight) &&
            parseInt(toWeight) <= parseInt(labelType.prices[i].toWeight)
          ) {
            throw createError(
              400,
              "To weight already lie between existing weights"
            );
          }
        }
      }

      labelType.prices.push({
        fromWeight,
        toWeight,
        price,
      });

      await labelType.save();

      res.send({
        message: "Label type updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // delete a weight from a type
  deleteWeightFromLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const labelType = await LabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      const { fromWeight, toWeight } = req.body;

      // check if weight range exists
      const weightRange = labelType.prices.find(
        (weightRange) =>
          weightRange.fromWeight === fromWeight &&
          weightRange.toWeight === toWeight
      );

      if (!weightRange) {
        throw createError(404, "Weight range not found");
      }

      labelType.prices.pull(weightRange);

      await labelType.save();

      res.send({
        message: "Label type updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // enable and disable a type
  enableDisableLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const labelType = await LabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      labelType.status = !labelType.status;

      await labelType.save();

      res.send({
        message: "Label type updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // get all custom labeltypes
  getAllCustomLabelTypes: async (req, res, next) => {
    try {
      const labeltypes = await CustomLabelType.find({});

      res.send({
        message: "Label types fetched successfully",
        labeltypes,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // add custom labeltype
  addCustomLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const { name } = req.body;

      const labelType = new CustomLabelType({
        name,
      });

      await labelType.save();

      res.send({
        message: "Label type added successfully",
        labelType,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // add pricings to custom labeltype
  addPricingToCustomLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const labelType = await CustomLabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      const { fromWeight, toWeight, price } = req.body;

      if (parseInt(fromWeight) > parseInt(toWeight)) {
        throw createError(400, "From weight cannot be greater than to weight");
      }

      // if these weights lie between existing weights, throw error
      if (labelType.prices.length > 0) {
        for (let i = 0; i < labelType.prices.length; i++) {
          if (
            parseInt(fromWeight) >= parseInt(labelType.prices[i].fromWeight) &&
            parseInt(fromWeight) <= parseInt(labelType.prices[i].toWeight)
          ) {
            throw createError(
              400,
              "From weight already lie between existing weights"
            );
          }
          if (
            parseInt(toWeight) >= parseInt(labelType.prices[i].fromWeight) &&
            parseInt(toWeight) <= parseInt(labelType.prices[i].toWeight)
          ) {
            throw createError(
              400,
              "To weight already lie between existing weights"
            );
          }
        }
      }

      labelType.prices.push({
        fromWeight,
        toWeight,
        price,
      });

      await labelType.save();

      res.send({
        message: "Label type updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // get a custom labeltype
  getCustomLabelType: async (req, res, next) => {
    try {
      const labelType = await CustomLabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      res.send({
        message: "Label type fetched successfully",
        labelType,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // enable and disable a custom labeltype
  enableDisableCustomLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const labelType = await CustomLabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      labelType.status = !labelType.status;

      await labelType.save();

      res.send({
        message: "Label type updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // delete a custom labeltype
  deleteWeightFromCustomLabelType: async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.payload.aud);
      if (!admin) {
        throw createError(401, "Unauthorized");
      }

      const labelType = await CustomLabelType.findById(req.params.id);

      if (!labelType) {
        throw createError(404, "Label type not found");
      }

      const { fromWeight, toWeight } = req.body;

      // check if weight range exists
      const weightRange = labelType.prices.find(
        (weightRange) =>
          weightRange.fromWeight === fromWeight &&
          weightRange.toWeight === toWeight
      );

      if (!weightRange) {
        throw createError(404, "Weight range not found");
      }

      labelType.prices.pull(weightRange);

      await labelType.save();

      res.send({
        message: "Label type updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
