import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import nodemailer from 'nodemailer';
import userBehaviorModel from '../models/userBehaviorModel.js';
import logAction from '../utils/logger.js';

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);
const readEnvValue = (key) => String(process.env[key] || '').trim().replace(/^"|"$/g, '');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findUserByEmail = (email) =>
    userModel.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });

const getMailTransporter = () => {
    const emailUser = readEnvValue('EMAIL_USER');
    const emailPass = readEnvValue('EMAIL_PASS');

    if (!emailUser || !emailPass) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
};

const trimAddressField = (value) => String(value || '').trim();

const sanitizeAddressPayload = (address = {}) => ({
    label: trimAddressField(address.label),
    fullName: trimAddressField(address.fullName),
    email: trimAddressField(address.email).toLowerCase(),
    phone: trimAddressField(address.phone),
    province: trimAddressField(address.province),
    district: trimAddressField(address.district),
    ward: trimAddressField(address.ward),
    addressDetail: trimAddressField(address.addressDetail),
    isDefault: Boolean(address.isDefault),
});

const isValidAddressPayload = (address) => {
    if (!address) return false;

    const requiredFields = [
        'fullName',
        'email',
        'phone',
        'province',
        'district',
        'ward',
        'addressDetail',
    ];

    if (!validator.isEmail(address.email || '')) {
        return false;
    }

    return requiredFields.every((field) => trimAddressField(address[field]).length > 0);
};

