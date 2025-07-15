<template lang="pug">
q-layout(view="hHh lpR fFf").view
  q-header 
    q-toolbar.bg-white.text-primary
      q-btn(to="/" flat dense icon="home")
      q-btn(to="/codebook" flat dense icon="book" v-if="user?.profile?.isEditor || user?.profile?.isAdmin")
        q-tooltip Codebook
      q-btn(to="/admin" flat dense icon="library_books" v-if="user?.profile?.isAdmin")
        q-tooltip Admin
      q-space
      span Community Researcher Dashboard &middot; {{ user ? user.email : 'Not signed in' }}
      q-space
      q-select(
        v-model="locale"
        :options="localeOptions"
        borderless
        emit-value
        map-options
        options-dense)
      q-btn(@click="signOut()" flat dense v-if="user" icon="logout")
    q-separator
  q-page-container
    //- div {{user}}
    router-view
</template>

<script>
import { defineComponent } from "vue";
import { auth } from "src/boot/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useCurrentUser } from "vuefire";
import { useI18n } from "vue-i18n";

// const modules = import.meta.glob(
//   "../../node_modules/quasar/lang/(ar).js"
// );
import { watch } from "vue";
import { useQuasar } from "quasar";
import ar from "quasar/lang/ar";
import en from "quasar/lang/en-US";

export default defineComponent({
  name: "App",
  setup() {
    const user = useCurrentUser();

    const { locale } = useI18n({ useScope: "global" });

    const localeOptions = [
      { value: "en", label: "English" },
      { value: "ar", label: "Arabic" },
      { value: "fr", label: "French" },
      { value: "zh", label: "Chinese" },
      { value: "es", label: "Spanish" },
    ];

    const $q = useQuasar();

    watch(locale, (val) => {
      if (val === "ar") {
        // console.log(ar);
        $q.lang.set(ar);
      } else {
        $q.lang.set(en);
      }
      console.log("Changing language to:", val);
    });

    return { user, locale, localeOptions };
  },
  methods: {
    signOut() {
      auth
        .signOut()
        .then(() => {
          this.$router.push("/login"); // Redirect to login page after sign out
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    },
  },
  mounted() {
    // This is where you can initialize any global state or perform actions
    // that should happen when the app is mounted.

    // Confirm the link is a sign-in with email link.
    // const auth = getAuth()
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Additional state parameters can also be passed via URL.
      // This can be used to continue the user's intended action before triggering
      // the sign-in operation.
      // Get the email if available. This should be available if the user completes
      // the flow on the same device where they started it.
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt("Please provide your email for confirmation");
      }
      // The client SDK will parse the code from the link for you.
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          // Clear email from storage.
          window.localStorage.removeItem("emailForSignIn");
          // You can access the new user by importing getAdditionalUserInfo
          // and calling it with result:
          // getAdditionalUserInfo(result)
          // You can access the user's profile via:

          // getAdditionalUserInfo(result)?.profile
          // You can check if the user is new or existing:
          // getAdditionalUserInfo(result)?.isNewUser
          this.$router.push("/"); // Redirect to the dashboard or any other page
        })
        .catch(() => {
          // Some error occurred, you can inspect the code: error.code
          // Common errors could be invalid email and invalid or expired OTPs.
        });
    }
  },
});
</script>
