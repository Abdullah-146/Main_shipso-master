const Controller = require("../controllers/Address.Controller");
const router = require("express").Router();
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.post("/create", verifyAccessToken, Controller.create);
router.get("/readAll", verifyAccessToken, Controller.readAll);
router.put("/update/:id", verifyAccessToken, Controller.update);
router.delete("/delete/:id", verifyAccessToken, Controller.delete);

module.exports = router;
