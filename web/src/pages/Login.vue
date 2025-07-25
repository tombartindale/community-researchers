<template lang="pug">
q-page(padding).flex.flex-center
  //- q-spinner(v-if="waitingForUser")
  .row.justify-center.text-center
    .col-md-6.col
      .column.items-center.q-col-gutter-md
        .col.q-mb-md
          .text-h4 {{ $t('community-researcher-dashboard-0') }}
          .text-body2 {{ $t('participate-in-community-data-collection-and-analysis') }}
          .text-body2.text-negative.q-mt-lg(v-if="error") We don't recognise this email address, are you registered using another one?
        //- .col
        //-   .text-body1.q-mt-lg {{ $t('login-to-continue') }}
        .col
          q-input(v-model="email" :label="$t('enter-your-email-address')" type="email" outlined style="min-width:300px;" filled)
        .col
          q-btn(@click="signinPopup" :label="$t('send-login-link')" no-caps flat size="lg" icon-right="chevron_right")
        .col.q-mt-lg
          .text-body2.text-grey {{ $t('should-have-access') }}
</template>

<script>
import { defineComponent } from "vue";

import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "src/boot/firebase";

auth.useDeviceLanguage();
// console.log(process.env.VUE_APP_URL);

const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: process.env.VUE_APP_URL,
  // This must be true.
  handleCodeInApp: true,
};

import { useQuasar } from "quasar";
// import { useCurrentUser } from "vuefire";

export default defineComponent({
  name: "IndexPage",
  data() {
    return {
      email: "",
      // waitingForUser: true,
    };
  },
  props: ["error"],
  // watch: {
  // user() {
  //   if (this.user) this.waitingForUser = false;
  // },
  // },
  setup() {
    const q = useQuasar();
    // const user = useCurrentUser();
    // console.log(user);
    // watch(user,(v)=>{
    //   if
    // })
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
