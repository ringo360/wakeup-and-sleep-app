import { db } from './db'
import { formatInTimeZone } from "date-fns-tz"
import { decode, sign, verify } from "hono/jwt"
import { JWTSecret } from './config';
import { secureHeaders } from 'hono/secure-headers';

/**
 * Pythonなどに存在するsleep()的なものを可能にします。(async only)
 * @param ms ミリ秒(ex: 1000 = 1秒)
 */
export const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

/* =================================== */

/**
 * hono/jwtによるリフレッシュトークンを生成します。
 * このtokenには期限がないため、丁寧に扱う必要があります!
 * 
 * [!]このfunctionは非同期(async)です！
 * @param user ユーザー名
 * @param pass パスワード
 * @returns Boolean, エラーまたはtoken
 */
export async function genRefToken(user:string, pass:string) {
  try {
    const payload = {
      user: user,
      password: pass,
    }
    const token = await sign(payload, JWTSecret)
    console.log(`[genRefToken] ${token}`)
    return [true, token]

  } catch (e) {
    console.error(e)
    return [false, e]
  }
}

/**
 * リフレッシュトークンを利用してアクセストークンを取得します。期限は10分です。
 *
 * [!]このfunctionは非同期(async)です！
 * @param refToken リフレッシュトークン(genRefToken()で取得したもの)
 * @returns Boolean, エラーまたはtoken
 */
export async function genAccToken(refToken:string) {
  try {
    console.log('Generating')
    const payload = {
      token: refToken,
      exp: Math.floor(getJSTNow().getTime() / 1000) + 60 * 1 //1min token
    }
    console.log('Signing...')
    const token = await sign(payload, JWTSecret)
    return [true, token]
  } catch (e) {
    return [false, e]
  }
}


/**
 * 日付をJST(日本標準時)にフォーマットします。
 * @param date 日付(Date), デフォルト値: new Date()
 * @returns 'yyyy-MM-dd HH:mm:ss'
 */
export function getJSTDate(date:Date = new Date()) {
    // console.log(`Replace target date: ${date}`) for devs
  
    const JSTDate = formatInTimeZone(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
    return JSTDate
}

/**
 * Date型で日本時間が欲しい場合に使います。
 * これにより、どの実行環境でも日本時間を取得することが可能となります。
 * 
 * getJSTNow().getTime()といった使い方も可能です。
 * @returns Date(日本時間に直された版)
 */
export function getJSTNow() {
  return new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
}

/**
 * UserListにユーザーが存在するかを確認します。findusrとは違い、存在するか否かの確認のみを行います。
 * @param target ユーザー名(string)
 * @returns true(存在する)、またはfalse(存在しない)
 */
export function existsusr(target:string) {
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
export function findusr(target:string) {
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
 * パスワードを確認します。
 * @param user 
 * @param pass 
 * @returns Boolean
 */
export function CheckPass(user:string, pass:string) {
  const res:any = db.prepare(`SELECT password FROM UserList WHERE usrname = '${user}'`).all()
  if (res.password === pass) return true;
  else return false;
}

export function CheckUsr(username: string, password: string) {
  console.log(`Checking ${username}... password: ${password}`)
  
}

/**
 * UserListにユーザーを登録します。
 * @param username ユーザー名(string)
 * @param password パスワード(string)
 * @returns 既に存在するユーザーは'already exists', 成功時には'ok'を返却する。(どちらもstring)
 */
export function addusr(username: string, password: string) {
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
export function getnum(target: string) {
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
export function log_sleep(username: string) {
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
export function log_wakeup(username: string) {
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