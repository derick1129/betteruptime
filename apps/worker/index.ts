import axios from 'axios';
import { xAckBulk, xReadGroup } from 'redisstreams/client'
import { prismaClient } from 'store/client';
const REGION_ID = process.env.REGION_ID!;
const WORKER_ID = process.env.WORKER_ID!;

if (!REGION_ID) {
    throw new Error("Region not found")
}

if (!WORKER_ID) {
    throw new Error("Region not found")
}

async function main() {
    while (1) {
        //read from the stream
        // 1. Read from the stream
        const response = await xReadGroup(REGION_ID, WORKER_ID)

        if (!response) {
            return;
        }

        let promises = response.map(({ message }) => fetchWebsite(message.url, message.id))
        await Promise.all(promises)
        console.log(promises.length)

        // ack back to the queue that this event has been processed 
        xAckBulk(REGION_ID, response.map(({ id }) => id));
    }
}

async function fetchWebsite(url: string, websiteId: string) {
    return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        axios.get(url)
            .then(async () => {
                const endTime = Date.now()
                await prismaClient.websiteTick.create({
                    data: {
                        response_time_ms: endTime - startTime,
                        regionId: REGION_ID,
                        status: "Up",
                        websiteId: websiteId
                    }
                })
                resolve()
            })
            .catch(async () => {
                const endTime = Date.now()
                await prismaClient.websiteTick.create({
                    data: {
                        response_time_ms: endTime - startTime,
                        regionId: REGION_ID,
                        status: "Down",
                        websiteId: websiteId
                    }
                })
                resolve()
            })
    })
}

main()