const Joi = require("joi");

const Registerschema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(8).max(30).required(),
  email: Joi.string().email({
    minDomainSegments: 2,
  }),
  captchaToken: Joi.string().required(),
});

const Loginschema = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
  }),
  password: Joi.string().min(8).max(30).required(),
  captchaToken: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(8).max(30).required(),
  newPassword: Joi.string().min(8).max(30).required(),
});

const forgetPasswordSchema = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
  }),
  captchaToken: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
  }),
  newPassword: Joi.string().min(8).max(30).required(),
  OTP: Joi.string().required().min(6).max(6),
  captchaToken: Joi.string().required(),
});

const verifyEmail = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
  }),
  OTP: Joi.string().required().min(6).max(6),
  captchaToken: Joi.string().required(),
});

module.exports = {
  Registerschema,
  Loginschema,
  changePasswordSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  verifyEmail,
};