const normalizeAddressBook = (addresses = [], preferredDefaultId = '') => {
    const normalized = addresses.map((address, index) => ({
        ...address,
        label: trimAddressField(address?.label) || `Address ${index + 1}`,
        isDefault: false,
    }));

    if (normalized.length === 0) return normalized;

    const defaultIndex = preferredDefaultId
        ? normalized.findIndex((address) => String(address?._id) === String(preferredDefaultId))
        : normalized.findIndex((address) => Boolean(address?.isDefault));

    const safeIndex = defaultIndex >= 0 ? defaultIndex : 0;
    normalized[safeIndex].isDefault = true;

    return normalized;
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id);
            return res.json({ success: true, token });
        }

        return res.json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: 'User already exists' });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: 'Please enter a strong password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({ name, email, password: hashedPassword });
        const user = await newUser.save();
        const token = createToken(user._id);

        return res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const sendResetOtp = async (req, res) => {
    try {
        const rawEmail = String(req.body?.email || '').trim().toLowerCase();
        const emailUser = readEnvValue('EMAIL_USER');
        const transporter = getMailTransporter();

        if (!validator.isEmail(rawEmail)) {
            return res.json({ success: false, message: 'Please enter a valid email address' });
        }

        if (!emailUser || !transporter) {
            return res.json({ success: false, message: 'Password reset email service is not configured yet' });
        }

        const user = await findUserByEmail(rawEmail);

        if (!user) {
            return res.json({ success: false, message: 'No account found with that email' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expireAt = Date.now() + 10 * 60 * 1000;

        user.resetOtp = hashedOtp;
        user.resetOtpExpireAt = expireAt;
        await user.save();

        const html = `
            <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.7;max-width:640px;margin:0 auto;padding:24px;background:#fffaf5">
                <p style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#94a3b8;margin:0 0 12px">ForeverVN Account Recovery</p>
                <h2 style="margin:0 0 14px;font-size:28px;color:#0f172a">Reset your password</h2>
                <p style="margin:0 0 16px;font-size:15px;color:#475569">
                    Use the one-time code below to reset your password. The code stays valid for 10 minutes.
                </p>

                <div style="margin:22px 0;padding:20px 22px;border:1px solid #fed7aa;border-radius:20px;background:#fff7ed">
                    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#9a3412">One-Time Password</p>
                    <div style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0f172a;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.22em">
                        ${otp}
                    </div>
                    <p style="margin:14px 0 0;font-size:14px;color:#475569">
                        If you did not request this reset, you can ignore this email safely.
                    </p>
                </div>

                <p style="margin:0;font-size:14px;color:#475569">
                    ForeverVN Team
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: `"ForeverVN" <${emailUser}>`,
            to: rawEmail,
            subject: 'Your ForeverVN password reset code',
            html
        });

        return res.json({
            success: true,
            message: 'OTP has been sent to your email'
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const resetPasswordWithOtp = async (req, res) => {
    try {
        const rawEmail = String(req.body?.email || '').trim().toLowerCase();
        const otp = String(req.body?.otp || '').trim();
        const newPassword = String(req.body?.newPassword || '');

        if (!validator.isEmail(rawEmail)) {
            return res.json({ success: false, message: 'Please enter a valid email address' });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.json({ success: false, message: 'Please enter the 6-digit OTP' });
        }

        if (newPassword.trim().length < 8) {
            return res.json({ success: false, message: 'Please enter a strong password' });
        }

        const user = await findUserByEmail(rawEmail);

        if (!user || !user.resetOtp) {
            return res.json({ success: false, message: 'Reset OTP is invalid or expired' });
        }

        if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
            user.resetOtp = '';
            user.resetOtpExpireAt = 0;
            await user.save();
            return res.json({ success: false, message: 'OTP has expired. Please request a new one' });
        }

        const isOtpMatch = await bcrypt.compare(otp, user.resetOtp);

        if (!isOtpMatch) {
            return res.json({ success: false, message: 'Incorrect OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        const user = await userModel
            .findById(userId)
            .select('_id name email role addresses')
            .lean();

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const saveUserAddress = async (req, res) => {
    try {
        const { userId, addressId, address, setAsDefault } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const sanitizedAddress = sanitizeAddressPayload(address);
        if (!isValidAddressPayload(sanitizedAddress)) {
            return res.json({ success: false, message: 'Address information is incomplete' });
        }

        const currentAddresses = Array.isArray(user.addresses)
            ? user.addresses.map((item) => item.toObject())
            : [];

        const nextAddresses = [...currentAddresses];
        const nextDefaultId = setAsDefault ? String(addressId || '') : '';
        const existingIndex = nextAddresses.findIndex(
            (item) => String(item?._id) === String(addressId || ''),
        );

        if (existingIndex >= 0) {
            nextAddresses[existingIndex] = {
                ...nextAddresses[existingIndex],
                ...sanitizedAddress,
                isDefault: setAsDefault || Boolean(nextAddresses[existingIndex]?.isDefault),
            };
        } else {
            nextAddresses.push({
                ...sanitizedAddress,
                isDefault: Boolean(setAsDefault) || nextAddresses.length === 0,
            });
        }

        user.addresses = normalizeAddressBook(
            nextAddresses,
            nextDefaultId || (setAsDefault ? String(addressId || '') : ''),
        );
        await user.save();

        return res.json({
            success: true,
            message: existingIndex >= 0 ? 'Address updated successfully' : 'Address saved successfully',
            addresses: user.addresses,
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const deleteUserAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;

        if (!userId || !addressId) {
            return res.json({ success: false, message: 'Missing address information' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const currentAddresses = Array.isArray(user.addresses)
            ? user.addresses.map((item) => item.toObject())
            : [];

        const filteredAddresses = currentAddresses.filter(
            (item) => String(item?._id) !== String(addressId),
        );

        user.addresses = normalizeAddressBook(filteredAddresses);
        await user.save();

        return res.json({
            success: true,
            message: 'Address deleted successfully',
            addresses: user.addresses,
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const setDefaultUserAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;

        if (!userId || !addressId) {
            return res.json({ success: false, message: 'Missing address information' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const currentAddresses = Array.isArray(user.addresses)
            ? user.addresses.map((item) => item.toObject())
            : [];
        const hasTarget = currentAddresses.some(
            (item) => String(item?._id) === String(addressId),
        );

        if (!hasTarget) {
            return res.json({ success: false, message: 'Address not found' });
        }

        user.addresses = normalizeAddressBook(currentAddresses, String(addressId));
        await user.save();

        return res.json({
            success: true,
            message: 'Default address updated successfully',
            addresses: user.addresses,
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().replace(/^"|"$/g, '');
        const adminPassword = (process.env.ADMIN_PASSWORD || '').trim().replace(/^"|"$/g, '');

        if (email === adminEmail && password === adminPassword) {
            const token = jwt.sign({ email, role: 'Admin' }, process.env.JWT_SECRET);
            return res.json({ success: true, token, role: 'Admin' });
        }

        // DB Check
        const dbAdmin = await userModel.findOne({ email });
        if (dbAdmin && (dbAdmin.role === 'Admin' || dbAdmin.role === 'Employee')) {
            const isMatch = await bcrypt.compare(password, dbAdmin.password);
            if (isMatch) {
                const token = jwt.sign({ id: dbAdmin._id, role: dbAdmin.role }, process.env.JWT_SECRET);
                return res.json({ success: true, token, role: dbAdmin.role });
            }
        }

        return res.json({ success: false, message: 'Invalid credentials or lacking permissions' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const createEmployee = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Super Admin validation checks can be enforced via middleware
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: 'Account already exists' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newEmp = new userModel({ name, email, password: hashedPassword, role: 'Employee' });
        await newEmp.save();

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'CREATE_EMPLOYEE', `Tạo tài khoản nhân viên: ${email}`, newEmp._id);
        }

        return res.json({ success: true, message: 'Employee account created successfully!' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select('-password');
        res.json({ success: true, users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.json({ success: false, message: 'Missing user id' });
        }
        const user = await userModel.findById(id);
        if (user) {
            await userModel.findByIdAndDelete(id);
            if (req.adminEmail) {
                await logAction(req.adminEmail, req.adminName, 'DELETE_USER', `Xoá người dùng/nhân viên: ${user.email}`, id);
            }
        }
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const logBehavior = async (req, res) => {
    try {
        const { actionType, targetId, metadata, guestId } = req.body;
        const finalUserId = req.body.userId || guestId || 'Guest';

        // 1. Lưu log chi tiết (dùng cho Audit Log tab)
        const insertLog = new userBehaviorModel({
            userId: finalUserId,
            actionType,
            targetId,
            metadata
        });
        insertLog.save().catch(e => console.log('Behavior log error', e));

        // 2. Cập nhật Profile Summary (dùng cho phân tích/gợi ý)
        if (finalUserId !== 'Guest') {
            let profile = await userBehaviorModel.findOne({ userId: finalUserId, actionType: 'PROFILE_SUMMARY' });
            if (!profile) {
                profile = new userBehaviorModel({ 
                    userId: finalUserId, 
                    actionType: 'PROFILE_SUMMARY',
                    recentlyViewed: [],
                    categoryInteractions: new Map(),
                    searchQueries: []
                });
            }

            if (actionType === 'VIEW_PRODUCT' && targetId) {
                const rv = profile.recentlyViewed || [];
                profile.recentlyViewed = [targetId, ...rv.filter(id => id !== targetId)].slice(0, 20);
                
                if (metadata?.category) {
                    const currentCount = profile.categoryInteractions.get(metadata.category) || 0;
                    profile.categoryInteractions.set(metadata.category, currentCount + 1);
                }
            }

            if (actionType === 'SEARCH' && targetId) {
                const sq = profile.searchQueries || [];
                profile.searchQueries = [targetId, ...sq.filter(q => q !== targetId)].slice(0, 10);
            }

            profile.save().catch(e => console.log('Profile update error', e));
        }

        return res.json({ success: true });
    } catch (error) {
         return res.json({ success: false });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id, name, email, password } = req.body;
        const employee = await userModel.findById(id);

        if (!employee) return res.json({ success: false, message: 'Employee not found' });
        
        let shouldLog = false;
        if (name && name !== employee.name) { employee.name = name; shouldLog = true; }
        if (email && email !== employee.email) { employee.email = email; shouldLog = true; }
        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            employee.password = await bcrypt.hash(password, salt);
            shouldLog = true;
        }

        if (shouldLog) {
            await employee.save();
            await logAction('Admin/System', 'System', 'UPDATE_EMPLOYEE', `Cập nhật nhân viên ${email || employee.email}`, employee._id);
        }

        res.json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
         const { userId, name, newPassword } = req.body;
         const user = await userModel.findById(userId);
         
         if (!user) return res.json({ success: false, message: 'User not found' });
         
         if (name && name.trim().length > 0) user.name = name;
         
         if (newPassword && newPassword.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
         }
         
         await user.save();
         res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
         res.json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    registerUser,
    sendResetOtp,
    resetPasswordWithOtp,
    getCurrentUser,
    saveUserAddress,
    deleteUserAddress,
    setDefaultUserAddress,
    loginAdmin,
    getAllUsers,
    deleteUser,
    createEmployee,
    logBehavior,
    updateEmployee,
    updateProfile
};
