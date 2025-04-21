const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const body = request.body

  if (body.title === '' || body.url === '') {
    return response.status(400).json({ error: 'content missing' })
  }

  if (body.title === undefined || body.url === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  const user = request.user
  
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    return response.status(404).json({ error: 'Blog not found' })
  }

  const user = request.user

  if (blog.user.toString() !== user._id.toString()) {
    return response.status(403).json({ error: 'unauthorized' })
  }

  const deletedBlog = await Blog.findByIdAndDelete(request.params.id)
  if (!deletedBlog) {
    return response.status(404).json({ error: 'Blog not found or already removed' })
  }

  response.status(204).end()
})

blogsRouter.put('/:id', middleware.userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    return response.status(404).json({ error: 'Blog not found' })
  }

  const user = request.user

  if (blog.user.toString() !== user._id.toString()) {
    return response.status(403).json({ error: 'unauthorized' })
  }

  const body = request.body

  const newDataBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, newDataBlog, { new: true, runValidators: true, context: 'query' })
  
  if (!updatedBlog) {
    return response.status(404).json({ error: 'Blog not found or already removed' })
  }
  response.json(updatedBlog)
})

module.exports = blogsRouter