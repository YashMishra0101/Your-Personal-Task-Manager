const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Scheduled function that runs every minute to check for due alarms
 * Triggers: Every minute
 * Action: Checks all tasks with alarms and sends push notifications
 */
exports.checkAlarms = functions.pubsub
    .schedule("* * * * *") // Run every minute
    .timeZone("Asia/Kolkata") // Set your timezone
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();
        const db = admin.firestore();

        try {
            // Query all tasks with active alarms
            const tasksSnapshot = await db
                .collectionGroup("tasks")
                .where("alarm.enabled", "==", true)
                .where("alarm.triggered", "==", false)
                .get();

            const notifications = [];

            tasksSnapshot.forEach((doc) => {
                const task = doc.data();
                if (!task.alarm || !task.alarm.date || !task.alarm.time) return;

                // Parse alarm date and time
                const alarmDateTime = new Date(`${task.alarm.date}T${task.alarm.time}`);
                const alarmTimestamp = admin.firestore.Timestamp.fromDate(alarmDateTime);

                // Check if alarm should trigger (within 1 minute window)
                const timeUntilAlarm = alarmTimestamp.seconds - now.seconds;

                if (timeUntilAlarm <= 60 && timeUntilAlarm >= 0) {
                    // Alarm is due! Get user's FCM token
                    const userId = doc.ref.parent.parent.id;

                    notifications.push(
                        sendAlarmNotification(db, userId, task, doc.ref)
                    );
                }
            });

            // Send all notifications
            await Promise.all(notifications);

            console.log(`Checked alarms. Sent ${notifications.length} notifications.`);
            return null;
        } catch (error) {
            console.error("Error checking alarms:", error);
            return null;
        }
    });

/**
 * Send push notification to user's device
 */
async function sendAlarmNotification(db, userId, task, taskRef) {
    try {
        // Get user's FCM token
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData || !userData.fcmToken) {
            console.log(`No FCM token for user ${userId}`);
            return;
        }

        // Prepare notification payload
        const message = {
            notification: {
                title: "⏰ Alarm Ringing!",
                body: task.title,
                icon: "/icon-192.png",
            },
            data: {
                taskId: taskRef.id,
                type: "alarm",
                url: "/",
            },
            token: userData.fcmToken,
            webpush: {
                notification: {
                    requireInteraction: true,
                    tag: `alarm-${taskRef.id}`,
                    vibrate: [200, 100, 200],
                },
            },
        };

        // Send the notification
        await admin.messaging().send(message);

        // Mark alarm as triggered
        await taskRef.update({
            "alarm.triggered": true,
            "alarm.triggeredAt": admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Sent alarm notification for task: ${task.title}`);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

/**
 * HTTP function to test alarm notifications
 * Call this via: https://YOUR_PROJECT.cloudfunctions.net/testAlarm?userId=USER_ID
 */
exports.testAlarm = functions.https.onRequest(async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        res.status(400).send("Missing userId parameter");
        return;
    }

    try {
        const db = admin.firestore();
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData || !userData.fcmToken) {
            res.status(404).send("User or FCM token not found");
            return;
        }

        const message = {
            notification: {
                title: "🧪 Test Alarm",
                body: "This is a test notification from your Task Manager!",
            },
            token: userData.fcmToken,
        };

        await admin.messaging().send(message);
        res.send("Test notification sent successfully!");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error sending test notification");
    }
});
