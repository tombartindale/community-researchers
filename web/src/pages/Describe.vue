<template lang="pug">
q-page().text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mt-md
        .text-body1 {{ $t('for-each-cluster-follow-the-prompts') }}
        
    //- div {{records}}
    //- div {{clustered}}
    //- div {{clusters}}

  .row.justify-center
    .col-md-6.col
      .text-center
        span(size="lg" v-for="clus of usedClusters" style="font-size:2em;line-height:0px" :class="{'text-primary':step==clus.code}").q-mr-xs &middot;
      q-tab-panels(v-model="step" swipeable ref="stepper" v-if="usedClusters.length" flat animated)
        q-tab-panel(:name="cluster.code" v-for="cluster of usedClusters")
          .text-h6.q-mb-md {{cluster.title}}
              //- q-step(v-for="(cluster,index) of clustered" :name="index" :title="clusters[index].title").q-pa-none.q-ma-none
          //- div {{clusters[index]}}
          .column.q-col-gutter-sm.text-left
            //- .col {{$t('give-this-cluster-a-name')}}
            //- .col
            //-   q-input(filled v-model="clusters[index].title" )
            //- .col {{$t('enter-a-2-line-description-of-this-cluster')}}
            //- .col
              //- q-input(filled v-model="clusters[index].description")
            .col {{$t('why-did-you-think-this-is-interesting')}}
            .col
              q-input(filled type="textarea" autogrow v-model="cluster.learn")
            //- .col
            //-   q-input(filled v-model="clusters[index].questions" :label="$t('links-to-research-questions')")
            //- .col
            //-   q-input(filled v-model="clusters[index].bullets" :label="$t('take-home-messages-bullets')")
            .col {{ $t('select-3-of-the-following-quotes-that-best-represent-this-cluster') }}
            .col( v-for="element of getQuotesForCode(cluster.code)")
              Cluster(:element="element" :codeBook="codeBook" :clusters="false" :locale="locale" :highlight="true" :cluster="cluster")


      //- div {{allCodes}}
          
      .row.justify-between.q-mx-md.q-mb-xl.q-pb-xl(v-if="usedClusters.length")
        .col-auto
          q-btn(:disable="step == usedClusters[0].code" outline @click="$refs.stepper.previous()" no-caps color="primary") {{ $t('previous-cluster') }}
        .col-auto(v-if="step != usedClusters[usedClusters.length-1].code")
          q-btn(@click="$refs.stepper.next()" no-caps color="primary") {{ $t('next-cluster') }}
        .col-auto(v-if="step == usedClusters[usedClusters.length-1].code")
          q-btn(color="primary" @click="done()" no-caps) {{ $t('ive-finished-describing') }}

</template>

<script>
import { defineComponent, ref } from "vue";
import draggable from "vuedraggable";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, setDoc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";
// import groupBy from "lodash/groupBy";
import map from "lodash/map";
import extend from "lodash/extend";

