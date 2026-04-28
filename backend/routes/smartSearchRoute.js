import express from 'express';
import { getSearchCriteria, extractCriteria, searchProducts } from '../controllers/smartSearchController.js';

const smartSearchRouter = express.Router();

// GET /api/smart-search/criteria - Lấy danh sách tiêu chí có sẵn
smartSearchRouter.get('/criteria', getSearchCriteria);

// POST /api/smart-search/extract - Trích xuất tiêu chí từ mô tả bằng AI
smartSearchRouter.post('/extract', extractCriteria);

// POST /api/smart-search/search - Tìm kiếm sản phẩm theo tiêu chí
smartSearchRouter.post('/search', searchProducts);

export default smartSearchRouter;
