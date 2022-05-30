import { Router } from "express";
import {
  getAvailableTokens,
  getTokens,
  importTokens,
  swapToken,
} from "../controllers/token.controller";

const router = Router();

router.get("/", getTokens);
router.post("/import_token", importTokens);
router.post("/swap", swapToken);
router.post("/test", getAvailableTokens);

export default router;
