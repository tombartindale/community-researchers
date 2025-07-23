<template lang="pug">
q-page(padding).text-center
  .text-h4 Codebook
  //- div {{codeBook}}
  //- div {{locale}}
  q-list(separator).text-left
    q-item
      q-item-section.col-1.text-grey Color
      q-item-section.col-2.text-grey Code
      q-item-section.col-3.text-grey Name
      //- q-item-section.text-grey Description
    q-item(v-for="code of codeBook")
      q-item-section.col-1
        q-avatar(round :style="{'background-color':code.color}" size="2.5em")
      q-item-section.col-2 {{code.code}}
      q-item-section.col.text-left 
        div(v-for="(n,l) of code.name") 
          .row
            .col-1
              .q-pr-sm
                span.text-grey {{l}}&nbsp;
            .col
              span {{n}} 
      //- q-item-section.text-left
      //-   div(v-for="(n,l) of code.description") 
      //-     .row
      //-       .col-1
      //-         .q-pr-sm
      //-           span.text-grey {{l}}&nbsp;
      //-       .col
      //-         span {{n}} 
      q-item-section(side)
        q-btn(flat icon="remove" @click="remove(code)")
    q-form(@submit="addCode")
      q-separator
      q-item
        q-item-section.col-1.self-start
          q-avatar(round :style="{'background-color':newCode.color}" size="2.5em")
            q-icon(name="colorize" class="cursor-pointer" size="sm" color="grey")
              q-popup-proxy(cover transition-show="scale" transition-hide="scale")
                q-color(v-model="newCode.color")
        q-item-section.col-2.self-start
          q-input(filled v-model="newCode.code" dense :rules="[val => !!val || 'Code is required']")
        q-item-section
          .row(v-for="l of langs").items-top.q-col-gutter-sm
            .col-4
              q-input(filled v-model="newCode.name[l]" :label="l" dense :rules="[val => !!val || 'Required']")
            //- .col
              //- q-input(type="textarea" autogrow filled v-model="newCode.description[l]" :label="l" dense :rules="[val => !!val || 'Required']")
        //- q-item-section
          .row(v-for="l of langs")
            .col
              
                
        q-item-section(side)  
          q-btn(icon="add" flat type="submit")
      

    

</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore"; // Importing dbRef for database operations

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

// import find from "lodash/find";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "CodePage",
  props: ["id"],
  data() {
    return {
      langs: ["en", "fr", "ar", "es", "zh"],
      newCode: {
        color: "",
        code: "",
        name: {},
        // description: {},
      },
    };
  },
  setup() {
    const user = useCurrentUser();

    // const record = useDocument(
    //   doc(db, `users/${user.value.email}/recordings/${props.id}`)
    // );

    const codeBook = useCollection(collection(db, `codebook`));

    const { locale } = useI18n({ useScope: "global" });
    const q = useQuasar();

    // console.log("record", record);
    return { user, codeBook, locale, q };
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
    async remove(code) {
      try {
        await deleteDoc(doc(db, `codebook/${code.id}`));
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
    async addCode() {
      // const translated = {
      //   color: this.newCode.color,
      //   code: this.newCode.code,
      //   name: {},
      //   description: {},
      // };
      // translated.name[this.locale] = this.newCode.name;
      // translated.description[this.locale] = this.newCode.description;
      try {
        await addDoc(collection(db, `codebook`), this.newCode);
        // this.$router.push("/");
        this.newCode.color = "";
        this.newCode.code = "";
        this.newCode.name = {};
        this.newCode.description = {};
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
