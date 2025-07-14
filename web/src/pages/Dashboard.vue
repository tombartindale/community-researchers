<template lang="pug">
q-page(padding)
    .row.justify-center
      .col.col-md-8
        //- .text-center.q-mb-lg
          //- q-btn(to="/upload" color="primary" size="lg" no-caps) Upload New Recording
        //- div {{recordings}}
        .text-h4.q-mb-lg.q-mt-sm.text-center Your Research Tasks
        q-card(bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-icon(name="upload" size="md").q-mx-sm 
            q-card-section 
              .text-h6 Upload new recording
            q-space
            q-card-section
              //- .row
                //- .col-auto
                  //- q-icon(:name="getIcon(recording.status, 'transcribing')" color="green" size="16px") 
                //- .col  Automatic audio transcription
              q-btn(to="/upload" flat icon-right="chevron_right" no-caps) Upload

        q-card(v-for="recording in recordings" :key="recording.id" class="my-card" bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="isComplete(recording)" color="black")
              //- q-icon(:name="getIcon(recording.status, 'coding')" color="green" size="md") 
            q-card-section 
              .text-h6 Code transcript
              .text-body1 {{ recording.who }} &middot; {{ recording.when }}
            q-space
            q-card-section
              //- .row
                //- .col-auto
                  //- q-icon(:name="getIcon(recording.status, 'transcribing')" color="green" size="16px") 
                //- .col  Automatic audio transcription
              q-btn(no-caps :to="`/code/${recording.id}`" v-if="canCode(recording)" flat icon-right="chevron_right") Code transcript
              div(v-else) Waiting for automatic transcription
            
            //- q-space
            //- q-separator(vertical)
            //- q-card-section(horizontal)
            //-   q-btn(flat) Code
            //-   q-separator(vertical)
            //-   q-btn(flat) Group
        q-card(bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="isGrouped()" color="black")
            q-card-section 
              .text-h6 Group codes
            q-space
            q-card-section
              q-btn(no-caps :to="`/group/${user.email}`" flat icon-right="chevron_right") Group Codes
            //- router-link(:to="`/code/${recording.id}`" v-if="canCode(recording)") Code transcript
            //- div(v-else) Code transcript
        q-card(flat bordered).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="isReviewed()" color="black")
            q-card-section 
              .text-h6 Review codes

</template>

<script>
import { defineComponent } from "vue";

import { useCurrentUser } from "vuefire";

// const user = useCurrentUser()

import { collection, doc } from "firebase/firestore";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase Firestore setup

export default defineComponent({
  name: "DashboardPage",
  data() {
    return {
      recordings: [],
      userProfile: {},
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
    isComplete(recording) {
      return recording.status == "coded";
    },
    isGrouped() {
      return this.userProfile.status == "grouped";
    },
    isReviewed() {
      return this.userProfile.status == "reviewed";
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

        this.$firestoreBind("userProfile", doc(db, `users/${this.user.email}`));
      },
    },
  },
  setup() {
    const user = useCurrentUser();
    return { user };
  },
});
</script>
