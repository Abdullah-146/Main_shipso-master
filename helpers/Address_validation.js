const USPS = require("usps-webtools-promise").default;
const usps = new USPS({
  server: process.env.USPS_BASE_URL + "/ShippingAPI.dll",
  userId: process.env.USPS_ID,
  ttl: 10000, //TTL in milliseconds for request
});

module.exports = {
  validateAddress: async (address) => {
    const result = await usps.verify({
      ...address,
    });

    if (result.error) {
      return result.error;
    } else {
      return result;
    }
  },
};
