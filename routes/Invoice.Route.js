const router = require("express").Router();
const { verifyAccessToken } = require("../helpers/jwt_helper");
const Controller = require("../controllers/Invoice.Controller");

router.post("/create", verifyAccessToken, Controller.createInvoice);
router.get("/read", verifyAccessToken, Controller.getAllInvoices);
router.put("/comment", verifyAccessToken, Controller.addComment);

module.exports = router;
