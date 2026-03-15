import mongoose from "mongoose";
const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB đã kết nối')
    });
    
    // Clean MONGO_URI from quotes or whitespace
    const uri = (process.env.MONGO_URI || '').trim().replace(/^"|"$/g, '');
    
    if (!uri) {
        console.error('❌ MONGO_URI is missing in .env');
        return;
    }

    try {
        await mongoose.connect(`${uri}/e-commerce`);
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
    }
};
export default connectDB;