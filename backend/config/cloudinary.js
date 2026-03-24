import { v2 as cloudinary } from 'cloudinary'

const connectCloudinary = async () => {
    const cloudName = (process.env.CLOUDINARY_NAME || '').trim().replace(/^"|"$/g, '')
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^"|"$/g, '')
    const apiSecret = (
        process.env.CLOUDINARY_API_SECRET ||
        process.env.CLOUDINARY_SECRET ||
        ''
    )
        .trim()
        .replace(/^"|"$/g, '')

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    })
}

export default connectCloudinary
