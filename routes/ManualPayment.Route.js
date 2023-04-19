const router = require("express").Router();
const Controller = require("../controllers/ManualPayment.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.post("/create", verifyAccessToken, Controller.create);
router.get("/read", verifyAccessToken, Controller.getAll);
router.delete("/delete/:id", verifyAccessToken, Controller.delete);

module.exports = router;
