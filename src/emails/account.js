const sgMail = require('@sendgrid/mail')

const {SENDGRID_API_KEY} = process.env
sgMail.setApiKey(SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'urdrandin.wow@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    }) 
}

const sendCancelationEmail  = (email, name) => {
    sgMail.send({
        to: email,
        from: 'urdrandin.wow@gmail.com',
        subject: 'Account Cancelation',
        text: `Goodbye ${name}. I hope to see you back sometime soon.\n`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail 
}