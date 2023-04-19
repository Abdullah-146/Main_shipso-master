const router = require("express").Router();
const Controller = require("../controllers/Faq.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.post("/create", verifyAccessToken, Controller.createFaq);
router.get("/read", verifyAccessToken, Controller.readFaq);
router.put("/update/:id", verifyAccessToken, Controller.updateFaq);
router.delete("/delete/:id", verifyAccessToken, Controller.deleteFaq);

module.exports = router;
