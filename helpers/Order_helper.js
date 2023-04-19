const User = require("../models/User.model");
const LabelType = require("../models/LabelType.model");
const createError = require("http-errors");

module.exports = {
  calculatePrice: async (weight, type, user) => {
    try {
      // find user
      const userData = await User.findOne({ _id: user });

      const customPricings = userData.customPricing;

      const labelType = await LabelType.findOne({ _id: type });

      if (!labelType) {
        throw createError.BadRequest("Invalid label type");
      }
      if (weight <= 0) {
        throw createError(400, "Weight must be greater than 0");
      }

      if (userData.customPricingEnabled) {
        // find custom pricing for label type
        const customPricing = customPricings.find(
          (pricing) =>
            pricing.labelType.toString() === labelType.name.toString() &&
            parseInt(pricing.fromWeight) <= weight &&
            parseInt(pricing.toWeight) >= weight
        );

        if (customPricing) {
          return customPricing.price;
        }
      }

      // check price range for weight
      const price = labelType.prices.find(
        (price) => price.fromWeight <= weight && price.toWeight >= weight
      );
      if (!price) {
        throw createError(400, "Price not found");
      }

      return price.price;
    } catch (err) {
      console.log(err);
      return err;
    }
  },
};