import Cluster from "src/components/Quote.vue";
// import groupBy from "lodash/groupBy";

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
// import { scroll } from "quasar";
// const { setVerticalScrollPosition } = scroll;
// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "DescribePage",
  props: ["email"],
  components: {
    draggable,
    Cluster,
  },
  data() {
    return {
      // clusters: [
      //   { id: 1, name: "Cluster 1" },
      //   { id: 2, name: "Cluster 2" },
      //   { id: 3, name: "Cluster 3" },
      // ],
      list1: [],
      step: 0,
      clustered: [],
      // group1: [],
      // group2: [],
    };
  },
  setup(props) {
    const user = useCurrentUser();

    const loading = ref(true);

    const { data: records, promise } = useCollection(
      collection(db, `users/${props.email}/recordings`),
      { once: true }
    );

    const { data: codeBook, promise: promiseCodes } = useCollection(
      collection(db, `codebook`),
      { once: true }
    );

    const { data: clusters, promise: promise1 } = useCollection(
      collection(db, `users/${props.email}/clusters`)
    );

    const { locale } = useI18n();

    Promise.all([promiseCodes.value, promise1.value, promise.value]).then(
      async function (val) {
        // console.log(val[1]);
        //if no clusters added yet:
        if (val[1].length == 0) {
          console.log("adding groups");

          let i = 0;
          for (let code of val[0]) {
            // console.log(code.name);
            // console.log(locale);
            const obj = {
              title: code.name[locale.value],
              code: code.code,
              description: "",
              learn: "",
              // questions: "",
              // bullets: "",
              region: user.value.profile.region,
            };

            console.log(obj);
            await setDoc(doc(db, `users/${props.email}/clusters/${i}`), obj);
            i++;
          }
        }

        loading.value = false;
      }
    );

    // Promise.all([promise, promise1]).then(() => {});

    // console.log(user);

    // console.log(user);
    // promise.value.then(async function (val) {
    //   // console.log("clusters loaded");
    //   // console.log(val);
    //   if (val.length == 0) {
    //     console.log("adding clusters");

    //     for (let i = 0; i < 3; i++)
    //       await setDoc(doc(db, `users/${props.email}/clusters/${i}`), {
    //         title: "",
    //         description: "",
    //         learn: "",
    //         region: user.value.profile.region,
    //       });
    //   }
    // });

    // const { locale } = useI18n();

    // const codeBook = useCollection(collection(db, `codebook`));

    const q = useQuasar();

    // console.log("record", record);
    return { user, records, codeBook, locale, clusters, q };
  },
  computed: {
    usedClusters() {
      return filter(this.clusters, (c) => this.getQuotesForCode(c.code).length);
    },
    allCodes() {
      const tmp = [];
      // console.log(this.records);
      for (let record of this.records) {
        // let all = filter(record.transcription?.results, (f) => f.cluster);
        let all = map(record.transcription?.results, (o) => {
          return extend(o, { record: record.id });
        });
        tmp.push(...all);
      }
      return tmp;
    },
    // clustered() {},
  },
  watch: {
    usedClusters() {
      if (this.step == 0) this.step = this.usedClusters[0].code;
    },
    records: {
      deep: true,
      handler() {
        // if (this.clustered.length === 0) {
        //   console.log("watch allcodes");
        //   // const grouped = groupBy(this.allCodes, "code");

        //   console.log(grouped);

        //   const arr = [];

        //   for (let i of Object.keys(grouped)) {
        //     arr.push({
        //       id: i,
        //       quotes: grouped[i],
        //     });
        //   }
        //   this.clustered = arr;
        // } else {
        console.log("update records");
        try {
          for (const record of this.records) {
            if (record.transcription) {
              updateDoc(
                doc(db, `users/${this.email}/recordings/${record.id}`),
                {
                  transcription: record.transcription,
                }
              );
            }
          }
        } catch (e) {
          console.log(e);
          this.q.notify({
            type: "negative",
            message: e,
          });
        }
      },
      // },
    },

    step: {
      handler() {
        window.scrollTo(0, 0);
        //save to db:
        this.save();
      },
    },
  },
  methods: {
    getQuotesForCode(code) {
      // console.log(this.allCodes);
      return filter(this.allCodes, (e) => e.codes?.includes(code));
    },
    async save() {
      //save clusters to db:
      console.log("saving clusters");
      // console.log(this.clusters);
      try {
        for (let cluster of this.clusters) {
          await updateDoc(
            doc(db, `users/${this.email}/clusters/${cluster.id}`),
            {
              ...cluster,
            }
          );
        }
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
      this.save();
      try {
        setDoc(
          doc(db, `users/${this.email}`),
          {
            status: "described",
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
    // isActiveCode(line, code) {
    //   return line.codes?.includes(code.code);
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
  font-size: 1em;
}
</style>
<style>
.q-stepper__step-inner {
  padding-left: 0.8em !important;
  padding-right: 0.8em !important;
}
</style>
