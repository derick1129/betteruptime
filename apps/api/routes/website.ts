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
                include: {
                    region: true
                },
                orderBy: [{
                    createdAt: "desc"
                }],
                take: 20
            }
        }
    })

    if (!website) {
        return res.status(404).json({ message: "Website not found" })
    }
    res.json({
        id: website.id,
        url: website.url,
        userId: website.userId,
        timeAdded: website.timeAdded,
        ticks: website.ticks
    })
})

router.delete("/:websiteId", authmiddleware, async (req, res) => {
    const websiteId = req.params.websiteId as string;
    const website = await prismaClient.website.findFirst({
        where: {
            id: websiteId,
            userId: req.userId
        }
    });

    if (!website) {
        return res.status(404).json({ message: "Website not found" });
    }

    await prismaClient.websiteTick.deleteMany({
        where: { websiteId }
    });

    await prismaClient.website.delete({
        where: { id: websiteId }
    });

    res.json({ message: "Website deleted" });
});

router.get(["/", "/websites"], authmiddleware, async (req, res) => {
    const websites = await prismaClient.website.findMany({
        where: {
            userId: req.userId
        }
    })

    res.json({
        websites
    })
})

export default router;