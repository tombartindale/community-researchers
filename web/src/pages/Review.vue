<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md
        .text-body1 Summarise across all the insights from {{user.profile.region}}.
    //- div {{records}}
  //- div {{regionData}}

  .row(v-if="regionData").justify-center
    .col-md-8.col
      q-editor.text-left(type="textarea" v-model="regionData.description" @blur="saveDesc" filled label="Summary of Findings" content-class="bg-grey-1")


    //- div {{clusters}}
  .text-center.q-mt-lg(v-if="loading")
    q-spinner(size="md")

  .row.q-col-gutter-sm.q-mt-lg
    .col-4(v-for="(cluster,index) of clusters" )
      q-card(flat bordered v-if="cluster?.quotes.length>0")
        q-card-section
          .column.q-col-gutter-sm 
            .col
              .text-body1 {{clusters[index].title}}
            .col 
              .text-body2 {{clusters[index].description }}
            .col 
              .text-body2 {{clusters[index].learn}}
            .col 
              .text-body2 {{clusters[index].questions}}
            .col    
              .text-body2 {{clusters[index].bullets}}
            .col( v-for="element of cluster.quotes")
              Cluster(:element="element" :clusters="false" :locale="locale" :simple="true")
              q-separator(inset).q-mt-sm
  
  q-btn(color="primary" size="lg" to="/" no-caps).q-mt-lg I've finished reviewing

</template>

<script>
import { defineComponent } from "vue";
import draggable from "vuedraggable";

import { useCurrentUser, useDocument } from "vuefire";
import { db, getClustersForRegion } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, setDoc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";
// import groupBy from "lodash/groupBy";
import map from "lodash/map";
import extend from "lodash/extend";

import Cluster from "src/components/Cluster.vue";
// import groupBy from "lodash/groupBy";

import { useI18n } from "vue-i18n";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "DescribePage",
  props: ["region"],
  components: {
    draggable,
    Cluster,
  },
  async mounted() {
    // console.log(getClustersForRegion);
    try {
      this.clusters = (
        await getClustersForRegion({ region: this.region })
      ).data;
      this.loading = false;
    } catch (e) {
      console.error(e);
    }
  },
  data() {
    return {
      list1: [],
      step: 0,
      clustered: [],
      clusters: [],
      loading: true,
    };
  },
  setup(props) {
    const user = useCurrentUser();

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

    const { data: regionData, promise } = useDocument(
      doc(db, `regions/${props.region}`)
    );

    // console.log(promise);

    promise.value.then(async function (val) {
      // console.log("region loaded");
      // console.log(val);
      if (!val) {
        // console.log("adding clusters");

        await setDoc(doc(db, `regions/${props.region}`), {
          description: "",
        });
      }
    });

    const { locale } = useI18n();

    // const codeBook = useCollection(collection(db, `codebook`));

    // console.log("record", record);
    return { user, locale, regionData };
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

    // allClusters() {
    //   let
    //   return [];
    // },
  },
  watch: {
    async "regionData.description"() {},
  },
  methods: {
    async saveDesc(ev, data) {
      console.log(data);

      await updateDoc(doc(db, `regions/${this.region}`), {
        description: this.regionData.description,
      });
    },
    getItemsForCluster(cluster) {
      return filter(this.allCodes, {
        cluster: cluster,
      });
    },
    done() {
      this.save();
      setDoc(
        doc(db, `users/${this.user.email}`),
        {
          status: "described",
        },
        { merge: true }
      );
      this.$router.push("/");
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
