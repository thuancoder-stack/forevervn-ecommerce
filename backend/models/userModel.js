import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
    {
        label: { type: String, default: '' },
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        province: { type: String, required: true },
        district: { type: String, required: true },
        ward: { type: String, required: true },
        addressDetail: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true }
)

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    addresses: { type: [addressSchema], default: [] },
    role:     { type: String, enum: ['Admin', 'Employee', 'Customer'], default: 'Customer' },
    resetOtp: { type: String, default: '' },
    resetOtpExpireAt: { type: Number, default: 0 }
}, { minimize: false })

// Tránh tạo model mới mỗi lần nodemon restart
const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel
