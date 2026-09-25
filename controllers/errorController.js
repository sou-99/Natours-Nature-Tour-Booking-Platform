const AppError = require("../utils/appError")
const handleCastErrorDB = err =>{
  let message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message,400)
}
const handleDuplicateFieldDB = err =>{
  let message = `Duplicate field value ${err.keyValue.name}. Please use another value.`
  return new AppError(message,400)
}

const handleValidationErrorDB = err =>{
  let errors = Object.values(err.errors).map((el)=>el.message)
  let message = `Invalid data input. ${errors.join(". ")}`
  return new AppError(message,400)
}

const handleJWTError = err => new AppError("Invalid token. Please login again!",401);

const handleJwtExpirationError = err => new AppError("Token is expired. Please login again to get access.",401)

const handleErrorDev = (err,req,res) => {
  // A) API
  if(req.originalUrl.startsWith("/api")){
    return res.status(err.statusCode).json({
      status: err.status || "error",
      message: err.message,
      error:err,
      stack: err.stack
    })
  }
    // B) Rendered webSite
   return res.status(err.statusCode).render("error",{
      title:"Something went wrong!",
      msg:err.message
    })
  
  
}

const handleErrorProd = (err,req,res) => {
  // A) API
  if(req.originalUrl.startsWith("/api")){
    if(err.isOperational){
      // Operational error are trusted , hence pass the error to client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    }
      // Programming error -> pass a generic error to client
      console.error("error=",err)
    return res.status(500).json({
        status: err.status,
        message: "Something went very wrong!",
      })
    
  }
  // B) Rendered WebSite
  if(err.isOperational){
    // Operational error are trusted , hence pass the error to client
    return res.status(err.statusCode).render("error",{
      title: "Something went wrong!",
      msg: err.message,
    })
  }
    // Programming error -> pass a generic error to client
    console.error("error=",err)
  return res.status(500).json({
      title: "Something went wrong!",
      msg: "Please try again later!",
    })
}
module.exports = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "failed";
    console.log(process.env.NODE_ENV)
    if(process.env.NODE_ENV === "development"){
      console.log(err.name)
      handleErrorDev(err,req,res)
    }else if(process.env.NODE_ENV === "production"){
      let error = {...err};
      error.message = err.message
      console.log(error)
    // if(error.name === "CastError") error = handleCastError(error)
    if(error.kind === "ObjectId") error = handleCastErrorDB(error)
    if(error.code === 11000) error = handleDuplicateFieldDB(error)
    if(error._message === "Validation failed") error = handleValidationErrorDB(error)
    if(error.name === "JsonWebTokenError") error = handleJWTError(error)
    if(error.name === "TokenExpiredError") error = handleJwtExpirationError(error)
      handleErrorProd(error,req,res)
    }
}