import { Hono } from "hono";


const server = new Hono()

server.get('/', (c) => {
    return c.text('It works✨')
})

export default server;