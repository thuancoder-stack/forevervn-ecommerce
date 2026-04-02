import cron from 'node-cron';
import productModel from '../models/productModel.js';
import importBatchModel from '../models/importBatchModel.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'admin@gmail.com',
        pass: process.env.EMAIL_PASS || 'Thuan0912'
    }
});

const startStockAlertJob = () => {
    // Chạy lúc 00:00 hàng ngày
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running Daily Stock Alert Engine...');
            
            const products = await productModel.find({ stockThreshold: { $gt: 0 } });
            
            let alertItems = [];

            for (let product of products) {
                const batches = await importBatchModel.aggregate([
                    { $match: { productId: product._id.toString(), status: 'Active' } },
                    { $group: { _id: null, totalQty: { $sum: "$remainingQty" } } }
                ]);
                
                const totalQty = batches.length > 0 ? batches[0].totalQty : 0;
                
                if (totalQty <= product.stockThreshold) {
                    alertItems.push({
                        name: product.name,
                        id: product._id,
                        threshold: product.stockThreshold,
                        remaining: totalQty
                    });
                }
            }

            if (alertItems.length > 0) {
                let emailHtml = `<h2>Cảnh báo Tồn Kho Khẩn Cấp</h2>`;
                emailHtml += `<p>Các sản phẩm sau đã xuất hiện dưới ngưỡng tồn kho an toàn:</p><ul>`;
                for (let item of alertItems) {
                    emailHtml += `<li><strong>${item.name}</strong> (ID: ${item.id}) - Tồn thực tế: <span style="color:red;font-weight:bold">${item.remaining}</span> (Ngưỡng an toàn: ${item.threshold})</li>`;
                }
                emailHtml += `</ul>`;

                const adminEmail = (process.env.ADMIN_EMAIL || '').trim().replace(/^"|"$/g, '');
                
                if (adminEmail && process.env.EMAIL_USER) {
                    await transporter.sendMail({
                        from: `"ForeverVN Alert Engine" <${process.env.EMAIL_USER}>`,
                        to: adminEmail,
                        subject: '🚨 Cảnh Báo Tồn Kho Khẩn Cấp - ForeverVN E-commerce',
                        html: emailHtml
                    });
                    console.log(`Stock Alert Email sent successfully to ${adminEmail}!`);
                } else {
                    console.log('Missing ADMIN_EMAIL or EMAIL_USER in environment variables. Skipped sending email.');
                    console.log('Alert Details:', alertItems);
                }
            } else {
                console.log('Stock levels are healthy. No alerts generated.');
            }

        } catch (error) {
            console.error('Error in Stock Alert Job:', error);
        }
    });
};

export default startStockAlertJob;
