import { Router } from "express";
import websiteRouter from "./website";
import statusRouter from "./status";
import userRouter from "./user";

const rootRouter = Router();

rootRouter.use("/website", websiteRouter);
rootRouter.use("/status", statusRouter);
rootRouter.use("/user", userRouter);

export default rootRouter;

