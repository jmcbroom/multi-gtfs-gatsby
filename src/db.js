// db.js
import Dexie from 'dexie';

export const db = new Dexie('myDatabase');
db.version(3).stores({
  stops: '++id, agency, stop_id', // Primary key and indexed props
  bikeshare: '++id, agency, stop_id',
  routes: '++id, agency, route_id',
});