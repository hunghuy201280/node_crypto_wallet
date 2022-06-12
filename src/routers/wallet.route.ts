import { Router } from "express";
import {
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  createWallet,
  getWalletInfo,
  getWalletValidAddress,
  sendBalance,
  getNftOwner,
} from "../controllers/wallet.controller";

const router = Router();

router.get('/nft' ,getNftOwner);
router.post("/send", sendBalance);
router.get('/info/:address',getWalletInfo);
router.get('/valid/:address',getWalletValidAddress);
router.post("/verify_private", importWalletFromPrivateKey);
router.post("/verify_mnemonic", importWalletFromMnemonic);
router.post("/create", createWallet);
router.get('/info/:address',getWalletInfo);
 



export default router;
