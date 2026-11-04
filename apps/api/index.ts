import express from "express";
import rootRouter from "./routes";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors())

// Mount all API routes
app.use("/api/v1", rootRouter);

app.get("/health", (req, res) => {
    res.json({ message: "OK" })
})

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})
