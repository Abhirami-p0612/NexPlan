import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJXinMbYoFCkwv3fxqmO2kQMaDFRzvgmM",
  authDomain: "nexplan-c7e1a.firebaseapp.com",
  projectId: "nexplan-c7e1a",
  storageBucket: "nexplan-c7e1a.firebasestorage.app",
  messagingSenderId: "321240652128",
  appId: "1:321240652128:web:bb94a09bca4f1ca52f6605"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };