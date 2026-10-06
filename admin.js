// Front-end-only access gate. This code is visible in the browser, so it is a
// convenience screen rather than a security boundary.
const ADMIN_ACCESS_CODE = '1199';
const sessionKey = 'clinoAdminUnlocked';
const firebaseConfig = {
  apiKey: 'AIzaSyANt0dZtL-6P6l84ab-FSRIX9ISPd_YCe6I',
  authDomain: 'cpieo-99bd5.firebaseapp.com',
  projectId: 'cpieo-99bd5',
  storageBucket: 'cpieo-99bd5.firebasestorage.app',
  messagingSenderId: '405125968337',
  appId: '1:405125968337:web:7d5f74b710cc23b84270f0'
};

const loginPanel = document.getElementById('loginPanel');
const loginForm = document.getElementById('adminLogin');
const adminStatus = document.getElementById('adminStatus');
const dashboard = document.getElementById('dashboard');
const dashboardStatus = document.getElementById('dashboardStatus');
const dateLabel = value => {
  if (!value) return 'Date unavailable';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

function text(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function renderDashboard(data) {
  const bookingList = document.getElementById('bookingList');
  const subscriberList = document.getElementById('subscriberList');
  bookingList.replaceChildren();
  subscriberList.replaceChildren();
  document.getElementById('bookingCount').textContent = String(data.bookings.length);
  document.getElementById('subscriberCount').textContent = String(data.subscribers.length);

  if (!data.bookings.length) bookingList.append(text('p', 'No booking requests yet.', 'empty-note'));
  data.bookings.forEach(item => {
    const card = document.createElement('article');
    card.className = 'booking-item';
    const meta = text('div', `${item.date || ''} · ${item.time || ''} · ${dateLabel(item.createdAt)}`, 'booking-meta');
    const name = text('h3', item.name || 'New request');
    const email = document.createElement('a');
    email.href = `mailto:${encodeURIComponent(item.email || '')}`;
    email.textContent = item.email || 'No email provided';
    const plan = text('div', item.plan || 'Cleaning request', 'booking-meta');
    card.append(meta, name, email, plan, text('p', item.message || 'No additional message.'));
    bookingList.append(card);
  });

  if (!data.subscribers.length) subscriberList.append(text('p', 'No email sign-ups yet.', 'empty-note'));
  data.subscribers.forEach(item => {
    const chip = text('span', item.email || 'No email provided', 'email-chip');
    chip.title = dateLabel(item.createdAt);
    subscriberList.append(chip);
  });
}

async function loadDashboardData() {
  dashboardStatus.textContent = 'Loading saved requests and email sign-ups…';
  try {
    const [appModule, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]);
    const app = appModule.getApps().find(item => item.name === 'clino-admin')
      || appModule.initializeApp(firebaseConfig, 'clino-admin');
    const db = firestore.getFirestore(app);
    const [bookingSnapshot, subscriberSnapshot] = await Promise.all([
      firestore.getDocs(firestore.query(firestore.collection(db, 'bookings'), firestore.orderBy('createdAt', 'desc'))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'subscribers'), firestore.orderBy('createdAt', 'desc')))
    ]);
    renderDashboard({
      bookings: bookingSnapshot.docs.map(doc => doc.data()),
      subscribers: subscriberSnapshot.docs.map(doc => doc.data())
    });
    dashboardStatus.textContent = '';
  } catch (error) {
    console.error('Clino dashboard could not read Firestore data.', error);
    dashboardStatus.textContent = 'Dashboard unlocked, but Firestore is not allowing browser reads. Update Firestore read rules if you want these saved lists to appear here.';
    document.getElementById('bookingList').replaceChildren(text('p', 'Could not load booking requests.', 'empty-note'));
    document.getElementById('subscriberList').replaceChildren(text('p', 'Could not load email sign-ups.', 'empty-note'));
  }
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  loadDashboardData();
}

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  if (loginForm.elements.code.value !== ADMIN_ACCESS_CODE) {
    adminStatus.textContent = 'That access code is not correct.';
    loginForm.elements.code.select();
    return;
  }
  sessionStorage.setItem(sessionKey, 'true');
  adminStatus.textContent = '';
  showDashboard();
});

document.getElementById('adminLogout').addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  dashboard.hidden = true;
  loginPanel.hidden = false;
  loginForm.reset();
  adminStatus.textContent = 'You are signed out.';
});

if (sessionStorage.getItem(sessionKey) === 'true') showDashboard();
