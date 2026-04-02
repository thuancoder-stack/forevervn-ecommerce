import auditLogModel from '../models/auditLogModel.js';

// Tương thích ngược với lời gọi cũ: logAction(userId, userName, actionString, description, targetId)
// Có thể mở rộng với object mới nếu cần: logAction({ userId, userName, role, actionType, entity, description, targetId, oldValue, newValue })
const logAction = async (...args) => {
    try {
        let payload = {};
        
        if (args.length === 1 && typeof args[0] === 'object') {
            payload = { ...args[0] };
        } else {
            // Lời gọi cũ: (userId, userName, action, description, targetId)
            const [userId, userName, action, description, targetId] = args;
            
            // Smart mapping từ 'action' string cũ ('ADD_PRODUCT', 'UPDATE_ORDER_STATUS')
            let actionType = 'OTHER';
            if (action.includes('ADD_') || action.includes('CREATE_')) actionType = 'CREATE';
            if (action.includes('UPDATE_') || action.includes('EDIT_')) actionType = 'UPDATE';
            if (action.includes('DELETE_') || action.includes('REMOVE_') || action.includes('CANCEL_')) actionType = 'DELETE';
            
            let entity = 'OTHER';
            if (action.includes('_PRODUCT')) entity = 'PRODUCT';
            if (action.includes('_ORDER')) entity = 'ORDER';
            if (action.includes('_BANNER')) entity = 'BANNER';
            if (action.includes('_SYSTEM') || action.includes('_VOUCHER')) entity = 'SYSTEM';
            if (action.includes('_REVIEW')) entity = 'REVIEW';
            if (action.includes('_IMPORT_BATCH')) entity = 'IMPORT_BATCH';

            payload = {
                userId,
                userName,
                role: 'Admin', // Mặc định cũ coi như Admin
                actionType,
                entity,
                description,
                targetId
            };
        }

        const log = new auditLogModel({
            ...payload,
            timestamp: Date.now()
        });
        await log.save();
    } catch (error) {
        console.error('Failed to save audit log:', error);
    }
};

export default logAction;
