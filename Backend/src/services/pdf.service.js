const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateQuotePDF = async (quote) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({
            margin: 0,
            size: 'A4'
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const publicPath = path.join(__dirname, '../public');
        const startX = 60;
        const tableWidth = 475;

        // ==================== 1. HEADER ====================
        const headerPath = path.join(publicPath, 'header.png');
        if (fs.existsSync(headerPath)) {
            doc.image(headerPath, 0, 0, { width: 595.28 });
        }

        // ==================== 2. TITLE SECTION ====================
        doc.fillColor('#000000').font('Times-Bold').fontSize(14);
        doc.text('QUOTATION', 0, 140, { align: 'center' });

        doc.moveDown(1);
        doc.fontSize(11).text(`PROJECT : ${quote.projectName || 'BURJ AL ARAB'}`, { align: 'center' });
        doc.moveDown(1);
        
        // ==================== 3. INFO GRID ====================
        const infoTop = 185;
        doc.lineWidth(0.5);
        doc.font('Times-Bold').fontSize(8.5);

        // Grid Box
        doc.rect(startX, infoTop, tableWidth, 45).stroke();
        doc.moveTo(startX + 238, infoTop).lineTo(startX + 238, infoTop + 45).stroke();
        doc.moveTo(startX, infoTop + 15).lineTo(startX + tableWidth, infoTop + 15).stroke();
        doc.moveTo(startX, infoTop + 30).lineTo(startX + tableWidth, infoTop + 30).stroke();

        // Data Entry
        const leftCol = startX + 5;
        const rightCol = startX + 243;

        doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString('en-GB')}`, leftCol, infoTop + 5);
        doc.text(`To: ${quote.clientName || 'Oasis Hill'}`, leftCol, infoTop + 20);
        doc.text(`Attn: ${quote.clientAttendant || 'Mr. GV'}`, leftCol, infoTop + 35);

        doc.text(`Tel: 04-4428383`, rightCol, infoTop + 5);
        doc.text(`Fax: 04-4428384`, rightCol, infoTop + 20);
        
     
        const quoteNumber = quote.quoteNo ? quote.quoteNo.replace('GTS-PO-', '') : '00007';
        doc.text(`QOTIN NO : ${quoteNumber}`, rightCol, infoTop + 35);

        // ==================== 4. SALUTATION ====================
        doc.font('Times-Roman').fontSize(9).text('Dear Sir,', startX, 255);
        doc.text('With reference to your inquiry, we are pleased to quote our best price for the following for your', startX, 270);
        doc.text('favorable consideration.', startX, 285);

        // ==================== 5. MAIN TABLE ====================
        const tableTop = 305;
        const col = { no: 35, desc: 230, qty: 45, up: 75, tp: 90 };

        // Table Header
        doc.font('Times-Bold').fontSize(9);
        doc.rect(startX, tableTop, tableWidth, 38).stroke();

        let curX = startX;
        [col.no, col.desc, col.qty, col.up].forEach(w => {
            curX += w;
            doc.moveTo(curX, tableTop).lineTo(curX, tableTop + 38).stroke();
        });

        doc.text('No.', startX + 5, tableTop + 5);
        doc.text('Description', startX + col.no + 5, tableTop + 5);
        doc.text('Qty', startX + col.no + col.desc + 5, tableTop + 5);
        doc.text('Unit Price\nAED', startX + col.no + col.desc + col.qty, tableTop + 5, { width: col.up, align: 'center' });
        doc.text('Total Price\nAED', startX + col.no + col.desc + col.qty + col.up, tableTop + 5, { width: col.tp, align: 'center' });

        // Table Body Box
        let y = tableTop + 38;
        const bodyHeight = 100;
        doc.rect(startX, y, tableWidth, bodyHeight).stroke();

        let lineX = startX;
        [col.no, col.desc, col.qty, col.up].forEach(w => {
            lineX += w;
            doc.moveTo(lineX, y).lineTo(lineX, y + bodyHeight).stroke();
        });

        let subtotal = 0;
        const itemStartY = y + 8;

        quote.items.forEach((item, index) => {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;

            doc.font('Times-Roman').fontSize(9);
            doc.text((index + 1).toString().padStart(2, '0'), startX + 5, itemStartY + (index * 25));
            doc.text(item.description, startX + col.no + 5, itemStartY + (index * 25), { width: col.desc - 10 });

            if (item.note) {
                doc.font('Times-Bold').fontSize(8.5)
                    .text(`(Note: ${item.note})`, startX + col.no + 5, itemStartY + (index * 25) + 12,
                        { width: col.desc - 10 });
            }

            doc.font('Times-Roman').fontSize(9);
            doc.text(`${item.quantity} m`, startX + col.no + col.desc + 5, itemStartY + (index * 25));
            doc.text(item.unitPrice.toFixed(2), startX + col.no + col.desc + col.qty,
                itemStartY + (index * 25), { width: col.up, align: 'center' });
            doc.text(itemTotal.toFixed(2), startX + col.no + col.desc + col.qty + col.up - 8,
                itemStartY + (index * 25), { width: col.tp, align: 'right' });
        });

        // ==================== 6. TOTALS SECTION ====================
        y += bodyHeight;
        const vat = subtotal * (quote.vatPercentage / 100);
        const net = subtotal + vat;

        const drawTotalRow = (label, amt, currentY) => {
            doc.rect(startX, currentY, tableWidth, 18).stroke();
            const labelStartX = startX + col.no + col.desc + col.qty;

            doc.moveTo(labelStartX, currentY).lineTo(labelStartX, currentY + 18).stroke();
            doc.moveTo(labelStartX + col.up, currentY).lineTo(labelStartX + col.up, currentY + 18).stroke();

            doc.font('Times-Bold').fontSize(9)
                .text(label, labelStartX, currentY + 5, { width: col.up - 5, align: 'right' });
            doc.text(amt.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                labelStartX + col.up, currentY + 5, { width: col.tp - 8, align: 'right' });
        };

        drawTotalRow('Total', subtotal, y);
        drawTotalRow(`VAT ${quote.vatPercentage}%`, vat, y + 18);
        drawTotalRow('Net Total', net, y + 36);

        // ==================== 7. AMOUNT IN WORDS ====================
        let fY = y + 70;
        doc.font('Times-Bold').fontSize(10).text(`Total in words in AED : ${quote.amountInWords}`, startX, fY);

        // ==================== 8. VALIDITY & CLOSING ====================
        fY += 35;
        doc.font('Times-Roman').fontSize(9).text('Validity of Quotation: 30 days', startX, fY);

        fY += 20;
        doc.text('Please feel free to revert back to us for any further clarification and requirements. An opportunity', startX, fY);
        fY += 15;
        doc.text('provided to interact further on this account would be highly appreciated.', startX, fY);

        // ==================== 9. APPROVED BY ====================
        fY += 35;
        doc.font('Times-Roman').fontSize(9);
        doc.text('Approved by', startX, fY);
        fY += 15;
        doc.font('Times-Bold').fontSize(10).text('General Manager', startX, fY);
        fY += 15;
        doc.text('Muhammad Naasir', startX, fY);

        fY += 30;
        doc.font('Times-Bold').fontSize(10).text('Thanks, and Best Regards', startX, fY);
        fY += 20;
        doc.text('For Graps Technical Services LLC', startX, fY);

        fY += 20;
        doc.font('Times-Italic').fontSize(8.5).text('This is a computer generated quotation. No signature is required.', startX, fY);

        // ==================== 10. FOOTER IMAGE ====================
        const footerPath = path.join(publicPath, 'footer.png');
        if (fs.existsSync(footerPath)) {
            doc.image(footerPath, 0, 785, { width: 595.28 });
        }

        doc.end();
    });
};

module.exports = { generateQuotePDF };