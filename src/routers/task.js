const express = require('express')
const Task = require('../models/task')
const router = express.Router()
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id //setting owner id to this task - this id came from auth function with token validation
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }

})

//pagination
// limit skip 
//GET /tasks?limit=10&skip=0 
//skip ira permitir navegar entre as paginas, se nos fizermos o skip de 10 iremos ler os dados de 10 paginas adiante 
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const {completed, limit, skip, sortBy} = req.query
    const match = {}
    const sort = {}
    
    if (completed) {
        match.completed = completed === 'true'
    }

    if (sortBy) {
        const parts = sortBy.split(':') // usando split para separar as duas partes createdAt:asc 
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 // configurando 
    }
    
    try {
        const {user} = req
        //const tasks = await Task.find({owner: user._id}) this also solve this task of listing all tasks
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                sort
            }
        }).execPopulate() //when we use populate it set to model property instead of returning a value, in this case to tasks property
        res.send(user.tasks) //thats why we need to access tasks in user instance
    } catch(e) {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const {id:_id} = req.params
    
    try {
        const task = await Task.findOne({_id, owner: req.user._id})

        if (!task)
            return res.status(404).send()
        
        res.send(task)
    } catch(e) {
        console.log(e)
        res.status(500)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    if (!req.is('application/json'))
        return res.sendStatus(400)
    
    const updates = Object.keys(req.body)
    const allowedUpdateProperties = ['completed', 'description']
    const isValidOperation = updates.every((updateKey) => allowedUpdateProperties.includes(updateKey))

    if (!isValidOperation) 
        return res.status(400).send({error: 'Invalid updates!'})

    try {
        const _id = req.params.id
        const data = req.body

        const task = await Task.findOne({_id, owner: req.user._id})

        if (!task) 
            return res.status(404).send({error: 'task not found'})
        
        updates.forEach(updateProperty =>  task[updateProperty] = data[updateProperty])

        task.save()

        res.send(task)

    } catch(e) {
        console.log(e)
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id
        const task = await Task.findOneAndDelete({_id, owner: req.user._id})

        if (!task)
            return res.sendStatus(404)

        res.send(task)

    } catch(e) {
        res.sendStatus(500)
    }
})

module.exports = router