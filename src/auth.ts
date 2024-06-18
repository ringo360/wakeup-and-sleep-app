import { Hono } from "hono"
import { CheckPass } from "./util"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { JWTSecret } from "./config"
import { verify } from "hono/jwt"
import { genRefToken, genAccToken } from "./util"

const auth = new Hono()
auth.use(logger())

auth.use(cors({
  'origin': '*',
  'allowMethods': ['GET', 'POST']
}))

auth.post('/login', async (c) => {
    const body = await c.req.parseBody()
    console.log(body)
    const { username, password } = body
    if (!username || !password) {
      console.log('Invalid Req')
      return c.json({
       'Result': 'Invalid Request'
      }, 400)
    }
    if (CheckPass(username as string, password as string) === true) {
      const res = await genRefToken(username as string, password as string)
      console.log(res)
      const isok = res[0]
      if (isok !== true) {
        return c.json({
          "Error": res[1]
        }, 500)
      }
      const x = res[1]
      console.log('ok!')
        return c.json({
            'Result': 'OK',
            't': x
        })
    } else {
        console.log('Failed')
        return c.json({
            'Result': 'Failed'
        }, 400)
    }
})

auth.get('/acctoken', async (c) => {
  console.log('Fire')
  const token = c.req.header('X-Token')
  if (!token) return c.json({"Error": "Body is invalid"})
  console.log(token)
  try {
    await verify(token as string, JWTSecret)
  } catch (e) {
    return c.json({
      "Error": "Invalid Token"
    })
  }
  console.log('Generating')
  const res = await genAccToken(token as string)
  console.log(res)
  const isok = res[0]
  if (isok !== true) {
    return c.json({
      "Error": res[1]
    }, 500)
  }
  return c.json({
    "OK": "Generated!",
    "AccessToken": res[1]
  })
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
