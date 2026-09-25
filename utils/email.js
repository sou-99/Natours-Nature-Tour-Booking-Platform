const Nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email{
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = {
            address: process.env.EMAIL_FROM,
            name: process.env.Email_NAME,
        }
    }

    newTransport() {
        if(process.env.NODE_ENV === 'production') {
            return Nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                  user: 'apikey',
                  pass: process.env.SENDGRID_API_KEY
                }
              });
        }
       
        return Nodemailer.createTransport(
            MailtrapTransport({
                token: process.env.NODEMAILER_TOKEN,
            })
        );
    }

    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            subject,
            url: this.url,
        });
        // 2) Define email options
        const mailOptions = {
            from: process.env.NODE_ENV === 'production'?process.env.EMAIL_FROM:this.from,
            to: this.to,
            subject: subject,
            html: html,
            text: htmlToText.convert(html),
        };
        // 3) Create a transport and send email
        const transport = this.newTransport();

        await transport.sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome','Welcome to the Natures family!');
    }
    async sendPasswordReset() {
        await this.send('passwordReset','Your password reset token (valid for only 10 minutes)');
    }
}




// const sendEmail = async (options) => {
//     const TOKEN = process.env.NODEMAILER_TOKEN;

//     const transport = Nodemailer.createTransport(
//         MailtrapTransport({
//             token: TOKEN,
//         })
//     );

//     const sender = {
//         address: process.env.EMAIL_FROM,
//         name: process.env.Email_NAME,
//     };

//     await transport
//         .sendMail({
//             from: sender,
//             to: options.recipients,
//             subject: options.subject,
//             text: options.message,
//             category: "Integration Test",
//         })
//     //   .then(console.log, console.error);
// }
// module.exports = sendEmail;