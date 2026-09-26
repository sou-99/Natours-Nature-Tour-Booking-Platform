const express = require('express');
const morgan = require('morgan');
const AppError = require("./utils/appError")
const globalErrorHandler = require("./controllers/errorController")
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require("./routes/reviewRoutes")
const overViewRouter = require("./routes/overviewRoutes")
const bookingRouter = require("./routes/bookingRoutes")

// const pug = require("pug")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss-clean")
const hpp = require("hpp")
const path = require("path");
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const cookieParser = require("cookie-parser")
const compression = require("compression")
const app = express();

app.set("view engine","pug")
app.set("views",path.join(__dirname,"views"))

// 1) GLOBAL MIDDLEWARES
//serving static files
app.use(express.static(path.join(__dirname,"public")));
//set security HTTP headers, it adds security headers automatic , a standard in express apps
app.use(helmet(
  {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://api.mapbox.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: [
          "'self'",
          "https://api.mapbox.com",
          "https://fonts.googleapis.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.mapbox.com"
        ],
        connectSrc: [
          "'self'",
          "https://api.mapbox.com",
          "https://*.mapbox.com",
          "https://cdn.jsdelivr.net",
          "ws://127.0.0.1:*",
        ],
        workerSrc: [
          "'self'",
          "blob:"
        ],
        scriptSrc: [
          "'self'",
          "https://api.mapbox.com",
          "https://cdn.jsdelivr.net"
        ]
      }
    }
  }
))

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  // limiting api requests to max times per hour
  max: 90,
  windowMs: 60 *60 *1000,
  message:"Too many requests from this IP. Please try again later."
})
//Limit request from same API
app.use("/api",limiter)
// Body parser, attaches the API request body to req.body
app.use(express.json({limit:"10kb"}));
app.use(express.urlencoded({extended:true,limit:"10kb"}))
app.use(cookieParser())
// Data sanitization against noSQL query injection eg. email:{"gt":""}
app.use(mongoSanitize())
//Data sanitization against XSS
app.use(xss())
app.use(cors())
app.options('*', cors())
// Prevent parameter pollution 
//eg. ?sort=duration&sort=price -> generally throws error -> need to use hpp to consider last query like sort=price
// white listed values are allowed to provide range like ?duration=2&duration=5
app.use(hpp({
  whitelist:[
    "duration",
    "ratingsQuantity",
    "ratingsAverage",
    "maxGroupSize",
    "difficulty",
    "price"
  ]
}))



//it is just a test middleware
app.use((req, res, next) => {
  // console.log('Hello from the middleware 👋');
  next();
});

app.use(compression())
//it is just a test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies)
  next();
});

//middlewares for specific routes
app.use("/",overViewRouter)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//handle all the wrong apis
app.all("*",(req,res,next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`,404))
})
// global error middleware
app.use(globalErrorHandler)
module.exports = app;
