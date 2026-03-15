const mongoose = require('mongoose')

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    attendant: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    trn: {
        type: String,
        trim: true,
        description: 'Tax Registration Number'
    },
    crNo: {
        type: String,
        trim: true,
        description: 'Commercial Registration Number'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

clientSchema.index({ name: 'text', attendant: 'text', email: 'text', phone: 'text' });

const clientModel = mongoose.model('Client', clientSchema);

module.exports = clientModel;