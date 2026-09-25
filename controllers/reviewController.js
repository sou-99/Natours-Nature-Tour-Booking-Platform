const catchAsync = require("../utils/catchAsync");
const Review = require("../model/reviewModel")
const factory = require("./handlerFactory")

exports.getAllReviews = factory.getAll(Review)

// exports.getAllReviews = catchAsync(async (req,res,next) => {
//     // Allow nest get review on tour as well
//     let filter = {}
//     if(req.params.tourId) filter = {tour:req.params.tourId} 
//     const reviews = await Review.find(filter);
//     res.status(200).json({
//         status:"success",
//         results: reviews.length,
//         data:{
//             reviews
//         }
//     })
// })
exports.getReview = factory.getOne(Review)
exports.setTourUserIds = (req,res,next) => {
        // Allow the nested routes as well
        if(!req.body.tour) req.body.tour = req.params.tourId
        if(!req.body.guide) req.body.guide = req.user.id
        next()
}
exports.createReview = factory.createOne(Review)
// exports.createReview = catchAsync(async (req,res,next)=> {
//     // Allow the nested routes as well
//     if(!req.body.tour) req.body.tour = req.params.tourId
//     if(!req.body.guide) req.body.guide = req.user.id
//     console.log(req.body)
//     const newReview = await Review.create(req.body);
//     res.status(201).json({
//         status:"success",
//         data:{
//             review:newReview
//         }
//     })
// })
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review)