'use strict';

const fs = require('fs').promises;
const path = require('path');

const LAST_SENT_PATH = path.resolve(__dirname, '../../last-sent.json');

async function wasAlreadySentToday() {
  try {
    const raw = await fs.readFile(LAST_SENT_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    return data.date === today;
  } catch (err) {
    return false;
  }
}

async function markSentToday() {
  const today = new Date().toISOString().split('T')[0];
  await fs.writeFile(LAST_SENT_PATH, JSON.stringify({ date: today }), 'utf-8');
}

module.exports = { wasAlreadySentToday, markSentToday };
