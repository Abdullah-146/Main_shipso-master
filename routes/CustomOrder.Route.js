const router = require("express").Router();
const CustomOrderController = require("../controllers/CustomOrder.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.post(
  "/create-order",
  verifyAccessToken,
  CustomOrderController.createOrder
);

router.get("/get-orders", verifyAccessToken, CustomOrderController.readOrders);

module.exports = router;
