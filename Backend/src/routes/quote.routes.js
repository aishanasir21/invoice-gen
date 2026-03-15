const express = require('express')
const quoteController = require('../controllers/quote.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/createQuote', protect, quoteController.createQuote)
router.get('/getQuotes', protect, quoteController.getQuotes)
router.get('/getClientQuotes/:id', protect, quoteController.getClientQuotes)
router.put('/updateQuote/:id', protect, quoteController.updateQuote)
router.delete('/deleteQuote/:id', protect, quoteController.deleteQuote)
router.get('/downloadQuotePDF/:id', protect, quoteController.downloadQuotePDF)

module.exports = router