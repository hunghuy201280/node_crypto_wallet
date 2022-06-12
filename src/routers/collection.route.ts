import { Router } from "express";
import { getErc721ValidAddress, getNftOwner } from "../controllers/collection.controller";

const router = Router();

router.get('/owner',getNftOwner);
router.get("/valid/:address", getErc721ValidAddress);
 



export default router;