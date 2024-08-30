// (for me) editor.parameterHints.enabledをオフにすること。
//READ https://github.com/WiseLibs/better-sqlite3/
//READ https://gist.github.com/bonniss/2fb3853640510b697ca38255ec6bd282

import { ConfigChecker } from './config';
import { db, initdb } from './db';
import { addusr } from './util'; //dev
import { websv } from './websv';

/**
 * データベースの初期化などを行います。
 */
async function init() {
  console.log('Checking Config...');
  await ConfigChecker();
  console.log('Prepareing Database...');
  await initdb();
  console.log('OK');
  console.log('[dev] Adding usr...');
  addusr('tarou', '1234');
  addusr('tarou', 'duplicateduser');
  console.log('ok');
  const t_res: any = db.prepare('select * from UserList;').get();
  console.log(t_res);
  console.log('[SQLite3] Ready!');
  return true;
}

async function main() {
  console.log('[MAIN] Called');
  await import('./websv');
  //   await init(); dev
}

//call
main();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
/**
 * 終了処理を行います。
 */
async function shutdown() {
  console.log('Shutdown...');
  db.close();
  websv.close();
  console.log('Goodbye');
  process.exit(0);
}
