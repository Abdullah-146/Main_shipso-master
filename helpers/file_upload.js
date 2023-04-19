const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  fileFilter: (req, file, cb) => {
    // only upload pdf
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error("Only pdf files are allowed!"), false);
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

const storage3 = multer.diskStorage({
  destination: "uploads/",
  fileFilter: (req, file, cb) => {
    // upload only image
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
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

const upload2 = multer({ storage: storage3 }).single("image");
const upload = multer({ storage: storage }).single("pdf");
const uploadCSV = multer({ storage: storage2 }).single("csv");

module.exports = { upload, uploadCSV, upload2 };
