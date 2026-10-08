// Front-end-only access gate. The 1199 code is a convenience screen, not a
// security boundary; the analytics collection contains aggregate counters only.
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
const $ = id => document.getElementById(id);
const number = value => new Intl.NumberFormat().format(value || 0);
const pageLabels = {
  home: 'Home', about: 'About', services: 'Services', testimonials: 'Testimonials', blog: 'Blog',
  miami_house_cleaning: 'Miami home cleaning', fort_lauderdale_office_cleaning: 'Fort Lauderdale office cleaning',
  move_in_move_out_cleaning: 'Move-in / move-out', yacht_cleaning: 'Yacht cleaning',
  west_palm_broward_cleaning: 'West Palm Beach to Broward', kosher_friendly_cleaning: 'Kosher-friendly cleaning',
  privacy_policy: 'Privacy information', not_found: '404 page', other_page: 'Other page'
};
const clickLabels = {
  booking_submit: 'Booking form submit', newsletter_submit: 'Newsletter submit', review_submit: 'Review submit',
  social_link: 'Social link', phone_call: 'Phone call', email_link: 'Email link', booking_open: 'Open booking',
  navigation: 'Navigation link', service_link: 'Service link', booking_cta: 'Booking CTA',
  contact_cta: 'Contact CTA', review_action: 'Review action', other_button: 'Other button', other_link: 'Other link'
};
const deviceLabels = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' };
const sourceLabels = {
  direct: 'Direct / no referrer', internal: 'Internal navigation', search: 'Search engine',
  facebook: 'Facebook', instagram: 'Instagram', yelp: 'Yelp', nextdoor: 'Nextdoor',
  campaign_other: 'Other tagged campaign', referral_other: 'Other referral', other: 'Other source'
};
const timezoneLabels = {
  us_eastern: 'US Eastern', us_central: 'US Central', us_mountain: 'US Mountain', us_pacific: 'US Pacific',
  us_alaska: 'Alaska', us_hawaii: 'Hawaii', non_us_or_other: 'Other / outside US', unknown: 'Unknown'
};

