// db.js
import Dexie from 'dexie';

export const db = new Dexie('myDatabase');
db.version(1).stores({
  stops: '++id, agency, stop_id', // Primary key and indexed props
});