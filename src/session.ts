import { Hono } from "hono"
import { CookieStore, Session, sessionMiddleware } from "hono-sessions"
import { CheckPass } from "./util"

const store = new CookieStore()
const session_routes = new Hono<{
    Variables: {
      session: Session,
      session_key_rotation: boolean
    }
  }>().basePath('/auth')
  
session_routes.use('*', sessionMiddleware({
  store,
  expireAfterSeconds: 30, //30sec for dev
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
    const { username, password } = body
    if (CheckPass(username as string, password as string) === true) {
        c.set('session_key_rotation', true)
        session.set('username', username)
        session.set('failed-login-attempts', null)
        session.flash('result', 'success')
        return c.json({
            'Result': 'OK'
        })
    } else {
        const C_Fail = (session.get('failed-login-attempts') || 0 ) as number
        session.set('failed-login-attempts', C_Fail + 1)
        session.flash('result', 'failed')
        return c.json({
            'Result': 'Failed'
        })
    }
})

session_routes.post('/logout', async (c) => {
    c.get('session').deleteSession()
    return c.json({
        'Result': 'OK'
    })
})

export default session_routes;