import jwt from "jsonwebtoken";
import { Router } from "express";
import { AuthInput } from "./types";
import { prismaClient } from "store/client";

const router = Router();

router.post("/signup", async (req, res) => {
    const data = AuthInput.safeParse(req.body)
    if (!data.success) {
        res.status(403).send("");
        return;
    }

    try {
        let user = await prismaClient.user.create({
            data: {
                username: data.data.username,
                password: data.data.password
            }
        })
        res.json({
            id: user.id
        })
    } catch (e) {
        res.status(403).send("User already exists");
    }

})

router.post("/signin", async (req, res) => {
    const data = AuthInput.safeParse(req.body)
    if (!data.success) {
        res.status(403).send("");
        return;
    }

    let user = await prismaClient.user.findFirst({
        where: {
            username: data.data.username,
        }
    })

    if (user?.password !== data.data.password) {
        res.status(403).send("Invalid password");
        return;
    }

    let token = jwt.sign({
        sub: user.id
    }, process.env.JWT_SECRET!)

    res.json({
        jwt: token
    })
})

export default router;