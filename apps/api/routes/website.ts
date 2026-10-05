import { Router } from "express";
import { prismaClient } from "store/client";
const router = Router();

router.post("/", async (req, res) => {
    if (!req.body.url) {
        return res.status(411).json({ message: "url is required" })
    }
    const website = await prismaClient.website.create({
        data: {
            url: req.body.url,
            timeAdded: new Date()
        }
    })
    res.json({
        id: website.id
    })
})

router.get("/", (req, res) => {

})

export default router;