import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Request notification permission and get FCM token
 * @param {string} userId - The current user's ID
 * @returns {Promise<string|null>} - FCM token or null if failed
 */
export async function requestFCMPermission(userId) {
    try {
        // Check if messaging is supported
        if (!messaging) {
            console.warn("Firebase Messaging is not supported in this browser");
            return null;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        // Get FCM token
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
            console.log("FCM token received:", token);

            // Save token to Firestore
            await saveFCMToken(userId, token);

            return token;
        } else {
            console.log("Failed to get FCM token");
            return null;
        }
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
}

/**
 * Save FCM token to Firestore
 */
async function saveFCMToken(userId, token) {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(
            userRef,
            {
                fcmToken: token,
                fcmTokenUpdatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
        console.log("FCM token saved to Firestore");
    } catch (error) {
        console.error("Error saving FCM token:", error);
    }
}

/**
 * Set up foreground message listener
 * This handles notifications when the app is open
 */
export function setupForegroundMessageListener() {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);

        const notificationTitle = payload.notification?.title || "Task Manager";
        const notificationOptions = {
            body: payload.notification?.body,
            icon: payload.notification?.icon || "/icon-192.png",
        };

        // Show notification even in foreground
        if (Notification.permission === "granted") {
            new Notification(notificationTitle, notificationOptions);
        }
    });
}
