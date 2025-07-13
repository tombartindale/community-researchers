<template lang="pug">
q-page(padding)
    
    .text-center.q-mb-lg
      q-btn(to="/upload" color="primary" size="lg" no-caps) Upload New Recording
    //- div {{recordings}}
    q-card(v-for="recording in recordings" :key="recording.id" class="my-card" bordered flat).q-mb-md
      q-card-section(horizontal)
        q-card-section
          .text-h6 {{ recording.who }}
          p {{ recording.when }}
        q-card-section
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'transcribing')" color="green" size="16px") 
            .col  Automatic audio transcription
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'coding')" color="green" size="16px") 
            .col 
              router-link(:to="`/code/${recording.id}`" v-if="canCode(recording)") Code transcript
              div(v-else) Code transcript
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'grouped')" color="green" size="16px") 
            .col Group codes
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'reviewing')" color="green" size="16px") 
            .col Review codes
        //- q-space
        //- q-separator(vertical)
        //- q-card-section(horizontal)
        //-   q-btn(flat) Code
        //-   q-separator(vertical)
        //-   q-btn(flat) Group

</template>

<script>
import { defineComponent } from "vue";

import { useCurrentUser } from "vuefire";

// const user = useCurrentUser()

import { collection } from "firebase/firestore";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase Firestore setup

export default defineComponent({
  name: "DashboardPage",
  data() {
    return {
      recordings: [],
    };
  },
  methods: {
    canCode(recording) {
      return !(
        recording.status === "uploaded" || recording.status === "converted"
      );
    },
    getIcon(status, step) {
      console.log("getIcon", status, step);
      if (status === "converted" || status === "uploaded") {
        return "hourglass_empty";
      }

      if (step == "transcribing") {
        if (status != "converted" && status != "uploaded") {
          return "check";
        }
      }

      if (step == "coding") {
        if (status == "coded") {
          return "check";
        }
      }
    },
  },
  watch: {
    user: {
      // call it upon creation too
      immediate: true,
      handler() {
        this.$firestoreBind(
          "recordings",
          collection(db, `users/${this.user.email}/recordings`)
        );
      },
    },
  },
  setup() {
    const user = useCurrentUser();
    return { user };
  },
});
</script>
