const router = require("express").Router();
const Controller = require("../controllers/Webhook.Controller");

router.post("/coinbase", Controller.coinbase);
router.post("/order/:id", Controller.order);

module.exports = router;
