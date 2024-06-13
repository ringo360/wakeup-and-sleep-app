import { Hono } from "hono"
import { CookieStore, Session, sessionMiddleware } from "hono-sessions"
import { CheckPass } from "./util"
import { logger } from "hono/logger"
import { cors } from "hono/cors"

const store = new CookieStore()
const session_routes = new Hono<{
    Variables: {
      session: Session,
      session_key_rotation: boolean
    }
}>().basePath('/auth')

session_routes.use(logger())

session_routes.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE']
}))

session_routes.use('*', sessionMiddleware({
  store,
  expireAfterSeconds: 120, //120sec for dev
  cookieOptions: {
    sameSite: 'Lax',
    path: '/',
    httpOnly: true,
  },
  encryptionKey: '8tWz65V7YAUdSG6uEnNB9DkxZNmkG8QQ' //32文字以上
}))

session_routes.post('/login', async (c) => {
    const session = c.get('session')
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
      console.log('ok!')
        c.set('session_key_rotation', true)
        session.set('username', username)
        session.set('failed-login-attempts', null)
        session.flash('result', 'success')
        return c.json({
            'Result': 'OK'
        })
    } else {
        console.log('Failed')
        const C_Fail = (session.get('failed-login-attempts') || 0 ) as number
        session.set('failed-login-attempts', C_Fail + 1)
        session.flash('result', 'failed')
        return c.json({
            'Result': 'Failed'
        }, 400)
    }
})

session_routes.get('/info', async (c) => {
  const session = c.get('session')
  const user = session.get('username')
  if (!user) return c.text('You need to login!', 400)
  else c.text(`Hello, ${user}!`, 200)
})

session_routes.post('/logout', async (c) => {
    c.get('session').deleteSession()
    return c.json({
        'Result': 'OK'
    })
})

export default session_routes;
