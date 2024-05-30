// (for me) editor.parameterHints.enabledをオフにすること。
//READ https://github.com/WiseLibs/better-sqlite3/
//READ https://gist.github.com/bonniss/2fb3853640510b697ca38255ec6bd282

/*
const dev_x = db.prepare("select * from UserList").all()
console.log(dev_x)
*/

import { ConfigChecker } from "./config";
import { db, initdb } from "./db";
import { addusr } from "./util"; //dev
import './websv'




/**
 * データベースの初期化などを行います。
 */
async function init() {
  console.log('Checking Config...')
  await ConfigChecker()
  console.log('Prepareing Database...')
  await initdb();
  console.log('OK')
  console.log('[dev] Adding usr...')
  addusr('tarou', '1234')
  addusr('tarou', 'duplicateduser')
  console.log('ok')
  const t_res:any = db.prepare("select * from UserList;").get()
  console.log(t_res)
  console.log('[SQLite3] Ready!')
  return true
}

async function main() {
  console.log('Loading...');
  await init()
}

//call
main()


process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
/**
 * 終了処理を行います。
 */
async function shutdown() {
  console.log('Shutdown...')
  db.close();
  console.log('[SQLite] Closed')
  console.log('Goodbye')
  process.exit(0)
}