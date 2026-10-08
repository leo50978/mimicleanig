(() => {
  'use strict';

  // One delegated listener covers phone links in shared headers/footers and content added later.
  if (window.__clinoMetaEventsInitialized) return;
  window.__clinoMetaEventsInitialized = true;

  const trackingAllowed = () => navigator.globalPrivacyControl !== true && typeof window.fbq === 'function';
  const pageType = () => {
    const path = location.pathname.toLowerCase();
    if (path === '/' || path.endsWith('/index.html')) return 'home';
    if (/(cleaning|services)\.html$/.test(path)) return 'service';
    return undefined;
  };

  const knownServiceTypes = new Set([
    'home_cleaning', 'office_cleaning', 'airbnb_turnover', 'move_in_out',
    'deep_cleaning', 'yacht_cleaning', 'kosher_friendly_cleaning'
  ]);
  const serviceTypeFor = value => {
    const text = String(value || '').toLowerCase();
    if (/kosher/.test(text)) return 'kosher_friendly_cleaning';
    if (/yacht|boat|marine/.test(text)) return 'yacht_cleaning';
    if (/office|commercial/.test(text)) return 'office_cleaning';
    if (/airbnb|vacation|rental turnover/.test(text)) return 'airbnb_turnover';
    if (/move.?in|move.?out|turnover/.test(text)) return 'move_in_out';
    if (/deep/.test(text)) return 'deep_cleaning';
    if (/home|residential|house/.test(text)) return 'home_cleaning';

    const path = location.pathname.toLowerCase();
    if (/yacht/.test(path)) return 'yacht_cleaning';
    if (/office/.test(path)) return 'office_cleaning';
    if (/kosher/.test(path)) return 'kosher_friendly_cleaning';
    if (/move-in-move-out/.test(path)) return 'move_in_out';
    if (/miami-house|west-palm/.test(path)) return 'home_cleaning';
    return undefined;
  };

  document.addEventListener('click', event => {
    if (!trackingAllowed()) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="tel:"]') : null;
    if (!link) return;

    const context = link.closest('.service-card, .service-menu-card, [data-service-type]');
    const service = context?.dataset.serviceType || context?.querySelector('h2, h3, [data-service-name]')?.textContent;
    const params = { contact_method: 'phone', page_type: 'contact' };
    const type = serviceTypeFor(service);
    if (type && knownServiceTypes.has(type)) params.service_type = type;
    window.fbq('track', 'Contact', params);
  }, { capture: true });

  const sentLeadIds = new Set();
  window.clinoMetaEvents = Object.freeze({
    lead({ submissionId, service } = {}) {
      if (!trackingAllowed() || !submissionId || sentLeadIds.has(submissionId)) return false;
      sentLeadIds.add(submissionId);
      const params = { contact_method: 'form', page_type: 'booking' };
      const type = serviceTypeFor(service);
      if (type && knownServiceTypes.has(type)) params.service_type = type;
      window.fbq('track', 'Lead', params);
      return true;
    }
  });
})();
