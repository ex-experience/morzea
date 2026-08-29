rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function ownsIncoming() {
      return signedIn()
        && request.resource.data.uid == request.auth.uid;
    }

    function ownsExisting() {
      return signedIn()
        && resource.data.uid == request.auth.uid;
    }

    // MORZÉA visitor/session record
    match /MORZEA_Visitors/{sessionId} {
      allow create: if ownsIncoming();

      allow update: if ownsExisting()
        && request.resource.data.uid == resource.data.uid;

      allow read, delete: if false;
    }

    // Interaction / analytics events
    match /MORZEA_Events/{eventId} {
      allow create: if ownsIncoming();
      allow read, update, delete: if false;
    }

    // Voluntary customer leads / newsletter
    match /MORZEA_Leads/{leadId} {
      allow create: if ownsIncoming();
      allow read, update, delete: if false;
    }

    // AI concierge session metadata
    match /MORZEA_AI_Sessions/{sessionId} {
      allow create: if ownsIncoming();

      allow update: if ownsExisting()
        && request.resource.data.uid == resource.data.uid;

      allow read, delete: if false;
    }

    // AI conversation messages
    match /MORZEA_AI_Messages/{messageId} {
      allow create: if ownsIncoming();
      allow read, update, delete: if false;
    }

    // Front-end errors
    match /MORZEA_Errors/{errorId} {
      allow create: if ownsIncoming();
      allow read, update, delete: if false;
    }

    // Everything else denied
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
