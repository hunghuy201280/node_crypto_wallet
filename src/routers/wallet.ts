import { Router } from "express";
import {
  importWalletFromPrivateKey,
  createWallet,
} from "../controllers/wallet";

const router = Router();

router.post("/verify", importWalletFromPrivateKey);
router.post("/create", createWallet);

export default router;
