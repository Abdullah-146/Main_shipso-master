const router = require("express").Router();
const { verifyAccessToken } = require("../helpers/jwt_helper");
const Controller = require("../controllers/Worker.Controller");

router.post("/create", verifyAccessToken, Controller.create);
router.get("/read", verifyAccessToken, Controller.read);
router.put("/update/:id", verifyAccessToken, Controller.update);
router.delete("/delete/:id", verifyAccessToken, Controller.delete);

module.exports = router;
