const STORAGE_KEY = 'clino.reviews.v1';
const form = document.getElementById('reviewForm');
const grid = document.getElementById('testimonialList');
const status = document.getElementById('reviewFormStatus');
const average = document.getElementById('averageRating');
const submit = form?.querySelector('[type="submit"]');
if (!form || !grid || !status || !average) throw new Error('Review UI is incomplete.');

const staticRatings = [...grid.querySelectorAll('.testimonial-card .rating[data-rating]')]
  .map(node => Number(node.dataset.rating)).filter(rating => rating === 4 || rating === 5);
const isValidReview = review => review && typeof review.name === 'string' && review.name.trim().length >= 2
  && typeof review.message === 'string' && review.message.trim().length >= 12
  && [4, 5].includes(Number(review.rating)) && typeof review.createdAt === 'string';

function readLocalReviews() {
  try {
    const reviews = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(reviews) ? reviews.filter(isValidReview) : [];
  } catch {
    return [];
  }
}

function updateAverage(reviews) {
  const ratings = [...staticRatings, ...reviews.map(review => Number(review.rating))];
  if (!ratings.length) return;
  const value = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  average.textContent = Math.max(4.5, value).toFixed(1);
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

let savedReviews = readLocalReviews();
renderReviews(savedReviews);

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const review = {
    name: String(values.get('name') || '').trim(),
    rating: Number(values.get('rating')),
    message: String(values.get('message') || '').trim(),
    createdAt: new Date().toISOString()
  };
  if (!isValidReview(review)) {
    status.textContent = 'Enter your name, a comment and either 4 or 5 stars.';
    return;
  }
  savedReviews = [review, ...savedReviews];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedReviews));
    status.textContent = 'Thank you. Your review is saved in this browser and appears in the list below.';
  } catch {
    status.textContent = 'Your browser could not save this review. Please check its storage settings and try again.';
    savedReviews.shift();
    return;
  }
  form.reset();
  renderReviews(savedReviews);
});
