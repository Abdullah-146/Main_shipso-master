"use strict";
const axios = require("axios");
const Apps = require("../models/Apps.model");

const updateFulfillmentData = async (
  storeURL,
  accessToken,
  orderID,
  message,
  tracking_info
) => {
  await axios
    .get(
      `${storeURL}/admin/api/2022-10/orders/${orderID}/fulfillment_orders.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      }
    )
    .then(async (response) => {
      // console.log(response.data.fulfillment_orders[0].id);
      const fulfillmentOrderID = response.data.fulfillment_orders[0].id;
      const data = {
        fulfillment: {
          message: message,
          notify_customer: false,
          tracking_info: tracking_info,
          line_items_by_fulfillment_order: [
            {
              fulfillment_order_id: fulfillmentOrderID,
            },
          ],
        },
      };
      await axios
        .post(storeURL + "admin/api/2022-10/fulfillments.json", data, {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        })
        .then(async (response) => {
          console.log(response.data);

          return true;
        });
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

module.exports = {
  fetchOrders: async (domain, token) => {
    try {
      const response = await axios.get(
        domain + "admin/api/2022-10/orders.json",
        {
          headers: {
            "X-Shopify-Access-Token": token,
          },
        }
      );

      return response.data;
    } catch (err) {
      return false;
    }
  },

  /**
   * Read Product Controller
   */
  markOrder: async (storeURL, accessToken, tracking_info, orderID, message) => {
    try {
      return updateFulfillmentData(
        storeURL,
        accessToken,
        orderID,
        message,
        tracking_info
      );
    } catch (err) {
      console.log(err);
      return false;
    }
  },

  // update tracking
  updateTracking: async (req, res, next) => {},
};
