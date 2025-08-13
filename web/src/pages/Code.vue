<template lang="pug">
q-page(padding v-scroll="onScroll" @click="hideMenu").text-center
  div(v-if="initialSave").fullscreen.absolute.full-width.bg-white
    .column.full-height.justify-center
      .col-auto
        .text-body1 {{ $t('preparing-transcript') }}
  q-banner(style="left:0;bottom:0em;" :class="{'bg-warning':isDirty,'bg-grey-2':!isDirty}").fixed.full-width.z-max
    div(v-if="isDirty")
      .row.items-center
        .col {{ $t('updates-require-saving') }}
        .col-auto 
          q-btn(flat no-caps @click="save" :loading="saving" :disabled="saving").text-white {{ $t('save') }}
    div(v-else)
      .row.items-center
        .col {{ $t('all-changes-saved') }}
  .row.justify-center
    .col-md-8.col
      q-banner.text-center.q-mb-md
        .text-body1 {{ $t('read-the-transcript') }}
  //- div {{codeBook}}
  
  //- div {{record}}
  .row
    .col-md-1.lt-md.q-mb-md
      div.text-overline {{ $t('codes') }}: 
       span.q-mb-xs(v-for="code of codeBook" ) 
        span.line(:style="{ 'text-decoration-color': getLineColor({codes:[code.code]}) }") {{code.name[locale] || code.name['en']}} 
        span &middot; 
  .row.justify-center(v-if="record")
    .col-md-8.offset-md-2.col
      //- div {{selection}}
      q-card().text-justify
        //- div {{currentTarget}}
        q-card-section.text-body1
          span(v-for="(line,id) of record.transcription.results" :key="id" :id="`target_${id}`" @click.stop.prevent="toggle(line,id)").transcript
            //- div {{line.codes}}
            
            span.line(:style="{ 'text-decoration-color': getLineColor(line) }" :class="{selected:line.selected}") {{line.alternatives[0].transcript}}&nbsp;
            //- span(v-if="!line.alternatives[0].transcript.endsWith('.')") &nbsp; 
    .col-md-2.gt-sm.q-pl-md.text-left
      div(:class="{'fixed':fixed}" style="top:55px;")
        div.text-overline {{ $t('codes') }}
        div.text-left.line.q-mb-xs(v-for="code of codeBook" :style="{ 'text-decoration-color': getLineColor({codes:[code.code]}) }") {{code.name[locale] || code.name['en']}} 
  
  .row.q-col-gutter-md.justify-center.q-mt-lg.q-mb-xl.q-pb-lg
    .col-auto
      q-btn(v-if="isDirty" color="primary" outline size="lg" @click="save()" no-caps :disable="saving" :loading="saving") {{ $t('save-and-continue-later') }}
    .col-auto
      q-btn(color="primary" size="lg" @click="done()" no-caps :loading="saving" :disable="saving") {{ $t('ive-finished-coding') }}
  q-menu(ref="menu" anchor="bottom end" self="top end" persistent v-model="showMenu" :target="currentTarget" no-parent-event @before-hide="hideMenu")
    q-list(separator)
      q-item(clickable v-if="selection.length==1")
        q-item-section {{ $t('correct-transcript') }}
          
          //- q-btn(icon="edit" flat dense)
          q-popup-edit(:model-value="selection[0].alternatives[0].transcript" anchor="top right" auto-save v-slot="scope" @save="editLine($event,selection[0])")
            q-input(v-model="scope.value" dense autofocus @keyup.enter="scope.set" borderless style="min-width:50vw;")
      q-item
        q-item-section.text-grey {{ $t('select-a-code') }}
      q-separator
      q-item(v-for="code in codeBook" :key="code.id" @click.stop="addAllCodes(code)" clickable v-close-popup )
        q-item-section
          q-item-label {{code.name[locale] || code.name['en']}}
          //- q-item-label(caption lines="2") {{code.description[locale] || code.description['en']}}
      q-item(@click="addAllCodes(null)" clickable v-close-popup )
        q-item-section
          q-item-label {{ $t('un-label') }}
</template>

<script>
import { defineComponent, computed, ref } from "vue";

