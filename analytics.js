import { getFirestoreTools } from './firebase-client.js';

const pageNames = {
  '/': 'home',
  '/index.html': 'home',
  '/about.html': 'about',
  '/services.html': 'services',
  '/testimonials.html': 'testimonials',
  '/blog.html': 'blog',
  '/miami-house-cleaning.html': 'miami_house_cleaning',
  '/fort-lauderdale-office-cleaning.html': 'fort_lauderdale_office_cleaning',
  '/south-florida-move-in-move-out-cleaning.html': 'move_in_move_out_cleaning',
  '/south-florida-yacht-cleaning.html': 'yacht_cleaning',
  '/west-palm-beach-broward-cleaning.html': 'west_palm_broward_cleaning',
  '/kosher-friendly-cleaning.html': 'kosher_friendly_cleaning',
  '/privacy-policy.html': 'privacy_policy',
  '/404.html': 'not_found'
};

const pageKey = pageNames[location.pathname] || 'other_page';
const currentDay = new Date();
const dayNumber = Number(`${currentDay.getUTCFullYear()}${String(currentDay.getUTCMonth() + 1).padStart(2, '0')}${String(currentDay.getUTCDate()).padStart(2, '0')}`);
const device = /ipad|tablet/i.test(navigator.userAgent) ? 'tablet' : /mobi|iphone|android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

function timezoneGroup(zone) {
  if (/New_York|Detroit|Toronto|Indiana|Kentucky|Louisville/i.test(zone)) return 'us_eastern';
  if (/Chicago|Menominee|North_Dakota|Winnipeg/i.test(zone)) return 'us_central';
  if (/Denver|Boise|Phoenix|Edmonton/i.test(zone)) return 'us_mountain';
  if (/Los_Angeles|Vancouver|Tijuana/i.test(zone)) return 'us_pacific';
  if (/Anchorage/i.test(zone)) return 'us_alaska';
  if (/Honolulu/i.test(zone)) return 'us_hawaii';
  return zone ? 'non_us_or_other' : 'unknown';
}

function sourceGroup() {
  const campaign = new URLSearchParams(location.search).get('utm_source') || '';
  const campaignName = campaign.toLowerCase();
  if (/facebook|meta/.test(campaignName)) return 'facebook';
  if (/instagram/.test(campaignName)) return 'instagram';
  if (/google|bing|yahoo|search/.test(campaignName)) return 'search';
  if (/yelp/.test(campaignName)) return 'yelp';
  if (/nextdoor/.test(campaignName)) return 'nextdoor';
  if (campaign) return 'campaign_other';
  const source = document.referrer;
  if (!source) return 'direct';
  let host = '';
  try { host = new URL(source, location.href).hostname.toLowerCase(); } catch { return 'other'; }
  if (!host || host === location.hostname) return 'internal';
  if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(host)) return 'search';
  if (/facebook\.|fb\.com/.test(host)) return 'facebook';
  if (/instagram\./.test(host)) return 'instagram';
  if (/yelp\./.test(host)) return 'yelp';
  if (/nextdoor\./.test(host)) return 'nextdoor';
  return 'referral_other';
}

const sessionKey = `clino_analytics_session_counted_${dayNumber}`;
const visitorSessionKey = `clino_visitor_session_${dayNumber}`;
let firestore;
let visitorSessionId;
let isNewVisitorSession = false;

function createVisitorSessionId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

try {
  visitorSessionId = sessionStorage.getItem(visitorSessionKey);
  if (!visitorSessionId) {
    visitorSessionId = createVisitorSessionId();
    sessionStorage.setItem(visitorSessionKey, visitorSessionId);
    isNewVisitorSession = true;
  }
} catch {
  visitorSessionId = createVisitorSessionId();
  isNewVisitorSession = true;
}

async function getTools() {
  if (!firestore) firestore = await getFirestoreTools();
  return firestore;
}

