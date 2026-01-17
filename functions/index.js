const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Trigger when a review is created
exports.onReviewCreated = functions.firestore
  .document("reviews/{reviewId}")
  .onCreate(async (snap, context) => {
    const review = snap.data();
    const workerId = review.workerId;
    const rating = review.rating;

    const workerRef = admin.firestore().collection("workers").doc(workerId);

    await admin.firestore().runTransaction(async (transaction) => {
      const workerSnap = await transaction.get(workerRef);
      if (!workerSnap.exists) return;

      const workerData = workerSnap.data();
      const totalRatings = (workerData.totalRatings || 0) + 1;
      const averageRating =
        ((workerData.averageRating || 0) * (totalRatings - 1) + rating) /
        totalRatings;

      transaction.update(workerRef, {
        totalRatings: totalRatings,
        averageRating: parseFloat(averageRating.toFixed(1)),
      });
    });
  });