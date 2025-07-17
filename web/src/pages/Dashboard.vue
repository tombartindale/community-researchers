<template lang="pug">
q-page(padding)
    .row.justify-center
      .col.col-md-6

        .text-h4.q-mb-lg.q-mt-sm.text-center {{ $t('your-research-tasks') }}

        .text-center(v-if="loading")
          q-spinner(size="md")

        div(v-if="!loading")
          .row.q-my-md.items-center
            .col 
              q-separator(inset)
            .col-auto.q-px-md.text-caption.text-grey {{ $t('plan-your-research') }}
            .col 
              q-separator(inset)
          q-card(bordered flat).q-mb-md
            q-card-section(horizontal).items-center
              q-card-section(side)
                q-checkbox(readonly size="lg" :model-value="hasResearchPlan()" color="black")
              q-card-section 
                .text-h6 {{ $t('upload-your-research-plan') }}
                span(v-if="user.profile.latestResearchPlan && !user.profile.isResearchPlanChecked").text-grey {{ $t('your-research-plan-has-been-uploaded-and-is-being-reviewed') }}
              q-space
              q-card-section
                q-btn(to="/researchplan" flat icon-right="chevron_right" no-caps v-if="!user.profile.isResearchPlanChecked") {{ $t('upload') }}
          .row.q-my-md.items-center
            .col 
              q-separator(inset)
            .col-auto.q-px-md.text-caption.text-grey {{ $t('collect-your-data') }}
            .col 
              q-separator(inset)
          q-card(bordered flat).q-mb-md
            q-card-section(horizontal).items-center
              q-card-section(side)
                q-icon(name="upload" size="md").q-mx-sm 
              q-card-section 
                .text-h6 {{ $t('upload-new-interview') }}
              q-space
              q-card-section

                q-btn(to="/upload" flat icon-right="chevron_right" no-caps) {{ $t('upload') }}
          .row.q-my-md.items-center
            .col 
              q-separator(inset)
            .col-auto.q-px-md.text-caption.text-grey {{ $t('code-your-data') }}
            .col 
              q-separator(inset)
          q-card(v-for="recording in recordings" :key="recording.id" class="my-card" bordered flat).q-mb-md
            q-card-section(horizontal).items-center
              q-card-section(side)
                q-checkbox(readonly size="lg" :model-value="isComplete(recording)" color="black")

              q-card-section 
                .text-h6 {{ $t('code-transcript') }}
                .text-body1.text-grey {{ recording.who }} &middot; {{ recording.when }}
              q-space
              q-card-section(align="right" style="max-width:50%")
                q-btn(no-caps :to="`/code/${recording.id}`" v-if="canCode(recording)" flat icon-right="chevron_right") {{ $t('code') }}
                div(v-else-if="recording.status=='error'" ) {{ $t('error-transcription') }}
                div(v-else) {{ $t('waiting-for-automatic-transcription') }}
              
          .row.q-my-md.items-center
            .col 
              q-separator(inset)
            .col-auto.q-px-md.text-caption.text-grey {{ $t('develop-your-insights') }}
            .col 
              q-separator(inset)
          q-card(bordered flat).q-mb-md
            q-card-section(horizontal).items-center
              q-card-section(side)
                q-checkbox(readonly size="lg" :model-value="isGrouped()" color="black")
              q-card-section 
                .text-h6 {{ $t('cluster-codes-into-stories') }}
              q-space
              q-card-section
                q-btn(no-caps :to="`/group/${user.email}`" flat icon-right="chevron_right" v-if="canGroup()") {{ $t('cluster') }}
          q-card(bordered flat).q-mb-md
            q-card-section(horizontal).items-center
              q-card-section(side)
                q-checkbox(readonly size="lg" :model-value="isDescribed()" color="black")
              q-card-section 
                .text-h6 {{ $t('describe-your-insights') }}
              q-space
              q-card-section
                q-btn(no-caps :to="`/describe/${user.email}`" flat icon-right="chevron_right" v-if="canDescribe()") {{ $t('describe') }}
              
          .row.q-my-md.items-center
            .col 
              q-separator(inset)
            .col-auto.q-px-md.text-caption.text-grey {{ $t('share-and-reflect-on-your-findings') }}
            .col 
              q-separator(inset)
          q-card(flat bordered).q-mb-md
            q-card-section(horizontal).items-center
              q-card-section(side)
                q-icon(size="lg" name="forum").q-mx-sm
                //- q-checkbox(readonly size="lg" :model-value="isReviewed()" color="black")
              q-card-section 
                .text-h6 {{ $t('review-themes') }}
                .text-body1.text-grey {{ $t('across-user-profile-region', [user.profile.region]) }}
              q-space
              q-card-section
                q-btn(no-caps :to="`/review/${user.profile.region}`" flat icon-right="chevron_right" v-if="canReview()") {{ $t('review') }}

</template>

<script>
import { defineComponent } from "vue";

import { useCurrentUser } from "vuefire";

// const user = useCurrentUser()

import { collection, doc } from "firebase/firestore";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase Firestore setup

import some from "lodash/some";

export default defineComponent({
  name: "DashboardPage",
  data() {
    return {
      recordings: [],
      userProfile: {},
      loading: true,
    };
  },
  methods: {
    canCode(recording) {
      return (
        !(
          recording.status === "uploaded" || recording.status === "converted"
        ) && recording.status != "error"
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
    canGroup() {
      // console.log(this.recordings);

      return some(this.recordings, { status: "coded" });
    },
    canDescribe() {
      return (
        this.user.profile.status == "clustered" ||
        this.user.profile.status == "described"
      );
    },
    canReview() {
      return (
        this.user.profile.status == "described" ||
        this.user.profile.status == "clustered"
      );
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
      async handler() {
        await Promise.all([
          this.$firestoreBind(
            "userProfile",
            doc(db, `users/${this.user.email}`)
          ),

          this.$firestoreBind(
            "recordings",
            collection(db, `users/${this.user.email}/recordings`)
          ),
        ]);

        this.loading = false;
      },
    },
  },
  setup() {
    const user = useCurrentUser();
    return { user };
  },
});
</script>
