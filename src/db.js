// db.js
import Dexie from 'dexie';

let db = null;

if (typeof window !== 'undefined') {
  db = new Dexie('transit-det-city');

  db.version(6).stores({
    stops: '++id, agency, stop_id', // Primary key and indexed props
    bikeshare: '++id, agency, stop_id',
    routes: '++id, agency, route_id',
  });
}

export { db };