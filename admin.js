// Front-end-only access gate. The 1199 code is a convenience screen, not a
// security boundary; Firestore analytics data, including IPs, is publicly readable.
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
const eventTypeLabels = { page: 'Viewed', click: 'Clicked', engaged: 'Active' };
let bookingRecords = [];
let subscriberRecords = [];
let sessionRecords = [];
let eventRecordsBySession = new Map();

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
  bookingRecords = data;
  $('bookingCount').textContent = String(data.length);
  $('bookingNavCount').textContent = number(data.length);
  renderBookingRows();
}

function renderBookingRows() {
  const list = $('bookingList');
  const query = $('bookingSearch').value.trim().toLowerCase();
  const matches = bookingRecords.map((item, index) => ({ item, index })).filter(({item}) =>
    [item.name, item.email, item.plan, item.date, item.time, item.message].some(value => String(value || '').toLowerCase().includes(query))
  );
  list.replaceChildren();
  if (!matches.length) {
    list.append(text('p', bookingRecords.length ? 'No requests match your search.' : 'No cleaning requests yet.', 'empty-note'));
    return;
  }
  matches.forEach(({item, index}) => {
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'booking-row'; row.dataset.detailKind = 'booking'; row.dataset.detailIndex = String(index);
    const client = document.createElement('span'); client.className = 'row-primary';
    client.append(text('strong', item.name || 'New request'), text('small', item.email || 'No email provided'));
    const service = text('span', item.plan || 'Cleaning request', 'service-badge');
    const date = text('span', `${item.date || 'Date not set'}${item.time ? ` · ${item.time}` : ''}`, 'row-date');
    row.append(client, service, date, text('span', '›', 'row-arrow'));
    list.append(row);
  });
}

function renderSubscribers(data) {
  subscriberRecords = data;
  $('subscriberCount').textContent = String(data.length);
  $('subscriberNavCount').textContent = number(data.length);
  renderSubscriberRows();
}

