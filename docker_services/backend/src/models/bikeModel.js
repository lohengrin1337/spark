// mock db
const bikes = [
    {
        name: "I am bike no 1"
    },
    {
        name: "I am bike no 2"
    }
];

const bikeModel = {
    async getBikes() {
        return bikes;
    }
};

module.exports =  bikeModel;
