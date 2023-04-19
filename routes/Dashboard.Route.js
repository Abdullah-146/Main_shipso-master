const router = require("express").Router();
const Controller = require("../controllers/Dashboard.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.get("/read", verifyAccessToken, Controller.read);

router.get("/orders-stats", verifyAccessToken, Controller.readOrdersStats);
router.get("/revenue-stats", verifyAccessToken, Controller.readRevenueStats);
router.get("/users-stats", verifyAccessToken, Controller.readUsersStats);
router.get("/deposit-stats", verifyAccessToken, Controller.readInvoicesStats);

// type statistics
router.get("/type-stats", verifyAccessToken, Controller.readLabelTypesStats);

// bar chart
router.get(
  "/read-orders-chart",
  verifyAccessToken,
  Controller.readOrdersBarChartData
);

router.get(
  "/read-users-chart",
  verifyAccessToken,
  Controller.readUsersBarChartData
);

router.get(
  "/read-invoices-chart",
  verifyAccessToken,
  Controller.readInvoicesBarChartData
);

router.get(
  "/read-revenue-chart",
  verifyAccessToken,
  Controller.readRevenueData
);

// pie chart
router.get(
  "/read-labels-chart",
  verifyAccessToken,
  Controller.readHighestSoldLabelTypeData
);

router.get(
  "/read-payment-chart",
  verifyAccessToken,
  Controller.readHighestPaidPaymentGatewayData
);

module.exports = router;
