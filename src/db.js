// db.js
import Dexie from 'dexie';

export const db = new Dexie('transit-det-city');

db.version(4).stores({
  stops: '++id, agency, stop_id', // Primary key and indexed props
  bikeshare: '++id, agency, stop_id',
  routes: '++id, agency, route_id',
});