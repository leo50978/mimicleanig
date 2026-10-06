import { getFirestoreTools } from './firebase-client.js';

const form = document.getElementById('reviewForm');
const grid = document.getElementById('testimonialList');
const status = document.getElementById('reviewFormStatus');
const average = document.getElementById('averageRating');
const heroAverage = document.getElementById('heroAverageRating');
const heroAggregate = document.querySelector('.rating-aggregate');
const submit = form?.querySelector('[type="submit"]');
if (!form || !grid || !status || !average) throw new Error('Review UI is incomplete.');

const staticCards = [...grid.querySelectorAll('.testimonial-card .rating[data-rating]')];
const staticRatings = staticCards.map(node => Number(node.dataset.rating)).filter(rating => Number.isInteger(rating) && rating >= 1 && rating <= 5);
const isValidReview = review => review && typeof review.name === 'string' && review.name.trim().length >= 2
  && typeof review.message === 'string' && review.message.trim().length >= 12
  && Number.isInteger(Number(review.rating)) && Number(review.rating) >= 1 && Number(review.rating) <= 5;

function updateAverage(reviews) {
  const ratings = [...staticRatings, ...reviews.map(review => Number(review.rating))];
  if (!ratings.length) return;
  const value = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const displayed = value.toFixed(1);
  average.textContent = displayed;
  if (heroAverage) heroAverage.textContent = `${displayed} / 5`;
  if (heroAggregate) {
    heroAggregate.style.setProperty('--rating-fill', `${Math.max(0, Math.min(100, value / 5 * 100))}%`);
    heroAggregate.setAttribute('aria-label', `Average client rating: ${displayed} out of 5 stars`);
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function createReviewCard(data) {
  const article = document.createElement('article');
  article.className = 'testimonial-card glass user-review';
  const person = document.createElement('div');
  person.className = 'person';
  const avatar = document.createElement('span');
  avatar.className = 'person-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = data.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  const identity = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = data.name.trim();
  const date = document.createElement('small');
  date.textContent = formatDate(data.createdAt);
  identity.append(name, date);
  person.append(avatar, identity);
  const rating = document.createElement('div');
  rating.className = 'rating';
  rating.setAttribute('aria-label', `${data.rating} out of 5 stars`);
  rating.textContent = '★'.repeat(Number(data.rating)) + '☆'.repeat(5 - Number(data.rating));
  const quote = document.createElement('blockquote');
  quote.textContent = data.message.trim();
  article.append(person, rating, quote);
  return article;
}

function renderReviews(reviews) {
  grid.querySelectorAll('.user-review').forEach(card => card.remove());
  const fragment = document.createDocumentFragment();
  reviews.forEach(review => fragment.append(createReviewCard(review)));
  grid.prepend(fragment);
  updateAverage(reviews);
}

function mapSnapshotReview(documentSnapshot) {
  const data = documentSnapshot.data();
  const createdAt = data.createdAt?.toDate?.();
  const review = {
    name: data.name,
    rating: Number(data.rating),
    message: data.message,
    createdAt: createdAt?.toISOString() || ''
  };
  return isValidReview(review) && createdAt ? review : null;
}

let currentReviews = [];
let firestore;
let reviewsCollection;
let liveQuery;
let unsubscribe;

async function connectReviews() {
  try {
    firestore = await getFirestoreTools();
    reviewsCollection = firestore.collection(firestore.db, 'reviews');
    liveQuery = firestore.query(reviewsCollection, firestore.orderBy('createdAt', 'desc'), firestore.limit(50));
    unsubscribe = firestore.onSnapshot(liveQuery, snapshot => {
      currentReviews = snapshot.docs.map(mapSnapshotReview).filter(Boolean);
      renderReviews(currentReviews);
    }, error => {
      console.error('Clino reviews could not be loaded.', error);
      status.textContent = 'Reviews are temporarily unavailable. Please try again later.';
    });
  } catch (error) {
    console.error('Clino reviews could not connect to Firestore.', error);
    status.textContent = 'Reviews are temporarily unavailable. Please try again later.';
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = '';
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const review = {
    name: String(values.get('name') || '').trim(),
    rating: Number(values.get('rating')),
    message: String(values.get('message') || '').trim()
  };
  if (!isValidReview(review)) {
    status.textContent = 'Enter your name, a comment and a rating from 1 to 5 stars.';
    return;
  }
  if (!firestore || !reviewsCollection || !submit) {
    status.textContent = 'Reviews are temporarily unavailable. Please try again later.';
    return;
  }

  submit.disabled = true;
  submit.textContent = 'Posting review…';
  status.textContent = 'Posting your review…';
  try {
    await firestore.addDoc(reviewsCollection, {
      ...review,
      createdAt: firestore.serverTimestamp()
    });
    status.textContent = 'Thank you. Your review is now shared with visitors.';
    form.reset();
  } catch (error) {
    console.error('Clino review could not be saved.', error);
    status.textContent = error?.code === 'permission-denied'
      ? 'Reviews are temporarily unavailable. Please try again later.'
      : 'Your review could not be posted. Please try again shortly.';
  } finally {
    submit.disabled = false;
    submit.textContent = 'Post your review';
  }
});

window.addEventListener('pagehide', () => unsubscribe?.(), { once: true });
connectReviews();
