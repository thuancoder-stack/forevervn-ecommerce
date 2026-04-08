import mongoose from "mongoose";

const ensureDatabaseName = (rawUri, databaseName = 'e-commerce') => {
    const cleanedUri = String(rawUri || '').trim().replace(/^"|"$/g, '');

    if (!cleanedUri) return '';

    const queryIndex = cleanedUri.indexOf('?');
    const baseUri = queryIndex >= 0 ? cleanedUri.slice(0, queryIndex) : cleanedUri;
    const queryString = queryIndex >= 0 ? cleanedUri.slice(queryIndex) : '';
    const protocolIndex = baseUri.indexOf('://');
    const lastSlashIndex = baseUri.lastIndexOf('/');
    const pathAfterHosts =
        lastSlashIndex > protocolIndex + 2 ? baseUri.slice(lastSlashIndex + 1) : '';

    if (pathAfterHosts) {
        return cleanedUri;
    }

    const normalizedBaseUri = baseUri.replace(/\/+$/, '');
    return `${normalizedBaseUri}/${databaseName}${queryString}`;
};

const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB đã kết nối');
    });

    const uri = ensureDatabaseName(process.env.MONGO_URI);

    if (!uri) {
        console.error('❌ MONGO_URI is missing in .env');
        return;
    }

    try {
        await mongoose.connect(uri);
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
    }
};

export default connectDB;
