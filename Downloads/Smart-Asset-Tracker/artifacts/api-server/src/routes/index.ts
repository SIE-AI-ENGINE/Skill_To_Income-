import { Router, type IRouter } from "express";
import authRouter from "./auth";
import healthRouter from "./health";
import sieRouter from "./sie";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(sieRouter);

export default router;
