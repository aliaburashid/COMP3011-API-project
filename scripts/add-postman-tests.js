#!/usr/bin/env node
/**
 * Adds failure test cases to the Postman collection per coursework feedback.
 */
const fs = require('fs')
const path = require('path')

const collectionPath = path.join(__dirname, '..', 'docs', 'FlickGallery-API.postman_collection.json')
const col = JSON.parse(fs.readFileSync(collectionPath, 'utf8'))

function findFolder(name) {
  return col.item.find((f) => f.name === name)
}

function addReq(folder, req) {
  folder.item.push(req)
}

// 2. Authors - add failure cases
const authors = findFolder('2. Authors (CRUD)')
const authorFailure = [
  {
    name: 'Get One Author invalid id → expect 400',
    event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }],
    request: { method: 'GET', url: '{{baseUrl}}/authors/invalid' }
  },
  {
    name: 'Get One Author not found → expect 404',
    event: [{ listen: 'test', script: { exec: ["pm.test('Status 404', () => pm.response.to.have.status(404));"], type: 'text/javascript' } }],
    request: { method: 'GET', url: '{{baseUrl}}/authors/507f1f77bcf86cd799439011' }
  },
  {
    name: 'Update Author without token → expect 401',
    event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }],
    request: {
      method: 'PUT',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: { mode: 'raw', raw: '{"name":"Test","bio":"Bio"}' },
      url: '{{baseUrl}}/authors/{{authorId}}'
    }
  },
  {
    name: 'Get Saved Posts without token → expect 401',
    event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }],
    request: { method: 'GET', url: '{{baseUrl}}/authors/saved' }
  }
]
authorFailure.forEach((r) => addReq(authors, r))

// Add password check to Get One Author
const getOneAuthor = authors.item.find((i) => i.name === 'Get One Author')
if (getOneAuthor && getOneAuthor.event) {
  const testEv = getOneAuthor.event.find((e) => e.listen === 'test')
  if (testEv && testEv.script) {
    testEv.script.exec.push("if (pm.response.code === 200) { const j = pm.response.json(); const a = j.author || j; if (a) pm.test('Password not in response', () => pm.expect(a).to.not.have.property('password')); }")
  }
}

// 3. Posts - add failure cases
const posts = findFolder('3. Posts (CRUD)')
const postFailure = [
  { name: 'Create Post without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"caption":"Test","imageUrl":"https://example.com/1.jpg","hashtags":["a"]}' }, url: '{{baseUrl}}/posts' } },
  { name: 'Create Post missing caption → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }, { key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"imageUrl":"https://example.com/1.jpg","hashtags":[]}' }, url: '{{baseUrl}}/posts' } },
  { name: 'Get One Post invalid id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'GET', url: '{{baseUrl}}/posts/invalid' } },
  { name: 'Get One Post not found → expect 404', event: [{ listen: 'test', script: { exec: ["pm.test('Status 404', () => pm.response.to.have.status(404));"], type: 'text/javascript' } }], request: { method: 'GET', url: '{{baseUrl}}/posts/507f1f77bcf86cd799439011' } },
  { name: 'Update Post without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'PUT', header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"caption":"X"}' }, url: '{{baseUrl}}/posts/{{postId}}' } },
  { name: 'Delete Post without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'DELETE', url: '{{baseUrl}}/posts/{{postId}}' } },
  { name: 'Like Post without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'POST', url: '{{baseUrl}}/posts/{{postId}}/like' } },
  { name: 'Like Post invalid id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }], url: '{{baseUrl}}/posts/invalid/like' } },
  { name: 'Save Post without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'POST', url: '{{baseUrl}}/posts/{{postId}}/save' } }
]
postFailure.forEach((r) => addReq(posts, r))

// 4. Comments - add failure cases
const comments = findFolder('4. Comments (CRUD)')
const commentFailure = [
  { name: 'Create Comment without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"content":"Hi"}' }, url: '{{baseUrl}}/posts/{{postId}}/comments' } },
  { name: 'Create Comment missing content → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }, { key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{}' }, url: '{{baseUrl}}/posts/{{postId}}/comments' } },
  { name: 'Create Comment invalid post id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }, { key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"content":"Hi"}' }, url: '{{baseUrl}}/posts/invalid/comments' } },
  { name: 'Delete Comment without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'DELETE', url: '{{baseUrl}}/comments/{{commentId}}' } },
  { name: 'Delete Comment invalid id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'DELETE', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }], url: '{{baseUrl}}/comments/invalid' } },
  { name: 'Like Comment without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'POST', url: '{{baseUrl}}/comments/{{commentId}}/like' } },
  { name: 'Like Comment invalid id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }], url: '{{baseUrl}}/comments/invalid/like' } }
]
commentFailure.forEach((r) => addReq(comments, r))

// 5. Tags - add edge cases
const tags = findFolder('5. Tags')
const tagEdge = [
  { name: 'Get posts by tag - no posts (empty array)', event: [{ listen: 'test', script: { exec: ["pm.test('Returns array', () => { const j = pm.response.json(); pm.expect(j.posts || j).to.be.an('array'); });"], type: 'text/javascript' } }], request: { method: 'GET', url: '{{baseUrl}}/tags/nonexistenttag12345' } },
  { name: 'Get posts by tag - unusual casing', event: [{ listen: 'test', script: { exec: ["pm.test('Returns 200', () => pm.response.to.have.status(200));"], type: 'text/javascript' } }], request: { method: 'GET', url: '{{baseUrl}}/tags/FASHION' } }
]
tagEdge.forEach((r) => addReq(tags, r))

// 6. Messages - add failure cases
const messages = findFolder('6. Messages (CRUD)')
const msgFailure = [
  { name: 'Send message without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"recipientId":"{{recipientId}}","content":"Hi"}' }, url: '{{baseUrl}}/messages' } },
  { name: 'Send message missing recipientId → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }, { key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"content":"Hi"}' }, url: '{{baseUrl}}/messages' } },
  { name: 'Send message missing content → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }, { key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"recipientId":"{{recipientId}}"}' }, url: '{{baseUrl}}/messages' } },
  { name: 'Send message invalid recipientId → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }, { key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"recipientId":"invalid","content":"Hi"}' }, url: '{{baseUrl}}/messages' } },
  { name: 'Get conversation invalid recipientId → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'GET', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }], url: '{{baseUrl}}/messages/conversation/invalid' } },
  { name: 'Get one message invalid id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'GET', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }], url: '{{baseUrl}}/messages/invalid' } },
  { name: 'Mark read without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'PUT', url: '{{baseUrl}}/messages/{{messageId}}/read' } },
  { name: 'Mark read invalid id → expect 400', event: [{ listen: 'test', script: { exec: ["pm.test('Status 400', () => pm.response.to.have.status(400));"], type: 'text/javascript' } }], request: { method: 'PUT', header: [{ key: 'Authorization', value: 'Bearer {{token}}' }], url: '{{baseUrl}}/messages/invalid/read' } },
  { name: 'Delete message without token → expect 401', event: [{ listen: 'test', script: { exec: ["pm.test('Status 401', () => pm.response.to.have.status(401));"], type: 'text/javascript' } }], request: { method: 'DELETE', url: '{{baseUrl}}/messages/{{messageId}}' } }
]
msgFailure.forEach((r) => addReq(messages, r))

fs.writeFileSync(collectionPath, JSON.stringify(col, null, 2), 'utf8')
console.log('Postman collection updated with failure test cases.')
