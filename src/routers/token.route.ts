import { Router } from "express";
import {
  getAvailableTokens,
  getWalletTokens,
  importWalletTokens,
  importAvailableTokens,
  swapToken,
  getDetailOfToken,
  sendToken,
  getValidTokenAddress,
} from "../controllers/token.controller";

const router = Router();

router.get("/", getWalletTokens);
router.get("/:tokenAddress", getDetailOfToken);

router.post("/import_token", importWalletTokens);
router.post("/swap", swapToken);
router.get("/available_tokens", getAvailableTokens);
router.post("/import_available_tokens", importAvailableTokens);
router.post("/sendToken", sendToken);
router.get('/valid/:tokenAddress', getValidTokenAddress);

export default router;
