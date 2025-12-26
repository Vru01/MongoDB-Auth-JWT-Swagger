const Joi = require('joi');

const signupSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.validateSignup = (req, res, next) => {
    const { error } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });
    next();
};

exports.validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });
    next();
};