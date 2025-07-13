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
            .col Transcribe audio
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'coding')" color="green" size="16px") 
            .col Code transcript
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'reviewing')" color="green" size="16px") 
            .col Review codes
          .row
            .col-auto
              q-icon(:name="getIcon(recording.status, 'grouped')" color="green" size="16px") 
            .col Group codes
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
    getIcon(status) {
      //TOOD:
      switch (status) {
        case "uploaded":
          return "cloud_done";
        case "transcribed":
          return "text_snippet";
        case "coded":
          return "code";
        case "grouped":
          return "group_work";
        default:
          return "help";
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
