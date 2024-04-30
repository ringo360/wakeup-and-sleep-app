import { serve } from '@hono/node-server'
import { Hono } from 'hono'



const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', (c) => {
  //fetch data from sqlite3
})

const port = 3150
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
