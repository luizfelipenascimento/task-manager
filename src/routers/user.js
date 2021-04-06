const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const sharp = require('sharp')
const {calculateImageDimentions, upload} = require('../helper/utils')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')


router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send({error: e.message})
    } 
})

router.post('/users/login', async (req, res) => {
    try {
        const {email, password} = req.body
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(e) {
        res.status(400).send(e.message)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {        
        const filteredTokens = req.user.tokens.filter(doc => {
            return doc.token !== req.token
        })
        
        req.user.tokens = filteredTokens
        await req.user.save()

        res.send()
    
    } catch(e) {
        res.status(500).send()
    
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        const {user} = req
        user.tokens = []
        
        await user.save()
        
        res.send()    
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    const {user} = req
    res.send(user)
})

router.get('/users', async (req, res) => {
    try {
        const users = await User.find({})
        res.send(users)
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/:id', auth, async (req, res) => {
    const { id:_id } = req.params
    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
        
    } catch(e) {
        res.status(500).send()
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const {body:data} = req
    const updates = Object.keys(data)
    const allowedUpdatesProperties = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((updateKey) => allowedUpdatesProperties.includes(updateKey))

    if (!req.is('application/json')) 
        return res.sendStatus(400)

    if (!isValidOperation)
        return res.status(400).send( {error: 'invalid updates!'} )

    try {
        const {user} = req

        //esse new true como parametro para options ira retornar o novo usuario atualizado como resposta do evento async
        //const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true })

        updates.forEach(updateProperty => user[updateProperty] = data[updateProperty])
        
        await user.save()

        res.send(user)

    } catch(e) {
        res.status(400).send(e.message)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        const {user} = req
        //esse parametro req.user foi configurado na função de middleware auth
        await user.remove()
        sendCancelationEmail(user.email, user.name)
        res.send(user)
    } catch(e) {
        res.sendStatus(500)
    }
})




router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const {user, file} = req
    
    const sharpImg = await sharp(file.buffer)
    const {width, height} = await sharpImg.png().metadata()
    const newImageDimentions = calculateImageDimentions(width, height, 350)
    const avatarBuffer = await sharpImg.resize(newImageDimentions).toBuffer()

    user.avatar = avatarBuffer
    
    await user.save()
    res.send()

}, (error, req, res, next) => {
    res.status(404).send({
        error: error.message
    })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        const {user} = req
        user.avatar = undefined
        await user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const {id} = req.params
        const user = await User.findById(id)

        if (!user || !user.avatar) {
            throw new Error('not found')
        }

        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch(e) {    
        res.status(404).send()
    }
})

module.exports = router