<template lang="pug">
q-page(padding).text-center
  .text-h6 Users
  q-list(separator).text-left
    q-item
      q-item-section.text-grey Email
      q-item-section.text-grey Region
      q-item-section(side) Admin
      q-item-section(side) Editor
    q-item(v-for="user of users")
      q-item-section {{user.id}}
      q-item-section
        q-select(:options="regions" :model-value="user.region" @update:model-value="changeRegion($event,user)" dense filled)
      q-item-section(side) 
        q-checkbox(:model-value="user.isAdmin" @update:model-value="changeAdmin(user)" :disable="currentUser.email === user.id")
      q-item-section(side) 
        q-checkbox(:model-value="user.isEditor" @update:model-value="changeEditor(user)" :disable="currentUser.email === user.id")
    
    q-item
      q-item-section
        q-input(v-model="newEmail" label="New researcher's email address" filled)
      
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
  name: "CodePage",
  // props: ["id"],
  data() {
    return {
      newEmail: "",
      regions: ["Europe (French)", "Asia", "Americas (Spanish)"],
    };
  },
  setup() {
    const currentUser = useCurrentUser();

    // const record = useDocument(
    //   doc(db, `users/${user.value.email}/recordings/${props.id}`)
    // );

    const users = useCollection(collection(db, `users`));

    const q = useQuasar();

    // console.log("record", record);
    return { users, currentUser, q };
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
      if (this.newEmail.length) {
        try {
          // throw Error();
          await setDoc(doc(db, `users/${this.newEmail}`), {
            isAdmin: false,
            isEditor: false,
          });
          this.newEmail = "";
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
    async changeEditor(user) {
      try {
        await updateDoc(doc(db, `users/${user.id}`), {
          isEditor: !user.isEditor,
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
    async changeRegion(ev, user) {
      try {
        // console.log(ev);
        await updateDoc(doc(db, `users/${user.id}`), {
          region: ev,
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
