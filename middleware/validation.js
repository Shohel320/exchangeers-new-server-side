// middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');

const signupValidators = [
  body('username').isString().isLength({ min: 3 }).trim().withMessage('Username must be at least 3 chars'),
  body('email').isEmail().withMessage('Invalid email'),
  body('phone').isString().isLength({ min: 7 }).withMessage('Invalid phone'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  body('confirmPassword').exists().withMessage('confirmPassword is required'),
  body('country').optional().isString().trim()
];

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // send first error or all
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = { signupValidators, runValidation };
