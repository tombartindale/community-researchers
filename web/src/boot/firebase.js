import { defineBoot } from "#q-app/wrappers";
import { VueFire, VueFireAuth, VueFireFirestoreOptionsAPI } from "vuefire";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseApp = initializeApp({
  // your application settings
  apiKey: "AIzaSyCSjAMC7EvpMdXManKiyg3Wiz4_dOX8UhM",
  authDomain: "community-researchers.firebaseapp.com",
  projectId: "community-researchers",
  storageBucket: "community-researchers.firebasestorage.app",
  messagingSenderId: "905414776864",
  appId: "1:905414776864:web:a406535403b4791061c445",
  measurementId: "G-8DQL5R64SK",
});

// used for the firestore refs
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { connectStorageEmulator } from "firebase/storage";

if (process.env.VUE_APP_EMULATORS) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}

export default defineBoot(({ app }) => {
  console.log("Booting Firebase...");
  app.use(VueFire, {
    // imported above but could also just be created here
    firebaseApp,
    modules: [
      // we will see other modules later on
      VueFireAuth(),
      VueFireFirestoreOptionsAPI(),
    ],
  });
});