function renderSubscriberRows() {
  const list = $('subscriberList');
  const query = $('subscriberSearch').value.trim().toLowerCase();
  const matches = subscriberRecords.map((item, index) => ({ item, index }))
    .filter(({item}) => String(item.email || '').toLowerCase().includes(query));
  list.replaceChildren();
  if (!matches.length) {
    list.append(text('p', subscriberRecords.length ? 'No subscribers match your search.' : 'No email subscribers yet.', 'empty-note'));
    return;
  }
  matches.forEach(({item, index}) => {
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'subscriber-row'; row.dataset.detailKind = 'subscriber'; row.dataset.detailIndex = String(index);
    const email = document.createElement('span'); email.className = 'row-primary';
    email.append(text('strong', item.email || 'No email provided'), text('small', 'Clino email updates'));
    row.append(email, text('span', dateLabel(item.createdAt), 'row-date'), text('span', '›', 'row-arrow'));
    list.append(row);
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

function renderAnalytics(documents, sessionDocuments, days) {
  const totals = { pageviews: 0, visits: 0, engaged: 0, clicks: 0 };
  const pages = {}, clicks = {}, devices = {}, sources = {}, regions = {}, locations = Object.create(null);
  sessionDocuments.forEach(item => {
    const session = item.data();
    const label = [session.city, session.region, session.country].filter(value => typeof value === 'string' && value.trim()).join(', ');
    if (label) locations[label] = (locations[label] || 0) + 1;
  });
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
  appendRows('analyticsLocations', locations, {}, 'No IP location data yet.');
  appendRows('analyticsRegions', regions, timezoneLabels, 'No timezone data yet.');
  drawChart(daily, days);
}

function renderSessionJourneys(sessionDocuments, eventDocuments) {
  sessionRecords = sessionDocuments.map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.lastActiveAt?.toMillis?.() || 0) - (a.lastActiveAt?.toMillis?.() || 0)).slice(0, 20);
  eventRecordsBySession = new Map();
  eventDocuments.forEach(item => {
    const data = item.data();
    const rows = eventRecordsBySession.get(data.sessionId) || [];
    rows.push(data);
    eventRecordsBySession.set(data.sessionId, rows);
  });
  $('visitorNavCount').textContent = number(sessionRecords.length);
  renderVisitorRows();
  renderOverviewSessions();
  $('analyticsSessionsStatus').textContent = '';
}

function sessionLocation(session) {
  return [session.city, session.region, session.country].filter(value => typeof value === 'string' && value.trim()).join(', ');
}

function sessionEvents(session) {
  return (eventRecordsBySession.get(session.sessionId || session.id) || [])
    .slice().sort((a, b) => (a.occurredAt?.toMillis?.() || 0) - (b.occurredAt?.toMillis?.() || 0));
}

function renderVisitorRows() {
  const list = $('analyticsSessions');
  const query = $('visitorSearch').value.trim().toLowerCase();
  list.replaceChildren();
  const matches = sessionRecords.map((session, index) => ({session,index})).filter(({session}) =>
    [session.sessionId, session.ip, sessionLocation(session), session.device, session.source, session.page]
      .some(value => String(value || '').toLowerCase().includes(query))
  );
  if (!matches.length) {
    list.append(text('p', sessionRecords.length ? 'No visits match your search.' : 'No anonymous visit journeys recorded for this period.', 'empty-note'));
    return;
  }
  matches.forEach(({session,index}) => {
    const row = document.createElement('button'); row.type='button'; row.className='visitor-card';
    row.dataset.detailKind='visitor'; row.dataset.detailIndex=String(index);
    const shortId = String(session.sessionId || session.id).slice(0,8);
    const location = sessionLocation(session);
    row.append(text('strong', `Visit ${shortId}…`), text('span', `${deviceLabels[session.device] || 'Device unknown'}${location ? ` · ${location}` : ''} · ${dateLabel(session.lastActiveAt || session.startedAt)}`, 'visitor-device'));
    row.append(text('small', [session.ip ? `IP ${session.ip}` : '', sourceLabels[session.source] || 'Source unknown', `${sessionEvents(session).length} activity events`].filter(Boolean).join(' · ')));
    list.append(row);
  });
}

function renderOverviewSessions() {
  const list = $('overviewSessions'); list.replaceChildren();
  if (!sessionRecords.length) { list.append(text('p','No recent visitor activity yet.','overview-empty')); return; }
  sessionRecords.slice(0,4).forEach((session,index) => {
    const row=document.createElement('button'); row.type='button'; row.className='overview-session-row';
    row.dataset.detailKind='visitor'; row.dataset.detailIndex=String(index);
    const primary=document.createElement('span');
    primary.append(text('strong',`Visit ${String(session.sessionId || session.id).slice(0,8)}…`),text('small',[sessionLocation(session)||'Location unavailable',dateLabel(session.lastActiveAt || session.startedAt)].join(' · ')));
    row.append(primary,text('span','Details →')); list.append(row);
  });
}

function showSessionErrorMessage() {
  const status = $('analyticsSessionsStatus');
  status.replaceChildren(document.createTextNode('The visitor timeline could not be loaded. Check the connection, then retry. '));
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = 'Retry loading';
  link.addEventListener('click', event => { event.preventDefault(); loadDashboardData(); });
  status.append(link);
}

async function loadDashboardData() {
  $('connectionStatus').textContent = 'Loading dashboard data…';
  $('connectionDot').classList.remove('is-warning');
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
    const [bookings, subscribers, analytics, sessions, events] = await Promise.allSettled([
      firestore.getDocs(firestore.query(firestore.collection(db, 'bookings'), firestore.orderBy('createdAt', 'desc'), firestore.limit(100))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'subscribers'), firestore.orderBy('createdAt', 'desc'), firestore.limit(200))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'siteAnalytics'), firestore.where('day', '>=', startDay), firestore.orderBy('day', 'asc'), firestore.limit(5000))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'visitorSessions'), firestore.where('day', '>=', startDay), firestore.orderBy('day', 'desc'), firestore.limit(200))),
      firestore.getDocs(firestore.query(firestore.collection(db, 'visitorEvents'), firestore.where('day', '>=', startDay), firestore.orderBy('day', 'desc'), firestore.limit(5000)))
    ]);
    const fulfilledReads = [bookings, subscribers, analytics, sessions, events].filter(result => result.status === 'fulfilled').length;
    $('connectionStatus').textContent = fulfilledReads === 5 ? 'Connected to Firestore' : fulfilledReads ? 'Some data unavailable' : 'Connection issue';
    $('connectionDot').classList.toggle('is-warning', fulfilledReads < 5);
    if (bookings.status === 'fulfilled') renderBookings(bookings.value.docs.map(doc => doc.data()));
    else { renderBookings([]); $('bookingList').replaceChildren(text('p', 'Could not load booking requests right now.', 'empty-note')); }
    if (subscribers.status === 'fulfilled') renderSubscribers(subscribers.value.docs.map(doc => doc.data()));
    else { renderSubscribers([]); $('subscriberList').replaceChildren(text('p', 'Could not load subscribers right now.', 'empty-note')); }
    if (analytics.status === 'fulfilled') {
      renderAnalytics(analytics.value.docs, sessions.status === 'fulfilled' ? sessions.value.docs : [], days);
      $('analyticsStatus').textContent = analytics.value.empty ? 'No activity yet for this period.' : '';
    } else {
      $('analyticsKpis').replaceChildren(); $('analyticsChart').replaceChildren();
      const status = $('analyticsStatus');
      status.replaceChildren(document.createTextNode('Website activity could not be loaded from Firestore. Check your connection, then retry. '));
      const retryLink = document.createElement('a');
      retryLink.href = '#';
      retryLink.textContent = 'Retry loading';
      retryLink.addEventListener('click', event => { event.preventDefault(); loadDashboardData(); });
      status.append(retryLink);
      ['analyticsPages', 'analyticsClicks', 'analyticsDevices', 'analyticsSources', 'analyticsLocations', 'analyticsRegions'].forEach(id => $(id).replaceChildren());
    }
    if (sessions.status === 'fulfilled' && events.status === 'fulfilled') {
      renderSessionJourneys(sessions.value.docs, events.value.docs);
    } else {
      $('analyticsSessions').replaceChildren();
      showSessionErrorMessage();
    }
    dashboardStatus.textContent = '';
  } catch (error) {
    console.error('Clino dashboard could not load Firestore data.', error);
    $('connectionStatus').textContent = 'Connection issue';
    $('connectionDot').classList.add('is-warning');
    dashboardStatus.textContent = 'Could not connect to Firestore. Check the connection and try again.';
  }
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  document.body.classList.add('has-dashboard');
  $('adminLogout').hidden = false;
  loadDashboardData();
}

