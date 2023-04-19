const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const User = require("../models/User.model");

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "12h",
        issuer: "app.happyship.io",
        audience: userId,
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
          return;
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },

  // verify api key
  verifyApiKey: (req, res, next) => {
    if (!req.headers["x-api-key"]) return next(createError.Unauthorized());
    const apiKey = req.headers["x-api-key"];

    // find user by api key
    User.findOne({ api_key: apiKey }, (err, user) => {
      if (err) return next(createError.Unauthorized());
      if (!user) return next(createError.Unauthorized());
      req.user = user;
      next();
    });
  },
};