function text(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function dateLabel(value) {
  if (!value) return 'Date unavailable';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function renderBookings(data) {
  const bookingList = $('bookingList');
  bookingList.replaceChildren();
  $('bookingCount').textContent = String(data.length);
  if (!data.length) bookingList.append(text('p', 'No booking requests yet.', 'empty-note'));
  data.forEach(item => {
    const card = document.createElement('article');
    card.className = 'booking-item';
    const meta = text('div', `${item.date || ''} · ${item.time || ''} · ${dateLabel(item.createdAt)}`, 'booking-meta');
    const name = text('h3', item.name || 'New request');
    const email = document.createElement('a');
    email.href = `mailto:${encodeURIComponent(item.email || '')}`;
    email.textContent = item.email || 'No email provided';
    card.append(meta, name, email, text('div', item.plan || 'Cleaning request', 'booking-meta'), text('p', item.message || 'No additional message.'));
    bookingList.append(card);
  });
}

function renderSubscribers(data) {
  const list = $('subscriberList');
  list.replaceChildren();
  $('subscriberCount').textContent = String(data.length);
  if (!data.length) list.append(text('p', 'No email sign-ups yet.', 'empty-note'));
  data.forEach(item => {
    const chip = text('span', item.email || 'No email provided', 'email-chip');
    chip.title = dateLabel(item.createdAt);
    list.append(chip);
  });
}

function dayNumber(date) {
  return Number(`${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`);
}

function appendRows(id, values, labels, emptyText) {
  const list = $(id);
  list.replaceChildren();
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (!rows.length) {
    list.append(text('li', emptyText, 'analytics-empty'));
    return;
  }
  rows.forEach(([key, value]) => {
    const row = document.createElement('li');
    row.append(text('span', labels[key] || key.replaceAll('_', ' ')), text('strong', number(value)));
    list.append(row);
  });
}

function drawChart(daily, days) {
  const svg = $('analyticsChart');
  svg.replaceChildren();
  if (!daily.size || ![...daily.values()].some(row => row.pageviews || row.visits || row.clicks)) {
    const message = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    message.setAttribute('x', '450'); message.setAttribute('y', '128'); message.setAttribute('text-anchor', 'middle');
    message.setAttribute('class', 'chart-label'); message.textContent = 'No activity recorded for this period yet.';
    svg.append(message);
    return;
  }
  const ns = 'http://www.w3.org/2000/svg';
  const left = 42, right = 12, top = 12, bottom = 32, width = 900, height = 250;
  const plotW = width - left - right, plotH = height - top - bottom;
  const rows = Array.from({ length: days }, (_, index) => daily.get(dayNumber(new Date(Date.now() - (days - index - 1) * 86400000))) || { pageviews: 0, visits: 0, clicks: 0 });
  const maxValue = Math.max(1, ...rows.flatMap(row => [row.pageviews, row.visits, row.clicks]));
  for (let i = 0; i < 4; i++) {
    const y = top + plotH * i / 3;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', String(left)); line.setAttribute('x2', String(width - right)); line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'chart-grid');
    svg.append(line);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', '2'); label.setAttribute('y', String(y + 4)); label.setAttribute('class', 'chart-label'); label.textContent = number(Math.round(maxValue * (3 - i) / 3));
    svg.append(label);
  }
  const series = [
    { key: 'pageviews', color: '#506ed0' },
    { key: 'visits', color: '#35a7ad' },
    { key: 'clicks', color: '#ef9f56' }
  ];
  series.forEach(item => {
    const points = rows.map((row, index) => {
      const x = left + (days === 1 ? .5 : index / (days - 1)) * plotW;
      const y = top + (1 - row[item.key] / maxValue) * plotH;
      return [x, y];
    });
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' '));
    path.setAttribute('stroke', item.color); path.setAttribute('class', 'chart-line'); svg.append(path);
    if (days <= 14) points.forEach(point => {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', String(point[0])); circle.setAttribute('cy', String(point[1])); circle.setAttribute('r', '3.5'); circle.setAttribute('fill', item.color); circle.setAttribute('class', 'chart-point'); svg.append(circle);
    });
  });
  const labelEvery = Math.max(1, Math.ceil(days / 7));
  rows.forEach((_, index) => {
    if (index % labelEvery !== 0 && index !== days - 1) return;
    const d = new Date(Date.now() - (days - index - 1) * 86400000);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(left + (days === 1 ? .5 : index / (days - 1)) * plotW));
    label.setAttribute('y', String(height - 7)); label.setAttribute('text-anchor', 'middle'); label.setAttribute('class', 'chart-label');
    label.textContent = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; svg.append(label);
  });
}

