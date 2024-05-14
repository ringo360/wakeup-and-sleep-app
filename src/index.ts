import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { formatInTimeZone } from 'date-fns-tz'
import Database from 'better-sqlite3'
import fs from 'fs'

//SQLite3
// const db = new sqlite3.Database('./db/database.db') old code
const db_dir = './db'
if (!fs.existsSync(db_dir)) {
  fs.mkdirSync(db_dir)
}
const db = new Database('./db/database.db')

//READ https://github.com/WiseLibs/better-sqlite3/

function getJSTDate(date:Date) {
  // console.log(`Replace target date: ${date}`) for devs

  const JSTDate = formatInTimeZone(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
  return JSTDate
}

function init() {
  // db.exec("drop table if exists UserDB");
  // db.exec("create table if not exists members(name,age)");
  // db.exec("create table if not exists UserDB(usrID, devDate, devTime)");
  // db.exec("create table UserDB(usrID, devDate, devTime)");
  db.exec('drop table if exists UserList');
  db.exec('drop table if exists UserData');
  console.log(getJSTDate(new Date()))
  // db.exec('create table UserDB(userid INTEGER, displayname TEXT, date DATE)');
  db.exec('create table UserList(usrname TEXT, password TEXT, creationdate DATETIME);');
  db.exec('create table UserData(usrname TEXT, sleepdate DATETIME, wakeupdate DATETIME);')

  db.exec("insert into UserList(usrname, password, creationdate) values('tarou', '1234', '2024-05-07 12:48:35');")
  db.exec("insert into UserData(usrname, sleepdate, wakeupdate) values('tarou', '2024-05-08 23:14:19', '06:30:01');")
  const t_res:any = db.prepare("select * from UserList;").get()
  console.log(t_res)



  /*
  db.exec("insert into members(name,age) values(?,?)", "hoge", 33);
  db.exec("insert into members(name,age) values(?,?)", "foo", 44);
  db.exec("update members set age = ? where name = ?", 55, "foo");
  db.each("select * from members", (err, row) => {
      console.log(`${row.name} ${row.age}`);
  });
  */
  // const x = db.prepare('insert into UserDB(devDate, devTime) values("2024-05-07", "10:30:00")')
  // const x = db.prepare('insert into members(name, age) values (?,?)')
  /*
  x.run('hoge', 33)
  x.run('foo', 44)
 */
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
shutdown()

console.log('=====UserList DB=====')

console.log('Pettern 1 (fetch all)')
db.exec("insert into UserList(usrname, password, creationdate) values('tarou', 'longlonglonglonglonglongstring', '2024-05-08');")
db.exec("insert into UserList(usrname, password, creationdate) values('john', 't0day1shappydAy!', '2023-12-12');")
const dev_x = db.prepare("select * from UserList").all()
console.log(dev_x)



console.log('Pattern 2 (search usrname="tarou")')
const dev_x2 = db.prepare(`SELECT * FROM UserList WHERE usrname = 'tarou'`).all()
console.log(dev_x2)

console.log('='.repeat(20))

console.log('=====UserData DB=====')



console.log('='.repeat(20))

//write

//Hono
const app = new Hono()

app.use(logger())

app.get('/', (c) => {
  return c.text('It works✨')
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
        const nowJST = getJSTDate(new Date())
        await db.exec(`insert into UserList(name,password) values (${username}, ${password}, ${nowJST})`)
        //like my https://github.com/ringo360/bio-workers/blob/master/src/index.ts
        //TODO: register successfull
        return c.json({
          "OK": "Registered!"
        })
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
  const x = await db.prepare('select * from UserList')
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
  await db.close();
  console.log('[SQLite] Closed')
  console.log('Goodbye')
  process.exit(0)
}