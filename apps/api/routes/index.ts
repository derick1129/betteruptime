import { Router } from "express";
import websiteRouter from "./website";
import statusRouter from "./status";

const rootRouter = Router();

rootRouter.use("/website", websiteRouter);
rootRouter.use("/status", statusRouter);

export default rootRouter;

