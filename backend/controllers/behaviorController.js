import userBehaviorModel from '../models/userBehaviorModel.js';

const trackBehavior = async (req, res) => {
    try {
        const { userId, productId, category, searchQuery, guestId } = req.body;
        const finalId = userId || guestId || 'Guest';

        if (finalId === 'Guest') return res.json({ success: true });

        // Tìm hoặc tạo profile behavior cho user/guest
        let behavior = await userBehaviorModel.findOne({ userId: finalId, actionType: 'PROFILE_SUMMARY' });

        if (!behavior) {
            behavior = new userBehaviorModel({ 
                userId: finalId, 
                actionType: 'PROFILE_SUMMARY',
                recentlyViewed: [],
                categoryInteractions: new Map(),
                searchQueries: []
            });
        }

        if (productId) {
            // Cập nhật danh sách vừa xem
            const rv = behavior.recentlyViewed || [];
            const nextRv = [productId, ...rv.filter(id => id !== productId)].slice(0, 20);
            behavior.recentlyViewed = nextRv;
        }

        if (category) {
            // Tăng tương tác category
            const currentCount = behavior.categoryInteractions.get(category) || 0;
            behavior.categoryInteractions.set(category, currentCount + 1);
        }

        if (searchQuery) {
            // Lưu từ khóa tìm kiếm
            const sq = behavior.searchQueries || [];
            const nextSq = [searchQuery, ...sq.filter(q => q !== searchQuery)].slice(0, 10);
            behavior.searchQueries = nextSq;
        }

        await behavior.save();
        res.json({ success: true, message: 'Behavior analyzed successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getRecommendations = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.json({ success: false, message: 'Missing User ID' });
        }

        const behavior = await userBehaviorModel.findOne({ userId });
        
        if (!behavior || Object.keys(behavior.categoryInteractions || {}).length === 0) {
            return res.json({ success: true, recommendations: null, message: "No behavior data" });
        }

        // Find favorite category
        let topCategory = null;
        let maxCount = 0;
        for (const [cat, count] of Object.entries(behavior.categoryInteractions)) {
            if (count > maxCount) {
                maxCount = count;
                topCategory = cat;
            }
        }

        res.json({ success: true, topCategory, recentlyViewed: behavior.recentlyViewed });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { trackBehavior, getRecommendations };
