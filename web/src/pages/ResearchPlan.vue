<template lang="pug">
q-page(padding)
  .row.justify-center
    .col.col-md-5
      .text-h6.text-center.q-my-lg {{ $t('upload-your-research-plan-0') }}
      div.q-mt-md &nbsp;
      q-form(@submit.prevent="upload" v-if="!uploading")
        .column
          q-file(v-model="inputVal" :label="$t('select-file')" filled)
          //- q-select(v-model="language" :options="languageOptions" label="Language" filled :rules="[val => !!val || 'Language is required']" emit-value map-options)
          //- //- q-input(v-model="who" label="Who" filled :rules="[val => !!val || 'Who is required']")
          //- .col
          //-   q-field(:rules="[val => !!val || 'When is required']")
          //-     q-date(v-model="when" label="When" filled landscape)
          //- .col.text-right
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
    
</template>

<script>
import { defineComponent } from "vue";

import { useCurrentUser } from "vuefire";
import { storage, db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
import { ref, uploadBytesResumable } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore"; // Importing dbRef for database operations

// const user = useCurrentUser()

export default defineComponent({
  name: "UploadPage",
  data() {
    return {
      inputVal: null,
      uploadProgress: 0,
      uploading: false,
      // language: "",
      // who: "",
      // when: "",
      // languageOptions: [
      //   { value: "en-US", label: "English" },
      //   { value: "es-ES", label: "Spanish" },
      //   { value: "fr-FR", label: "French" },
      //   { value: "ar-EG", label: "Arabic" },
      //   { value: "zh-CN", label: "Chinese" },
      // ],
    };
  },
  setup() {
    const user = useCurrentUser();
    return { user };
  },
  methods: {
    async upload() {
      // const filename = `${this.inputVal.name}_${DateTime.now().toHTTP()}`;

      // console.log("uploading");

      if (this.inputVal) {
        this.uploading = true;
        try {
          // const uuid = await import("uuid");

          // console.log(state.user);
          const filename = `recordings/${this.user.email}/plans/${Date.now()}_${this.inputVal.name}`;
          const uploadRef = ref(storage, filename);

          const uploadResult = uploadBytesResumable(uploadRef, this.inputVal);

          uploadResult.on("state_changed", (snapshot) => {
            // console.log(snapshot);
            let progress = snapshot.bytesTransferred / snapshot.totalBytes;

            // let prog = progress + j / numtoupload;
            console.log(progress);
            this.uploadProgress = progress;
          });

          await uploadResult;

          // //on completion -- add record to database
          // const docRef = collection(db, `users/${this.user.email}/recordings`);

          await updateDoc(doc(db, `users/${this.user.email}`), {
            latestResearchPlan: filename,
          });
          this.$router.push("/"); // Redirect to the dashboard or any other page
        } catch (er) {
          console.error(er);
          alert(this.$t("error-uploading-file-please-try-again"));
        }

        this.uploading = false;
      }
    },
  },
});
</script>
