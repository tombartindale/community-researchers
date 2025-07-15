import { defineBoot } from "#q-app/wrappers";
import {
  VueFire,
  VueFireAuth,
  VueFireFirestoreOptionsAPI,
  firestoreDefaultConverter,
  globalFirestoreOptions,
} from "vuefire";

globalFirestoreOptions.converter = {
  // the default converter just returns the data: (data) => data
  toFirestore: firestoreDefaultConverter.toFirestore,
  fromFirestore: (snapshot, options) => {
    const data = firestoreDefaultConverter.fromFirestore(snapshot, options);
    // if the document doesn't exist, return null
    if (!data) return null;
    // add anything custom to the returned object
    // console.log(snapshot.ref.parent.parent);
    data.parent = snapshot.ref.parent?.parent?.id;
    return data;
  },
};

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

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
export const functions = getFunctions(firebaseApp);

import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { connectStorageEmulator } from "firebase/storage";
import { connectFunctionsEmulator } from "firebase/functions";

if (process.env.VUE_APP_EMULATORS) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
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

export const getClustersForRegion = httpsCallable(
  functions,
  "getClustersForRegion"
);
