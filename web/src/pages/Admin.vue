<template lang="pug">
q-page(padding).text-center
  .text-h6 Admin
  div
    q-tabs
      q-route-tab(to="/admin/users") Users
      q-route-tab(to="/admin") Recordings
      q-route-tab(to="/admin/researchplans") Research Plans
  router-view

</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser, useDocument } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

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
  setup(props) {
    const user = useCurrentUser();

    const record = useDocument(
      doc(db, `users/${user.value.email}/recordings/${props.id}`)
    );

    const codeBook = useCollection(collection(db, `codebook`));

    // console.log("record", record);
    return { user, record, codeBook };
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
