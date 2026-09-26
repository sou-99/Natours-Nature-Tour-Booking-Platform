const Booking = require("../model/bookingModel");
const Tour = require("../model/tourModel");
const User = require("../model/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync")

exports.alerts = (req,res,next) => {
    const { alert } = req.query;
    if(alert === "booking"){
        res.locals.alert = "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up here immediately, please come back later."
    }
    next();
}

exports.getOverViewController = catchAsync(async(req, res) => {
    const tours = await Tour.find();
    res.status(200).render('overview', {
        title: "All Tours.",
        tours
    })
})
exports.getTour = catchAsync(async(req, res,next) => {
    const tour = await Tour.findOne({slug:req.params.slug}).populate({
        path:"reviews",
        fields:"review rating user"
    })
    if(!tour){
        return next(new AppError("There is no tour with that name.",404))
    }
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
})
exports.getLogInForm = (req,res) => {
    res.status(200).render('login', {
        title: `Login to your account.`,
    })
}

exports.getAccount = (req,res) => {
    res.status(200).render('account', {
        title: `Your account`,
    })
}
exports.updateUserData = catchAsync(async(req,res,next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id,{
        name: req.body.name,
        email: req.body.email
    },{
        new:true,
        runValidators: true
    })

    res.status(200).render('account', {
        title: `Your account`,
        user: updatedUser
    })
})
exports.getMyTours = catchAsync(async(req,res,next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({user:req.user.id})
    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour)
    const tours = await Tour.find({_id: {$in: tourIDs}})
    res.status(200).render('overview', {
        title: `My Tours`,
        tours
    })
})
