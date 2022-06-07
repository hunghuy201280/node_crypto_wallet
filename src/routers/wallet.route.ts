import { Router } from "express";
import {
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  createWallet,
  getWalletInfo,
} from "../controllers/wallet.controller";

const router = Router();

router.post("/verify_private", importWalletFromPrivateKey);
router.post("/verify_mnemonic",importWalletFromMnemonic);
router.post("/create", createWallet);
router.get('/info/:address',getWalletInfo);

export default router;
