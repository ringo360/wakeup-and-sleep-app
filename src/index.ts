import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import loki from 'lokijs'

const db =new loki('./db/loki.json',{ autoupdate: true })

const items = db.addCollection('test')

items.insert({a: 1, b:2})
items.insert({a: 2, b:3})

try {
  db.saveDatabase()
  console.log('Saved')
} catch (e) {
  console.log('Something went wrong: ' + e)
}

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', (c) => {
  const result = items.findOne({a: 1})
  return c.text(result.a)
})

const port = 3150
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
