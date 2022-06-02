import { Router } from "express";
import {
  getAvailableTokens,
  getWalletTokens,
  importWalletTokens,
  importAvailableTokens,
  swapToken,
} from "../controllers/token.controller";

const router = Router();

router.get("/", getWalletTokens);
router.post("/import_token", importWalletTokens);
router.post("/swap", swapToken);
router.get("/available_tokens", getAvailableTokens);
router.post("/import_available_tokens", importAvailableTokens);

export default router;
