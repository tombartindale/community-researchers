<template lang="pug">
q-page(padding)
  .row.justify-center
    .col.col-md-6
      .text-h6.text-center.q-my-lg {{ $t('upload-new-interview') }}
      .text-h6.text-warning.text-center(v-if="email") Uploading on behalf of {{email}}
      div.q-mt-md &nbsp;
      q-form(@submit.prevent="upload" v-if="!uploading && !completed")
        .column.q-col-gutter-sm
          q-file(v-model="inputVal" :label="$t('which-file-to-upload')" filled accept="audio/*, video/*, .docx")
          .text-caption {{ $t('upload-any-recording-file') }}
          q-select(v-model="language" :options="languageOptions" :label="$t('what-language-was-the-interview-conducted-in')" filled :rules="[val => !!val || $t('language-is-required')]" emit-value map-options )
          q-input(v-model="who" :label="$t('who-did-you-interview')" filled :rules="[val => !!val || $t('who-is-required')]")
          .col
            q-input(:rules="[val => !!val || $t('when-is-required')]" v-model="when" readonly filled :label="$t('when-did-you-conduct-the-interview')")
              template(v-slot:append)
                q-icon(name="event").cursor-pointer
                  q-popup-proxy(cover)
                    q-date(v-model="when" :label="$t('when')" filled landscape)
                      .row.items-center.justify-end
                        q-btn(v-close-popup flat no-caps) {{ $t('close') }}
          .col.text-center
            q-btn.q-mt-md(type="submit" :label="$t('upload')" color="primary" :disable="this.uploading || !inputVal" no-caps size="lg")
      
      .row.justify-center
        .col-auto
          q-banner(v-if="uploading" text-color="white" class="q-mt-md").bg-positive.rounded-borders.text-white.text-center
            .text-body1 {{ $t('uploading-now') }}
            q-circular-progress.q-my-md(  
              :value="uploadProgress * 100"
              color="white"
              size="6em"
            )
            .text-body1 {{ $t('do-not-close-this-page-while-uploading') }}
      .row.justify-center(v-if="completed")
        .col-auto.text-center
          q-banner( text-color="white" class="q-mt-md").bg-positive.rounded-borders.text-white.text-center
            .text-body1 {{ $t('upload-complete') }}
            .text-center
              q-icon.q-my-md(name="check" size="lg")
            .text-body1 {{$t('waiting-for-automatic-transcription')}}
          q-btn(to="/" color="primary" size="lg" no-caps).q-mt-lg {{ $t('back-to-your-task-list') }} 

    
</template>

<script>
import { defineComponent } from "vue";

import { useCurrentUser } from "vuefire";
import { storage, db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
import { ref, uploadBytesResumable } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore"; // Importing dbRef for database operations

import { useQuasar } from "quasar";
// const user = useCurrentUser()

export default defineComponent({
  name: "UploadPage",
  props: ["email"],
  data() {
    return {
      inputVal: null,
      uploadProgress: 0,
      uploading: false,
      language: "",
      who: "",
      when: "",
      completed: false,
      languageOptions: [
        { value: "en-US", label: this.$t("english") },
        { value: "ar-EG", label: this.$t("arabic") },
        { value: "fr-FR", label: this.$t("french") },
        { value: "zh-CN", label: this.$t("chinese") },
        { value: "es-ES", label: this.$t("spanish") },
      ],
    };
  },
  setup() {
    const user = useCurrentUser();
    const q = useQuasar();
    return { user, q };
  },
  methods: {
    async upload() {
      if (this.inputVal) {
        this.uploading = true;
        try {
          const theRealUser = this.email || this.user.email;

          const uploadRef = ref(
            storage,
            `recordings/${theRealUser}/${this.language}_${Date.now()}_${this.inputVal.name}`
          );

          const uploadResult = uploadBytesResumable(uploadRef, this.inputVal);

          uploadResult.on("state_changed", (snapshot) => {
            // console.log(snapshot);
            let progress = snapshot.bytesTransferred / snapshot.totalBytes;

            // let prog = progress + j / numtoupload;
            console.log(progress);
            this.uploadProgress = progress;
          });

          await uploadResult;

          //on completion -- add record to database
          const docRef = collection(db, `users/${theRealUser}/recordings`);

          await addDoc(docRef, {
            language: this.language,
            who: this.who,
            when: this.when,
            filePath: uploadRef.fullPath,
            status: "uploaded",
            createdAt: new Date().valueOf(),
          });
          this.completed = true;
          // this.$router.push("/"); // Redirect to the dashboard or any other page
        } catch (e) {
          console.error(e);
          this.q.notify({
            type: "negative",
            message: this.$t("error-uploading-file-please-try-again"),
          });

          // alert(this.$t("error-uploading-file-please-try-again"));
        }

        this.uploading = false;
      }
    },
  },
});
</script>
