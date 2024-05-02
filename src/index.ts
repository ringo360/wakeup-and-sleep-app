import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import Database from 'better-sqlite3'

//SQLite3
// const db = new sqlite3.Database('./db/database.db') old code
const db = new Database('./db/database.db', options)

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
 
  db.prepare("select * from members", (err, rows) => {
      console.log(JSON.stringify(rows));
  });
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
db.prepare("select * from members", (err, rows) => {
  console.log(JSON.stringify(rows));
});

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
  
  console.log('OK')
  return c.json(res)
  // await next()
})

async function fetchdb() {
  const start = new Date()
  console.log('Called')
  await db.prepare("select * from members", (err, rows) => {
    console.log('Processing')
    const result = JSON.stringify(rows)
    // console.log(JSON.stringify(rows))
    const end = new Date()
    const diff = end - start
    console.log(diff)
    return result;
  })
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