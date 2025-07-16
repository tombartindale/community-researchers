<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col.col-md-8
      
      .text-h6 Research plans to check
      .text-caption Check each research plan. Contact the researcher directly if you need them to make changes to their research plan
      q-separator
      q-list(separator).text-left
        div(v-for="plan of plans")
          q-item( v-if="!plan?.isResearchPlanChecked") 
            q-item-section {{plan.id}}
            q-item-section(side) 
              q-btn(flat icon="download" @click="download(plan.latestResearchPlan)" dense)
            q-item-section(side)
              q-btn(flat icon="check" dense @click="approve(plan)") 
                q-tooltip OK to move forward
        //- span(v-if="plans.length==0").text-overline nothing here
        .text-center
          q-spinner(v-if="loading" size="md").q-ma-md

      .text-h6 Research plans in operation
      q-separator
      q-list(separator).text-left
        div(v-for="plan of plans")
          q-item( v-if="plan?.isResearchPlanChecked") 
            q-item-section {{plan.id}}
            q-item-section(side) 
              q-btn(flat icon="download" @click="download(plan.latestResearchPlan)" dense)
      .text-center
          q-spinner(v-if="loading" size="md").q-ma-md
          
           
</template>

<script>
import { defineComponent, ref as vueRef } from "vue";

import { useCollection, useCurrentUser } from "vuefire";
import { db, storage } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
import { ref, getDownloadURL } from "firebase/storage";
import { doc, collection, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations
import { openURL } from "quasar";

// import find from "lodash/find";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "CodePage",
  props: ["id"],
  data() {
    return {};
  },
  setup() {
    const user = useCurrentUser();

    // const record = useDocument(
    //   doc(db, `users/${user.value.email}/recordings/${props.id}`)
    // );

    const { data: plans, promise } = useCollection(collection(db, `users`));

    const loading = vueRef(true);
    promise.value.then(() => {
      loading.value = false;
    });

    // console.log("record", record);
    return { user, plans, loading };
  },
  // watch: {
  //   record: {
  //     handler(newVal) {
  //       if (newVal && newVal.transcription && newVal.transcription.results) {
  //         console.log("record changed", newVal);
  //       }
  //     },
  //     deep: true,
  //   },
  // },
  methods: {
    approve(plan) {
      try {
        updateDoc(doc(db, `users/${plan.id}`), {
          isResearchPlanChecked: true,
          planCheckedBy: this.user.email,
          planCheckedOn: Date(),
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
    download(file) {
      getDownloadURL(ref(storage, file))
        .then((url) => {
          // `url` is the download URL for 'images/stars.jpg'

          // This can be downloaded directly:
          // const xhr = new XMLHttpRequest();
          // xhr.responseType = "blob";
          // xhr.onload = () => {
          //   const blob = xhr.response;
          // };
          // xhr.open("GET", url);
          // xhr.send();

          console.log(url);

          openURL(url);

          // Or inserted into an <img> element
          // const img = document.getElementById("myimg");
          // img.setAttribute("src", url);
        })
        .catch((err) => {
          // Handle any errors
          console.log(err);
        });
    },
    done() {
      try {
        updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
          status: "coded",
        });
        this.$router.push("/");
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
  },
});
</script>

<style scoped lang="scss">
.line {
  text-decoration: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 3px;
}

.transcript {
  font-size: 1.4em;
  line-height: 2.5em;
  font-family: serif;

  // text-decoration-style: wavy;

  :hover {
    background-color: #f0f0f0;
    cursor: pointer;
  }
}
</style>
