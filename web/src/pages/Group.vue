<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    q-dialog(v-model="firstRun")
      q-card
        q-card-section
          .text-center.q-mb-md
            .text-body1 {{ $t('create-clusters') }}
            .text-body1  {{ $t('in-the-next-step-you-can-tell-us-more-about-why-you-have-clustered-things-like-this') }}
        q-card-actions(align="right")
          q-btn(flat v-close-popup) {{$t("ok")}}
      //- div {{codeBook}}
    
    //- div {{list1}}
    //- div {{list1}}
    //- div {{clusters}}

  .text-center(v-if="loading")
    q-spinner(size="md")

  //- .row.q-mb-md.items-center
  //-   .col
  //-     q-separator
  //-   .col-auto.q-px-sm.text-grey {{ $t('quotes') }}
  //-   .col
  //-     q-separator
  .row.justify-center
    .col-md-8.col
      .q-px-md
        //- q-linear-progress(:value="progress")
      .text-smallish(v-if="slide != 'end'") {{slide+1}} of {{allCodes.length}}
      q-carousel(v-model="slide" swipeable animated control-color="black" arrows transition-prev="slide-right" transition-next="slide-left" style="height:250px;")
        q-carousel-slide(:name="index" v-for="(element,index) of allCodes").q-mt-none.q-pt-none.q-pb-none
          .q-px-md.fit
            QuoteCluster(:element="element" :codeBook="codeBook" :clusters="clusters" :locale="locale" :saving="saving" :disable="saving")
        q-carousel-slide(name="end").q-mt-none.q-pt-none.q-pb-none
          .text-body1.q-mt-lg.q-mx-lg Check your clusters make sense. Select any quote below to change or remove it's cluster.
  //- .row
  //-   .col-12
  //-     q-scroll-area(style="height:50vh;width:100%;")
  //-       .row.q-col-gutter-sm
  //-         .col-4(v-for="i in [0,1,2,3]")
  //-           .column.q-col-gutter-sm
  //-             .col(v-for="element of list1[i]")
  //-               //- div {{element}}
  //-               Cluster(:element="element" :codeBook="codeBook" :clusters="clusters" :locale="locale")
  //- .row.q-mb-md.items-center
  //-   .col
  //-     q-separator
  //-   .col-auto.q-px-sm.text-grey {{ $t('clusters') }}
  //-   .col
  //-     q-separator
  .row.q-col-gutter-sm(style="min-height:240px;")
    .col(v-for="cluster of clusters")
      q-input(v-model="cluster.title" filled :placeholder="$t('name-of-cluster')" dense @blur="updateName(cluster)").q-mb-xs
      .column
        .col-auto
          .text-tiny {{getItemsForCluster(cluster.id).length}} of 10
        .col-auto( v-for="element of getItemsForCluster(cluster.id)")
          QuoteClusterSmall.cursor-pointer(:element="element" :codeBook="codeBook" :clusters="clusters" :locale="locale" @click="setSlide(element)")
          q-separator().q-my-xs

     
  
  q-btn(color="primary" size="lg" @click="done()" no-caps).q-mt-lg {{ $t('ive-finished-clustering') }}

</template>

<script>
import { defineComponent, ref } from "vue";
// import draggable from "vuedraggable";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, setDoc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";
// import find from "lodash/find";
// import map from "lodash/map";
// import extend from "lodash/extend";

import QuoteCluster from "src/components/QuoteCluster.vue";
import Quote from "src/components/Quote.vue";
import QuoteClusterSmall from "src/components/QuoteClusterSmall.vue";
// import groupBy from "lodash/groupBy";

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

