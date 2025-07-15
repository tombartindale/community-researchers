<template lang="pug">
q-page(padding)
    .row.justify-center
      .col.col-md-8
        //- .text-center.q-mb-lg
          //- q-btn(to="/upload" color="primary" size="lg" no-caps) Upload New Recording
        //- div {{recordings}}
        .text-h4.q-mb-lg.q-mt-sm.text-center Your Research Tasks
        .row.q-my-md.items-center
          .col 
            q-separator
          .col-auto.q-px-md.text-caption.text-grey Plan Your research
          .col 
            q-separator
        q-card(bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="hasResearchPlan()" color="black")
            q-card-section 
              .text-h6 Upload Your research plan
              span(v-if="user.profile.latestResearchPlan && !user.profile.isResearchPlanChecked").text-grey Your research plan has been uploaded and is being reviewed
            q-space
            q-card-section
              q-btn(to="/researchplan" flat icon-right="chevron_right" no-caps v-if="!user.profile.isResearchPlanChecked") Upload
        .row.q-my-md.items-center
          .col 
            q-separator
          .col-auto.q-px-md.text-caption.text-grey Collect Your data
          .col 
            q-separator
        q-card(bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-icon(name="upload" size="md").q-mx-sm 
            q-card-section 
              .text-h6 Upload new interview
            q-space
            q-card-section
              //- .row
                //- .col-auto
                  //- q-icon(:name="getIcon(recording.status, 'transcribing')" color="green" size="16px") 
                //- .col  Automatic audio transcription
              q-btn(to="/upload" flat icon-right="chevron_right" no-caps) Upload
        .row.q-my-md.items-center
          .col 
            q-separator
          .col-auto.q-px-md.text-caption.text-grey Code Your data
          .col 
            q-separator
        q-card(v-for="recording in recordings" :key="recording.id" class="my-card" bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="isComplete(recording)" color="black")
              //- q-icon(:name="getIcon(recording.status, 'coding')" color="green" size="md") 
            q-card-section 
              .text-h6 Code transcript
              .text-body1.text-grey {{ recording.who }} &middot; {{ recording.when }}
            q-space
            q-card-section
              //- .row
                //- .col-auto
                  //- q-icon(:name="getIcon(recording.status, 'transcribing')" color="green" size="16px") 
                //- .col  Automatic audio transcription
              q-btn(no-caps :to="`/code/${recording.id}`" v-if="canCode(recording)" flat icon-right="chevron_right") Code
              div(v-else) Waiting for automatic transcription
            
            //- q-space
            //- q-separator(vertical)
            //- q-card-section(horizontal)
            //-   q-btn(flat) Code
            //-   q-separator(vertical)
            //-   q-btn(flat) Group
        .row.q-my-md.items-center
          .col 
            q-separator
          .col-auto.q-px-md.text-caption.text-grey Develop Your insights
          .col 
            q-separator
        q-card(bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="isGrouped()" color="black")
            q-card-section 
              .text-h6 Cluster codes into stories
            q-space
            q-card-section
              q-btn(no-caps :to="`/group/${user.email}`" flat icon-right="chevron_right") Cluster
        q-card(bordered flat).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-checkbox(readonly size="lg" :model-value="isDescribed()" color="black")
            q-card-section 
              .text-h6 Describe Your insights
            q-space
            q-card-section
              q-btn(no-caps :to="`/describe/${user.email}`" flat icon-right="chevron_right") Describe
            
        .row.q-my-md.items-center
          .col 
            q-separator
          .col-auto.q-px-md.text-caption.text-grey Share and reflect on Your findings
          .col 
            q-separator
        q-card(flat bordered).q-mb-md
          q-card-section(horizontal).items-center
            q-card-section(side)
              q-icon(size="lg" name="forum").q-mx-sm
              //- q-checkbox(readonly size="lg" :model-value="isReviewed()" color="black")
            q-card-section 
              .text-h6 Review themes
              .text-body1.text-grey Across {{user.profile.region}}
            q-space
            q-card-section
              q-btn(no-caps :to="`/review/${user.profile.region}`" flat icon-right="chevron_right") Review

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
      return (
        this.userProfile.status == "clustered" ||
        this.userProfile.status == "described"
      );
    },
    isDescribed() {
      return this.userProfile.status == "described";
    },
    isReviewed() {
      return this.userProfile.status == "reviewed";
    },
    hasResearchPlan() {
      return this.user.profile.isResearchPlanChecked || false;
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
