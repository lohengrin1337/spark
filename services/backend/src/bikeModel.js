import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// const bikeSchema = new mongoose.Schema({
//   isOn: { type: Boolean, default: false },
//   onService: { type: Boolean, default: false },
//   isCharging: { type: Boolean, default: false },
//   batteryLife: { type: Number, default: 100 }, // Number istället för Integer
//   position: { type: [Number], default: [0, 0] }, // Array av Numbers, t.ex. [lat, lng]
//   speed: { type: Number, default: 0 } // Number istället för Integer
// });


const bikeSchema = new mongoose.Schema({
    isOn: Boolean,
    onService: Boolean,
    isCharging: Boolean,
    batteryLife: Number,
    position: [Number],
    speed: Number,
});

const Bike = mongoose.model("Bike", bikeSchema);

const testData = {
    isOn: false,
    onService: false,
    isCharging: false,
    batteryLife: 100,
    position: [10.0, 10.0],
    speed: 0,
};

// Just a simple set up
const bikeModel = {
    async populate() {
        const aBike = new Bike(testData);
        const res = await aBike.save();
        console.log(res);
        return res;
    },

    async getBikes() {
        const bikes = await Bike.find();
        console.log(bikes);
        return bikes;
    }
};

export default bikeModel;
