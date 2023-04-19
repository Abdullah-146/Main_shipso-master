const router = require("express").Router();
const { verifyAccessToken } = require("../helpers/jwt_helper");
const Controller = require("../controllers/App.Controller");

router.post("/create", verifyAccessToken, Controller.createApp);
router.get("/read", verifyAccessToken, Controller.getApps);
router.delete("/delete/:id", verifyAccessToken, Controller.deleteApp);

router.get("/read/orders/:id", verifyAccessToken, Controller.readOrders);
router.get(
  "/read/orders-fulfilled/:id",
  verifyAccessToken,
  Controller.readOrdersfulfilled
);

router.post("/mark", verifyAccessToken, Controller.fulfillOrder);
router.post("/totalPrice", verifyAccessToken, Controller.calculatePrice);

router.put("/override-weight", verifyAccessToken, Controller.overrideWeight);

module.exports = router;
