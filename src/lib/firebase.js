import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAYcAG1QVeYgtEiRE5dQS7FiVo62fN4iEk",
  authDomain: "lumina-5aac9.firebaseapp.com",
  databaseURL: "https://lumina-5aac9-default-rtdb.firebaseio.com",
  projectId: "lumina-5aac9",
  storageBucket: "lumina-5aac9.appspot.com",
  messagingSenderId: "100605478051",
  appId: "1:100605478051:web:8e4f1d88aaf40029f16b16",
  measurementId: "G-VWPWWM6149"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Optional App Check (use if enforcement is ON). Provide site key via .env
const recaptchaSiteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY;
if (recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (_) {
    // ignore duplicate init in HMR
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


