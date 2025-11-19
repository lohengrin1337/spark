import express from "express";
import bikeModel from "./src/bikeModel";

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
    const bikes = await bikeModel.getBikes();
    res.json({ data: bikes });
});

app.get('/populate', async (req, res) => {
    const result = await bikeModel.populate();
    res.json({ data: result });
});

app.listen(port, () => {
    console.log(`Spark backend listening on ${port}`);
});
