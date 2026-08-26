/* CCS — shared word packs
 * Optional. When configured, a teacher's edits can be published so every
 * visitor to the site sees them as the new default - not just the browser
 * that made the change. Nothing here runs, or errors, until CONFIG below is
 * filled in: with no cloud project set up, CCS behaves exactly as it did
 * before (each browser keeps its own local edits, per config.js).
 *
 * How it's secured: Firestore's rules (set server-side, in the Firebase
 * console - never shipped in this file) make packs/* world-readable but
 * writable only by a signed-in user. Signing in calls Firebase's own
 * authentication, which this code never sees the password for beyond
 * relaying it over HTTPS - there is no password check happening in this
 * file to read out of the page source, unlike the local "Teacher" PIN.
 *
 * Setup (one-time, for whoever administers the shared word packs):
 *   1. https://console.firebase.google.com -> Add project (free "Spark" plan).
 *   2. Build -> Firestore Database -> Create database -> production mode.
 *   3. Firestore -> Rules, paste:
 *        rules_version = '2';
 *        service cloud.firestore {
 *          match /databases/{database}/documents {
 *            match /packs/{packId} {
 *              allow read: if true;
 *              allow write: if request.auth != null;
 *            }
 *          }
 *        }
 *   4. Build -> Authentication -> Get started -> Sign-in method -> Email/Password -> Enable.
 *   5. Authentication -> Users -> Add user. This one login is shared by every
 *      teacher who should be able to publish - treat it like a staffroom key,
 *      not a personal password.
 *   6. Project settings (gear icon) -> General -> "Your apps" -> Add app -> Web (</>).
 *      Copy the firebaseConfig object it gives you into CONFIG below.
 */
(function (ns) {
  'use strict';

  /* Fill these in from step 6 above. Leave apiKey empty to keep CCS fully
   * local (no network calls, no console errors) - that's the default. */
  var CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  var ready = false;
  var db = null;

  function enabled() { return !!CONFIG.apiKey; }

  function ensureInit() {
    if (ready || !enabled()) return ready;
    try {
      if (typeof firebase === 'undefined') return false;
      firebase.initializeApp(CONFIG);
      db = firebase.firestore();
      ready = true;
    } catch (e) { ready = false; }
    return ready;
  }

  /* fetchShared() -> Promise<{ok, packs}>
   * Never rejects, so callers never need a special offline path - but "ok"
   * tells the difference between "connected, nothing published" and
   * "couldn't reach the server" so the status line doesn't overclaim on
   * flaky classroom wifi. */
  function fetchShared() {
    if (!ensureInit()) return Promise.resolve({ ok: false, packs: [] });
    return db.collection('packs').get().then(function (snap) {
      var out = [];
      snap.forEach(function (doc) {
        var data = doc.data();
        if (data && data.config) out.push({ id: doc.id, config: data.config, meta: data });
      });
      return { ok: true, packs: out };
    }).catch(function () { return { ok: false, packs: [] }; });
  }

  /* publish(id, config, name, email, password) -> Promise (resolves or rejects with a short message) */
  function publish(id, config, name, email, password) {
    if (!ensureInit()) {
      return Promise.reject('Cloud publishing isn’t set up on this site yet.');
    }
    return firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      return db.collection('packs').doc(id).set({
        config: config,
        publishedBy: (name || '').slice(0, 60),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).then(function () {
      return firebase.auth().signOut().catch(function () {});
    }).catch(function (err) {
      var code = err && err.code || '';
      if (/user-not-found|wrong-password|invalid-credential|invalid-login-credentials/.test(code)) {
        throw 'That login was not correct.';
      }
      if (/network/.test(code)) throw 'Could not reach the server. Check your internet connection.';
      throw 'Could not publish (' + (code || 'unknown error') + ').';
    });
  }

  ns.cloud = {
    enabled: enabled,
    fetchShared: fetchShared,
    publish: publish
  };
})(window.CCS = window.CCS || {});
