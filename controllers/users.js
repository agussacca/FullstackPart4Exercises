const bcrypt = require('bcryptjs')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', {url:1,title:1,author:1})
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name } = request.body
  const password = request.body.passwordHash

  if (username === '' || password === '') {
    return response.status(400).json({ error: 'content missing' })
  }
  
  if (username === undefined || password === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  if (password.length < 3){
    return response.status(400).json({ error: 'password must have at least 3 characters' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

module.exports = usersRouter