const router = require("express").Router();
const Controller = require("../controllers/LabelType.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.post("/create", verifyAccessToken, Controller.createLabelType);
router.get("/read", verifyAccessToken, Controller.getAllLabelTypes);
router.get("/read/:id", verifyAccessToken, Controller.getLabelType);
router.post("/update/:id", verifyAccessToken, Controller.updateLabelType);

// add weight
router.post(
  "/addWeight/:id",
  verifyAccessToken,
  Controller.addWeightToLabelType
);

router.post(
  "/deleteWeight/:id",
  verifyAccessToken,
  Controller.deleteWeightFromLabelType
);

router.put(
  "/enableDisableLabelType/:id",
  verifyAccessToken,
  Controller.enableDisableLabelType
);

router.get(
  "/readCustomLabels",
  verifyAccessToken,
  Controller.getAllCustomLabelTypes
);

router.post(
  "/createCustomLabel",
  verifyAccessToken,
  Controller.addCustomLabelType
);

router.post(
  "/addPricings/:id",
  verifyAccessToken,
  Controller.addPricingToCustomLabelType
);

router.get(
  "/readCustomLabelType/:id",
  verifyAccessToken,
  Controller.getCustomLabelType
);

router.put(
  "/enableDisableCustomLabelType/:id",
  verifyAccessToken,
  Controller.enableDisableCustomLabelType
);

router.post(
  "/deleteCustomLabelWeight/:id",
  verifyAccessToken,
  Controller.deleteWeightFromCustomLabelType
);

module.exports = router;
