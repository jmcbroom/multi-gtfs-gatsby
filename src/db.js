// db.js
import Dexie from 'dexie';

export const db = new Dexie('myDatabase');
db.version(2).stores({
  stops: '++id, agency, stop_id', // Primary key and indexed props
  routes: '++id, agency, route_id',
});