import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import sqlite3 from 'sqlite3'

//SQLite3
const db = new sqlite3.Database('./db/database.db')
db.serialize(() => {
  db.run("drop table if exists members");
  db.run("create table if not exists members(name,age)");
  db.run("insert into members(name,age) values(?,?)", "hoge", 33);
  db.run("insert into members(name,age) values(?,?)", "foo", 44);
  db.run("update members set age = ? where name = ?", 55, "foo");
  /*
  db.each("select * from members", (err, row) => {
      console.log(`${row.name} ${row.age}`);
  });
  */
 
  db.all("select * from members", (err, rows) => {
      console.log(JSON.stringify(rows));
  });
  /*
  db.get("select count(*) from members", (err, count) => {
      console.log(count["count(*)"]);
  })
  */
  console.log('[SQLite3] Ready!')
});

console.log('Again')
db.all("select * from members", (err, rows) => {
  console.log(JSON.stringify(rows));
});

console.log('Pattern 2')
db.serialize(() => {
  db.all("select * from members", (err, rows) => {
    console.log(JSON.stringify(rows));
  });
})

//Hono
const app = new Hono()

app.use(logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', async (c, next) => {
  //Context is not finalized
  console.log('Awaiting')
  try {
    console.log('fetching')
    await fetchdb()
      .then(res => c.json(res))
    return;
  } catch (e) {
    throw new Error(`Something went wrong: ${e}`)
  }
  console.log('OK')
  // await next()
})

async function fetchdb() {
  db.all("select * from members", (err, rows) => {
    console.log('Processing')
    const result = JSON.stringify(rows)
    // console.log(JSON.stringify(rows))
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