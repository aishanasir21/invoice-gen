const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    quoteNo: {
        type: String,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    clientName: String,
    clientAttendant: String,
    
    projectName: {
        type: String,
        default: ''
    },
    
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        note: String 
    }],
    
    subtotal: {
        type: Number,
        required: true
    },
    vatPercentage: {
        type: Number,
        default: 5
    },
    vatAmount: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    amountInWords: String,
    
    tel: {
        type: String,
        default: '04-4428383'
    },
    fax: {
        type: String,
        default: '04-4428384'
    },
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });


quoteSchema.pre('save', async function() {
    try {
        if (!this.quoteNo) {

            const now = new Date();
            const year = now.getFullYear().toString().slice(-2); // 26
            const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 03
            const day = now.getDate().toString().padStart(2, '0'); // 01
            const datePrefix = `${year}${month}${day}`; // 260301
            

            const lastQuote = await mongoose.model('Quote')
                .findOne({ 
                    quoteNo: { $regex: `^${datePrefix}` } 
                })
                .sort({ createdAt: -1 });
            
            let sequence = 1;
            
            if (lastQuote && lastQuote.quoteNo) {
                // Format: YYMMDDGTS (e.g., 260301GTS)
                const lastSequence = parseInt(lastQuote.quoteNo.replace(datePrefix, '').replace('GTS', ''));
                if (!isNaN(lastSequence)) {
                    sequence = lastSequence + 1;
                }
            }

            this.quoteNo = `${datePrefix}${sequence}GTS`;
            console.log('Generated quote number:', this.quoteNo);
        }
    } catch (error) {
        console.error('Error generating quote number:', error);
        throw error;
    }
});

const quoteModel = mongoose.model('Quote', quoteSchema);
module.exports = quoteModel;