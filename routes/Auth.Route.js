const router = require("express").Router();
const Controller = require("../controllers/Auth.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "uploads/",
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(null, true);
  },
  // filename
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}.${ext[ext.length - 1]}`);
  },
});

router.post("/register", Controller.register);
router.post("/login", Controller.login);
router.post("/forgotPassword", Controller.forgotPassword);
router.post("/resetPassword", Controller.resetPassword);
router.post("/verifyEmail", Controller.verifyEmail);
router.get("/access", verifyAccessToken, Controller.access);
router.post("/admin-login", Controller.adminLogin);
router.get("/admin-access", verifyAccessToken, Controller.adminAccess);
router.post("/create-admin", Controller.createAdmin);
router.put("/update-password", verifyAccessToken, Controller.updatePassword);
router.put(
  "/updateProfile",
  verifyAccessToken,
  Controller.updateEmailAndUsername
);

router.get("/readStats", verifyAccessToken, Controller.readDashboardStats);
router.put(
  "/upload-avatar",
  verifyAccessToken,
  multer({ storage: storage }).single("avatar"),
  Controller.updateAvatar
);

module.exports = router;
