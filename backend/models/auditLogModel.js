import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String },
    role: { type: String, enum: ['Admin', 'Employee', 'Customer'], default: 'Customer' },
    actionType: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'OTHER'], required: true },
    entity: { type: String, required: true }, // e.g., 'PRODUCT', 'ORDER', 'IMPORT_BATCH'
    targetId: { type: String },
    description: { type: String },
    oldValue: { type: Object }, // Lưu trạng thái cũ dạng JSON string hoặc JS Object
    newValue: { type: Object }, // Lưu trạng thái mới
    timestamp: { type: Number, default: Date.now },
    createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-cleanup sau 30 ngày
});

const auditLogModel = mongoose.models.auditLog || mongoose.model('auditLog', auditLogSchema);

export default auditLogModel;