async function increment(metric, key, amount = 1) {
  const { db, doc, setDoc, increment: incrementField, serverTimestamp } = await getTools();
  const id = `${dayNumber}_${metric}_${key}`;
  await setDoc(doc(db, 'siteAnalytics', id), {
    day: dayNumber,
    metric,
    key,
    count: incrementField(amount),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function record(metric, key, amount = 1) {
  increment(metric, key, amount).catch(() => {});
}

async function recordSessionStart() {
  const { db, doc, setDoc, updateDoc, serverTimestamp } = await getTools();
  const ref = doc(db, 'visitorSessions', visitorSessionId);
  if (!isNewVisitorSession) {
    try {
      await updateDoc(ref, { lastActiveAt: serverTimestamp() });
    } catch {
      await setDoc(ref, {
        sessionId: visitorSessionId,
        day: dayNumber,
        device,
        source: sourceGroup(),
        timezone: timezoneGroup(timezone),
        firstPage: pageKey,
        startedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      });
    }
    return;
  }
  await setDoc(ref, {
    sessionId: visitorSessionId,
    day: dayNumber,
    device,
    source: sourceGroup(),
    timezone: timezoneGroup(timezone),
    firstPage: pageKey,
    startedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp()
  });
}

async function recordJourney(type, { actionKey = '', actionLabel = '', seconds = 0 } = {}) {
  const { db, collection, addDoc, doc, updateDoc, serverTimestamp } = await getTools();
  updateDoc(doc(db, 'visitorSessions', visitorSessionId), { lastActiveAt: serverTimestamp() }).catch(() => {});
  await addDoc(collection(db, 'visitorEvents'), {
    day: dayNumber,
    sessionId: visitorSessionId,
    type,
    page: pageKey,
    actionKey,
    actionLabel,
    seconds,
    occurredAt: serverTimestamp()
  });
}

function recordJourneySafely(type, details) {
  recordJourney(type, details).catch(() => {});
}

record('pageviews', 'all');
record('page', pageKey);
record('device', device);
recordSessionStart().catch(() => {});
recordJourneySafely('page');

try {
  if (!sessionStorage.getItem(sessionKey)) {
    sessionStorage.setItem(sessionKey, '1');
    record('visits', 'all');
    record('source', sourceGroup());
    record('timezone', timezoneGroup(timezone));
  }
} catch {
  record('visits', 'all');
  record('source', sourceGroup());
  record('timezone', timezoneGroup(timezone));
}

function clickGroup(element) {
  const form = element.closest('form');
  if (form?.id === 'bookingForm') return 'booking_submit';
  if (form?.id === 'newsletterForm') return 'newsletter_submit';
  if (form?.id === 'reviewForm') return 'review_submit';
  if (element.getAttribute('aria-label') === 'Open menu' || element.getAttribute('aria-label') === 'Close menu') return 'menu_toggle';
  if (element.closest('.socials')) return 'social_link';
  if (element.matches('a[href^="tel:"]')) return 'phone_call';
  if (element.matches('a[href^="mailto:"]')) return 'email_link';
  if (element.matches('[data-book-plan], [data-booking-plan], [data-open-booking], [data-booking]')) return 'booking_open';
  if (element.closest('#navLinks, .nav')) return 'navigation';
  if (element.closest('.service-card, .local-service-card')) return 'service_link';
  if (element.matches('button')) {
    const label = `${element.getAttribute('aria-label') || ''} ${element.textContent || ''}`.toLowerCase();
    if (/book|estimate|reserve|cleaning plan/.test(label)) return 'booking_cta';
    if (/call|contact|phone/.test(label)) return 'contact_cta';
    if (/review|testimonial/.test(label)) return 'review_action';
    return 'other_button';
  }
  return 'other_link';
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('a, button, [role="button"]') : null;
  if (!target || target.closest('.admin-trigger')) return;
  const actionKey = clickGroup(target);
  const actionLabel = `${target.getAttribute('aria-label') || target.innerText || target.textContent || ''}`.replace(/\s+/g, ' ').trim().slice(0, 80);
  record('click', actionKey);
  recordJourneySafely('click', { actionKey, actionLabel });
});

let lastTick = document.visibilityState === 'visible' ? performance.now() : 0;
let activeSeconds = 0;

function flushTime() {
  if (document.visibilityState === 'visible' && lastTick) {
    const now = performance.now();
    activeSeconds += Math.min(15, Math.max(0, Math.floor((now - lastTick) / 1000)));
    lastTick = now;
  }
  const whole = Math.min(15, Math.floor(activeSeconds));
  if (whole > 0) {
    activeSeconds -= whole;
    record('engaged_seconds', pageKey, whole);
    recordJourneySafely('engaged', { seconds: whole });
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushTime();
  else lastTick = performance.now();
});
window.setInterval(flushTime, 5000);
window.addEventListener('pagehide', flushTime, { once: true });
