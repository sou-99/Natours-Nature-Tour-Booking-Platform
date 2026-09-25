const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs")
const Tour = require("../../model/tourModel")
const User = require("../../model/userModel")
const Review = require("../../model/reviewModel")

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful"))
  .catch((err) => console.error(err));

  // Read File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,"utf-8"))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,"utf-8"))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,"utf-8"))


//Import DAta into DB

const importData = async() =>{
    try{
    await Tour.create(tours)
    // await User.create(users,{validateBeforeSave:false})
    // await Review.create(reviews)

    console.log("Data successfully loaded!")
    }catch(err){
        console.log(err)
    }
    process.exit()
}

// Delete data from DB
const deleteData = async () =>{
    try{
        await Tour.deleteMany();
        // await User.deleteMany();
        // await Review.deleteMany();

        console.log("Data deleted from DB.")
    }catch(err){
        console.log(err)
    }
    process.exit()
}
if(process.argv[2] === "--import"){
    importData()
}else if(process.argv[2] === "--delete"){
    deleteData()
}