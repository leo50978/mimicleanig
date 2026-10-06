const ADMIN_API = 'https://us-central1-cpieo-99bd5.cloudfunctions.net/adminApi';
const loginPanel = document.getElementById('loginPanel');
const loginForm = document.getElementById('adminLogin');
const adminStatus = document.getElementById('adminStatus');
const dashboard = document.getElementById('dashboard');
const dashboardStatus = document.getElementById('dashboardStatus');
const tokenKey = 'clinoAdminSession';
const dateLabel = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable';
async function callAdmin(payload, token) {
  const response = await fetch(ADMIN_API, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The dashboard service is unavailable.');
  return data;
}
function text(tag, value, className) { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; }
function renderDashboard(data) {
  const bookingList = document.getElementById('bookingList');
  const subscriberList = document.getElementById('subscriberList');
  bookingList.replaceChildren(); subscriberList.replaceChildren();
  document.getElementById('bookingCount').textContent = String(data.bookings.length);
  document.getElementById('subscriberCount').textContent = String(data.subscribers.length);
  if (!data.bookings.length) bookingList.append(text('p', 'No booking requests yet.', 'empty-note'));
  data.bookings.forEach(item => {
    const card = document.createElement('article'); card.className = 'booking-item';
    const meta = text('div', `${item.date} · ${item.time} · ${dateLabel(item.createdAt)}`, 'booking-meta');
    const name = text('h3', item.name || 'New request');
    const email = document.createElement('a'); email.href = `mailto:${encodeURIComponent(item.email)}`; email.textContent = item.email;
    const plan = text('div', item.plan || 'Cleaning request', 'booking-meta');
    card.append(meta, name, email, plan, text('p', item.message || 'No additional message.'));
    bookingList.append(card);
  });
  if (!data.subscribers.length) subscriberList.append(text('p', 'No email sign-ups yet.', 'empty-note'));
  data.subscribers.forEach(item => { const chip = text('span', item.email, 'email-chip'); chip.title = dateLabel(item.createdAt); subscriberList.append(chip); });
}
async function loadDashboard(token) {
  dashboardStatus.textContent = 'Loading private data…';
  const data = await callAdmin({ action: 'messages' }, token);
  loginPanel.hidden = true; dashboard.hidden = false; renderDashboard(data); dashboardStatus.textContent = '';
}
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const button = loginForm.querySelector('[type="submit"]'); button.disabled = true;
  adminStatus.textContent = 'Checking access…';
  try {
    const { token } = await callAdmin({ action: 'login', code: loginForm.elements.code.value });
    sessionStorage.setItem(tokenKey, token);
    await loadDashboard(token);
  } catch (error) { adminStatus.textContent = error.message; }
  finally { button.disabled = false; }
});
document.getElementById('adminLogout').addEventListener('click', () => { sessionStorage.removeItem(tokenKey); dashboard.hidden = true; loginPanel.hidden = false; loginForm.reset(); adminStatus.textContent = 'You are signed out.'; });
const savedToken = sessionStorage.getItem(tokenKey);
if (savedToken) loadDashboard(savedToken).catch(error => { sessionStorage.removeItem(tokenKey); adminStatus.textContent = error.message; });
