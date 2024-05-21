// (for me) editor.parameterHints.enabledをオフにすること。

/**
 * Pythonなどに存在するsleep()的なものを可能にします。
 * @param ms ミリ秒(ex: 1000 = 1秒)
 */
const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { formatInTimeZone } from 'date-fns-tz'
import Database from 'better-sqlite3'
import fs from 'fs'

//SQLite3
const db_dir = './db'
if (!fs.existsSync(db_dir)) {
  fs.mkdirSync(db_dir)
}
const db = new Database('./db/database.db')

//READ https://github.com/WiseLibs/better-sqlite3/

/**
 * 日付をJST(日本標準時)にフォーマットします。
 * @param date 日付(Date), デフォルト値: new Date()
 * @returns 'yyyy-MM-dd HH:mm:ss'
 */
function getJSTDate(date:Date = new Date()) {
  // console.log(`Replace target date: ${date}`) for devs

  const JSTDate = formatInTimeZone(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
  return JSTDate
}

/**
 * UserListにユーザーが存在するかを確認します。findusrとは違い、存在するか否かの確認のみを行います。
 * @param target ユーザー名(string)
 * @returns true(存在する)、またはfalse(存在しない)
 */
function existsusr(target:string) {
  const check:any = db.prepare(`SELECT EXISTS(SELECT * FROM UserList WHERE usrname = '${target}') AS count;`).get()
  console.log(`[ExistsUser] Result: ${check.count}`)
  if (check.count !== 0) {
    return true
  } else {
    return false
  }
}

/**
 * UserList内のユーザーを検索し、存在する場合はその情報を返します。
 * @param target 検索したいユーザー名(string)
 * @returns 存在しない場合は'not found'を返します。(string) 存在する場合はresを返します。
 * resにはusrname(ユーザー名)とcreationdate(作成日)が含まれています。
 */
function findusr(target:string) {
  const check:any = db.prepare(`SELECT EXISTS(SELECT * FROM UserList WHERE usrname = '${target}') AS count;`).get()
  console.log(check.count) // number
  if (check.count > 1) {
    throw new Error(`oops, check.count is ${check.count}.`)
  }
  if (check.count == 1) {
    console.log('Found!')
    const res:any = db.prepare(`SELECT * FROM UserList WHERE usrname = '${target}'`).all()
    // console.log(res)
    //res.usrname, res.password, res.creationdate...
    //! * can replace with usrname, creationdate
    return res;
  }

  return 'not found'
}

/**
 * UserListにユーザーを登録します。
 * @param username ユーザー名(string)
 * @param password パスワード(string)
 * @returns 既に存在するユーザーは'already exists', 成功時には'ok'を返却する。(どちらもstring)
 */
function addusr(username: string, password: string) {
  if (existsusr(username)) {
    console.log(`[AddUser] ${username} already exists.`)
    return 'already exists'
  } else {
    //something
    db.exec(`insert into UserList(usrname, password, creationdate) values('${username}', '${password}', '${getJSTDate(new Date())}');`)
    console.log(`[AddUser] Added ${username}!`)
    return 'ok'
  }
  
}

/**
 * 対象のユーザーがSleepDataのテーブル内に、いくつのカラムを持っているか取得します。
 * @param target ユーザー名(string)
 * @returns 数値(何らかの問題が発生した場合は-1を返します。)
 * ユーザーがまだ記録したことがない場合に加え、ユーザーが存在しない場合も0を返します。
 * ユーザーの存在を確認する場合はfindusr()を使用してください。
 */
function getnum(target: string) {
  console.log('[getnum] fetching num')
  //const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));
  const check:any = db.prepare(`SELECT COUNT(usrname='${target}' OR NULL) AS count from SleepData`).get()
  console.log(`[getnum] ${target} - ${check.count}`)
  const x = check.count as number
  if (x < 0) {
    console.log(`${x} - something went wrong`)
    return -1
  }
  return x
}

/**
 * 就寝時に使われます。
 * @param username ユーザー名(string)
 * @returns boolean
 */
function log_sleep(username: string) {
  //TODO: 努力
  try {
    db.exec(`insert into SleepData(num, usrname, sleepdate) values('${getnum(username) + 1}', '${username}', '${getJSTDate()}');`)
    return true
  } catch (e) {
    console.log(e)
    return false;
  }
}

/**
 * 起床時に使われます。
 * @param username ユーザー名(string)
 * @returns boolean
 */
function log_wakeup(username: string) {
  //https://qiita.com/minhee/items/8de52f4bffb886c68b99 みなさい
  //TODO: やりましょう
  //ex UPDATE 家計簿 SET 出金額　= 1500 WHERE 日付 = '2021-08-03'
  console.log('[wakeup] called')
  const num = getnum(username)
  console.log(`[wakeup] update ${username} - ${num}`)
  if (num < 0) {
    console.log(`Err: num is ${num}`)
    return false;
  }
  db.exec(`update SleepData SET wakeupdate = '${getJSTDate()}' where num = '${num}' and usrname = '${username}'`)
  console.log('[wakeup] ok!')
  return true;
}

/**
 * (開発者向け)データベースの初期化などを行います。
 */
function init() {
  // db.exec("drop table if exists UserDB");
  // db.exec("create table if not exists members(name,age)");
  // db.exec("create table if not exists UserDB(usrID, devDate, devTime)");
  // db.exec("create table UserDB(usrID, devDate, devTime)");
  db.exec('drop table if exists UserList');
  db.exec('drop table if exists UserData');
  db.exec('drop table if exists SleepData');
  // db.exec('create table UserDB(userid INTEGER, displayname TEXT, date DATE)');
  db.exec('create table UserList(usrname TEXT, password TEXT, creationdate DATETIME);');
  db.exec('create table UserData(usrname TEXT, isSleeping BOOLEAN);');
  db.exec('create table SleepData(num INTEGER, usrname TEXT, sleepdate DATETIME, wakeupdate DATETIME);')

  console.log('Adding usr...')
  addusr('tarou', '1234')
  addusr('tarou', 'duplicateduser')
  console.log('ok')
  const t_res:any = db.prepare("select * from UserList;").get()
  console.log(t_res)
  console.log('[SQLite3] Ready!')
  return true
}

console.log('Loading...');


init()
// shutdown()

/*
console.log('=====UserList DB=====')

console.log('Pettern 1 (fetch all)')

addusr('john', 't0day1shappydAy!')
log_sleep('tarou')
log_sleep('john')
delay(1000)
log_wakeup('john')
delay(500)
log_sleep('john')
delay(10)
log_wakeup('tarou')
delay(1000)
log_wakeup('john')
log_sleep('john')
log_wakeup('john')
const dev_x = db.prepare("select * from UserList").all()
console.log(dev_x)

console.log('='.repeat(20))

console.log('=====UserData DB=====')



console.log('='.repeat(20))
*/
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
      const res = addusr(username as string, password as string)
      if (res === 'ok') {
        return c.json({
          "OK": "Registered!"
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


const port = 3150
console.log(`Listening port ${port}`)
findusr('tarou')
serve({
  fetch: app.fetch,
  port
})


//STOP

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

/**
 * 終了処理を行います。(Graceful Shutdownを実現させます。)
 */
async function shutdown() {
  console.log('Shutdown...')
  await db.close();
  console.log('[SQLite] Closed')
  console.log('Goodbye')
  process.exit(0)
}