const mongoose = require("mongoose");
const validator = require("validator")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name!"]
    },
    email: {
        type: String,
        required: [true, "Please provide your email!"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email!"]
    },
    photo: {
        type: String,
        default: "default.jpg"
    },
    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user"
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "please confirm your password."],
        validate: {
            validator: function (val) {
                return val === this.password;
            }
        },
        message: "Password are not the same!"
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        default:true,
        select: false
    }
})
userSchema.pre("save", function(){
    if(!this.isModified("password") || this.isNew) return;
    this.passwordChangedAt= Date.now() - 1000; // 1 sec minus, bcz sometime token is issue before the passwordchangedAt
})
userSchema.pre("save", async function () {
    // document middleware
    if (!this.isModified("password")) return;
    // hash password before saving it
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    // from mongoose 7+. all middleware supports async functions without next. next is undefined here
    // next()
})
userSchema.methods.correctPassword = async (candidatePassword, password) => {
    //instance methods
    return await bcrypt.compare(candidatePassword, password)
}
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    // if passwordChangedAt does not exist means user has not changed password
    if (this.passwordChangedAt) {
        const changedTimeSatmp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        )
        return JWTTimeStamp < changedTimeSatmp;
    }
    return false;
}

userSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
    return resetToken;
}

userSchema.pre(/^find/,function(){
    // query middleware, this points to current query
    this.find({active:{$ne:false}})
})

const User = mongoose.model("User", userSchema)
module.exports = User;