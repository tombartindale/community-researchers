<template lang="pug">
q-page(padding).text-center
  //- .text-h6.q-mb-lg Analysis
  //- div For each region, put summary, then clusters, then users, then recordings
  .row.justify-center
    .col-auto
      q-banner(rounded).bg-grey-2.q-my-md
        q-btn(color="primary" @click="startExport" no-caps :loading="loading").q-mr-md Start Export
        q-btn-dropdown( flat dense no-caps label="Download export file")
          q-list
            q-item(@click="getExportFile('docx')" clickable v-close-popup) Word Document (.docx) 
            q-item(@click="getExportFile('md')" clickable v-close-popup) Markdown (.md)
            q-item(@click="getExportFile('json')" clickable v-close-popup) JSON (.json)
            q-item(@click="getExportFile('xlsx')" clickable v-close-popup) Excel (.xlsx)

  div(v-for="region of regions").q-mt-lg.q-mb-xl
    .row.items-center
      .col
        q-separator(inset)
      .col-auto
        .text-h6 {{region.id}}
      .col
        q-separator(inset)
    .row
      .col.text-body1.text-grey.q-py-md(:html="region.description || 'Summary not written yet...'")
    .row.q-col-gutter-sm.q-mb-md
      .col(v-if="!region.clusters")
        q-spinner( size="2em")
      template(v-for="cluster of region.clusters")
        .col-4( v-if="cluster.quotes.length")
          q-card(flat bordered).fit
            q-card-section 
              //- div {{cluster}}
              .column.q-col-gutter-sm 
                .col
                  .text-body1 {{cluster.title}}
                  .text-caption {{cluster.parent}}
                //- .col 
                  //- .text-body2 {{cluster.description }}
                .col 
                  .text-body2 {{cluster.learn}}
                .col    
                  .text-body2 {{cluster.bullets}}
                .col( v-for="element of cluster.quotes")
                  Cluster(:element="element" :clusters="false" :locale="locale" :simple="true")
                  q-separator(inset).q-mt-sm
    .row.items-center
      .col
        q-separator(inset)
      .col-auto
        .text-caption Source Data
      .col
        q-separator(inset)
    .row.q-col-gutter-sm.q-mt-sm
      //- div {{users}}
      .col-4(v-for="user of getRegionalUsers(region.id)")
        q-card(bordered flat).fit
          q-card-section
            .row.text-left.items-center
              .col
                .text-body1 {{user.id}}
              .col-auto
                //- q-btn(icon="grain" dense flat :to="`/group/${user.id}`" no-caps)
                //-   q-tooltip Clustering
                q-btn(icon="description" dense flat :to="`/describe/${user.id}`" no-caps)
                  q-tooltip Describe
          q-separator(inset)
          q-list(separator).text-left
            q-item(v-for="recording of getRecordingsForUser(user.id)") 
              q-item-section {{recording.who}}
              q-item-section(side).text-caption {{recording.language}}
              q-item-section(side)
                q-btn(icon="graphic_eq" dense flat @click="getRecording(recording)" no-caps)
                  q-tooltip Recording
              q-item-section(side)
                q-btn(icon="article" dense flat @click="getTranscript(recording)" no-caps)
                  q-tooltip Transcript
              q-item-section(side v-if="!recording.error")
                q-btn(icon="code" dense flat :to="`/code/${recording.parent}/${recording.id}`" no-caps)
                  q-tooltip Coding
              q-item-section(side v-if="recording.error")
                q-icon(name="warning").q-mx-xs
                  q-tooltip {{recording.error}}

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
import {
  db,
  storage,
  getClustersForRegion,
  startExport,
  downloadTranscript,
} from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import {
  // doc,
  collection,
  // updateDoc,
  collectionGroup,
} from "firebase/firestore"; // Importing dbRef for database operations

import { ref, getDownloadURL } from "firebase/storage";
import { openURL, useQuasar } from "quasar";
import Cluster from "src/components/Quote.vue";
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
    return { loading: false };
  },
  setup() {
    const user = useCurrentUser();

    const records = useCollection(collectionGroup(db, `recordings`), {
      once: true,
    });

    const users = useCollection(collection(db, `users`));

    const { data: regions, promise } = useCollection(
      collection(db, `regions`),
      { once: true }
    );

    promise.value.then(async (val) => {
      console.log("regions loaded");
      //for each region, call the ep for the cluster summary:
      for (let r of val) {
        console.log(r);
        const dat = await getClustersForRegion({ region: r.id });
        // console.log(dat);
        r.clusters = dat.data;
      }
    });

    const { locale } = useI18n();

    const codeBook = useCollection(collection(db, `codebook`), { once: true });

    const q = useQuasar();

    // console.log("record", record);
    return { user, records, codeBook, regions, locale, users, q };
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
    async startExport() {
      this.loading = true;
      try {
        await startExport();
        this.q.notify({
          type: "positive",
          message: "Export complete!",
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
      this.loading = false;
    },
    getExportFile(ext) {
      getDownloadURL(ref(storage, `exports/latestExport.${ext}`))
        .then((url) => {
          console.log(url);
          openURL(url);
        })
        .catch((e) => {
          this.q.notify({
            type: "negative",
            message: e,
          });
        });
    },
    getRecordingsForUser(user) {
      return filter(this.records, (r) => r.parent == user);
    },
    getRegionalUsers(region) {
      return filter(this.users, { region: region });
    },
    async getTranscript(record) {
      try {
        console.log(record);
        let doc = await downloadTranscript({
          email: record.parent,
          id: record.id,
        });

        // console.log(doc.data.doc);

        //HACK: artificically sleep to wait for the document to exist:
        await new Promise((r) => setTimeout(r, 1000));

        // console.log(record);
        getDownloadURL(ref(storage, doc.data.doc))
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

            // console.log(url);

            openURL(url);

            // Or inserted into an <img> element
            // const img = document.getElementById("myimg");
            // img.setAttribute("src", url);
          })
          .catch((err) => {
            // Handle any errors
            console.log(err);
          });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
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
