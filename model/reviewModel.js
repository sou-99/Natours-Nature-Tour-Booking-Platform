const { default: mongoose } = require("mongoose");
const Tour = require("./tourModel")
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, "Review must be provided."]
    },
    rating: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId, // parent referencing
        ref: "Tour",
        required: [true, "A review must belong to a Tour."]
    },
    guide: {
        type: mongoose.Schema.ObjectId, // parent referencing
        ref: "User",
        required: [true, "Review must belong to a User."]
    }
},
    {
        toJSON: {
            virtuals: true
        },
        toObject: {
            virtuals: true
        }
    }
)

reviewSchema.index({tour:1, guide:1},{unique:true}); // to do one user can write only one review for a tour

reviewSchema.statics.calcAvgRatings = async function(tourId){
    // calculate the tour ratingAverage & no. of rating each time there is review curd
    const stats = await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
            $group:{
                _id:"$tour",
                nRatings:{$sum:1},
                avgRatings:{$avg:"$rating"}
            }
        }
    ])
    // console.log(stats)
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:stats[0].nRatings,
            ratingsAverage:stats[0].avgRatings
        })
    }
}
reviewSchema.pre(/^find/,function(){
    // this.populate({
    //     path:"tour",
    //     select:"name"
    // }).populate({
    //     path:"guide",
    //     select:"name photo"
    // })
    this.populate({
        path:"guide",
        select:"name photo"
    })
})
reviewSchema.post("save",function(){
    // this points to current review
    // as Review modal is not created by this time so this.constructor help to access the calcAvgRating
    this.constructor.calcAvgRatings(this.tour)
})

//findByIDdAndUpdate
//findByIDdAndDelete
reviewSchema.pre(/^findOneAnd/,async function(){
    // in query middle ware the this refers to current query
    // this.model given the current model
    // this.getQuery() gives the query filter object
    // this.model.fineOne creates a separate query object 
    this.r = await this.model.findOne(this.getQuery());
})
reviewSchema.post(/^findOneAnd/,async function(){
    // in query middle ware the this refers to current query
    await this.r.constructor.calcAvgRatings(this.r.tour)
})
const Review = mongoose.model("Review", reviewSchema)
module.exports = Review;