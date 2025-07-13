<template lang="pug">
q-page.flex.flex-center
  div Login
  q-input(v-model="email" label="Email" type="email" outlined)
  q-btn(@click="signinPopup" label="Send Link" color="primary")
</template>

<script>
import { defineComponent } from 'vue'

import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from 'src/boot/firebase'

const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: 'http://localhost:9000',
  // This must be true.
  handleCodeInApp: true,
}

export default defineComponent({
  name: 'IndexPage',
  methods: {
    signinPopup() {
      sendSignInLinkToEmail(auth, this.email, actionCodeSettings)
        .then(() => {
          // The link was successfully sent. Inform the user.
          // Save the email locally to complete sign-in when the user returns.
          window.localStorage.setItem('emailForSignIn', this.email)
          alert('Email sent! Please check your inbox.')
        })
        .catch((error) => {
          // Some error occurred, you can inspect the code: error.code
          console.error('Error sending email:', error)
        })
    },
  },
})
</script>
