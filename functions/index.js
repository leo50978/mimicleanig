const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const crypto = require('node:crypto');

initializeApp();
const db = getFirestore();
const adminPin = defineSecret('ADMIN_PIN');
const allowedOrigins = new Set(['https://leo50978.github.io', 'http://localhost:8000', 'http://127.0.0.1:8000']);
const response = (res, status, payload) => res.status(status).json(payload);
const sign = (payload, secret) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
};
const verify = (token, secret) => {
  const [body, supplied, extra] = String(token || '').split('.');
  if (!body || !supplied || extra) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  let actual;
  try { actual = Buffer.from(supplied, 'base64url'); } catch { return false; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now(); } catch { return false; }
};

exports.adminApi = onRequest({ region: 'us-central1', secrets: [adminPin], maxInstances: 2, cors: false }, async (req, res) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.has(origin)) return response(res, 403, { error: 'Origin not allowed' });
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return response(res, 405, { error: 'Method not allowed' });

  const secret = adminPin.value();
  const action = req.body?.action;
  if (action === 'login') {
    const ip = String(req.ip || 'unknown');
    const id = crypto.createHash('sha256').update(ip).digest('hex');
    const ref = db.collection('_adminRateLimits').doc(id);
    const now = Date.now();
    const permit = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : {};
      const windowStart = Number(data.windowStart || 0);
      const attempts = now - windowStart > 60 * 60 * 1000 ? 0 : Number(data.attempts || 0);
      if (attempts >= 5) return false;
      const suppliedCode = Buffer.from(typeof req.body?.code === 'string' ? req.body.code : '');
      const configuredCode = Buffer.from(secret);
      const correct = /^\d{4}$/.test(String(req.body?.code || '')) &&
        suppliedCode.length === configuredCode.length && crypto.timingSafeEqual(suppliedCode, configuredCode);
      tx.set(ref, correct ? { attempts: 0, windowStart: now } : { attempts: attempts + 1, windowStart: attempts ? windowStart : now });
      return correct;
    });
    if (!permit) return response(res, 401, { error: 'Invalid code or access temporarily limited' });
    return response(res, 200, { token: sign({ exp: now + 15 * 60 * 1000 }, secret) });
  }

  if (action !== 'messages') return response(res, 400, { error: 'Unknown action' });
  const token = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!verify(token, secret)) return response(res, 401, { error: 'Session expired. Enter your code again.' });
  try {
    const [bookingSnapshot, subscriberSnapshot] = await Promise.all([
      db.collection('bookings').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('subscribers').orderBy('createdAt', 'desc').limit(200).get()
    ]);
    const bookings = bookingSnapshot.docs.map(doc => {
      const d = doc.data();
      return { name: d.name || '', email: d.email || '', date: d.date || '', time: d.time || '', plan: d.plan || '', message: d.message || '', createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null };
    });
    const subscribers = subscriberSnapshot.docs.map(doc => {
      const d = doc.data();
      return { email: d.email || '', createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null };
    });
    return response(res, 200, { bookings, subscribers });
  } catch (error) {
    console.error('Admin data query failed', error.code || 'unknown');
    return response(res, 500, { error: 'Could not load the dashboard.' });
  }
});
