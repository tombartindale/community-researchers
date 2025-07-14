<template lang="pug">
q-page(padding).text-center
  .text-h4 Recordings
  q-list(separator).text-left
    q-item(v-for="record of records")
      q-item-section
        div {{record.who}} &middot; {{record.when}}
      q-item-section(side)
        q-btn(icon="download" dense flat @click="getRecording(record)" no-caps) Recording
      q-item-section(side)
        q-btn(icon="download" dense flat @click="getCoding(record)" no-caps) Coding

</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser } from "vuefire";
import { db, storage } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import {
  // doc,
  collection,
  // updateDoc,
  collectionGroup,
} from "firebase/firestore"; // Importing dbRef for database operations

import { ref, getDownloadURL } from "firebase/storage";
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

    const records = useCollection(collectionGroup(db, `recordings`));

    const codeBook = useCollection(collection(db, `codebook`));

    // console.log("record", record);
    return { user, records, codeBook };
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
    getRecording(record) {
      // console.log(record);
      getDownloadURL(ref(storage, record.filePath))
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
    getCoding(record) {
      console.log(record);
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
