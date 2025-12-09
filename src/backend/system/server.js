const express = require('express');
const apiV1 = require('./api/v1/apiRoutes.js');

const app = express();


app.use(express.json());
app.use("/api/v1", apiV1);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});
