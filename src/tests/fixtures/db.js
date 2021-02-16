const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../../models/user')
const Task = require('../../models/task')

const {JWT_SECRET} = process.env




const userOneId = new mongoose.Types.ObjectId
const userOne = {
    _id: userOneId,
    name: 'Luiz Felipe',
    email: 'luiz@example.com',
    password: '123456!',
    tokens: [{
        token: jwt.sign({_id: userOneId}, JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId
const userTwo = {
    _id: userTwoId,
    name: 'Mike',
    email: 'mike@example.com',
    password: '123456!',
    tokens: [{
        token: jwt.sign({_id: userTwoId}, JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId,
    description: 'first task',
    completed: false,
    owner: userOneId
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId,
    description: 'second task',
    completed: true,
    owner: userOneId
}

const thirdTask = {
    _id: new mongoose.Types.ObjectId,
    description: 'third task',
    completed: false,
    owner: userOneId
}

const firstTaskUserTwo = {
    _id: new mongoose.Types.ObjectId,
    description: 'third task',
    completed: false,
    owner: userTwo._id
}

const setupDatabase = async () => {
    await Task.deleteMany()
    await User.deleteMany() //removing all users from db
    await new User(userOne).save() //creating a user for login
    await new User(userTwo).save() //creating a user for login
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(thirdTask).save()
    await new Task(firstTaskUserTwo).save()
}

module.exports = {
    userOneId,
    userOne,
    setupDatabase,
    userTwo,
    taskOne,
    taskTwo,
    taskThree: firstTaskUserTwo
}