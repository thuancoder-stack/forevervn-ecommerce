import auditLogModel from '../models/auditLogModel.js';
import userBehaviorModel from '../models/userBehaviorModel.js';

const getAuditLogs = async (req, res) => {
    try {
        const logs = await auditLogModel.find({}).sort({ timestamp: -1 }).limit(200);
        const userBehaviors = await userBehaviorModel.find({}).sort({ createdAt: -1 }).limit(200);
        res.json({ success: true, logs, userBehaviors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const clearAuditLogs = async (req, res) => {
    try {
        await auditLogModel.deleteMany({});
        res.json({ success: true, message: 'Logs Cleared' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { getAuditLogs, clearAuditLogs };
