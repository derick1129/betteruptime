import { Router } from "express";
import websiteRouter from "./website";
import userRouter from "./user";

const rootRouter = Router();

rootRouter.use("/website", websiteRouter);
rootRouter.use("/user", userRouter);

export default rootRouter;

