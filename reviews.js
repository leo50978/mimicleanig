import { getFirestoreTools } from './firebase-client.js';

const form = document.getElementById('reviewForm');
const grid = document.getElementById('testimonialList');
const status = document.getElementById('reviewFormStatus');
const average = document.getElementById('averageRating');
const submit = form?.querySelector('[type="submit"]');
if (!form || !grid || !status || !average) throw new Error('Review UI is incomplete.');

const staticRatings = [...grid.querySelectorAll('.testimonial-card .rating[data-rating]')]
  .map(node => Number(node.dataset.rating)).filter(rating => rating === 4 || rating === 5);
let publicRatings = [];
const updateAverage = () => {
  const ratings = [...staticRatings, ...publicRatings];
  if (!ratings.length) return;
  average.textContent = (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1);
};
const formatDate = timestamp => {
  if (!timestamp?.toDate) return 'Just now';
  return timestamp.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
const createReviewCard = data => {
  const article = document.createElement('article');
  article.className = 'testimonial-card glass user-review';
  article.dataset.rating = String(data.rating);
  const person = document.createElement('div');
  person.className = 'person';
  const avatar = document.createElement('span');
  avatar.className = 'person-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = String(data.name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  const identity = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = String(data.name || '').trim();
  const date = document.createElement('small');
  date.textContent = formatDate(data.createdAt);
  identity.append(name, date);
  person.append(avatar, identity);
  const rating = document.createElement('div');
  rating.className = 'rating';
  rating.setAttribute('aria-label', `${data.rating} out of 5 stars`);
  rating.textContent = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
  const quote = document.createElement('blockquote');
  quote.textContent = String(data.message || '').trim();
  article.append(person, rating, quote);
  return article;
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = '';
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const rating = Number(values.get('rating'));
  const name = String(values.get('name') || '').trim();
  const message = String(values.get('message') || '').trim();
  if (![4, 5].includes(rating)) {
    status.textContent = 'Choose either 4 or 5 stars.';
    return;
  }
  if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); submit.textContent = 'Posting…'; }
  status.textContent = 'Saving your review…';
  try {
    const { db, addDoc, collection, serverTimestamp } = await getFirestoreTools();
    await addDoc(collection(db, 'reviews'), { name, rating, message, createdAt: serverTimestamp() });
    form.reset();
    status.textContent = 'Thank you. Your review has been added to the list.';
  } catch (error) {
    console.error('Clino review could not be saved.', error);
    status.textContent = 'We couldn’t save your review. Please try again shortly.';
  } finally {
    if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); submit.textContent = 'Post your review'; }
  }
});

(async () => {
  try {
    const { db, collection, limit, onSnapshot, orderBy, query } = await getFirestoreTools();
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    onSnapshot(reviewsQuery, snapshot => {
      grid.querySelectorAll('.user-review').forEach(card => card.remove());
      const validReviews = snapshot.docs.map(item => item.data()).filter(review =>
        typeof review.name === 'string' && typeof review.message === 'string' && [4, 5].includes(Number(review.rating))
      );
      publicRatings = validReviews.map(review => Number(review.rating));
      const fragment = document.createDocumentFragment();
      validReviews.forEach(review => fragment.append(createReviewCard(review)));
      grid.prepend(fragment);
      updateAverage();
    }, error => {
      console.error('Clino public reviews could not be loaded.', error);
    });
  } catch (error) {
    console.error('Clino public reviews could not be connected.', error);
  }
})();
