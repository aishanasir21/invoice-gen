const express = require('express')
const clientController = require('../controllers/client.controller')
const { protect } = require('../middleware/auth.middleware')
const router = express.Router()


router.post('/createClient', protect, clientController.createClient)
router.get('/getClients', protect, clientController.getClients)
router.get('/search', protect, clientController.searchClients) 
router.get('/getClient/:id', protect, clientController.getClient)
router.put('/updateClient/:id', protect, clientController.updateClient)
router.delete('/deleteClient/:id', protect, clientController.deleteClient)

module.exports = router