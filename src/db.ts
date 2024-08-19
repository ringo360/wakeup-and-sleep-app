import fs from 'fs';
import Database from 'better-sqlite3';

//SQLite3
const db_dir = './db';
if (!fs.existsSync(db_dir)) {
  fs.mkdirSync(db_dir);
}
export const db = new Database('./db/database.db');

export async function initdb() {
  db.exec('drop table if exists UserList');
  db.exec('drop table if exists UserData');
  db.exec('drop table if exists SleepData');
  db.exec(
    'create table UserList(usrname TEXT, password TEXT, creationdate DATETIME);',
  );
  db.exec('create table UserData(usrname TEXT, isSleeping BOOLEAN);');
  db.exec(
    'create table SleepData(num INTEGER, usrname TEXT, sleepdate DATETIME, wakeupdate DATETIME, atebreakfast BOOLEAN);',
  );
  return;
}
