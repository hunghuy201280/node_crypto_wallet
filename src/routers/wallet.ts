import { Router } from "express";
import { verifyMnemonic } from "../controllers/wallet";

const router = Router();

router.post("/verify", verifyMnemonic);

export default router;
