import express from 'express';
import { addImportBatch, deleteImportBatch, getImportBatches, getProductBatches, updateImportBatch } from '../controllers/importBatchController.js';
import requireRole from '../middleware/roleMiddleware.js';

const importBatchRouter = express.Router();

importBatchRouter.post('/add', requireRole(['Admin', 'Employee']), addImportBatch);
importBatchRouter.post('/delete', requireRole(['Admin', 'Employee']), deleteImportBatch);
importBatchRouter.put('/update', requireRole(['Admin', 'Employee']), updateImportBatch);
importBatchRouter.get('/list', requireRole(['Admin', 'Employee']), getImportBatches);
importBatchRouter.get('/product/:productId', requireRole('Admin'), getProductBatches);

export default importBatchRouter;
