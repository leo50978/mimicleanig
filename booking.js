import { getFirestoreTools } from './firebase-client.js';
const dialog = document.getElementById('bookingDialog');
const form = document.getElementById('bookingForm');
const dateInput = document.getElementById('bookingDate');
const status = document.getElementById('bookingStatus');
const submit = form?.querySelector('[type="submit"]');
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
if (dateInput) dateInput.min = localToday();
document.querySelectorAll('[data-book-plan]').forEach(button => button.addEventListener('click', () => {
  const plan = button.closest('.plan')?.querySelector('h3')?.textContent.trim() || button.dataset.bookPlan;
  form.elements.plan.value = plan;
  document.getElementById('selectedPlan').textContent = plan;
  status.textContent = '';
  dialog.showModal();
}));
document.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  if (values.get('date') < localToday()) {
    status.textContent = 'Please choose a future date.';
    return;
  }
  const booking = {
    name: String(values.get('name')).trim(),
    email: String(values.get('email')).trim().toLowerCase(),
    date: String(values.get('date')),
    time: String(values.get('time')),
    plan: String(values.get('plan')),
    message: [
      values.get('phone') ? `Phone: ${String(values.get('phone')).trim()}` : '',
      values.get('location') ? `City / ZIP: ${String(values.get('location')).trim()}` : '',
      String(values.get('message') || '').trim()
    ].filter(Boolean).join('\n').slice(0, 1200),
  };
  if (submit) { submit.disabled = true; submit.textContent = 'Sending request…'; }
  status.textContent = 'Saving your request securely…';
  try {
    const { db, addDoc, collection, serverTimestamp: _serverTimestamp } = await getFirestoreTools();
    booking.createdAt = _serverTimestamp();
    const savedRequest = await addDoc(collection(db, 'bookings'), booking);
    window.clinoMetaEvents?.lead({ submissionId: savedRequest.id, service: booking.plan });
    status.textContent = 'Thanks — your quote request was received. We’ll contact you to confirm availability and next steps. No appointment is confirmed yet.';
    form.reset();
    if (dateInput) dateInput.min = localToday();
  } catch (error) {
    console.error('Clino booking could not be saved.', error);
    status.textContent = 'We couldn’t save your request right now. Please call +1 (561) 275-4445 and we’ll help.';
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = submit.dataset.idleLabel || 'Request a free quote'; }
  }
});

document.querySelectorAll('#newsletterForm, form[data-newsletter-signup]').forEach(newsletterForm => {
  newsletterForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!newsletterForm.reportValidity()) return;
    const email = String(new FormData(newsletterForm).get('email')).trim().toLowerCase();
    const button = newsletterForm.querySelector('[type="submit"]');
    const note = newsletterForm.querySelector('[role="status"]') || newsletterForm.parentElement.querySelector('#newsletterStatus');
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    if (note) note.textContent = 'Saving your email…';
    try {
      const { db, addDoc, collection, serverTimestamp } = await getFirestoreTools();
      await addDoc(collection(db, 'subscribers'), { email, createdAt: serverTimestamp() });
      if (note) note.textContent = 'Thank you. You’re on the list.';
      newsletterForm.reset();
    } catch (error) {
      console.error('Clino email signup could not be saved.', error);
      if (note) note.textContent = 'We couldn’t save your email right now. Please try again shortly.';
    } finally {
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  });
});