const partitionBy = (arr, fn) => [
  ...arr
    .reduce((acc, val, i, arr) => {
      const current = fn(val, i, arr);
      if (acc.has(current)) acc.get(current).push(val);
      else acc.set(current, [val]);
      return acc;
    }, new Map())
    .values(),
];

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "GroupPage",
  props: ["email"],
  components: {
    QuoteCluster,
    Quote,
    QuoteClusterSmall,
  },
  data() {
    return {
      drag: false,
      firstRun: true,
      slide: 0,
      saving: false,
      // clusters: [
      //   { id: 1, name: "Cluster 1" },
      //   { id: 2, name: "Cluster 2" },
      //   { id: 3, name: "Cluster 3" },
      // ],
      list1: [],
      // group1: [],
      // group2: [],
    };
  },
  setup(props) {
    const user = useCurrentUser();

    const { data: records, promise: promise2 } = useCollection(
      collection(db, `users/${props.email}/recordings`),
      { once: true }
    );

    const q = useQuasar();

    const { locale, t } = useI18n();
    const loading = ref(true);

    const codeBook = useCollection(collection(db, `codebook`));

    const { data: clusters, promise } = useCollection(
      collection(db, `users/${props.email}/clusters`)
    );

    Promise.all([promise2.value, promise.value]).then(() => {
      // console.log("loaded");
      loading.value = false;
    });

    promise.value.then(async function (val) {
      // console.log("clusters loaded");
      // console.log(val);
      if (val.length == 0) {
        console.log("adding clusters");

        for (let i = 0; i < 3; i++)
          await setDoc(doc(db, `users/${props.email}/clusters/${i}`), {
            title: t("cluster-i", [i + 1]),
            description: "",
            learn: "",
            questions: "",
            bullets: "",
            region: user.value.profile.region,
          });
      }
    });

    // console.log("record", record);
    return { user, records, codeBook, locale, clusters, loading, q };
  },
  computed: {
    progress() {
      return this.slide / this.allCodes.length;
    },
    allCodes() {
      const tmp = [];

      for (let record of this.records) {
        let all = filter(
          record.transcription?.results,
          (f) => f.codes?.length > 0
        );

        // console.log(all);

        // all = map(all, (o) => {
        //   return extend(o, { record: record.id });
        // });

        tmp.push(...all);
      }

      return tmp;
    },
  },
  watch: {
    allCodes: {
      deep: true,
      handler() {
        if (this.list1.length === 0) {
          console.log("init partition");
          this.list1 = partitionBy(this.allCodes, (n, i) => {
            return i % 3;
          });
        } else {
          // console.log(this.allCodes);

          //this.records is the ground truth:

          // console.log(this.records);
          this.saving = true;
          //for each record doc:
          for (const record of this.records) {
            try {
              // console.log(this.records);
              if (record.transcription)
                updateDoc(
                  doc(db, `users/${this.user.email}/recordings/${record.id}`),
                  {
                    transcription: record.transcription,
                  }
                );
            } catch (e) {
              this.q.notify({
                type: "negative",
                message: e,
              });
            } finally {
              this.saving = false;
            }
          }
        }
      },
    },

    // cluster: {
    //   deep: true,
    //   handler(old, nw) {
    //     console.log(old, nw);
    //     // updateDoc(doc(db, `users/${this.user.email}/recordings/${record.id}`), {
    //     //   transcription: record.transcription,
    //     // });
    //   },
    // },
  },
  methods: {
    setSlide(element) {
      console.log(this.allCodes.indexOf(element));
      this.slide = this.allCodes.indexOf(element);
    },
    updateName(cluster) {
      // console.log(cluster.id);
      try {
        updateDoc(doc(db, `users/${this.user.email}/clusters/${cluster.id}`), {
          title: cluster.title,
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
    getItemsForCluster(cluster) {
      return filter(this.allCodes, {
        cluster: cluster,
      });
    },
    done() {
      try {
        setDoc(
          doc(db, `users/${this.user.email}`),
          {
            status: "clustered",
          },
          { merge: true }
        );
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
  font-size: 1em;
}
</style>

<style>
.text-smallish {
  font-size: 0.8em;
}
</style>
