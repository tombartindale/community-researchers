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

  .row
    .col-sm-auto.col-12
      q-list(separator)
        template(v-for="region of regions")
          q-item(clickable :to="`/admin/${region.id}`" :active="tab==region.id") 
            q-item-section.text-left 
              .row 
                .col {{region.id}}
              .row
                q-item-section(side) 
                  .row.items-center
                    q-avatar(size="sm" icon="person") 
                    .text-tiny {{getRegionalUsers(region.id).length}}
                q-item-section(side)
                  .row.items-center 
                    q-avatar(size="sm" icon="graphic_eq") 
                    .text-tiny {{getRegionalUserRecordings(region.id)}}
                q-item-section(side)
                  .row.items-center 
                    q-avatar(size="sm" icon="code") 
                    .text-tiny {{getRegionalUserCoding(region.id)}}
                q-item-section(side)
                  .row.items-center 
                    q-avatar(size="sm" icon="article") 
                    .text-tiny {{getRegionalUserDescribe(region.id)}}

            //- q-tabs(v-model="tab" vertical no-caps)
            //- q-tab(v-for="region of regions" :name="region.id" :label="region.id")
    .col-12.col-sm
      q-tab-panels(v-model="tab" @transition="loadPanel")
        q-tab-panel(v-for="region of regions" :name="region.id" ).q-mt-lg.q-mb-xl
          .row.items-center
            .col
              q-separator(inset)
            .col-auto
              .text-h6 {{region.id}}
            .col
              q-separator(inset)
          .row
            //- div {{region}}
            .col.text-body1.text-grey.q-py-md(v-html="(region.description.trim()=='')? 'Summary not written yet...':region.description")
          .row.q-col-gutter-sm.q-mb-md
            .col(v-if="!region.clusters")
              q-spinner( size="2em")
            template(v-for="cluster of region.clusters")
              .col-md-6.col-12( v-if="cluster.quotes.length")
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
                        QuoteGrouped(:element="element" :clusters="false" :locale="locale" :simple="true")
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
            .col-md-6.col-12(v-for="user of getRegionalUsers(region.id)")
              q-card(bordered flat).fit
                q-card-section
                  .row.text-left.items-center
                    .col
                      .text-body1 {{user.id}}
                    .col-auto
                      //- q-btn(icon="grain" dense flat :to="`/group/${user.id}`" no-caps)
                      //-   q-tooltip Clustering
                      q-btn(icon="upload" dense flat :to="`/upload/${user.id}`" no-caps)
                        q-tooltip Upload
                      q-btn(icon="description" dense flat :to="`/describe/${user.id}`" no-caps :color="(user.status=='described')?'positive':''")
                        q-tooltip Describe
                q-separator
                q-list(separator).text-left
                  q-item(v-if="getRecordingsForUser(user.id).length === 0").text-grey No recordings yet...
                  q-item(v-for="recording of getRecordingsForUser(user.id)") 
                    q-item-section.ellipsis-2-lines {{recording.who}}
                    q-item-section(side).text-caption {{recording.language}}
                    q-item-section(side)
                      q-btn(icon="graphic_eq" dense flat @click="getRecording(recording)" no-caps)
                        q-tooltip Recording
                    q-item-section(side)
                      q-btn(icon="article" dense flat @click="getTranscript(recording)" no-caps)
                        q-tooltip Transcript
                    q-item-section(side v-if="!recording.error")
                      q-btn(icon="code" dense flat :to="`/code/${recording.parent}/${recording.id}`" no-caps :color="(recording.status=='coded')?'positive':''")
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
import { useRouter } from "vue-router";

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
import QuoteGrouped from "src/components/QuoteGrouped.vue";
import { useI18n } from "vue-i18n";

import filter from "lodash/filter";
import find from "lodash/find";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "CodePage",
  props: ["id", "tab"],
  components: { QuoteGrouped },
  data() {
    return { loading: false };
  },
  setup(props) {
    const user = useCurrentUser();

    const records = useCollection(collectionGroup(db, `recordings`), {
      once: true,
    });

    const users = useCollection(collection(db, `users`));

    const { data: regions, promise } = useCollection(
      collection(db, `regions`),
      {
        once: true,
      }
    );

    const q = useQuasar();
    const router = useRouter();

    const loadPanel = async (region) => {
      // console.log("Load", region);
      if (region.length) {
        const reg = find(regions.value, { id: region });
        // console.log(reg);
        try {
          const dat = await getClustersForRegion({ region: reg.id });
          //   // console.log(dat);
          reg.clusters = dat.data;
        } catch (e) {
          q.notify({
            type: "negative",
            message: e,
          });
        }
      }
    };

    promise.value.then((val) => {
      // console.log(props);
      // console.log(val);
      if (!props.tab) {
        console.log(val[0].id);
        router.replace(`/admin/${val[0].id}`);
        // props.tab = val[0].id;
      } else loadPanel(props.tab);
    });

    // const tab = vref("");

    // promise.value.then(async (val) => {
    //   console.log("regions loaded");
    //   // tab.value = val[0].id;
    //   //for each region, call the ep for the cluster summary:
    //   // for (let r of val) {
    //   //   console.log(r);
    //   //   const dat = await getClustersForRegion({ region: r.id });
    //   //   // console.log(dat);
    //   //   r.clusters = dat.data;
    //   // }
    // });

    const { locale } = useI18n();

    const codeBook = useCollection(collection(db, `codebook`), { once: true });

    // console.log("record", record);
    return { user, records, codeBook, regions, locale, users, q, loadPanel };
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
    getRegionalUserDescribe(region) {
      const uu = this.getRegionalUsers(region);
      return filter(uu, { status: "described" }).length;
    },
    getRegionalUserCoding(region) {
      let count = 0;
      let uu = this.getRegionalUsers(region);
      for (let u of uu) {
        const recs = this.getRecordingsForUser(u.id);
        const rec_coded = filter(recs, { status: "coded" });
        count += rec_coded.length;
      }
      //for every recording:

      // return filter(this.getRegionalUserRecordings(region), { status: "coded" })
      //   .length;
      return count;
    },

    getRecordingsForUser(user) {
      return filter(this.records, (r) => r.parent == user);
    },
    getRegionalUsers(region) {
      return filter(this.users, { region: region });
    },
    getRegionalUserRecordings(region) {
      let uu = this.getRegionalUsers(region);
      let count = 0;

      for (let u of uu) {
        count += this.getRecordingsForUser(u.id).length;
        // console.log(u);
      }

      return count;
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
