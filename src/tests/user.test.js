const request = require('supertest')
const app = require('../app');
const User = require('../models/user');
const { userOneId, userOne, setupDatabase, userTwo } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'urdrandin',
        email: 'urdrandin@example.com',
        password: '123456789!'
    }).expect(201)

    //Assert that the user was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertion about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'urdrandin',
            email: 'urdrandin@example.com',
        },
        token: user.tokens[0].token
    })

    //asserting user password
    expect(user.password).not.toBe('123456789!')
})

test('Should login existing user', async () => {
    const resp = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    const { token } = resp.body

    expect(token).toBe(user.tokens[1].token)

})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: 'nonexistent@exemple.com',
        password: '3214654'
    }).expect(400)
})

test('Should get profile for user', async () => {
    //this is a path witch requires an authenticated token
    //so first we need to set our authorization header
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)

    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer asdasd`)
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    //we need to get access to an image that we can use in test cases

    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'src/tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))

})

test('Upload update valid user fields', async () => {

    const name = 'Urdrandin thor'

    await request(app)
        .patch('/users/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ name })
        .expect(200)

    const user = await User.findById(userOneId)

    expect(user.name).toBe(name)
})

test('Should not update invalid user fields', async () => {
    const resp = await request(app)
        .patch('/users/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ location: 'asdasdasdasdweqwe' })
        .expect(400)
})


test('Should not signup user with invalid name', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: '',
            email: 'urdrandin@example.com',
            password: '123456789!'
        })
        .expect(400)

})

test('Should not signup user with invalid email', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'test',
            email: 'test',
            password: '123456789!'
        })
        .expect(400)
})

test('Should not signup user with invalid password', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'test',
            email: 'test@test.com',
            password: ''
        })
        .expect(400)
})

test('Should not update user if unauthenticated', async () => {
    const response = await request(app)
        .patch(`/users/me`)
        .send({ name: 'luiz' })
        .expect(401)
})


test('Should not update user with invalid name', async () => {
    const response = await request(app)
        .patch(`/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: ''
        })
        .expect(404)
})

test('Should not update user with invalid email', async () => {
    const response = await request(app)
        .patch(`/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            email: 'test'
        })
        .expect(404)
})

test('Should not update user with invalid password', async () => {
    const response = await request(app)
        .patch(`/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            password: 1212
        })
        .expect(404)
})

test('Should not delete user if unauthenticated', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})
