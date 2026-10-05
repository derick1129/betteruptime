import express from "express";
import rootRouter from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount all API routes
app.use("/api/v1", rootRouter);

app.get("/health", (req, res) => {
    res.json({ message: "OK" })
})

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})
