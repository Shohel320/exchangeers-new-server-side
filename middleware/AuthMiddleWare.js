const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token.split(" ")[1], 'jwtsecret', (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();
    });
  };
};
