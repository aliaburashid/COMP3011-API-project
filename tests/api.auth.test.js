const request = require('supertest')

const app = require('../app')
describe('API smoke tests (no DB dependency)', () => {
  test('signup rejects missing required fields (400)', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'x@example.com' })
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  test('root route redirects to sign-in page', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/authors/login')
  })

  test('protected profile route rejects missing token (401)', async () => {
    const res = await request(app).get('/api/authors/profile')
    expect(res.statusCode).toBe(401)
    expect(res.body).toHaveProperty('message', 'Not authorized')
  })

  test('protected post creation rejects missing token (401)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ caption: 'Missing token should fail' })
    expect(res.statusCode).toBe(401)
  })

  test('protected message route rejects missing token (401)', async () => {
    const res = await request(app).get('/api/messages/inbox')
    expect(res.statusCode).toBe(401)
  })

  test('protected author update rejects missing token (401)', async () => {
    const res = await request(app)
      .put('/api/authors/507f1f77bcf86cd799439011')
      .send({ bio: 'No token' })
    expect(res.statusCode).toBe(401)
  })

  test('protected author delete rejects missing token (401)', async () => {
    const res = await request(app).delete('/api/authors/507f1f77bcf86cd799439011')
    expect(res.statusCode).toBe(401)
  })

  test('protected comment creation rejects missing token (401)', async () => {
    const res = await request(app)
      .post('/api/posts/507f1f77bcf86cd799439011/comments')
      .send({ content: 'No token' })
    expect(res.statusCode).toBe(401)
  })

  test('protected comment delete rejects missing token (401)', async () => {
    const res = await request(app).delete('/api/comments/507f1f77bcf86cd799439011')
    expect(res.statusCode).toBe(401)
  })

  test('protected mark-message-read rejects missing token (401)', async () => {
    const res = await request(app).put('/api/messages/507f1f77bcf86cd799439011/read')
    expect(res.statusCode).toBe(401)
  })

  test('protected save-post rejects missing token (401)', async () => {
    const res = await request(app).post('/api/posts/507f1f77bcf86cd799439011/save')
    expect(res.statusCode).toBe(401)
  })

  test('unknown route returns JSON 404 response', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('message')
  })
})
