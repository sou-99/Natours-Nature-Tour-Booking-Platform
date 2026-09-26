const Booking = require("../model/bookingModel");
const Tour = require("../model/tourModel");
const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    // 1) Get the currently booked tour
    const tourId = req.params.tourId;
    const tour = await Tour.findById(tourId);
    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours/?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: tour.price * 100,
          
                product_data: {
                  name: `${tour.name} Tour`,
                  description: tour.summary,
                  images: [
                    `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
                  ]
                }
              },
              quantity: 1
            }
          ]
    })
    // 3) Send it as response
    res.status(200).json({
        status: 'success',
        session
    })
})
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // This is TEMPORARY because it's unsecure: everyone can make bookings without paying
//     const { tour, user, price } = req.query;
//     if (!tour && !user && !price) return next();
//     await Booking.create({ tour, user, price });
//     res.redirect(req.originalUrl.split('?')[0]);
// })
const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.billing_details.email })).id;
    const price = session.amount / 100;
    await Booking.create({ tour, user, price });
}
exports.webhookCheckout = (req, res, next) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(session)
        // Create a booking
        createBookingCheckout(session);
    }
    res.status(200).json({ received: true });
}
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
