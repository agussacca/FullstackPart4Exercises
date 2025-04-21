const { test, after, beforeEach } = require('node:test')
const bcrypt = require('bcryptjs')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const User = require('../models/user')

const initialUsers = [
  {
    username: "test",
    name: "Test",
    passwordHash: "password",
    blogs: []
  },
]

beforeEach(async () => {
  await User.deleteMany({})

  for (let user of initialUsers) {
    const userObject = new User(user)
    await userObject.save()
  }
})

test('user without username is not added', async () => {
  const newUser = {
    name: "Agustin Sacca",
    passwordHash: "password",
    blogs: []
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  const response = await api.get('/api/users')
  assert.strictEqual(response.body.length, initialUsers.length)
})

test('username must have at least 3 characters', async () => {
  const newUser = {
    username: "ab", // username con menos de 3 caracteres
    name: "Short Username",
    password: "password"
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  const response = await api.get('/api/users')
  assert.strictEqual(response.body.length, initialUsers.length)
})

test('user without password is not added', async () => {
  const newUser = {
    username: "agussacca",
    name: "Agustin Sacca",
    blogs: []
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  const response = await api.get('/api/users')
  assert.strictEqual(response.body.length, initialUsers.length)
})

test('password must have at least 3 characters', async () => {
  const newUser = {
    username: "user",
    name: "Short password", // password con menos de 3 caracteres
    password: "pa"
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  const response = await api.get('/api/users')
  assert.strictEqual(response.body.length, initialUsers.length)
})

test('username must be unique', async () => {
  const newUser = {
    username: "test", // ya existe por defecto en initialUsers
    name: "Usuario Duplicado",
    passwordHash: "password"
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  assert.strictEqual(result.body.error, 'expected `username` to be unique')

  const response = await api.get('/api/users')
  assert.strictEqual(response.body.length, initialUsers.length)
})

after(async () => {
  await mongoose.connection.close()
})