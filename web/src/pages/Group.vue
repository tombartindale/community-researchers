<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md
        .text-body1 Create clusters of quotes that tell a story when put together. You do not have to use all quotes.
        .text-body1 In the next step you can tell us more about why you have clustered thigns like this.
      //- div {{codeBook}}
    
    //- div {{list1}}
    //- div {{list1}}
    //- div {{clusters}}

  .row.q-mb-md.items-center
    .col
      q-separator
    .col-auto.q-px-sm.text-grey Quotes
    .col
      q-separator
  .row
    .col-12
      q-scroll-area(style="height:50vh;width:100%;")
        .row.q-col-gutter-sm
          .col-4(v-for="i in [0,1,2,3]")
            .column.q-col-gutter-sm
              .col(v-for="element of list1[i]")
                //- div {{element}}
                Cluster(:element="element" :codeBook="codeBook" :clusters="clusters" :locale="locale")
  .row.q-mb-md.items-center
    .col
      q-separator
    .col-auto.q-px-sm.text-grey Clusters
    .col
      q-separator
  .row.q-col-gutter-sm
    .col-4(v-for="cluster of clusters")
      
      q-input(v-model="cluster.title" filled placeholder="Name of cluster" dense @blur="updateName(cluster)").q-mb-sm
      .column.q-col-gutter-sm
        .col( v-for="element of getItemsForCluster(cluster.id)")
          Cluster(:element="element" :codeBook="codeBook" :clusters="clusters" :locale="locale")
     
  
  q-btn(color="primary" size="lg" @click="done()" no-caps).q-mt-lg I've finished clustering

</template>

<script>
import { defineComponent } from "vue";
import draggable from "vuedraggable";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, setDoc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";
// import find from "lodash/find";
// import map from "lodash/map";
// import extend from "lodash/extend";

import Cluster from "src/components/Cluster.vue";
// import groupBy from "lodash/groupBy";

import { useI18n } from "vue-i18n";

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
    draggable,
    Cluster,
  },
  data() {
    return {
      drag: false,
      dragOptions: {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost",
      },
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

    const records = useCollection(
      collection(db, `users/${props.email}/recordings`),
      { once: true }
    );

    const { locale } = useI18n();

    const codeBook = useCollection(collection(db, `codebook`));

    const { data: clusters, promise } = useCollection(
      collection(db, `users/${props.email}/clusters`)
    );

    promise.value.then(async function (val) {
      // console.log("clusters loaded");
      // console.log(val);
      if (val.length == 0) {
        console.log("adding clusters");

        for (let i = 0; i < 3; i++)
          await setDoc(doc(db, `users/${props.email}/clusters/${i}`), {
            title: `Cluster ${i + 1}`,
            description: "",
            learn: "",
            region: user.value.profile.region,
          });
      }
    });

    // console.log("record", record);
    return { user, records, codeBook, locale, clusters };
  },
  computed: {
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

          console.log(this.records);

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
              console.error(e);
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
    updateName(cluster) {
      console.log(cluster.id);
      updateDoc(doc(db, `users/${this.user.email}/clusters/${cluster.id}`), {
        title: cluster.title,
      });
    },
    getItemsForCluster(cluster) {
      return filter(this.allCodes, {
        cluster: cluster,
      });
    },
    done() {
      setDoc(
        doc(db, `users/${this.user.email}`),
        {
          status: "clustered",
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