function renderAnalytics(documents, days) {
  const totals = { pageviews: 0, visits: 0, engaged: 0, clicks: 0 };
  const pages = {}, clicks = {}, devices = {}, sources = {}, regions = {};
  const daily = new Map();
  documents.forEach(item => {
    const d = item.data();
    const day = Number(d.day);
    const row = daily.get(day) || { pageviews: 0, visits: 0, clicks: 0 };
    if (d.metric === 'pageviews') { totals.pageviews += d.count || 0; }
    if (d.metric === 'visits') { totals.visits += d.count || 0; row.visits += d.count || 0; }
    if (d.metric === 'engaged_seconds') totals.engaged += d.count || 0;
    if (d.metric === 'page') pages[d.key] = (pages[d.key] || 0) + (d.count || 0);
    if (d.metric === 'click') { clicks[d.key] = (clicks[d.key] || 0) + (d.count || 0); row.clicks += d.count || 0; }
    if (d.metric === 'device') devices[d.key] = (devices[d.key] || 0) + (d.count || 0);
    if (d.metric === 'source') sources[d.key] = (sources[d.key] || 0) + (d.count || 0);
    if (d.metric === 'timezone') regions[d.key] = (regions[d.key] || 0) + (d.count || 0);
    if (d.metric === 'pageviews') row.pageviews += d.count || 0;
    daily.set(day, row);
  });
  const avgTime = totals.visits ? totals.engaged / totals.visits : 0;
  const formatTime = seconds => seconds >= 60 ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`;
  const metrics = [
    ['Visits', totals.visits, 'Browser tab sessions, not unique people'],
    ['Page views', totals.pageviews, 'Total pages viewed'],
    ['Button clicks', Object.values(clicks).reduce((a, b) => a + b, 0), 'Phone, booking, navigation and other actions'],
    ['Avg. engaged time', formatTime(avgTime), 'Visible time per visit']
  ];
  const kpis = $('analyticsKpis');
  kpis.replaceChildren();
  metrics.forEach(([label, value, hint]) => {
    const card = document.createElement('article'); card.className = 'analytics-kpi';
    card.append(text('strong', typeof value === 'number' ? number(value) : value), text('span', hint));
    card.setAttribute('aria-label', `${label}: ${value}`); kpis.append(card);
  });
  appendRows('analyticsPages', pages, pageLabels, 'No page data yet.');
  appendRows('analyticsClicks', clicks, clickLabels, 'No button clicks yet.');
  appendRows('analyticsDevices', devices, deviceLabels, 'No device data yet.');
  appendRows('analyticsSources', sources, sourceLabels, 'No source data yet.');
  appendRows('analyticsRegions', regions, timezoneLabels, 'No timezone data yet.');
  drawChart(daily, days);
}

async function loadDashboardData() {
  dashboardStatus.textContent = 'Loading dashboard data…';
  $('analyticsStatus').textContent = 'Loading activity…';
  try {
    const [appModule, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]);
    const app = appModule.getApps().find(item => item.name === 'clino-admin')
      || appModule.initializeApp(firebaseConfig, 'clino-admin');
    const db = firestore.getFirestore(app);
    const days = Number($('analyticsRange').value || 30);
    const start = new Date(); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() - days + 1);
    const startDay = dayNumber(start);
    const [bookings, subscribers, analytics] = await Promise.allSettled([
      firestore.getDocs(firestore.query(firestore.collection(db, 'bookings'), firestore.orderBy('createdAt', 'desc'), firestore.limit(100))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'subscribers'), firestore.orderBy('createdAt', 'desc'), firestore.limit(200))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'siteAnalytics'), firestore.where('day', '>=', startDay), firestore.orderBy('day', 'asc'), firestore.limit(5000)))
    ]);
    if (bookings.status === 'fulfilled') renderBookings(bookings.value.docs.map(doc => doc.data()));
    else { renderBookings([]); $('bookingList').replaceChildren(text('p', 'Firestore rules do not allow reading bookings.', 'empty-note')); }
    if (subscribers.status === 'fulfilled') renderSubscribers(subscribers.value.docs.map(doc => doc.data()));
    else { renderSubscribers([]); $('subscriberList').replaceChildren(text('p', 'Firestore rules do not allow reading email sign-ups.', 'empty-note')); }
    if (analytics.status === 'fulfilled') {
      renderAnalytics(analytics.value.docs, days);
      $('analyticsStatus').textContent = analytics.value.empty ? 'No activity yet for this period.' : '';
    } else {
      $('analyticsKpis').replaceChildren(); $('analyticsChart').replaceChildren();
      const status = $('analyticsStatus');
      status.replaceChildren(document.createTextNode('Firestore is blocking analytics reads. Paste the analytics rules block into Firestore Rules, then reload this dashboard. '));
      const rulesLink = document.createElement('a');
      rulesLink.href = 'firestore-analytics-rules.txt';
      rulesLink.target = '_blank';
      rulesLink.rel = 'noopener noreferrer';
      rulesLink.textContent = 'Open the copy-ready rules';
      status.append(rulesLink);
      ['analyticsPages', 'analyticsClicks', 'analyticsDevices', 'analyticsSources', 'analyticsRegions'].forEach(id => $(id).replaceChildren());
    }
    dashboardStatus.textContent = '';
  } catch (error) {
    console.error('Clino dashboard could not load Firestore data.', error);
    dashboardStatus.textContent = 'Could not connect to Firestore. Check the project connection and reload.';
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

$('analyticsRange').addEventListener('change', loadDashboardData);
$('adminLogout').addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  dashboard.hidden = true;
  loginPanel.hidden = false;
  loginForm.reset();
  adminStatus.textContent = 'You are signed out.';
});

if (sessionStorage.getItem(sessionKey) === 'true') showDashboard();
