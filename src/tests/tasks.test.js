const request = require('supertest')
const Task = require('../models/task')
const app = require('../app')
const {userOneId, userOne, userTwo, taskOne, setupDatabase} = require('./fixtures/db')
const { mongo } = require('mongoose')

beforeEach(setupDatabase)

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: "fourth",
        })
        .expect(201)
    
    const task = await Task.findById(response.body._id)

    expect(task).not.toBeNull()
    expect(task.completed).toBe(false)
    expect(task.owner).toStrictEqual(userOneId)
})

test('Should return only user\'s tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const savedTasks = await Task.find({owner: userOneId})

    const tasks = response.body
    expect(tasks.length).toBe(savedTasks.length)

    tasks.forEach(task =>  expect(new mongo.ObjectID(task.owner)).toEqual(new mongo.ObjectID(userOneId)));
})

test('Should not delete others users tasks', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`) //taskOne belongs to user one
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`) // trying to login as user two to delete it
        .send()
        .expect(404) // expecting not found as return to this task id to user two
    
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull() //asserting task one was not deleted from database
})

test('Should not create task with invalid description', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: ''
        })
        .expect(400)
    
    
})

test('Should not create task with invalid completed', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'tasks 1231',
            completed: 'adad'
        })
        .expect(400)
    
})

test('Should not update task with invalid description', async () => {
    await request(app)
        .patch(`/tasks/${taskOne}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ description: ''})
        .expect(400)
})

test('Should not update task with invalid description', async () => {
    await request(app)
        .patch(`/tasks/${taskOne}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ completed: ''})
        .expect(400)
})

test('Should delete task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const task = await Task.findById(taskOne._id)
    expect(task).toBeNull()
})

test('Should not delete task if unauthenticated', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer `)
        .send()
        .expect(401)
})

test('Should not update other users task', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send({
            completed: true
        })
        .expect(404)
})

test('Should fetch user task by id', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const task = response.body
    expect(task).not.toBeNull()
    expect(new mongo.ObjectID(task._id)).toEqual(new mongo.ObjectID(taskOne._id))
})

test('Should not fetch user task by id if unauthenticated', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer asdasdsa`) //invalid token to not be authenticated
        .send()
        .expect(401)
})

test('Should not fetch other users task by id', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`) //task one belongs to user one 
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`) //trying to access users one task
        .send()
        .expect(404)
})

test('Should fetch only completed tasks', async () => {
    const response = await request(app)
        .get('/tasks?completed=true') //querying only completed tasks from user
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const tasks = response.body
    expect(tasks).not.toBeNull()

    const notCompletedTasks = tasks.filter(task => !task.completed) //filtering any task not completed in returned tasks
    expect(notCompletedTasks.length).toBe(0) //expecting not completed tasks filtered to be 0
})

test('Should fetch only incomplete tasks', async () => {
    const response = await request(app)
        .get('/tasks?completed=false') //querying only not completed tasks from user
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const tasks = response.body
    expect(tasks).not.toBeNull()

    const completedTasks = tasks.filter(task => task.completed) //filtering completed tasks from tasks list query
    expect(completedTasks.length).toBe(0) //expecting completedTasks length to be zero
})

test('Should sort tasks by description', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=description:asc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const tasks = response.body
    
    for (let i = 1; i < tasks.length; i++) {
        const compare = tasks[i - 1].description < tasks[i].description
        expect(compare).toBe(true)
    }
})

test('Should sort tasks by completed', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=completed:asc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const tasks = response.body

    for (let i = 1; i < tasks.length; i++) {
        const compare = tasks[i - 1].completed <= tasks[i].completed
        expect(compare).toBe(true)
    }
})

test('Should sort task by createdAt', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=createdAt:asc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const tasks = response.body

    for (let i = 1; i < tasks.length; i++) {
        const compare = new Date(tasks[i - 1].createdAt) < new Date(tasks[i].createdAt)
        expect(compare).toBe(true)
    }
})

test('Should sort tasks by updatedAt', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=updatedAt:asc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const tasks = response.body

    for (let i = 1; i < tasks.length; i++) {
        const compare = new Date(tasks[i - 1].updatedAt) < new Date(tasks[i].createdAt)
        expect(compare).toBe(true)
    }
})

test('Should fetch page of tasks', async () => {
    const response = await request(app)
        .get('/tasks?limit=2&skip=1')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const tasks = response.body
    expect(tasks).not.toBeNull()

    expect(tasks[0].description).toEqual('second task')
    expect(tasks[1].description).toEqual('third task')
})