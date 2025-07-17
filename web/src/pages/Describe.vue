<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md.q-mt-md
        .text-body1 {{ $t('for-each-cluster-follow-the-prompts') }}
        
    //- div {{records}}
    //- div {{clustered}}
    //- div {{clusters}}

  .row.justify-center
    .col-md-8.col
      q-stepper(v-model="step" ref="stepper" v-if="clusters.length" flat :contracted="$q.screen.lt.md")
        q-step(v-for="(cluster,index) of clustered" :name="index" :title="clusters[index].title")
          //- div {{clusters[index]}}
          .column.q-col-gutter-sm.text-left
            .col {{$t('give-this-cluster-a-name')}}
            .col
              q-input(filled v-model="clusters[index].title" )
            .col {{$t('enter-a-2-line-description-of-this-cluster')}}
            .col
              q-input(filled v-model="clusters[index].description")
            .col {{$t('why-did-you-think-this-is-interesting')}}
            .col
              q-input(filled v-model="clusters[index].learn")
            //- .col
            //-   q-input(filled v-model="clusters[index].questions" :label="$t('links-to-research-questions')")
            //- .col
            //-   q-input(filled v-model="clusters[index].bullets" :label="$t('take-home-messages-bullets')")
            .col {{ $t('select-3-of-the-following-quotes-that-best-represent-this-cluster') }}
            .col( v-for="element of cluster.quotes")
              Cluster(:element="element" :codeBook="codeBook" :clusters="false" :locale="locale" :highlight="true" :cluster="cluster")

        template(v-slot:navigation)
          q-stepper-navigation
            .row.justify-between
              q-btn(:disable="step == 0" flat @click="$refs.stepper.previous()" ) {{ $t('previous-cluster') }}
              q-btn(@click="$refs.stepper.next()" flat :disable="step == Object.keys(clustered).length-1" ) {{ $t('next-cluster') }}
  
  q-btn(color="primary" size="lg" @click="done()" no-caps).q-mt-lg {{ $t('ive-finished-describing') }}

</template>

<script>
import { defineComponent, ref } from "vue";
import draggable from "vuedraggable";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, setDoc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";
import groupBy from "lodash/groupBy";
import map from "lodash/map";
import extend from "lodash/extend";

import Cluster from "src/components/Quote.vue";
// import groupBy from "lodash/groupBy";

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

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

    const { data: clusters, promise: promise1 } = useCollection(
      collection(db, `users/${props.email}/clusters`)
    );

    Promise.all([promise, promise1]).then(() => {
      loading.value = false;
    });

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

    const { locale } = useI18n();

    const codeBook = useCollection(collection(db, `codebook`));

    const q = useQuasar();

    // console.log("record", record);
    return { user, records, codeBook, locale, clusters, q };
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
    // clustered() {},
  },
  watch: {
    allCodes: {
      deep: true,
      handler() {
        if (this.clustered.length === 0) {
          console.log("watch allcodes");
          const grouped = groupBy(this.allCodes, "cluster");

          const arr = [];

          for (let i of Object.keys(grouped)) {
            arr.push({
              id: i,
              quotes: grouped[i],
            });
          }
          this.clustered = arr;
        } else {
          console.log("update records");
          try {
            for (const record of this.records) {
              if (record.transcription) {
                updateDoc(
                  doc(db, `users/${this.user.email}/recordings/${record.id}`),
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
        }
      },
    },

    step: {
      handler() {
        //save to db:
        this.save();
      },
    },
  },
  methods: {
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
          doc(db, `users/${this.user.email}`),
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
