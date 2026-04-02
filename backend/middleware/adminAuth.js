import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
    try {
        const { token } = req.headers;

        if (!token) {
            return res.json({ success: false, message: 'Not Authorized Login Again' });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().replace(/^"|"$/g, '');

        if (token_decode.email && token_decode.email === adminEmail) {
            req.adminEmail = token_decode.email;
            req.adminName = token_decode.email.split('@')[0];
            req.userRole = 'Admin';
            return next();
        }

        // Check if token is DB based (has role)
        if (token_decode.id && (token_decode.role === 'Admin' || token_decode.role === 'Employee')) {
            req.adminId = token_decode.id;
            req.userRole = token_decode.role;
            return next();
        }

        return res.json({ success: false, message: 'Not Authorized Login Again' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export default adminAuth;