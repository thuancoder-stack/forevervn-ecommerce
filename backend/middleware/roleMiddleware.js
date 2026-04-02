import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const { token } = req.headers;

            if (!token) {
                return res.json({ success: false, message: 'Not Authorized Login Again' });
            }

            const token_decode = jwt.verify(token, process.env.JWT_SECRET);

            // Backward compatibility for root admin from .env
            const adminEmail = (process.env.ADMIN_EMAIL || '').trim().replace(/^"|"$/g, '');
            if (token_decode.email && token_decode.email === adminEmail) {
                if (roles.includes('Admin') || roles.includes('Employee')) {
                    req.adminEmail = token_decode.email;
                    req.adminName = token_decode.email.split('@')[0];
                    return next();
                }
            }

            // Database user checking
            if (!token_decode.id) {
                return res.json({ success: false, message: 'Invalid token payload' });
            }

            const user = await userModel.findById(token_decode.id);
            if (!user) {
                return res.json({ success: false, message: 'User not found' });
            }

            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            if (!allowedRoles.includes(user.role)) {
                return res.json({ success: false, message: 'Access denied: insufficient permissions' });
            }

            req.user = user;
            req.adminEmail = user.email; // Map it for legacy APIs that expect req.adminEmail
            next();

        } catch (error) {
            console.log(error);
            return res.json({ success: false, message: error.message });
        }
    };
};

export default requireRole;
