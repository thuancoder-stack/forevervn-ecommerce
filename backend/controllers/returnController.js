import returnModel from '../models/returnModel.js';
import orderModel from '../models/orderModel.js';
import { restoreInventoryFromOrder } from './orderController.js';
import { v2 as cloudinary } from 'cloudinary';
import logAction from '../utils/logger.js';
import mongoose from 'mongoose';

const requestReturn = async (req, res) => {
    try {
        const { userId, orderId, reason } = req.body;
        
        if (!userId || !orderId || !reason) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const image1 = req.files?.image1?.[0];
        const image2 = req.files?.image2?.[0];
        const image3 = req.files?.image3?.[0];
        const image4 = req.files?.image4?.[0];

        const images = [image1, image2, image3, image4].filter(Boolean);

        let imagesUrl = [];
        if (images.length > 0) {
            imagesUrl = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
        }

        const order = await orderModel.findById(orderId);
        if (!order || String(order.userId) !== String(userId)) {
            return res.json({ success: false, message: 'Order not found or unauthorized' });
        }

        if (order.status !== 'Delivered' && order.status !== 'Received') {
            return res.json({ success: false, message: 'Order must be Delivered or Received to request a return' });
        }

        const existingReturn = await returnModel.findOne({ orderId });
        if (existingReturn) {
            if (existingReturn.status !== 'Rejected') {
                return res.json({ success: false, message: 'A return request already exists for this order' });
            }
        }

        const returnData = {
            userId,
            orderId,
            reason,
            images: imagesUrl,
            status: 'Pending',
            refundAmount: order.amount, // Default to full amount
        };

        const newReturn = new returnModel(returnData);
        await newReturn.save();

        await orderModel.findByIdAndUpdate(orderId, { status: 'Return Requested' });

        await logAction(userId, 'Customer', 'REQUEST_RETURN', `Requested return for order #${String(orderId).slice(-8)}`, orderId);

        res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listReturns = async (req, res) => {
    try {
        const returns = await returnModel.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    let: { orderIdStr: "$orderId" },
                    pipeline: [
                        { $match: { $expr: { $eq: [ { $toString: "$_id" }, "$$orderIdStr" ] } } }
                    ],
                    as: 'orderObj'
                }
            },
            {
                $unwind: { path: '$orderObj', preserveNullAndEmptyArrays: true }
            },
            { $sort: { date: -1 } }
        ]);

        res.json({ success: true, returns });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const userReturns = async (req, res) => {
    try {
        const { userId } = req.body;
        const returns = await returnModel.find({ userId }).sort({ date: -1 });
        res.json({ success: true, returns });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateReturnStatus = async (req, res) => {
    try {
        const { returnId, status, refundAmount, adminNote } = req.body; // status: Approved, Rejected, Completed

        const returnReq = await returnModel.findById(returnId);
        if (!returnReq) {
            return res.json({ success: false, message: 'Return request not found' });
        }

        const order = await orderModel.findById(returnReq.orderId);
        if (!order) {
            return res.json({ success: false, message: 'Original order not found' });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            returnReq.status = status;
            if (refundAmount !== undefined) returnReq.refundAmount = Number(refundAmount);
            if (adminNote !== undefined) returnReq.adminNote = adminNote;

            await returnReq.save({ session });

            if (status === 'Approved') {
                order.status = 'Returning';
                await order.save({ session });
            } else if (status === 'Rejected') {
                order.status = 'Delivered';
                await order.save({ session });
            } else if (status === 'Completed') {
                order.status = 'Returned';
                await order.save({ session });

                if (order.inventoryDeducted) {
                    await restoreInventoryFromOrder(order, session);
                    order.inventoryDeducted = false;
                    order.inventoryAdjustments = [];
                    await order.save({ session });
                }
            } else if (status === 'Pending') {
                order.status = 'Return Requested';
                await order.save({ session });
            }

            await session.commitTransaction();
            session.endSession();

            if (req.adminEmail) {
                await logAction(req.adminEmail, req.adminName, 'UPDATE_RETURN', `Updated return request ${String(returnId).slice(-8)} to ${status}`, returnId);
            }

            res.json({ success: true, message: 'Return status updated successfully' });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { requestReturn, listReturns, userReturns, updateReturnStatus };
