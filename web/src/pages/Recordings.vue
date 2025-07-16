<template lang="pug">
q-page(padding).text-center
  //- .text-h6.q-mb-lg Analysis
  //- div For each region, put summary, then clusters, then users, then recordings

  div(v-for="region of regions").q-mt-lg.q-mb-xl
    .row.items-center
      .col
        q-separator
      .col-auto
        .text-h6 {{region.id}}
      .col
        q-separator
    .row
      .col.text-body1.text-grey.q-py-md {{region.description || 'Summary not written yet...'}}
    .row.q-col-gutter-sm.q-mb-md
      .col-3(v-for="cluster of region.clusters") 
        //- div {{cluster}}
        .column.q-col-gutter-sm 
          .col
            .text-body1 {{cluster.title}}
          .col 
            .text-body2 {{cluster.description }}
          .col 
            .text-body2 {{cluster.learn}}
          .col 
            .text-body2 {{cluster.questions}}
          .col    
            .text-body2 {{cluster.bullets}}
          .col( v-for="element of cluster.quotes")
            Cluster(:element="element" :clusters="false" :locale="locale" :simple="true")
            q-separator(inset).q-mt-sm
    .row.items-center
      .col
        q-separator
      .col-auto
        .text-caption Source Data
      .col
        q-separator
    .row.q-col-gutter-sm
      .col-3(v-for="user of getRegionalUsers(region.id)")
        q-card(bordered flat)
          q-card-section
            .row.text-left.items-center
              .col
                .text-body1 {{user.id}}
              .col-auto
                q-btn(icon="grain" dense flat :to="`/group/${user.id}`" no-caps)
                  q-tooltip Clustering
                q-btn(icon="description" dense flat :to="`/describe/${user.id}`" no-caps)
                  q-tooltip Describe
          q-list(separator).text-left
            q-item(v-for="recording of getRecordingsForUser(user.id)") 
              q-item-section {{recording.who}}
              q-item-section(side)
                q-btn(icon="download" dense flat @click="getRecording(recording)" no-caps)
                  q-tooltip Recording
              q-item-section(side)
                q-btn(icon="code" dense flat :to="`/code/${recording.id}`" no-caps)
                  q-tooltip Coding

  //- q-list(separator).text-left
  //-   q-item(v-for="record of records")
  //-     q-item-section
  //-       div {{record.who}} &middot; {{record.when}}
  //-     q-item-section(side)
  //-       q-btn(icon="download" dense flat @click="getRecording(record)" no-caps) Recording
  //-     q-item-section(side)
  //-       q-btn(icon="download" dense flat @click="getCoding(record)" no-caps) Coding

</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser } from "vuefire";
import { db, storage, getClustersForRegion } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import {
  // doc,
  collection,
  // updateDoc,
  collectionGroup,
} from "firebase/firestore"; // Importing dbRef for database operations

import { ref, getDownloadURL } from "firebase/storage";
import { openURL } from "quasar";
import Cluster from "src/components/Cluster.vue";
import { useI18n } from "vue-i18n";

import filter from "lodash/filter";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "CodePage",
  props: ["id"],
  components: { Cluster },
  data() {
    return {};
  },
  setup() {
    const user = useCurrentUser();

    const records = useCollection(collectionGroup(db, `recordings`), {
      once: true,
    });

    const users = useCollection(collectionGroup(db, `users`));

    const { data: regions, promise } = useCollection(
      collection(db, `regions`),
      { once: true }
    );

    promise.value.then(async (val) => {
      console.log("regions loaded");
      //for each region, call the ep for the cluster summary:
      for (let r of val) {
        // console.log(r);
        const dat = await getClustersForRegion({ region: r.id });
        // console.log(dat);
        r.clusters = dat.data;
      }
    });

    const { locale } = useI18n();

    const codeBook = useCollection(collection(db, `codebook`), { once: true });

    // console.log("record", record);
    return { user, records, codeBook, regions, locale, users };
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
    getRecordingsForUser(user) {
      return filter(this.records, (r) => r.parent == user);
    },
    getRegionalUsers(region) {
      return filter(this.users, { region: region });
    },
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
    // getCoding(record) {
    //   console.log(record);
    // },
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