function setDashboardView(view) {
  document.querySelectorAll('[data-view-panel]').forEach(panel => {
    const active = panel.dataset.viewPanel === view;
    panel.hidden = !active;
    panel.classList.toggle('is-visible', active);
  });
  document.querySelectorAll('[data-dashboard-view]').forEach(button => {
    const active = button.dataset.dashboardView === view;
    button.classList.toggle('is-active', active);
    if (button.getAttribute('role') === 'tab') button.setAttribute('aria-selected', String(active));
    else if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function addDetail(label, value, options = {}) {
  if (value === undefined || value === null || value === '') return;
  const row=document.createElement('dl'); row.className='detail-field';
  const term=text('dt',label); const detail=document.createElement('dd');
  if (options.email) { const link=document.createElement('a'); link.href=`mailto:${encodeURIComponent(String(value))}`; link.textContent=String(value); detail.append(link); }
  else detail.textContent=String(value);
  row.append(term,detail); $('detailsContent').append(row);
}

function addDialogAction(label, href) {
  const link=document.createElement('a'); link.className='button'; link.href=href; link.textContent=label; $('detailsActions').append(link);
}

function openDetails(kind, index) {
  const dialog=$('detailsDialog'); const content=$('detailsContent'); const actions=$('detailsActions');
  content.replaceChildren(); actions.replaceChildren();
  if (kind === 'booking') {
    const item=bookingRecords[index]; if (!item) return;
    $('detailsEyebrow').textContent='CLEANING REQUEST'; $('detailsTitle').textContent=item.name || 'New request';
    addDetail('Client',item.name || 'Not provided'); addDetail('Email',item.email,{email:true});
    addDetail('Service',item.plan || 'Cleaning request'); addDetail('Preferred date',item.date || 'Not provided');
    addDetail('Preferred time',item.time || 'Not provided'); addDetail('Received',dateLabel(item.createdAt));
    addDetail('Message',item.message || 'No additional message.');
    if (item.email) addDialogAction('Reply by email',`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent('Your Clino cleaning request')}`);
  } else if (kind === 'subscriber') {
    const item=subscriberRecords[index]; if (!item) return;
    $('detailsEyebrow').textContent='EMAIL SUBSCRIBER'; $('detailsTitle').textContent='Sign-up details';
    addDetail('Email',item.email,{email:true}); addDetail('Joined',dateLabel(item.createdAt));
    if (item.email) addDialogAction('Compose email',`mailto:${encodeURIComponent(item.email)}`);
  } else if (kind === 'visitor') {
    const session=sessionRecords[index]; if (!session) return;
    $('detailsEyebrow').textContent='ANONYMOUS VISIT'; $('detailsTitle').textContent=`Visit ${String(session.sessionId || session.id).slice(0,8)}…`;
    addDetail('IP address',session.ip || 'Unavailable'); addDetail('Approx. location',sessionLocation(session) || 'Unavailable');
    addDetail('Device',deviceLabels[session.device] || 'Unknown'); addDetail('Traffic source',sourceLabels[session.source] || 'Unknown');
    addDetail('Timezone',timezoneLabels[session.timezone] || 'Unknown'); addDetail('Started',dateLabel(session.startedAt));
    addDetail('Last active',dateLabel(session.lastActiveAt));
    const events=sessionEvents(session);
    if (events.length) {
      const row=document.createElement('dl'); row.className='detail-field'; row.append(text('dt','Visit activity'));
      const trail=document.createElement('dd'); const ordered=document.createElement('ol'); ordered.className='dialog-trail';
      events.forEach(event=>{
        let detail='';
        if (event.type==='page') detail=`Viewed ${pageLabels[event.page] || 'a page'}`;
        if (event.type==='click') detail=`Clicked ${event.actionLabel || clickLabels[event.actionKey] || 'a site action'}`;
        if (event.type==='engaged') detail=`Active ${number(event.seconds)}s on ${pageLabels[event.page] || 'a page'}`;
        if (detail) ordered.append(text('li',`${dateLabel(event.occurredAt)} · ${detail}`));
      });
      if (!ordered.children.length) ordered.append(text('li','No page or action events were captured.'));
      trail.append(ordered); row.append(trail); content.append(row);
    }
  }
  if (!dialog.open) dialog.showModal();
}

document.querySelectorAll('[data-dashboard-view]').forEach(button => button.addEventListener('click', () => setDashboardView(button.dataset.dashboardView)));
document.querySelectorAll('[data-open-view]').forEach(button => button.addEventListener('click', () => setDashboardView(button.dataset.openView)));
$('bookingSearch').addEventListener('input',renderBookingRows);
$('subscriberSearch').addEventListener('input',renderSubscriberRows);
$('visitorSearch').addEventListener('input',renderVisitorRows);
document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-detail-kind]');
  if (trigger) openDetails(trigger.dataset.detailKind,Number(trigger.dataset.detailIndex));
});
document.querySelector('[data-dialog-close]').addEventListener('click',()=> $('detailsDialog').close());
$('detailsDialog').addEventListener('click',event=>{if(event.target === $('detailsDialog')) $('detailsDialog').close();});
$('refreshDashboard').addEventListener('click',loadDashboardData);
$('dashboardToday').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
setDashboardView('overview');

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
  $('adminLogout').hidden = true;
  dashboard.hidden = true;
  document.body.classList.remove('has-dashboard');
  loginPanel.hidden = false;
  loginForm.reset();
  adminStatus.textContent = 'You are signed out.';
});

if (sessionStorage.getItem(sessionKey) === 'true') showDashboard();
