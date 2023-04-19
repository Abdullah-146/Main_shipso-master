const router = require("express").Router();
const Controller = require("../controllers/Ticket.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.post("/create", verifyAccessToken, Controller.create);
router.get("/read", verifyAccessToken, Controller.read);
router.put("/update", verifyAccessToken, Controller.update);
router.put("/message", verifyAccessToken, Controller.sendMessage);

module.exports = router;
