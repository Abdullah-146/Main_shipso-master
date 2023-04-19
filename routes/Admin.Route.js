const router = require("express").Router();
const Controller = require("../controllers/Admin.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

router.get("/users/read", verifyAccessToken, Controller.readUsers);
router.post("/users/add-balance/:id", verifyAccessToken, Controller.addBalance);
router.post("/users/create", verifyAccessToken, Controller.addUser);

router.get("/orders/read", verifyAccessToken, Controller.readOrders);
router.get("/api-orders/read", verifyAccessToken, Controller.readApiOrders);
router.get("/invoice/read", verifyAccessToken, Controller.readInvoices);

router.put("/invoice/markaspaid/:id", verifyAccessToken, Controller.markAsPaid);

router.get("/tickets/read", verifyAccessToken, Controller.readTickets);
router.put(
  "/tickets/update/:id",
  verifyAccessToken,
  Controller.updateTicketStatus
);
router.put("/ticket/updateMessage", verifyAccessToken, Controller.replyTicket);

router.get("/dashboard/readStats", verifyAccessToken, Controller.readDashboard);
router.get(
  "/dashboard/readrevenue",
  verifyAccessToken,
  Controller.readRevenueChart
);

router.put("/user/status/:id", verifyAccessToken, Controller.disableUser);
router.put(
  "/user/custom-pricing/:id",
  verifyAccessToken,
  Controller.addCustomPricing
);
router.get("/user/read/:id", verifyAccessToken, Controller.readSingleUser);
router.post(
  "/user/custom-pricing/delete/:id",
  verifyAccessToken,
  Controller.deleteCustomPricing
);
router.put(
  "/user/custom-pricing/enable/:id",
  verifyAccessToken,
  Controller.enableDisableCustomPricing
);

router.get(
  "/custom-order/read",
  verifyAccessToken,
  Controller.readAllCustomOrders
);

router.put(
  "/custom-order/fulfill/:id",
  verifyAccessToken,
  Controller.customOrderFulfill
);

router.put(
  "/user/api-enable/:id",
  verifyAccessToken,
  Controller.enableDisableApi
);

module.exports = router;
