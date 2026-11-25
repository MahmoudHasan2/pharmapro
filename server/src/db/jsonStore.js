const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class JsonStore {
  constructor(name, dataDir) {
    this.file = path.join(dataDir, `${name}.json`);
    this._ensure();
  }
  _ensure() {
    if (!fs.existsSync(path.dirname(this.file))) fs.mkdirSync(path.dirname(this.file), { recursive: true });
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, '[]');
  }
  _readAll() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8') || '[]'); } catch { return []; }
  }
  _writeAll(arr) { fs.writeFileSync(this.file, JSON.stringify(arr, null, 2)); }
  all() { return this._readAll(); }
  find(predicate = () => true) { return this._readAll().filter(predicate); }
  findOne(predicate) { return this._readAll().find(predicate) || null; }
  findById(id) { return this.findOne((d) => d._id === id); }
  count(predicate = () => true) { return this._readAll().filter(predicate).length; }
  insert(doc) {
    const arr = this._readAll();
    const now = new Date().toISOString();
    const record = { _id: doc._id || crypto.randomUUID(), createdAt: now, updatedAt: now, ...doc };
    arr.push(record);
    this._writeAll(arr);
    return record;
  }
  updateById(id, updates) {
    const arr = this._readAll();
    const idx = arr.findIndex((d) => d._id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates, _id: arr[idx]._id, updatedAt: new Date().toISOString() };
    this._writeAll(arr);
    return arr[idx];
  }
  deleteById(id) {
    const arr = this._readAll();
    const idx = arr.findIndex((d) => d._id === id);
    if (idx === -1) return null;
    const [removed] = arr.splice(idx, 1);
    this._writeAll(arr);
    return removed;
  }
}

module.exports = JsonStore;
