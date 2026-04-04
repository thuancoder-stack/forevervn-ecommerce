import importBatchModel from '../models/importBatchModel.js';

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeVariantSize = (size) => {
    const value = String(size || 'Any').trim();
    return value || 'Any';
};

const normalizeVariantColor = (color) => {
    const value = String(color || 'Any').trim();
    return value || 'Any';
};

const buildExactRegex = (value) => new RegExp(`^${escapeRegex(String(value || '').trim())}$`, 'i');
const buildDelimitedRegex = (value) =>
    new RegExp(`(?:^|\\s*,\\s*)${escapeRegex(String(value || '').trim())}(?:\\s*,\\s*|$)`, 'i');

const buildInventoryFilter = ({ productId, size, color } = {}) => {
    const filter = {
        productId: String(productId || ''),
        status: { $ne: 'Cancelled' },
        remainingQty: { $gt: 0 },
    };

    const andConditions = [];

    if (size) {
        const normalizedSize = normalizeVariantSize(size);

        if (normalizedSize === 'Any') {
            filter.size = buildExactRegex('Any');
        } else {
            andConditions.push({
                $or: [
                    { size: buildDelimitedRegex(normalizedSize) },
                    { size: buildExactRegex('Any') },
                ],
            });
        }
    }

    if (typeof color !== 'undefined') {
        const normalizedColor = normalizeVariantColor(color);

        if (normalizedColor === 'Any') {
            filter.color = buildExactRegex('Any');
        } else {
            andConditions.push({
                $or: [
                    { color: buildDelimitedRegex(normalizedColor) },
                    { color: buildExactRegex('Any') },
                ],
            });
        }
    }

    if (andConditions.length > 0) {
        filter.$and = andConditions;
    }

    return filter;
};

const getAvailableStock = async ({ productId, size, color } = {}) => {
    if (!productId) return 0;

    const batches = await importBatchModel
        .find(buildInventoryFilter({ productId, size, color }))
        .select('remainingQty');

    return batches.reduce((sum, batch) => sum + (Number(batch?.remainingQty) || 0), 0);
};

export { normalizeVariantSize, normalizeVariantColor, buildInventoryFilter, getAvailableStock };
