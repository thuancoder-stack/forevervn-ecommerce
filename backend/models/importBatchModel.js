import mongoose from 'mongoose';

const importBatchSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true, default: 'Any' },
    sku: { type: String }, // Optional SKU for tracking
    costPrice: { type: Number, required: true }, // Value at time of import
    supplier: { type: String },
    initialQty: { type: Number, required: true },
    remainingQty: { type: Number, required: true },
    importDate: { type: Number, required: true, default: Date.now },
    status: { type: String, enum: ['Active', 'Depleted', 'Cancelled'], default: 'Active' },
    note: { type: String }
});

const importBatchModel = mongoose.models.importBatch || mongoose.model('importBatch', importBatchSchema);

export default importBatchModel;
