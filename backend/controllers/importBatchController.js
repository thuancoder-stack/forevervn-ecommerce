import importBatchModel from '../models/importBatchModel.js';
import productModel from '../models/productModel.js';
import logAction from '../utils/logger.js';

// Add new import batch
const addImportBatch = async (req, res) => {
    try {
        const { productId, size, color, sku, costPrice, supplier, initialQty, note } = req.body;

        if (!productId || !size || !costPrice || !initialQty) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        // Verify product exists
        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }

        const batchData = {
            productId,
            size,
            color: color || 'Any',
            sku,
            costPrice: Number(costPrice),
            supplier,
            initialQty: Number(initialQty),
            remainingQty: Number(initialQty),
            note
        };

        const batch = new importBatchModel(batchData);
        await batch.save();

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'ADD_IMPORT_BATCH', `Imported ${initialQty} units of ${product.name} (Size: ${size}, Color: ${color})`, batch._id);
        }

        res.json({ success: true, message: 'Import batch added successfully', batch });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get all import batches
const getImportBatches = async (req, res) => {
    try {
        const batches = await importBatchModel.find({}).sort({ importDate: -1 });
        res.json({ success: true, batches });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get import batches for a product
const getProductBatches = async (req, res) => {
    try {
        const { productId } = req.params;
        const batches = await importBatchModel.find({ productId }).sort({ importDate: -1 });
        res.json({ success: true, batches });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Update import batch
const updateImportBatch = async (req, res) => {
    try {
        const { id, costPrice, remainingQty, supplier, note, status, size } = req.body;
        
        const batch = await importBatchModel.findById(id);
        if (!batch) {
            return res.json({ success: false, message: 'Batch not found' });
        }

        // Cập nhật các trường
        if (costPrice !== undefined) batch.costPrice = Number(costPrice);
        if (remainingQty !== undefined) batch.remainingQty = Number(remainingQty);
        if (supplier !== undefined) batch.supplier = supplier;
        if (note !== undefined) batch.note = note;
        if (status !== undefined) batch.status = status;
        if (size !== undefined) batch.size = size;

        await batch.save();

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'UPDATE_IMPORT_BATCH', `Cập nhật thông tin lô hàng ${id}`, batch._id);
        }

        res.json({ success: true, message: 'Batch updated successfully', batch });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { addImportBatch, getImportBatches, getProductBatches, updateImportBatch };
