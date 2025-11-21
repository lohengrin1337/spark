const express = require('express');

const port = 3000;
const app = express();

app.get('/', async (req, res) => {
    const result = await fetch("http://backend:5000/api/v1/bikes");
    const body = await result.json();
    const bikes = body.data;

    let html = "<h1>Fetching bikes from backend api</h1>";

    bikes.forEach(bike => {
        html += `<p>${bike.name}</p>`
    });

    res.send(html);
});

app.listen(port, () => {
    console.log(`Spark admin web listening on ${port}`);
});
