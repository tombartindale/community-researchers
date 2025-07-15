<template lang="pug">
q-page.flex.flex-center
  .column.items-center.q-col-gutter-md
    .col
      .text-h4 {{ $t('login-to-continue') }}
    .col
      q-input(v-model="email" :label="$t('enter-your-email-address')" type="email" outlined style="min-width:300px;")
    .col
      q-btn(@click="signinPopup" :label="$t('send-login-link')" no-caps flat size="lg" icon-right="chevron_right")
</template>

<script>
import { defineComponent } from "vue";

import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "src/boot/firebase";

console.log(process.env.VUE_APP_URL);

const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: process.env.VUE_APP_URL,
  // This must be true.
  handleCodeInApp: true,
};

import { useQuasar } from "quasar";

export default defineComponent({
  name: "IndexPage",
  data() {
    return {
      email: "",
    };
  },
  setup() {
    const q = useQuasar();
    return { q };
  },
  methods: {
    signinPopup() {
      if (this.email != "")
        sendSignInLinkToEmail(auth, this.email, actionCodeSettings)
          .then(() => {
            // The link was successfully sent. Inform the user.
            // Save the email locally to complete sign-in when the user returns.
            window.localStorage.setItem("emailForSignIn", this.email);
            this.q.notify(this.$t("email-sent-please-check-your-inbox"));
            // alert("Email sent! Please check your inbox.");
          })
          .catch(() => {
            // Some error occurred, you can inspect the code: error.code
            this.q.notify({
              type: "negative",
              message: this.$t("error-sending-email"),
            });
            // console.error("Error sending email:", error);
          });
    },
  },
});
</script>
