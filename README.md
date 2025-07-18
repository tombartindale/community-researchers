# Deployment

## UI

`cd web`

`npm run build`

`npx firebase deploy --only hosting`

## Functions

`cd functions`

`npx firebase deploy --only functions`

## Developer Notes

Much of the functionality in the UI is driven by connecting and loading data directly from Firestore client side.

File uploads and downloads are all done directly by interacting with the Firebase Storage service.

All permissions and authentication is handled by the `.rules` files which when changed need to updated to Firebase using the CLI (or copy-paste into Firebase Console).

In `web` is a standard Quasar (Vue3) project. `npm i && npm run dev` gets it going.

In `functions` is a standard JS firebase functions project. `npm i && npm run emulate` gets it going.

By default the UI in dev mode will talk to the local emulator. Change `VUE_APP_EMULATORS=false` in `.env.dev` to connect your local dev UI to the live Firebase instance.

## UI

Frontend is built in Quasar (UI framework for VueJS).

Quasar documentation is very good - and should be first place to look for any issues.

VueFire is minimally used to simplify binding Firestore data.

No store is used, each page loads the data it requires onmount (setup).

There is a bit of a mix of Vue3 Options API and Composition API at the moment unfortunatly.

Authentication is performed using Firebase Authentication client library. Firebase sends an email to the user's email address with a magic link which the UI application picks up when the page loads (if its a successful login), and uses the Firebase client library to load the user.

The router beforeRoute handler loads the current user with await so that the user object is always present in other UI code.

Basic UI Nav:

- App
  - Dashboard
  - ResearchPlan
  - Upload
  - Code
  - Group
  - Describe
  - Review
  - Codebook (`isEditor` or `isAdmin` permission required on user)
  - Admin (`isAdmin` permission required on user)
    - Recordings
    - Users
    - ResearchPlans
    - Regions

## i18n

Translations are all stored in `web/src//

## Functions

**convert_file_1**

Triggers when a new `recording` document is created in the DB. If it points to a docx file, it opens it, splits into sentences and puts back into `transcription` field.

If it points to a media file, initiates ffmpeg transcoding of file into .wav and puts this back into the storage bucket.

**transcribe2**

Triggers when a new file is created in the storage bucket.

If its a .wav file, it sends it off for transcription, which will put the transcription back in the bucket as a JSON file.

If its a .json file, it loads the transcript and saves it back to the `recording` object it relates to.

**getClustersForRegion**

Endpoint used by the UI to retrieve clusters and quotes for a provided region name.

**startExport**

Enpoint that triggers batch aggregation of data and saves it back as multiple files into the storage in `exports`. These can then be downloaded at any time.

## Database Notes

- User object must exist in `users` with id of `email` for someone to login with that email address.
- `users/{email}/recordings` is where each individual file gets created when user uploads something
