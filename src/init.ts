import { ConfigChecker } from './config';
import { initdb } from './db';

async function main() {
  console.log('Initializing...');
  await ConfigChecker();
  console.log('Checked config');
  await initdb();
  console.log('[DB] OK');
}

main();
