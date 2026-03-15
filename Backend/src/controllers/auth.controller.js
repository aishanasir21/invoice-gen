const userModel = require('../models/user.model')
const jwt = require("jsonwebtoken")
const emailService = require("../services/email")

async function userRegisterController(req, res) {
    try {
        const { password, email, name } = req.body

        const isExist = await userModel.findOne({ email })
        if (isExist) {
            return res.status(422).json({
                success: false,
                message: "user already exists"
            })
        }
        
        const user = await userModel.create({ password, email, name })
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "3d"})
        
        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

async function userLoginController(req, res) {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email }).select("+password")

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email or password is INVALID"
            })
        }

        const isValidPassword = await user.comparePassword(password)

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Email or password is INVALID"
            })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "3d"})
        
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

async function getCurrentUser(req, res) {
    try {
        const user = await userModel.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { 
    userRegisterController, 
    userLoginController,
    getCurrentUser  
};