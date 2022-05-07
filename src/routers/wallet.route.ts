import { Router } from "express";
import {
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  createWallet,
} from "../controllers/wallet.controller";

const router = Router();

router.post("/verify_private", importWalletFromPrivateKey);
router.post("/verify_mnemonic",importWalletFromMnemonic);
router.post("/create", createWallet);

export default router;