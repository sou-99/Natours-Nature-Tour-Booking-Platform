const jwt = require("jsonwebtoken")
const User = require("../model/userModel")
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { promisify } = require("util")
// const sendEmail = require("../utils/email")
const Email = require("../utils/email")
const crypto = require("crypto");
const { RuleTester } = require("eslint");
const signToken = id => {
    const token = jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
    return token;
}

const createSendToken = (user,statusCode,res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly:true,
    }
    if(process.env.NODE_ENV === "production"){
        cookieOptions.secure = true; // bcz it works with https only
    }
    res.cookie("jwt",token,cookieOptions)
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data:{
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    })
    const url = `${req.protocol}://${req.get("host")}/me`
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser,201,res)
});
exports.login = catchAsync(async (req, res, next) => {
    //1) check if email & password there
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError("Please provide email and password.", 400))
    }
    //2) check if user exist
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect name or password.", 401))
    }
    //3) if all Ok send the token to client
    createSendToken(user,200,res)
});

exports.logout = (req,res,next) => {
    res.cookie("jwt","logout",{
        expires: new Date(Date.now() + 10 *1000),
        httpOnly: true
    })
    res.status(200).json({status:"success"})
}

exports.protect = catchAsync(async (req, res, next) => {
    //1) getting token & check if token is there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    }else if(req.cookies.jwt){
        token = req.cookies.jwt
    }

    if (!token) {
        return next(new AppError("You are not logged in.Please login to get access.", 401))
    }
    //2) verfication of token, it automatic throws error if any failure like expired/invalid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    //3) check if user still exists,after token is issued
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError("The user belonging to this token does no longer exist!", 401))
    }

    // //4) Check if user has changed it's password after token is issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError("User recently changed password. Please login again!", 401))
    }

    //finally, GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next()
});

exports.isLoggedIn = async (req, res, next) => {
    //1) verify token
   if(req.cookies.jwt){
    try{
    //2) check if user still exist
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next()
    }

    // //4) Check if user has changed it's password after token is issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next()
    }

    //finally, GRANT ACCESS TO PROTECTED ROUTE
    res.locals.user = currentUser;
    return next()
    }catch(err){
        return next()
    }
}
    next()
};

exports.restrictTo = (...roles) => {
    // As we can't directly pass arguments to the middleware function so we wrapped it with another functio
    // Inorder to form closure so that we can access the roles inside our middleware function
    return (req, res, next) => {
        // roles is an array , ["admin","lead-guide"]
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission to perform this action.", 403))
        }
        next();
    }
}
exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError("There is no user with this email address.", 404))
    }

    //2) Generate the ranmdom reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    //3) Send it to user's email
    // const message = `Forgot your password! Submit a PATCH request with your password & forgotPassword to: ${resetUrl}`

    try {
        // const options = {
        //     recipients: [
        //         user.email,
        //     ],
        //     subject: "Your password reset token expires in 10mins",
        //     message,

        // }
        // await sendEmail(options)
        // res.status(200).json({
        //     status: "success",
        //     message: "Token has sent to email!"
        // })
        let resetUrl = `${req.protocol}://${req.get("host")}/api/v1/users/resetpassword/${resetToken}`
        await new Email(user, resetUrl).sendPasswordReset();
        res.status(200).json({
            status: "success",
            message: "Token has sent to email!"
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("There was an error sending email. Try again later!", 500))
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })
    // 2) If the token is not expired, and there is a user , set the new password
    if (!user) {
        return next(new AppError("Token is expired or invalid.", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()
    // 3) update changedPasswordAt for the user
    // 4) log the user in, sent JWT
    createSendToken(user,200,res)
});

exports.updatePassword = catchAsync(async (req,res,next) => {
    console.log(req.user)
    // 1)Find user from collection
    const user = await User.findById(req.user.id).select("password");
    if(!user){
        return next(new AppError("User does not exist",401));
    }
    // 2) Check if the passwordCurrent provided matches it's current password
    let isMatched = await user.correctPassword(req.body.passwordCurrent,user.password)
    if(!isMatched){
        return next(new AppError("Password is incorrect.",401))
    }
    // 3) update user's new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // 4) Issue the new token to the user
    createSendToken(user,200,res)
})