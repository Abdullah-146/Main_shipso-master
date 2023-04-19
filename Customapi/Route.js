const router = require("express").Router();
const Controller = require("./Controller");
const { verifyApiKey } = require("../helpers/jwt_helper");

router.post("/order/create", verifyApiKey, Controller.createOrder);
router.get("/order/read/:id", verifyApiKey, Controller.readOrder);
router.get("/order/cancel/:id", verifyApiKey, Controller.cancelOrder);
router.get("/order/duplicate/:id", verifyApiKey, Controller.duplicateOrder);
router.get("/order/pdf/:id", verifyApiKey, Controller.downloadPdf);
router.get("/labels/read", verifyApiKey, Controller.readLabelTypes);
router.post("/order/ups/create", verifyApiKey, Controller.createUpsLabel);

module.exports = router;