import { useCollection, useCurrentUser, useDocument } from "vuefire";
import { db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
// import { ref, uploadBytesResumable } from "firebase/storage";
import { doc, collection, updateDoc } from "firebase/firestore"; // Importing dbRef for database operations

import find from "lodash/find";
import orderBy from "lodash/orderBy";
import compact from "lodash/compact";
import filter from "lodash/filter";
import chunk from "lodash/chunk";

// const toggleElement = (arr, val) =>
//   arr.includes(val) ? arr.filter((el) => el !== val) : [...arr, val];

// const user = useCurrentUser()

import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "CodePage",
  props: ["id", "email"],
  data() {
    return {
      fixed: false,
      currentTarget: "",
      // selection: [],
      showMenu: false,
      currentLine: null,
      isDirty: false,
      saving: false,
    };
  },
  setup(props) {
    const user = useCurrentUser();
    const initialSave = ref(true);

    const { data: record, promise } = useDocument(
      doc(db, `users/${props.email}/recordings/${props.id}`),
      { once: true }
    );

    promise.value.then(async function (val) {
      console.log("loaded record", val);
      //splice up into smaller chunks:

      const newArr = [];
      if (!val.transcription.hasBeenSplit) {
        for (let line of val.transcription.results) {
          // console.log(line);
          if (line.alternatives[0].transcript.length)
            line.alternatives[0].transcript += ".";
          const words = line.alternatives[0].transcript.split(" ");

          const newlines = chunk(words, 6);

          // console.log(newlines);
          // console.log(line);

          // console.log(this.record.transcription);

          const index = val.transcription.results.indexOf(line);
          console.log("index", index);

          //if should be split into more than 1 line:
          if (newlines.length > 1) {
            // console.log("new lines:");
            //remove the old obj:
            // val.transcription.results.splice(index, 1);
            const codes = line.codes;

            //split into new lines:
            // let i = 0;
            for (const nl of newlines) {
              const trans = `${nl.join(" ").trim()}`;
              // console.log(trans);
              if (trans.length) {
                const newitem = {
                  alternatives: [{ transcript: trans }],
                  record: props.id,
                };
                if (codes) newitem.codes = codes;
                // val.transcription.results.splice(index + i, 0, newitem);
                newArr.push(newitem);
              }
              // console.log(newitem);
              // i++;
            }
          } else {
            if (line.alternatives[0].transcript.length) newArr.push(line);
          }
        }

        val.transcription.results = newArr;
        val.transcription.hasBeenSplit = true;

        try {
          console.log("start initial save");

          // line.codes.push(code.code);
          updateDoc(
            doc(db, `users/${user.value.email}/recordings/${props.id}`),
            {
              transcription: val.transcription,
            }
          );
          await new Promise((r) => setTimeout(r, 2000));
          console.log("finish initial save");
          initialSave.value = false;
        } catch (e) {
          this.q.notify({
            type: "negative",
            message: e,
          });
        }
      } else {
        initialSave.value = false;
      }
    });

    const codebook = useCollection(collection(db, `codebook`));

    const { locale } = useI18n();
    const q = useQuasar();

    const codeBook = computed(() => {
      return orderBy(codebook.value, "code");
    });

    // console.log("record", record);
    return { user, record, codeBook, locale, q, initialSave };
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
  computed: {
    selection() {
      return filter(this.record.transcription.results, { selected: true });
    },
  },
  methods: {
    hideMenu() {
      //unselect all:
      let tmp = [...this.selection];

      for (let l of tmp) {
        // l.codes = [code.code];
        delete l.selected;
      }
      this.showMenu = false;
    },
    toggle(line, id) {
      //toggle selection of this line:
      // console.log(line, id);
      line.selected = !line.selected;
      this.currentLine = line;
      this.currentTarget = `#target_${id}`;
      this.$refs.menu.updatePosition();
      this.showMenu = true;
    },
    // showMenu(ev) {
    //   console.log(ev);
    // },
    onScroll(position) {
      // console.log(position);
      if (position > 100) this.fixed = true;
      else this.fixed = false;
    },
    async editLine(val, line) {
      // console.log(val);
      // console.log(line);
      try {
        //split lines into new objects if a new full stop detected:

        const newlines = compact(val.split("."));

        // console.log(newlines);
        // console.log(line);

        // console.log(this.record.transcription);

        const index = this.record.transcription.results.indexOf(line);
        // console.log("index", index);

        if (newlines.length == 1) line.alternatives[0].transcript = val;
        else {
          // console.log("new lines:");
          //remove the old obj:
          this.record.transcription.results.splice(index, 1);
          const codes = line.codes;

          //split into new lines:
          let i = 0;
          for (const nl of newlines) {
            const newitem = {
              alternatives: [{ transcript: `${nl.trim()}.` }],
              record: this.id,
            };
            if (codes) newitem.codes = codes;
            this.record.transcription.results.splice(index + i, 0, newitem);
            i++;
          }
        }

        // console.log(this.record.transcription.results);

        this.isDirty = true;
        // this.save();
        // await updateDoc(
        //   doc(db, `users/${this.user.email}/recordings/${this.id}`),
        //   {
        //     transcription: this.record.transcription,
        //   }
        // );
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      }
    },
    async done() {
      try {
        this.saving = true;
        await updateDoc(
          doc(db, `users/${this.user.email}/recordings/${this.id}`),
          {
            transcription: this.record.transcription,
            status: "coded",
          }
        );
        this.isDirty = false;
        this.$router.push("/");
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      } finally {
        this.saving = false;
      }
    },
    isActiveCode(line, code) {
      return line.codes?.includes(code.code);
    },
    addAllCodes(code) {
      let tmp = [...this.selection];

      for (let l of tmp) {
        // l.codes = [code.code];
        this.addCode(l, code);
      }
    },
    async save() {
      try {
        this.saving = true;
        console.log("start save");
        await new Promise((r) => setTimeout(r, 1000));

        // line.codes.push(code.code);
        updateDoc(doc(db, `users/${this.user.email}/recordings/${this.id}`), {
          transcription: this.record.transcription,
        });
        console.log("finish save");
        this.isDirty = false;
      } catch (e) {
        this.q.notify({
          type: "negative",
          message: e,
        });
      } finally {
        this.saving = false;
      }
    },
    async addCode(line, code) {
      delete line.selected;
      // console.log(`transcription.results.${line}.codes`);
      if (!line.codes) {
        line.codes = [];
      }

      if (code === null) {
        line.codes = [];
      } else {
        // if (line.codes.length == 1 && line.codes[0] == code.code)
        // line.codes = [];
        line.codes = [code.code];
      }

      // this.save();
      this.isDirty = true;
      // line.codes = toggleElement(line.codes, code.code);

      // console.log(line, code);
    },
    getLineColor(line) {
      //index of this code:
      if (this.codeBook.length) {
        if (line.codes && line.codes.length == 1) {
          //find the color of the first code:
          const col = find(this.codeBook, { code: line.codes[0] });
          if (col) {
            if (col.color === "") return "#bbb";
            return col.color;
          } else return "transparent";
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
  // user-select: "all";
  // cursor: text;

  // text-decoration-style: wavy;

  :hover {
    background-color: #f0f0f0;
    cursor: pointer;
  }

  .selected {
    background: yellow;
  }
}
</style>
