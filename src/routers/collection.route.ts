import { Router } from "express";
import { getErc721ValidAddress, getInfoCollection, getNftOwner } from "../controllers/collection.controller";

const router = Router();

router.get('/owner',getNftOwner);
router.get("/valid/:address", getErc721ValidAddress);
router.get("/info/:address",getInfoCollection);



export default router;