import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { addusr, findusr, genRefToken, genAccToken, CheckPass } from "./util"
import { JWTSecret, port } from "./config"
import { verify } from "hono/jwt"
import session_routes from "./session"

//p-dev.ringoxd.dev
const app = new Hono()

app.route('/', session_routes)

app.use(logger())

app.use('/v1/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE']
}))

app.get('/', (c) => {
  return c.text('It works✨')
})

app.get('/v1/user/acctoken', async (c) => {
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
    "OK": "Generated AccessToken!",
    "AccessToken": res[1]
  })
})

app.post('/v1/user', async (c) => {
  try {
    const body = await c.req.parseBody()
    const { username, password } = body
    if (!username || !password) {
      return c.json({
        "Error": "Invalid body(need username and password)"
      }, 400) //read http.cat
    } else {
      const res = addusr(username as string, password as string)
      if (res === 'ok') {
        const res_gr = await genRefToken(username as string, password as string)
        const isok_r = res_gr[0] as Boolean
        const msg_r = res_gr[1] as string
        console.log(res_gr)
        console.log(isok_r)
        console.log(msg_r)
        if (isok_r !== true) {
          return c.json({
            "Error": msg_r
          }, 500)
        }
        return c.json({
          "OK": "Registered!",
          "RefreshToken": msg_r
        })
      } else if (res === 'already exists') {
        return c.json({
          "Error": "Already exists!"
        }, 400)
      }
    }
  } catch (e) {
    console.log(e)
  }
})

app.get('/find/:user', async (c) => {
  const target = c.req.param('user')
  console.log(`Finding ${target}`)
  const res:any = await findusr(target)
  const x = res[0]
  
  if (x.usrname) {
    return c.json({
      "user": x.usrname,
      "date": x.creationdate
    })
  } else {
    return c.json({
      "error": `cannot find ${target}`
    }, 404)
  }
})


app.notFound((c) => {
  return c.text('404 - Are you lost?', 404)
})


console.log(`Listening port ${port}`)
serve({
  fetch: app.fetch,
  port
})