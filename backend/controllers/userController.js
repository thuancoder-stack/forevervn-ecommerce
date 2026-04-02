import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import userBehaviorModel from '../models/userBehaviorModel.js';
import logAction from '../utils/logger.js';

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

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

const getCurrentUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        const user = await userModel.findById(userId).select('_id name email').lean();

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, user });
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

export { loginUser, registerUser, getCurrentUser, loginAdmin, getAllUsers, deleteUser, createEmployee, logBehavior, updateEmployee, updateProfile };