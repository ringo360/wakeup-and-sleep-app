import { Hono } from "hono"
import { CheckPass } from "./util"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import {html} from 'hono/html'

const auth = new Hono()
auth.use(logger())

auth.post('/login', async (c) => {
    const body = await c.req.parseBody()
    console.log(c.req.header('Content-Type'))
    console.log(body)
    const { username, password } = body
    if (!username || !password) {
      console.log('Invalid Req')
      return c.json({
       'Result': 'Invalid Request'
      }, 400)
    }
    if (CheckPass(username as string, password as string) === true) {
      const x = ''
      console.log('ok!')
        return c.json({
            'Result': 'OK',
            'Session': x
        })
    } else {
        console.log('Failed')
        return c.json({
            'Result': 'Failed'
        }, 400)
    }
})

auth.get('/info', async (c) => {
  console.log('a')
})

auth.post('/logout', async (c) => {
    return c.json({
        'Result': 'OK'
    })
})
export default auth;
