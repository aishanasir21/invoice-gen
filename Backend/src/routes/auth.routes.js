const express = require('express')
const authController = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const router = express.Router()

router.post('/register', authController.userRegisterController)
router.post('/login', authController.userLoginController)
router.get('/me', protect, authController.getCurrentUser)  

module.exports = router