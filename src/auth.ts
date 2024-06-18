import { Hono } from "hono"
import { CheckPass } from "./util"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { JWTSecret } from "./config"
import { decode, verify } from "hono/jwt"
import { genRefToken, genAccToken, TokenDisabler } from "./util"
const t_disabler = new TokenDisabler()

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
  const token = c.req.header('X-Token')
  if (!token) {
    return c.json({
      'Error': 'Invalid Request'
    }, 400)
  }
  const v_res = await verify(token, JWTSecret)
  console.log(v_res) //for dev
  const res = await decode(token)
  console.log(res) //for dev
  return c.json({
    'OK': 'Success!',
    'res': res
  })
})

auth.post('/logout', async (c) => {
  try {
    const body = await c.req.parseBody()
    const { t } = body
    t_disabler.add(t as string)
    return c.json({
      'Result': 'OK'
    })
  } catch (e) {
    console.error(e)
    return c.json({
      'Result': 'Failed (check server log)'
    }, 500)
  }
})
export default auth;
