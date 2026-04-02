import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    name:        { type: String,  required: true },
    description: { type: String,  required: true },
    price:       { type: Number,  required: true },
    oldPrice:    { type: Number,  default: 0 },
    image:       { type: Array,   required: true },
    category:    { type: String,  required: true },
    subCategory: { type: String,  required: true },
    sizes:       { type: Array,   required: true },
    colors:      { type: Array,   default: []    }, // New: Array of color names/hex
    videoUrl:    { type: String,  default: ""    }, // New: TikTok/Review video link
    bestseller:  { type: Boolean  },
    stockThreshold: { type: Number, default: 0   }, // New: Alert when total remaining quantity is below this flag
    ratingAvg:   { type: Number,  default: 0     }, // For Smart Ranking
    ratingCount: { type: Number,  default: 0     }, // For Smart Ranking
    views:       { type: Number,  default: 0     }, // For Smart Ranking
    sold:        { type: Number,  default: 0     }, // For Smart Ranking
    date:        { type: Number,  required: true },
})

const productModel = mongoose.models.product || mongoose.model('product', productSchema)

export default productModel