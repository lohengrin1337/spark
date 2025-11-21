const express = require('express');
const apiV1 = require("./api/api-v1.js");

// const _ = require("lodash");

const port = 5000;
const app = express();
app.use("/api/v1", apiV1);


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Spark backend listening on ${port}`);
});
