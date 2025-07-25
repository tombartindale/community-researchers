<template lang="pug">
q-layout(view="hHh lpR fFf").view
  q-header()
    q-toolbar.bg-white.text-primary
      q-btn(to="/" flat dense icon="home")
      q-btn(to="/codebook" flat dense icon="book" v-if="user?.profile?.isEditor || user?.profile?.isAdmin")
        q-tooltip {{ $t('codebook') }}
      q-btn(to="/admin" flat dense icon="settings" v-if="user?.profile?.isAdmin")
        q-tooltip {{ $t('admin') }}
      .text-grey.text-tiny.q-pt-xs.q-pl-xs v{{version}}
      q-space
      span 
        span.gt-sm {{ $t('community-researcher-dashboard') }} &middot; 
        span {{ user ? user.email : $t('not-signed-in') }}
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
    //- div {{loggingIn}}
    
    q-spinner(size="3em" v-if="loggingIn").absolute-center
    router-view(v-if="!loggingIn")
    q-page-sticky(position="bottom-right" :offset="[18, 18]")
      q-btn(fab icon="question_mark" color="primary" @click="showHelp = true" outline).bg-white
    q-dialog(v-model="showHelp")
      q-card(style="width:400px;max-width:90vw")
        q-card-section
          .text-body1 {{ $t('this-dashboard-has-been-built-specifically-to-support-community-researchers-for-this-project') }}
          .text-body2.q-mt-md {{ $t('as-such-there-may-problems-with-the-platform-which-we-did-not-have-chance-to-fix') }}
          .text-body2.q-mt-md {{ $t('if-you-have-issues') }}
        q-card-actions(align="right")  
          q-btn(v-close-popup flat) {{ $t('ok') }}
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
import languageMappingList from "./language-mapping-list";

export default defineComponent({
  name: "App",
  setup() {
    const user = useCurrentUser();

    const { locale } = useI18n({ useScope: "global" });

    console.log(locale.value);

    const localeOptions = [
      { value: "en", label: languageMappingList.en.nativeName },
      { value: "ar", label: languageMappingList.ar.nativeName },
      { value: "fr", label: languageMappingList.fr.nativeName },
      { value: "zh", label: languageMappingList.zh.nativeName },
      { value: "es", label: languageMappingList.es.nativeName },
    ];

    const $q = useQuasar();

    watch(locale, (val) => {
      if (val === "ar") {
        console.log("setting to ar");
        $q.lang.set(ar);
      } else {
        $q.lang.set(en);
      }
      console.log("Changing language to:", val);
    });

    locale.value = $q.lang.getLocale();

    console.log($q.lang.getLocale());

    return { user, locale, localeOptions };
  },
  data: function () {
    return {
      loggingIn: false,
      showHelp: false,
    };
  },
  methods: {
    signOut() {
      auth
        .signOut()
        .then(() => {
          // this.$router.push("/login"); // Redirect to login page after sign out
          this.$router.go();
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    },
    // loggingIn() {
    //   console.log(window.location.search);
    //   return window.location.search;
    // },
  },
  computed: {
    version() {
      console.log(process.env.VUE_APP_VERSION);
      return process.env.VUE_APP_VERSION;
    },
  },
  mounted() {
    // This is where you can initialize any global state or perform actions
    // that should happen when the app is mounted.

    console.log("href", window.location.search.includes("mode=signIn"));
    if (window.location.search.includes("mode=signIn")) this.loggingIn = true;

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
          this.loggingIn = false;

          console.log("got this far");
          // this.$router.go();
          this.$router.push("/"); // Redirect to the dashboard or any other page
        })
        .catch(() => {
          // Some error occurred, you can inspect the code: error.code
          // Common errors could be invalid email and invalid or expired OTPs.
        });
    } else {
      this.loggingIn = false;
    }
  },
});
</script>

<style>
.text-tiny {
  font-size: 0.8em;
}
</style>
