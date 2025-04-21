const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

const User = require('../models/user')

let token = null

const initialBlogs = [
  {    
    title: "My first blog",
    author: "Agustin",
    url: "http://localhost:3003/api/blogs/myfirstblog",
    likes: 5
  },
  {
    title: "My second blog",
    author: "Agustin",
    url: "http://localhost:3003/api/blogs/mysecondblog",
    likes: 1
  },
]

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('clave', 10)
  const user = new User({ username: 'testuser', name: 'Test User', passwordHash })
  const savedUser = await user.save()

  const loginResponse = await api
  .post('/api/login')
  .send({ username: 'testuser', password: 'clave' })

  token = loginResponse.body.token

  const blogObjects = initialBlogs.map(blog => new Blog({ ...blog, user: savedUser._id }))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('unique identifier property of blog posts is named id', async () => {
  const response = await api.get('/api/blogs')

  const blogs = response.body

  blogs.forEach(blog => {
    assert.ok(blog.id)
    assert.strictEqual(typeof blog.id, 'string')
    assert.strictEqual(blog._id, undefined)
  })
})

test('a valid blog can be added ', async () => {
  const newBlog = {
    title: "blog has a title",
    author: "Agustin",
    url: 'http://localhost:3003/api/blogs/randomblog',
    likes: 1
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)

  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  assert.strictEqual(response.body.length, initialBlogs.length + 1)

  assert(titles.includes('blog has a title'))
})

test('property "likes" defaults to 0 when is missing', async () => {
  const newBlog = {
    title: 'Blog without likes',
    author: 'Agustin',
    url: 'http://localhost:3003/api/blogs/nolikes'
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const createdBlog = response.body
  assert.strictEqual(createdBlog.likes, 0)
})

test('blog without title is not added', async () => {
  const newBlog = {
    author: 'Agustin',
    url: 'http://localhost:3003/api/blogs/notitle',
    likes: 2
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('blog without url is not added', async () => {
  const newBlog = {
    title: 'Blog without url',
    author: 'Agustin',
    likes: 4
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToDelete = blogsAtStart.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)

  const blogsReturned = await api.get('/api/blogs')
  const blogsAtEnd = blogsReturned.body

  const titles = blogsAtEnd.map(r => r.title)
  assert(!titles.includes(blogToDelete.title))

  assert.strictEqual(blogsAtEnd.length, initialBlogs.length - 1)
})

test('a blog can be updated', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToUpdate = blogsAtStart.body[0]

  const updatedData = {
    title: blogToUpdate.title,
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: blogToUpdate.likes + 5
  }

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updatedData)
    .expect(200)

  const blogsAtEnd = await api.get('/api/blogs')
  const updatedBlog = blogsAtEnd.body.find(b => b.id === blogToUpdate.id)

  assert.strictEqual(updatedBlog.likes, updatedData.likes)
})

after(async () => {
  await mongoose.connection.close()
})