import { Router } from "express";
import { prismaClient } from "store/client";
import { authmiddleware } from "./middleware";
const router = Router();

router.post("/", authmiddleware, async (req, res) => {
    if (!req.body.url) {
        return res.status(411).json({ message: "url is required" })
    }
    const website = await prismaClient.website.create({
        data: {
            url: req.body.url,
            timeAdded: new Date(),
            userId: req.userId
        }
    })
    res.json({
        id: website.id
    })
})

router.get("/status/:websiteId", authmiddleware, async (req, res) => {
    const website = await prismaClient.website.findFirst({
        where: {
            userId: req.userId,
            id: req.params.websiteId as string
        },
        include: {
            ticks: {
                orderBy: [{
                    time: "desc"
                }],
                take: 1
            }
        }
    })

    if (!website) {
        return res.status(411).json({ message: "Website not found" })
    }
    res.json({
        website
    })
})

export default router;