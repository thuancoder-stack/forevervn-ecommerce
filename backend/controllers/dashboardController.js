import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import importBatchModel from '../models/importBatchModel.js';
import userModel from '../models/userModel.js';

const getDashboardStats = async (req, res) => {
    try {
        const orders = await orderModel.find({ status: { $nin: ['Cancelled', 'Returned'] } });
        const products = await productModel.find({});
        const productMap = new Map(products.map((product) => [String(product._id), product]));
        
        // New Requirements
        const customersCount = await userModel.countDocuments({ role: 'Customer' });
        const pendingOrdersCount = await orderModel.countDocuments({ status: { $in: ['Order Placed', 'Packing'] } });
        
        // Calculate Total Active Inventory Value (Capital Locked in Stock)
        const activeBatches = await importBatchModel.find({ status: 'Active' });
        const totalInventoryValue = activeBatches.reduce((acc, batch) => acc + (batch.remainingQty * batch.costPrice), 0);
        const totalStockQty = activeBatches.reduce((acc, batch) => acc + batch.remainingQty, 0);
        const lowStockBatches = await importBatchModel
            .find({
                status: { $ne: 'Cancelled' },
                remainingQty: { $gt: 0, $lt: 5 },
            })
            .sort({ remainingQty: 1, importDate: 1 });

        const lowStockAlerts = lowStockBatches.map((batch) => {
            const product = productMap.get(String(batch.productId));

            return {
                id: String(batch._id),
                productId: String(batch.productId),
                productName: product?.name || 'Hidden / removed product',
                size: batch.size || 'Any',
                color: batch.color || 'Any',
                supplier: batch.supplier || '',
                remainingQty: Number(batch.remainingQty) || 0,
                costPrice: Number(batch.costPrice) || 0,
                category: product?.category || '',
            };
        });

        // Calculate Stats
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalProfit = 0;
        let totalDiscount = 0;
        
        let weeklyRevenue = 0;
        let monthlyRevenue = 0;
        let yearlyRevenue = 0;

        const financialDataByMonth = orders.reduce((acc, order) => {
            const orderDate = new Date(order.date);
            const amount = Number(order.amount) || 0;
            const cogs = Number(order.cogs) || 0;
            const profit = Number(order.profit) || 0;
            const discount = Number(order.discount) || 0;

            totalRevenue += amount;
            totalCOGS += cogs;
            totalProfit += profit;
            totalDiscount += discount;

            if (orderDate >= startOfWeek) weeklyRevenue += amount;
            if (orderDate >= startOfMonth) monthlyRevenue += amount;
            if (orderDate >= startOfYear) yearlyRevenue += amount;

            const monthYear = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
            if (!acc[monthYear]) acc[monthYear] = { revenue: 0, cogs: 0, profit: 0, discount: 0 };
            
            acc[monthYear].revenue += amount;
            acc[monthYear].cogs += cogs;
            acc[monthYear].profit += profit;
            acc[monthYear].discount += discount;
            
            return acc;
        }, {});

        // Format financial chart data
        const financialChart = Object.keys(financialDataByMonth).map(key => ({
            name: key,
            revenue: financialDataByMonth[key].revenue,
            cogs: financialDataByMonth[key].cogs,
            profit: financialDataByMonth[key].profit
        })).sort((a, b) => {
             const [m1, y1] = a.name.split('/').map(Number);
             const [m2, y2] = b.name.split('/').map(Number);
             return y1 !== y2 ? y1 - y2 : m1 - m2;
        }).slice(-12);

        // Calculate Category Distribution
        const categoryData = Object.entries(
            products.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {})
        ).map(([name, value]) => ({ name, value }));

        res.json({
            success: true,
            stats: {
                totalRevenue,
                totalCOGS,
                totalProfit,
                totalDiscount,
                grossMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
                weeklyRevenue,
                monthlyRevenue,
                yearlyRevenue,
                totalOrders: orders.length,
                totalProducts: products.length,
                totalCustomers: customersCount,
                pendingOrders: pendingOrdersCount,
                inventoryValue: totalInventoryValue,
                totalStockQty: totalStockQty,
                lowStockCount: lowStockAlerts.length,
            },
            charts: {
                financial: financialChart,
                categories: categoryData
            },
            alerts: {
                lowStock: lowStockAlerts,
            },
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const exportOrdersCsv = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 });
        
        // Define CSV Header
        let csvContent = "Order ID,Date,User ID,Status,Payment Method,Items Count,Total Amount,COGS,Profit\n";
        
        orders.forEach(order => {
            const dateStr = new Date(order.date).toLocaleDateString('vi-VN');
            const itemCount = order.items ? order.items.length : 0;
            const amount = order.amount || 0;
            const cogs = order.cogs || 0;
            const profit = order.profit || 0;
            
            // Format row, escaping commas in texts if any
            csvContent += `"${order._id}","${dateStr}","${order.userId}","${order.status}","${order.paymentMethod}",${itemCount},${amount},${cogs},${profit}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="DonHang_BaoCao.csv"');
        res.status(200).send('\uFEFF' + csvContent); // \uFEFF for Excel UTF-8 BOM
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { getDashboardStats, exportOrdersCsv };
