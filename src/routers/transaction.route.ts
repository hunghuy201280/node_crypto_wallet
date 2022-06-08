import { Router } from "express";
import { getHashDetail, getHistoryTransaction } from "../controllers/transaction.controller";

const router = Router();

router.get('/history',getHistoryTransaction)
router.get("/detail", getHashDetail);


export default router;