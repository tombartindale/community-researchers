<template lang="pug">
q-page(padding).text-center
  .text-h6 Regions
  q-list(separator).text-left
    q-item
      q-item-section.text-grey Region
    q-item(v-for="region of regions")
      q-item-section {{region.id}}
    
    q-item
      q-item-section
        q-input(v-model="newRegion" label="Region name" filled)
      
      q-item-section(side)
        q-btn(flat @click="addNew" icon="add")


</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, updateDoc, setDoc } from "firebase/firestore"; // Importing dbRef for database operations
import { useQuasar } from "quasar";
// import find from "lodash/find";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "RegionsPage",
  // props: ["id"],
  data() {
    return {
      newRegion: "",
      // regions: ["Europe (French)", "Asia", "Americas (Spanish)"],
    };
  },
  setup() {
    const currentUser = useCurrentUser();

    // const record = useDocument(
    //   doc(db, `users/${user.value.email}/recordings/${props.id}`)
    // );

    const regions = useCollection(collection(db, `regions`));

    const q = useQuasar();

    // console.log("record", record);
    return { regions, currentUser, q };
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
    async addNew() {
      if (this.newRegion.length) {
        try {
          // throw Error();
          await setDoc(doc(db, `regions/${this.newRegion}`), {
            description: "",
          });
          this.newRegion = "";
        } catch (e) {
          this.q.notify({
            type: "negative",
            message: e,
          });
        }
      }
    },
    async changeAdmin(user) {
      try {
        await updateDoc(doc(db, `users/${user.id}`), {
          isAdmin: !user.isAdmin,
        });
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
