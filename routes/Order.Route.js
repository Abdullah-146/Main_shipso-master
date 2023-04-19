const router = require("express").Router();
const Controller = require("../controllers/Order.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const multer = require("multer");
const storage2 = multer.diskStorage({
  destination: "uploads/",
  fileFilter: (req, file, cb) => {
    // only upload pdf
    if (!file.originalname.match(/\.(csv)$/)) {
      return cb(new Error("Only csv files are allowed!"), false);
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

router.post("/create", verifyAccessToken, Controller.create);
router.get("/read", verifyAccessToken, Controller.readAll);
router.get("/download/:id", verifyAccessToken, Controller.downloadLabel);
router.post("/price", verifyAccessToken, Controller.readPrice);
router.get("/read-api-orders", verifyAccessToken, Controller.readApiOrders);

// csv
router.post(
  "/validatecsv",
  verifyAccessToken,
  multer({ storage: storage2 }).single("csv"),
  Controller.validateCSV
);
router.post(
  "/createOrderFromCSV",
  verifyAccessToken,
  multer({ storage: storage2 }).single("csv"),
  Controller.createCSVOrder
);

router.post("/bulk-download", verifyAccessToken, Controller.downloadLabelbulk);

router.get("/downloadApi/:id", verifyAccessToken, Controller.downloadApiPdf);

module.exports = router;
