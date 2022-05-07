import { Router } from "express";
import {
  getAvailableTokens,
  getTokens,
  importTokens,
} from "../controllers/token";

const router = Router();

router.get("/", getTokens);
router.post("/import_token", importTokens);
router.post("/test", getAvailableTokens);

export default router;
