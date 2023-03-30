import mongoose from "mongoose";

const HorsePerformanceSchema = new mongoose.Schema({
    name: String,
    winner: Boolean,
    coach: String,
    driver: String,
    date: Number
  });


const HorsePerformance = mongoose.model('HorsePerformance', HorsePerformanceSchema, 'horse_performances');

export default HorsePerformance