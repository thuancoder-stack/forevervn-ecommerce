import mongoose from "mongoose";

const userBehaviorSchema = new mongoose.Schema({
    userId: { type: String, required: false, default: 'Guest' }, // Có thể là Id user hoặc 'Guest'
    actionType: { type: String, required: true }, // VIEW_PRODUCT, ADD_TO_CART, REMOVE_FROM_CART, SEARCH, PLACE_ORDER
    targetId: { type: String, required: false }, // ID của sản phẩm, danh mục, v.v.
    metadata: { type: mongoose.Schema.Types.Mixed, required: false }, // Info tuỳ chọn thêm (Ví dụ: keyword search, detail size)
    
    // Các trường phục vụ phân tích (Analysis)
    recentlyViewed: [{ type: String }], 
    categoryInteractions: { type: Map, of: Number, default: {} },
    searchQueries: [{ type: String }],

    createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-cleanup sau 30 ngày
});

const userBehaviorModel = mongoose.models.userBehavior || mongoose.model("userBehavior", userBehaviorSchema);

export default userBehaviorModel;
