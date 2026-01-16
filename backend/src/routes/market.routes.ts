import { Router } from 'express';
import { MarketController } from '../controllers/marketController';

const router = Router();
const marketController = new MarketController();

router.get('/klines/:symbol/:interval', marketController.getKlines);
router.get('/trades/:symbol', marketController.getTrades);
router.get('/orderbook/:symbol', marketController.getOrderBook);
router.get('/ticker/:symbol', marketController.getTicker);
router.get('/symbols', marketController.getSymbols);

export default router;
