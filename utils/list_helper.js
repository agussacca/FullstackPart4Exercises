const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  if (blogs.length === 0) return 0

  if (blogs.length === 1) {
    return blogs[0].likes
  }
  else {
    return blogs.reduce((sum, element) => sum + element.likes, 0)
  }
}

const favoriteBlog = (blogs) => {
  const blogMostLiked = blogs.reduce((max, blog) => {
    return blog.likes > max.likes ? blog : max
  })

  return {
    title: blogMostLiked.title,
    author: blogMostLiked.author,
    likes: blogMostLiked.likes
  }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null
  
  const blogsCount = {}
  
  blogs.forEach(blog => {
    blogsCount[blog.author] = (blogsCount[blog.author] || 0) + 1
  })

  let maxAuthor = null
  let maxBlogs = 0

  for (const author in blogsCount) {
    if (blogsCount[author] > maxBlogs) {
    maxAuthor = author
    maxBlogs = blogsCount[author]
    }
  }

  return {
    author: maxAuthor,
    blogs: maxBlogs
  }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null
  
  const likesCount = {}
  
  blogs.forEach(blog => {
    likesCount[blog.author] = (likesCount[blog.author] || 0) + blog.likes
  })

  let maxAuthor = null
  let maxLikes = 0

  for (const author in likesCount) {
    if (likesCount[author] > maxLikes) {
    maxAuthor = author
    maxLikes = likesCount[author]
    }
  }

  return {
    author: maxAuthor,
    likes: maxLikes
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}