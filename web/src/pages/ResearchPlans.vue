<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col.col-md-8
      .text-h4 Research Plans
      .text-h6 To check
      .text-caption Check each research plan. Contact the researcher directly if you need them to make changes to their research plan
      q-list(separator).text-left
        div(v-for="plan of plans")
          q-item( v-if="!plan?.isResearchPlanChecked") 
            q-item-section {{plan.id}}
            q-item-section(side) 
              q-btn(flat icon="download" @click="download(plan.latestResearchPlan)" dense)
            q-item-section(side)
              q-btn(flat icon="check" dense @click="approve(plan)") 
                q-tooltip OK to move forward
      .text-h6 In operation
      q-list(separator).text-left
        div(v-for="plan of plans")
          q-item( v-if="plan?.isResearchPlanChecked") 
            q-item-section {{plan.id}}
            q-item-section(side) 
              q-btn(flat icon="download" @click="download(plan.latestResearchPlan)" dense)
           
</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser } from "vuefire";
import { db, storage } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
import { ref, getDownloadURL } from "firebase/storage";
import { doc, collection, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations
import { openURL } from "quasar";

import find from "lodash/find";

const toggleElement = (arr, val) =>
  arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

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

    const plans = useCollection(collection(db, `users`));

    // console.log("record", record);
    return { user, plans };
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
      updateDoc(doc(db, `users/${plan.id}`), {
        isResearchPlanChecked: true,
        planCheckedBy: this.user.email,
        planCheckedOn: Date(),
      });
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
      updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
        status: "coded",
      });
      this.$router.push("/");
    },
    isActiveCode(line, code) {
      return line.codes?.includes(code.code);
    },
    addCode(line, code) {
      console.log(line);

      // console.log(`transcription.results.${line}.codes`);
      if (!line.codes) {
        line.codes = [];
      }

      line.codes = toggleElement(line.codes, code.code);

      // line.codes.push(code.code);
      updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
        transcription: this.record.transcription,
      });
      // console.log(line, code);
    },
    getLineColor(line) {
      //index of this code:
      if (this.codeBook.length) {
        if (line.codes && line.codes.length == 1) {
          //find the color of the first code:
          const col = find(this.codeBook, { code: line.codes[0] });
          return col.color;
        } else if (line.codes && line.codes.length > 1) {
          return "grey";
        }
      }
      return "transparent";
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
