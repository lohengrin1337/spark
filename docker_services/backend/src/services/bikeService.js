const bikeModel = require("../models/bikeModel.js");

const bikeService = {
    async getBikes() {
        return await bikeModel.getBikes();
    },
};

module.exports = bikeService;