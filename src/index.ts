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
  db.exec("insert into members(name,age) values(?,?)", "hoge", 33);
  db.exec("insert into members(name,age) values(?,?)", "foo", 44);
  db.exec("update members set age = ? where name = ?", 55, "foo");
  /*
  db.each("select * from members", (err, row) => {
      console.log(`${row.name} ${row.age}`);
  });
  */
 
  const res = db.prepare("select * from members")
  console.log(res)
  console.log(JSON.stringify(res))
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
const dev_x = db.prepare("select * from members")
console.log(dev_x)
console.log(JSON.stringify(dev_x))

/*
dev_x is:

Statement {
  busy: false,
  reader: true,
  readonly: true,
  source: 'select * from members'
  ...
  (read the server log)
}

*/

console.log('Pattern 2 (nothing)')

//write

//Hono
const app = new Hono()

app.use(logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', async (c, next) => {
  //Context is not finalized
  console.log('Awaiting')
  const res = await exec('select * from members')
  console.log(res)
  console.log('OK')
  return c.json({
    "uwu": "string",
    "name": res.name,
    "age": res.age
  })
  // await next()
})

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