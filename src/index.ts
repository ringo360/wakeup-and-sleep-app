import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import Database from 'better-sqlite3'

//SQLite3
// const db = new sqlite3.Database('./db/database.db') old code
const db = new Database('./db/database.db')

//READ https://github.com/WiseLibs/better-sqlite3/

function init() {
  
  db.exec("drop table if exists members");
  db.exec("create table if not exists members(name,age)");

  db.exec("drop table if exists members"); //need to delete this
  db.exec("create table if not exists userdb(name,password)");
  /*
  db.exec("insert into members(name,age) values(?,?)", "hoge", 33);
  db.exec("insert into members(name,age) values(?,?)", "foo", 44);
  db.exec("update members set age = ? where name = ?", 55, "foo");
  db.each("select * from members", (err, row) => {
      console.log(`${row.name} ${row.age}`);
  });
  */
  const x = db.prepare('insert into members(name, age) values (?,?)')
  x.run('hoge', 33)
  x.run('foo', 44)
 
  const res = db.prepare("select * from members").get()
  console.log(res)
  // console.log(JSON.stringify(res))
  /*
  db.get("select count(*) from members", (err, count) => {
      console.log(count["count(*)"]);
  })
  */
  console.log('[SQLite3] Ready!')
}

console.log('Loading...')
init()

console.log('Again')
const dev_x = db.prepare("select * from members").get()
console.log(dev_x)
// console.log(JSON.stringify(dev_x))



console.log('Pattern 2 (nothing)')

//write

//Hono
const app = new Hono()

app.use(logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// read the: https://gist.github.com/bonniss/2fb3853640510b697ca38255ec6bd282



app.post('/v1/user', async (c) => {
  try {
    const body = await c.req.parseBody()
    const { username, password } = body
    if (!username || !password) {
      return c.json({
        "Error": "Invalid body(need username and password)"
      }, 400) //read http.cat
    } else {
      const check = await findusr(username)
      if (check.name) {
        return c.json({
          "Error": "This username already exists!"
        }, 400)
      } else {
        const x = db.prepare('insert into userdb(name,password) values (?,?)')
        x.run(username, password)
        //like my https://github.com/ringo360/bio-workers/blob/master/src/index.ts
        //TODO: register successfull
      }
    }
  } catch (e) {
    console.log(e)
  }
})

app.get('/test', async (c, next) => {
  //Context is not finalized
  console.log('Awaiting')
  const res:any = await db.prepare('select * from members').get()
  console.log(res)
  console.log('OK')
  return c.json({
    "uwu": "string",
    "name": res.name,
    "age": res.age
  })
  // await next()
})

app.get('/find/:user', async (c) => {
  const target = c.req.param('user')
  console.log(`Finding ${target}`)
  const x:any = await findusr(target)
  if (x.name) {
    return c.json({
      "user": x.name,
      "age": x.age
    })
  } else {
    return c.json({
      "error": `cannot find ${target}`
    }, 404)
  }
})

async function findusr(target:any) {
  const x = await db.prepare('select * from members')
  let t:any;
  for (t of x.iterate()) {
    if (t.name === target) {
      console.log(`I found ${t.name}`)
      return t
    }
  }
  return 'not found'
}

const port = 3150
console.log(`Listening port ${port}`)

serve({
  fetch: app.fetch,
  port
})


//STOP

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

async function shutdown() {
  console.log('Shutdown...')
  db.close();
  console.log('[SQLite] Closed')
  console.log('Goodbye')
  process.exit(0)
}