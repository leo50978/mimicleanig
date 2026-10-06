const firebaseConfig = {
  apiKey: 'AIzaSyANt0dZtL-6P6l84ab-FSRIX9ISPd_YCe6I',
  authDomain: 'cpieo-99bd5.firebaseapp.com',
  projectId: 'cpieo-99bd5',
  storageBucket: 'cpieo-99bd5.firebasestorage.app',
  messagingSenderId: '405125968337',
  appId: '1:405125968337:web:7d5f74b710cc23b84270f0'
};

let firestoreTools;
export function getFirestoreTools() {
  if (!firestoreTools) {
    firestoreTools = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]).then(([app, firestore]) => {
      const firebaseApp = app.getApps().length ? app.getApp() : app.initializeApp(firebaseConfig);
      return { db: firestore.getFirestore(firebaseApp), ...firestore };
    }).catch(error => {
      firestoreTools = undefined;
      throw error;
    });
  }
  return firestoreTools;
}
