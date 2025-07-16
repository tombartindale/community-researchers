<template lang="pug">
q-page(padding).text-center
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md
        .text-body1 {{ $t('read-the-transcript') }}
      //- div {{codeBook}}
  
  //- div {{record.transcription.results}}
  .row.justify-center(v-if="record")
    .col-md-8.col
      q-card().text-justify
        q-card-section.text-body1
          span(v-for="(line,id) of record.transcription.results" :key="id" ).transcript
            //- div {{line.codes}}
            q-menu(touch-position)
              q-list(separator)
                q-item
                  q-item-section.text-grey {{ $t('select-a-code') }}
                  q-item-section(side)
                    q-btn(icon="edit" flat dense)
                      q-popup-edit(:model-value="line.alternatives[0].transcript" anchor="top right" auto-save v-slot="scope" @save="editLine($event,line)")
                        q-input(v-model="scope.value" dense autofocus @keyup.enter="scope.set" borderless style="min-width:50vw;")
                q-separator
                q-item(v-for="code in codeBook" :key="code.id" @click="addCode(line, code)" clickable v-close-popup :active="isActiveCode(line, code)")
                  q-item-section
                    q-item-label {{code.name[locale] || code.name['en']}}
                    q-item-label(caption lines="2") {{code.description[locale] || code.description['en']}}
            span.line(:style="{ 'text-decoration-color': getLineColor(line) }") {{line.alternatives[0].transcript}}
            span . 
    .col-md-1.gt-md
      div.text-overline {{ $t('codes') }}
      div.transcript.line(v-for="code of codeBook" :style="{ 'text-decoration-color': getLineColor({codes:[code.code]}) }") {{code.name[locale] || code.name['en']}} 
  
  q-btn(color="primary" size="lg" @click="done()" no-caps).q-mt-lg {{ $t('ive-finished-coding') }}

</template>

<script>
import { defineComponent } from "vue";

import { useCollection, useCurrentUser, useDocument } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import find from "lodash/find";

const toggleElement = (arr, val) =>
  arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "CodePage",
  props: ["id"],
  data() {
    return {};
  },
  setup(props) {
    const user = useCurrentUser();

    const record = useDocument(
      doc(db, `users/${user.value.email}/recordings/${props.id}`)
    );

    const codeBook = useCollection(collection(db, `codebook`));

    const { locale } = useI18n();
    const q = useQuasar();

    // console.log("record", record);
    return { user, record, codeBook, locale, q };
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
    editLine(val, line) {
      // console.log(val);
      // console.log(line);
      try {
        line.alternatives[0].transcript = val;
        updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
          transcription: this.record.transcription,
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
    done() {
      try {
        updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
          status: "coded",
        });
        this.$router.push("/");
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
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

      try {
        // line.codes.push(code.code);
        updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
          transcription: this.record.transcription,
        });
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
      // console.log(line, code);
    },
    getLineColor(line) {
      //index of this code:
      if (this.codeBook.length) {
        if (line.codes && line.codes.length == 1) {
          //find the color of the first code:
          const col = find(this.codeBook, { code: line.codes[0] });
          if (col) return col.color;
          else return "transparent";
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
