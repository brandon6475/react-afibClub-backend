import * as admin from 'firebase-admin';
import config from '../config';
var serviceAccount = require("../../firebase_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firestore_url
});

export const db = admin.firestore();