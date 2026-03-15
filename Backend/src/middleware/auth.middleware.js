const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - No token'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        

        req.userId = decoded.userId || decoded.id;

        const user = await userModel.findById(req.userId).select('-password');
        req.user = user;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized - Invalid token'
        });
    }
};

module.exports = { protect };