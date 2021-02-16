const path = require('path') 
require('dotenv').config({path: path.join(__dirname, '../../.env')})
const mongoose = require('mongoose')
const {DATABASE_URL} = process.env

const database = DATABASE_URL

mongoose.connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true, //search for database index
    useFindAndModify: false
}).then(() => {
}).catch(e => {
    console.log('Error to connect to dabase:', e.message)
})


