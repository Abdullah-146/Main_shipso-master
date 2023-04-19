const express = require("express");
const coinbase = require("coinbase-commerce-node");
const createError = require("http-errors");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const { Telegraf } = require("telegraf");
var Client = coinbase.Client;
Client.init(process.env.COINBASE_API);
require("./helpers/init_mongodb");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cors());

app.get("/", async (req, res, next) => {
  res.send("Hello World");
});

// require("./controllers/Cron.Controller").generate();

app.use("/api", require("./routes/api.route"));
app.use("/api/v1/auth", require("./routes/Auth.Route"));
app.use("/api/v1/address", require("./routes/Address.Route"));
app.use("/api/v1/invoice", require("./routes/Invoice.Route"));
app.use("/api/v1/webhook", require("./routes/Webhook.Route"));
app.use("/api/v1/labeltype", require("./routes/LabelType.Route"));
app.use("/api/v1/order", require("./routes/Order.Route"));
app.use("/api/v1/ticket", require("./routes/Ticket.Route"));
app.use("/api/v1/admin", require("./routes/Admin.Route"));
app.use("/api/v1/faq", require("./routes/Faq.Route"));
app.use("/api/v1/custom-order", require("./routes/CustomOrder.Route"));
app.use("/api/v1/dashboard", require("./routes/Dashboard.Route"));
app.use("/api/v1/workers", require("./routes/Worker.Route"));
app.use("/api/v1/manual-payment", require("./routes/ManualPayment.Route"));
app.use("/api/v1/apps", require("./routes/App.Route"));
app.use("/api/v2/", require("./Customapi/Route"));

app.use((req, res, next) => {
  if (req.path.includes("uploads")) {
    return res.download("." + decodeURIComponent(req.path));
  }
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
