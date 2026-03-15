const Client = require('../models/client.model')

async function createClient(req, res) {
    try {
        const { name, attendant, email, phone, address, trn, crNo } = req.body

        if (!name || !attendant) {
            return res.status(400).json({
                success: false,
                message: 'Name and attendant are required'
            })
        }

        const client = await Client.create({
            name,
            attendant,
            email: email || '',
            phone: phone || '',
            address: address || '',
            trn: trn || '',
            crNo: crNo || '',
            createdBy: req.userId || req.user?._id  
        })

        res.status(201).json({
            success: true,
            data: client
        })

    } catch (err) {
        console.error('Error in createClient:', err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function getClient(req, res) {
    try {
        const client = await Client.findOne({ 
            _id: req.params.id,
            createdBy: req.userId || req.user?._id 
        })

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            })
        }

        res.json({
            success: true,
            data: client
        })
    } catch (err) {
        console.error('Error in getClient:', err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function getClients(req, res) {
    try {
        const { search, page = 1, limit = 50 } = req.query
        const userId = req.userId || req.user?._id

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            })
        }

        let query = { createdBy: userId }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { attendant: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { trn: { $regex: search, $options: 'i' } },
                { crNo: { $regex: search, $options: 'i' } }
            ]
        }

        const clients = await Client.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)

        const total = await Client.countDocuments(query)

        res.json({
            success: true,
            count: clients.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: clients
        })
    } catch (err) {
        console.error('Error in getClients:', err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function updateClient(req, res) {
    try {
        const { name, attendant, email, phone, address, trn, crNo } = req.body
        const userId = req.userId || req.user?._id

        const client = await Client.findOne({ 
            _id: req.params.id,
            createdBy: userId 
        })

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            })
        }

        if (name) client.name = name
        if (attendant) client.attendant = attendant
        if (email !== undefined) client.email = email
        if (phone !== undefined) client.phone = phone
        if (address !== undefined) client.address = address
        if (trn !== undefined) client.trn = trn
        if (crNo !== undefined) client.crNo = crNo

        await client.save()

        res.json({
            success: true,
            data: client
        })
    } catch (err) {
        console.error('Error in updateClient:', err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function deleteClient(req, res) {
    try {
        const userId = req.userId || req.user?._id

        const client = await Client.findOneAndDelete({ 
            _id: req.params.id,
            createdBy: userId 
        })

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            })
        }

        res.json({
            success: true,
            message: 'Client deleted successfully',
            data: client
        })
    } catch (err) {
        console.error('Error in deleteClient:', err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function searchClients(req, res) {
    try {
        const { q } = req.query
        const userId = req.userId || req.user?._id

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            })
        }

        const clients = await Client.find({
            createdBy: userId,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { attendant: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } }
            ]
        }).limit(10)

        res.json({
            success: true,
            data: clients
        })
    } catch (err) {
        console.error('Error in searchClients:', err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = { 
    createClient, 
    getClient, 
    getClients, 
    updateClient, 
    deleteClient,
    searchClients  
}