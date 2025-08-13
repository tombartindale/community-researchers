<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md
        .text-body1 {{ $t('summarise-across-all-the-insights-from-user-profile-region', [user.profile.region]) }}
    //- div {{clusters}}
  //- div {{regionData}}
  //- div {{clusters.length}}

  .row(v-if="regionData").justify-center
    .col-md-8.col
      q-editor.text-left(type="textarea" v-model="regionData.description" @blur="saveDesc" filled :label="$t('summary-of-findings')" content-class="bg-grey-1")
      .text-body2.text-grey {{ $t('please-coordinate-with-other-researchers-in-your-national-society-so-one-person-edits-this-text-at-a-time') }}


    //- div {{clusters}}
  .text-center.q-mt-lg(v-if="loading")
    q-spinner(size="md")

  .row.q-col-gutter-sm.q-mt-lg.justify-center
    .col-md-4.col-sm(v-for="cluster of validClusters" )
      q-card(flat bordered v-if="cluster?.quotes.length>0")
        q-card-section
          .column.q-col-gutter-sm 
            .col
              .text-body1 {{cluster.title}}
            //- .col 
              //- .text-body2 {{clusters[index].description }}
            .col 
              .text-body2 {{cluster.learn}}
            //- .col 
              //- .text-body2 {{clusters[index].questions}}
            //- .col    
            //-   .text-body2 {{clusters[index].bullets}}
            .col( v-for="element of cluster.quotes")
              QuoteGrouped(:element="element" :clusters="false" :locale="locale" :simple="true")
              q-separator(inset).q-mt-sm
  .row.justify-center.q-col-gutter-md
    .col-auto
      q-btn(@click="saveDesc()" :loading="saving" :disable="saving" color="primary" outline size="lg" no-caps).q-mt-lg {{ $t('save-and-continue-later') }}
    .col-auto
      q-btn(color="primary" size="lg" :loading="saving" :disabled="saving" @click="done()" no-caps).q-mt-lg {{ $t('ive-finished-reviewing') }}

</template>

<script>
import { defineComponent } from "vue";
import draggable from "vuedraggable";

import { useCurrentUser, useDocument } from "vuefire";
import { db, getClustersForRegion } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";
// import groupBy from "lodash/groupBy";
import map from "lodash/map";
import extend from "lodash/extend";

import QuoteGrouped from "src/components/QuoteGrouped.vue";
// import groupBy from "lodash/groupBy";

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "DescribePage",
  props: ["region"],
  components: {
    draggable,
    QuoteGrouped,
  },
  async mounted() {
    // console.log(getClustersForRegion);
    try {
      console.log("loading clusters");
      this.clusters = (
        await getClustersForRegion({ region: this.region })
      ).data;

      console.log(this.clusters);
      this.loading = false;
    } catch (e) {
      console.error(e);
      this.q.notify({
        type: "negative",
        message: e,
      });
    }
  },
  data() {
    return {
      list1: [],
      step: 0,
      clustered: [],
      clusters: [],
      loading: true,
      saving: false,
    };
  },
  setup(props) {
    const user = useCurrentUser();
    const q = useQuasar();

    // const records = useCollection(
    //   collection(db, `users/${props.email}/recordings`)
    // );

    // const { data: clusters, promise: clusterPromise } = useCollection(
    //   collectionGroup(db, `clusters`)
    // );

    // clusterPromise.value.then(function (val) {
    //TODO: load/match the records to get the quotes:
    // console.log(val);
    // for (let v of val) {
    //   console.log(v.parent);
    // }
    // });

    const regionData = useDocument(doc(db, `regions/${props.region}`));

    // console.log(promise);

    // promise.value.then(async function (val) {
    //   console.log("region loaded");
    //   console.log(val);
    //   if (!val) {
    //     console.log("adding clusters");

    //     await setDoc(doc(db, `regions/${props.region}`), {
    //       description: "",
    //     });
    //   }
    // });

    const { locale } = useI18n();

    // const codeBook = useCollection(collection(db, `codebook`));

    // console.log("record", record);
    return { user, locale, regionData, q };
  },
  computed: {
    allCodes() {
      const tmp = [];
      for (let record of this.records) {
        let all = filter(record.transcription?.results, (f) => f.cluster);
        all = map(all, (o) => {
          return extend(o, { record: record.id });
        });
        tmp.push(...all);
      }
      return tmp;
    },

    validClusters() {
      return filter(this.clusters, (c) => c.quotes.length);
    },

    // allClusters() {
    //   let
    //   return [];
    // },
  },
  // watch: {
  //   async "regionData.description"() {},
  // },
  methods: {
    async saveDesc() {
      // console.log(data);
      this.saving = true;
      await new Promise((r) => setTimeout(r, 1000));
      try {
        await updateDoc(doc(db, `regions/${this.region}`), {
          description: this.regionData.description,
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      } finally {
        this.saving = false;
      }
    },
    getItemsForCluster(cluster) {
      return filter(this.allCodes, {
        cluster: cluster,
      });
    },
    async done() {
      try {
        await this.saveDesc();
        // this.saving = true;
        // setDoc(
        //   doc(db, `users/${this.user.email}`),
        //   {
        //     status: "described",
        //   },
        //   { merge: true }
        // );

        this.$router.push("/");
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      } finally {
        // this.saving = false;
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
  font-size: 1em;
}
</style>
