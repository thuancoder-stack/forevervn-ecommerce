import express from 'express';
import { trackBehavior, getRecommendations } from '../controllers/behaviorController.js';

const behaviorRouter = express.Router();

behaviorRouter.post('/track', trackBehavior);
behaviorRouter.post('/recommend', getRecommendations);

export default behaviorRouter;
