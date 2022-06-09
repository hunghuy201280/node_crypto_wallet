import { Router } from "express";
import {
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  createWallet,
  getWalletInfo,
  getWalletValidAddress,
} from "../controllers/wallet.controller";

const router = Router();

router.get('/info/:address',getWalletInfo);
router.get('/valid/:address',getWalletValidAddress);
router.post("/verify_private", importWalletFromPrivateKey);
router.post("/verify_mnemonic",importWalletFromMnemonic);
router.post("/create", createWallet);



export default router;
