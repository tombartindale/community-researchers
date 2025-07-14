<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md
        .text-body1 Group codes together that make sense.
      //- div {{codeBook}}
    
    //- div {{allCodes}}
    //- div {{group1}}

    .row
      .col-4
        div All Codes/Quotes
        draggable(
          tag="transition-group"
          :component-data="{ tag: 'ul', type: 'transition-group', name: !drag ? 'flip-list' : null }"
          v-model="list1"
          v-bind="dragOptions"
          @start="drag = true"
          @end="drag = false"
          item-key="id")
          template(#item="{ element }")
            q-card(class="list-group-item").text-left.q-mb-sm
              q-card-section {{ element.alternatives[0].transcript }}
      .col-4
        div Group 1
        draggable(
          tag="transition-group"
          :component-data="{ tag: 'ul', type: 'transition-group', name: !drag ? 'flip-list' : null }"
          v-model="group1"
          v-bind="dragOptions"
          @start="drag = true"
          @end="drag = false"
          item-key="id")
          template(#item="{ element }")
            q-card(class="list-group-item").text-left.q-mb-sm
              q-card-section {{ element.alternatives[0].transcript }}
      .col-4
        div Group 2
        draggable(
          tag="transition-group"
          :component-data="{ tag: 'ul', type: 'transition-group', name: !drag ? 'flip-list' : null }"
          v-model="group2"
          v-bind="dragOptions"
          @start="drag = true"
          @end="drag = false"
          item-key="id")
          template(#item="{ element }")
            q-card(class="list-group-item").text-left.q-mb-sm
              q-card-section {{ element.alternatives[0].transcript }}

  //- .row.justify-center(v-if="record")
  //-   .col-md-8.col
  //-     q-card().text-justify
  //-       q-card-section.text-body1
  //-         span(v-for="(line,id) of record.transcription.results" :key="id" ).transcript
  //-           //- div {{line.codes}}
  //-           q-menu(touch-position)
  //-             q-list(separator)
  //-               q-item-label(header) Select a code
  //-               q-separator
  //-               q-item(v-for="code in codeBook" :key="code.id" @click="addCode(line, code)" clickable v-close-popup :active="isActiveCode(line, code)")
  //-                 q-item-section
  //-                   q-item-label {{code.name}}
  //-                   q-item-label(caption lines="2") {{code.description}}
  //-           span.line(:style="{ 'text-decoration-color': getLineColor(line) }") {{line.alternatives[0].transcript}}
  //-           span . 
    //- .col-md-1.md
    //-   div.text-overline Legend
    //-   div.transcript.line(v-for="code of codeBook" :style="{ 'text-decoration-color': getLineColor({codes:[code.code]}) }") {{code.name}} 
  
  q-btn(color="primary" size="lg" @click="done()" no-caps).q-mt-lg I've finished grouping

</template>

<script>
import { defineComponent } from "vue";
import draggable from "vuedraggable";

import { useCollection, useCurrentUser } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, setDoc, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import filter from "lodash/filter";

const toggleElement = (arr, val) =>
  arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

export default defineComponent({
  name: "GroupPage",
  props: ["email"],
  components: {
    draggable,
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
      list1: [],
      group1: [],
      group2: [],
    };
  },
  setup(props) {
    const user = useCurrentUser();

    const records = useCollection(
      collection(db, `users/${props.email}/recordings`)
    );

    //get all transcripts with a code:
    // const allCodes = computed(() => {
    //   const tmp = [];

    //   for (let record of records.value) {
    //     let all = filter(
    //       record.transcription?.results,
    //       (f) => f.codes?.length > 0
    //     );

    //     tmp.push(...all);
    //   }

    //   return tmp;
    // });

    const codeBook = useCollection(collection(db, `codebook`));

    // console.log("record", record);
    return { user, records, codeBook };
  },
  computed: {
    allCodes() {
      const tmp = [];

      for (let record of this.records) {
        let all = filter(
          record.transcription?.results,
          (f) => f.codes?.length > 0
        );

        tmp.push(...all);
      }

      return tmp;
    },
  },
  watch: {
    allCodes() {
      this.list1 = this.allCodes;
    },
  },
  methods: {
    done() {
      setDoc(
        doc(db, `users/${this.user.email}`),
        {
          status: "grouped",
        },
        { merge: true }
      );
      this.$router.push("/");
    },
    isActiveCode(line, code) {
      return line.codes?.includes(code.code);
    },
    addCode(line, code) {
      console.log(line);

      // console.log(`transcription.results.${line}.codes`);
      if (!line.codes) {
        line.codes = [];
      }

      line.codes = toggleElement(line.codes, code.code);

      // line.codes.push(code.code);
      updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
        transcription: this.record.transcription,
      });
      // console.log(line, code);
    },
    getLineColor(line) {
      //index of this code:
      if (this.codeBook.length) {
        if (line.codes && line.codes.length == 1) {
          //find the color of the first code:
          const col = find(this.codeBook, { code: line.codes[0] });
          return col.color;
        } else if (line.codes && line.codes.length > 1) {
          return "grey";
        }
      }
      return "transparent";
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
