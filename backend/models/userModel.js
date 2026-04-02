import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    role:     { type: String, enum: ['Admin', 'Employee', 'Customer'], default: 'Customer' }
}, { minimize: false })

// Tránh tạo model mới mỗi lần nodemon restart
const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel