const Quote = require('../models/quote.model');
const Client = require('../models/client.model');
const { generateQuotePDF } = require('../services/pdf.service.js');

async function createQuote(req, res) {
    try {
        const { 
            clientId, 
            items, 
            vatPercentage = 5, 
            amountInWords,
            projectName,
            tel,
            fax
        } = req.body;

        console.log('Received quote data:', { clientId, projectName, items, vatPercentage });


        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'Client ID is required'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items are required'
            });
        }


        const userId = req.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        let subtotal = 0;
        const processedItems = []; 

        for (let item of items) {

            if (!item.description) {
                return res.status(400).json({
                    success: false,
                    message: 'Item description is required'
                });
            }

            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            
            const perItemTotal = quantity * unitPrice;
            subtotal += perItemTotal;

            processedItems.push({
                description: item.description,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: perItemTotal,
                note: item.note || ''
            });
        }

        const vatAmount = subtotal * (vatPercentage / 100);
        const total = subtotal + vatAmount;


        const quoteData = {
            clientId: client._id,
            clientName: client.name,
            clientAttendant: client.attendant,
            items: processedItems,
            subtotal,
            vatPercentage,
            vatAmount,
            total,
            amountInWords: amountInWords || '',
            projectName: projectName || '',
            tel: tel || '04-4428383',
            fax: fax || '04-4428384',
            createdBy: userId
        };

        console.log('Creating quote with data:', quoteData);

        const quote = await Quote.create(quoteData);

        console.log('Quote created successfully:', quote._id);
        console.log('Quote number:', quote.quoteNo);

        res.status(201).json({
            success: true,
            data: quote
        });

    } catch (err) {
        console.error('Error in createQuote:', err);
        console.error('Error stack:', err.stack);
        
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

async function getQuotes(req, res) { 
    try {
        const userId = req.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        let quotes = await Quote.find({ createdBy: userId })
            .populate('clientId', 'name attendant')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: quotes.length,
            data: quotes
        });

    } catch (err) {
        console.error('Error in getQuotes:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

async function getClientQuotes(req, res) {
    try {
        const { clientId } = req.params;
        const userId = req.userId || req.user?._id;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const quotes = await Quote.find({
            clientId: clientId,
            createdBy: userId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            client: {
                name: client.name,
                attendant: client.attendant
            },
            data: quotes
        });

    } catch (error) {
        console.error('Error in getClientQuotes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function updateQuote(req, res) {
    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        const { 
            items, 
            vatPercentage, 
            amountInWords,
            projectName,
            tel,
            fax
        } = req.body;

        if (items && Array.isArray(items) && items.length > 0) {
            let subtotal = 0;
            const processedItems = [];

            for (let item of items) {
                const quantity = parseFloat(item.quantity) || 0;
                const unitPrice = parseFloat(item.unitPrice) || 0;
                const itemTotal = quantity * unitPrice;
                subtotal += itemTotal;

                processedItems.push({
                    description: item.description,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    totalPrice: itemTotal,
                    note: item.note || ''
                });
            }

            const newVatPercentage = vatPercentage !== undefined ? vatPercentage : quote.vatPercentage;
            const vatAmount = subtotal * (newVatPercentage / 100);
            const total = subtotal + vatAmount;

            quote.items = processedItems;
            quote.subtotal = subtotal;
            quote.vatPercentage = newVatPercentage;
            quote.vatAmount = vatAmount;
            quote.total = total;
        }

        if (amountInWords !== undefined) quote.amountInWords = amountInWords;
        if (projectName !== undefined) quote.projectName = projectName;
        if (tel !== undefined) quote.tel = tel;
        if (fax !== undefined) quote.fax = fax;

        await quote.save();

        console.log('Quote updated successfully:', quote._id);

        res.json({
            success: true,
            data: quote
        });

    } catch (error) {
        console.error('Error in updateQuote:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function deleteQuote(req, res) {
    try {
        const quote = await Quote.findByIdAndDelete(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        res.json({
            success: true,
            message: 'Quote deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteQuote:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function downloadQuotePDF(req, res) {
    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        const pdf = await generateQuotePDF(quote);

        res.setHeader('Content-Type', 'application/pdf');
        
       
        const fileName = `Quotation-${quote.quoteNo}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        
        res.send(pdf);

    } catch (error) {
        console.error('Error in downloadQuotePDF:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { 
    createQuote, 
    getQuotes,  
    getClientQuotes, 
    updateQuote, 
    deleteQuote, 
    downloadQuotePDF 
};