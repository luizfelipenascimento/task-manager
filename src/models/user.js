const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const {JWT_SECRET} = process.env

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value === 'password') {
                throw new Error('You are not allowed to use this password')
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    }, 
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task', // The model to use
    localField: '_id', // Find task where `localField`
    foreignField: 'owner' // is equal to foreignField (owner) in Task document
}) 

userSchema.methods.toJSON = function () {
    const {_id, name, age, email, createdAt, updatedAt} = this.toObject()
    const publicProfile = {
        _id, name, age, email, createdAt, updatedAt
    }

    return publicProfile
}

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id}, JWT_SECRET)

    user.tokens.push({token})
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) 
        throw new Error('unable to login')

    const isMacth = await bcrypt.compare(password, user.password)
    
    if(!isMacth) 
        throw new Error('Unable to login')

    return user
}

//hash the plain text before saving
userSchema.pre('save', async function (next) {
    const user = this
    
    //checking if password is already hashed
    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 8) //hashing password with bcrypt

    next()
})

//middleware to delete user tasks when user is deleted
userSchema.pre('remove', async function (next) {
    const user = this 

    await Task.deleteMany({owner: user._id})

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User