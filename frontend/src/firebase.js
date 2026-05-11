import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import axios from "axios";
import API_BASE_URL from "./config/api";

const firebaseConfig = {
  apiKey: "AIzaSyDPew83Uek8Zw2sRTzwo38hdiDAhyb1SCo",
  authDomain: "triptogether9191.firebaseapp.com",
  projectId: "triptogether9191",
  storageBucket: "triptogether9191.firebasestorage.app",
  messagingSenderId: "1007061520652",
  appId: "1:1007061520652:web:4863d10ee5b3e00a03b929",
  measurementId: "G-KB03CDH3CJ"
};

const app = initializeApp(firebaseConfig);

export const requestForToken = async () => {
  try {
    const supported = await isSupported();
    if (!supported) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const messaging = getMessaging(app);

    // Register Service Worker explicitly
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("FCM: Service Worker registered", registration);

    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: "BA9Z6Pevkse_ydmldG5E40krd3KIDfNesw5UMUTbRKg-VmrtVHZ7H_587x6ihMDAdFC8CSIjPwedVV07GQ0byf0",
    });

    if (currentToken) {
      console.log("FCM: Token generated:", currentToken);
      await axios.post(
        `${API_BASE_URL}/api/user-profile/update-fcm-token`,
        { fcmToken: currentToken },
        { withCredentials: true }
      );
    }
  } catch (err) {
    console.error("FCM Error Details:", err);
  }
};

export const onMessageListener = async (callback) => {
  try {
    const supported = await isSupported();
    if (!supported) return;

    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log("FCM: Message received:", payload);
      callback(payload);
    });
  } catch (err) {
    console.error("FCM Listener Error:", err);
  }
};
