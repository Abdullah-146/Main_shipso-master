const User = require("../models/User.model");
const Admin = require("../models/Admin.model");
const bcrypt = require("bcryptjs");
const Ticket = require("../models/Ticket.model");
const Order = require("../models/Order.model");
const createError = require("http-errors");
const { signAccessToken } = require("../helpers/jwt_helper");
const axios = require("axios");
const { randomOTP, generateApiKey } = require("../helpers/random_helper");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});
const {
  Registerschema,
  Loginschema,
  changePasswordSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  verifyEmail,
} = require("../helpers/Auth_validation");

module.exports = {
  // POST /api/auth/signup
  register: async (req, res, next) => {
    try {
      const values = await Registerschema.validateAsync(req.body);
      const tokendata = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${values.captchaToken}`
      );

      if (!tokendata.data.success)
        return next(createError(400, "Invalid captcha token"));
      const doesExist = await User.findOne({ email: values.email });
      if (doesExist) {
        throw createError.Conflict(`${values.email} is already registered`);
      }

      const user = new User({
        username: values.username,
        email: values.email,
        password: values.password,
      });

      await user.save();

      const OTP = randomOTP(6);
      const OTP_expiry = new Date(Date.now() + 1000 * 60 * 60 * 24);
      const hasedOTP = await bcrypt.hash(OTP, 10);

      await User.findByIdAndUpdate(user._id, {
        OTP: hasedOTP,
        OTP_expiry,
      });

      const mailData = {
        from: "shipsao<noreply@shipsao.co>",
        to: user.email,
        subject: "Verify Email",
        text: "Your verify email otp is " + OTP,
      };
      await mg.messages
        .create("my.shipsao.co", mailData)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log(error);
        });

      res.send({
        message: "Account created successfully",
      });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const values = await Loginschema.validateAsync(req.body);

      const tokendata = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${values.captchaToken}`
      );

      if (!tokendata.data.success)
        return next(createError(400, "Invalid captcha token"));
      const user = await User.findOne({ email: values.email });
      if (!user) {
        throw createError.Unauthorized("Invalid email or password");
      }

      const isValidPassword = await bcrypt.compare(values.password, user.password);

      if (!isValidPassword) {
        throw createError.Unauthorized("Invalid email or password");
      }

      if (!user.status) {
        throw createError.Unauthorized("Your account is blocked");
      }

      if (!user.isVerified) {
        // create OTP
        const OTP = randomOTP(6);
        const OTP_expiry = new Date(Date.now() + 1000 * 60 * 60 * 24);
        const hasedOTP = await bcrypt.hash(OTP, 10);

        await User.findByIdAndUpdate(user._id, {
          OTP: hasedOTP,
          OTP_expiry,
        });

        const mailData = {
          from: "shipsao.co<noreply@shipsao.co>",
          to: user.email,
          subject: "Verify Email",
          text: "Your verify email otp is " + OTP,
        };
        await mg.messages
          .create("my.shipsao.co", mailData)
          .then((response) => {
            console.log(response);
          })
          .catch((error) => {
            console.log(error);
          });

        throw createError.Forbidden("Please verify your email first");
      }

      const accessToken = await signAccessToken(user.id);

      res.send({
        accessToken,
        message: "Login successful",
      });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // verify email
  verifyEmail: async (req, res, next) => {
    try {
      const values = await verifyEmail.validateAsync(req.body);
      const tokendata = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${values.captchaToken}`
      );

      if (!tokendata.data.success)
        return next(createError(400, "Invalid captcha token"));
      const user = await User.findOne({ email: values.email });
      if (!user) {
        throw createError.Unauthorized("Invalid email");
      }

      if (user.OTP_expiry < Date.now()) {
        throw createError.Unauthorized("OTP expired");
      }

      const isValidOTP = await bcrypt.compare(values.OTP, user.OTP);
      if (!isValidOTP) {
        throw createError.Unauthorized("Invalid OTP");
      }

      // update user
      await User.findByIdAndUpdate(user._id, {
        $set: {
          isVerified: true,
          OTP: "",
          OTP_expiry: null,
        },
      });

      const accessToken = await signAccessToken(user.id);

      res.send({
        accessToken,
        message: "Email verified successfully",
      });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // forgot password
  forgotPassword: async (req, res, next) => {
    try {
      const values = await forgetPasswordSchema.validateAsync(req.body);
      const tokendata = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${values.captchaToken}`
      );

      if (!tokendata.data.success)
        return next(createError(400, "Invalid captcha token"));
      const user = await User.findOne({ email: values.email });
      if (!user) {
        throw createError.Unauthorized("Invalid email");
      }
      const OTP = randomOTP(6);
      var hashOTP = await bcrypt.hash(OTP, 10);
      await User.updateOne(
        { email: values.email },
        {
          $set: {
            OTP: hashOTP,
            OTP_expiry: Date.now() + 1800000,
          },
        }
      );

      // send mail
      const mailData = {
        from: "shipsao.co<noreply@shipsao.co>",
        to: user.email,
        subject: "Reset password",
        text: "Your reset password otp is " + OTP,
      };
      await mg.messages
        .create("my.shipsao.co", mailData)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {});
      res.send({
        message: "Otp sent to your email",
      });
    } catch (error) {
      console.log(error);
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // reset password
  resetPassword: async (req, res, next) => {
    try {
      const values = await resetPasswordSchema.validateAsync(req.body);
      const tokendata = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${values.captchaToken}`
      );

      if (!tokendata.data.success)
        return next(createError(400, "Invalid captcha token"));
      const { email, OTP, newPassword } = values;
      const user = await User.findOne({ email });
      if (!user) {
        throw createError.Unauthorized("Invalid email");
      }

      if (user.OTP_expiry < Date.now()) {
        throw createError.Unauthorized("OTP expired");
      }

      const isValidOTP = await bcrypt.compare(OTP, user.OTP);
      if (!isValidOTP) {
        throw createError.Unauthorized("Invalid otp");
      }
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(user._id, {
        password: newPasswordHash,
        OTP: "",
        OTP_expiry: "",
      });

      res.send({ message: "Password changed successfully" });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // check access
  access: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const user = await User.findById(id);
      if (!user) {
        throw createError.Unauthorized("Invalid access token");
      }

      res.send({
        username: user.username,
        email: user.email,
        balance: user.balance,
        joined: user.createdAt,
        avatar: user.avatar,
        api_key: user.api_key,
        id: user._id,
      });
    } catch (error) {
      next(error);
    }
  },

  // create admin
  createAdmin: async (req, res, next) => {
    try {
      const admin = new Admin({
        username: req.body.username,
        password: req.body.password,
      });

      await admin.save();

      res.send({
        message: "Admin created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // admin-login
  adminLogin: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const admin = await Admin.findOne({ username });
      if (!admin) {
        throw createError.Unauthorized("Invalid username or password");
      }

      const isValidPassword = bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        throw createError.Unauthorized("Invalid username or password");
      }

      const accessToken = await signAccessToken(admin.id);

      res.send({
        message: "Login successful",
        accessToken,
      });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // admin-access
  adminAccess: async (req, res, next) => {
    try {
      const id = req.payload.aud;
      const admin = await Admin.findById(id);
      if (!admin) {
        throw createError.Unauthorized("Invalid access token");
      }
      res.send({ username: admin.username, role: admin.role });
    } catch (error) {
      next(error);
    }
  },

  // read dashboard stats
  readDashboardStats: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError.Unauthorized("Invalid access token");
      }

      const tickets = await Ticket.countDocuments({ user: user._id });
      const balance = user.balance;
      const orders = await Order.countDocuments({ user: user._id });

      res.send({
        tickets,
        balance,
        orders,
      });
    } catch (err) {
      next(err);
    }
  },

  // update password
  updatePassword: async (req, res, next) => {
    try {
      const values = await changePasswordSchema.validateAsync(req.body);

      const { oldPassword, newPassword } = values;
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError.Unauthorized("Invalid access token");
      }

      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        throw createError.Unauthorized("Invalid old password");
      }
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(user._id, {
        password: newPasswordHash,
      });

      res.send({ message: "Password updated successfully" });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // update email and username
  updateEmailAndUsername: async (req, res, next) => {
    try {
      const { email, username } = req.body;
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError.Unauthorized("Invalid access token");
      }

      // check if email or username already exists and doesnt match the current user
      const userExists = await User.findOne({
        $and: [
          {
            $or: [{ email }, { username }],
          },
          {
            _id: { $ne: user._id },
          },
        ],
      });

      if (userExists) {
        throw createError.Unauthorized("Email or username already exists");
      }

      await User.findByIdAndUpdate(user._id, {
        email,
        username,
      });

      res.send({ message: "Email and username updated successfully" });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  // update avatar
  updateAvatar: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud);
      if (!user) {
        throw createError.Unauthorized("Invalid access token");
      }

      const avatar = req.file.path.replace(/\\/g, "/");
      await User.findByIdAndUpdate(user._id, {
        avatar,
      });

      res.send({ message: "Avatar updated successfully" });
    } catch (err) {
      next(err);
    }
  },
};
