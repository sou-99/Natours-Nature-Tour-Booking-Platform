const mongoose = require("mongoose");
const slugify = require("slugify")
const validator = require("validator")
const User = require("./userModel")
const tourSchema = new mongoose.Schema({
    name:{
      type: String,
      required: [true,"A tour must have a name."],
      unique:true,
      trim:true,
      minlength:[10,"The name must be equal or more than 10 characters"],
      maxlength:[50,"The name must be less or equal than 50 characters"],
      // validate:[validator.isAlpha,"Tour name must only contain characters."]
    },
    slug: String,
    duration:{
      type:Number,
      required:[true,"A tour mut have a duration."]
    },
    maxGroupSize:{
      type:Number,
      required:[true,"A tour must have a group size."]
    },
    difficulty:{
      type:String,
      required:[true,"A tour must have a difficulty."],
      enum:{
        values:["easy","difficult","medium"],
        message:"Difficulty is either easy, difficult, medium"
      }
    },
    ratingsAverage:{
      type: Number,
      default:4.5,
      min:[1,"Rating must be greater or equal than 1"],
      max:[5,"Rating must be equal or smaller than 5"],
      set: val => Math.round(val*10)/10 // A setter function to round off the value to x.y
    },
    ratingsNumber:{
      type:Number,
      default:0
    },
    ratingsQuantity:{
      type:Number,
      default:0
    },
    price:{
      type:Number,
      required:[true,"A tour must have a price."]
    },
    priceDiscount: {
      type: Number,
      validate:{
        validator: function(val){
          return val < this.price;
        },
        message:"Discount price ({VALUE}) should be below regular price."
      }
    },
    summary:{
      type:String,
      trim:true,
      required:[true,"A tour must have a description."]
    },
    description:{
      type: String,
      trim:true
    },
    imageCover:{
      type:String,
      required:[true,"A tour must have a image cover."]
    },
    images:[String],
    createdAt:{
      type: Date,
      default: Date.now(),
      select:false
    },
    startDates: [Date],
    secretTour:{
      type: Boolean,
      default: false
    },
    startLocation:{
      // geoJSON
      type:{
        type: String,
        default:"Point",
        enum:["Point"]
      },
      coordinates:[Number],
      address: String,
      description:String
    },
    locations:[ // embedded documents
      {
        type:{
          type: String,
          default:"Point",
          enum:["Point"]
        },
        coordinates:[Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // 1) guides: Array // embedding
    guides: [ // referencing
      {
        type: mongoose.Schema.ObjectId,
        ref:"User"
      }
    ]
  },{
    toJSON:{
      virtuals:true
    },
    toObject:{
      virtuals:true
    }
  })

  // Indexing to increase the read performance, we need to use index with fields that most frequently queried to raed data;
  // tourSchema.index({price: 1})
  tourSchema.index({price: 1,ratingsAverage:-1})
  tourSchema.index({slug: 1})
  tourSchema.index({startLocation:"2dsphere"}) // allowing to do geoSpatial queries on startLocation 
  tourSchema.virtual("durationWeeks").get(function(){
    return this.duration / 7;
  })
  tourSchema.virtual("reviews",{
    ref:"Review",
    foreignField:"tour", // as in review model tour variabled used as the reference to tour
    localField:"_id" // in tour model it is the _id
  })
  // MONGOOSE DOCUMET MIDDLEWARE RUN BEFORE SAVE() & CREATE()
  tourSchema.pre("save",function(){
    console.log("Will save document-----")
    this.slug = slugify(this.name,{lower:true})
    // next()
  })
  // used to query and pass the users info to the client , no operation on actual documents
  // for big apps populate will hamper performance
  tourSchema.pre(/^find/,function(){
    this.populate({
      path:"guides",
      select: "-__v -passwordChangedAt"
    })
  })

  // DATA MODELLING 
  // 1) It is the few:few embedding between tour & user
  // tourSchema.pre("save",async function(){ // embedding users into tours
  //   const guidesPromises = this.guides.map(async(id) => await User.findById(id))
  //   this.guides = await Promise.all(guidesPromises)
  // })
  
  // tourSchema.pre("save",function(next){
  //   console.log("Will save document-----")
  //   next()
  // })
  // tourSchema.post("save",function(doc,next){
  //   console.log(doc)
  //   next()
  // })

  //  QUERY MIDDLEWARE
  // tourSchema.pre(/^find/,async function(next){
  //   await this.find({secretTour:{$ne:true}})
  //   this.start = Date.now()
  //   next()
  // })
  // tourSchema.post(/^find/,function(doc,next){
  //   console.log(`Query took ${Date.now()- this.start} Milliseconds`)
  //   console.log(doc)
  //   next()
  // })

  // AGGREGATION MIDDLEWARE

  // tourSchema.pre("aggregate",function(next){
  //   this.pipeline().unshift({$match:{secretTour:{$ne:true}}})
  //   next()
  // })


  const Tour = mongoose.model("Tour",tourSchema)
  module.exports = Tour;
//   const testTour = new Tour({
//     name:"The Forest Hiker.1",
//     rating:4.9,
//     price:497
//   })
  
//   testTour.save().then((doc)=>console.log(doc)).catch((err)=>console.log(err))