<template lang="pug">
q-page(padding)
  .text-h4.text-center Upload new recording
  q-form(@submit.prevent="upload" v-if="!uploading")
    .column.q-col-gutter-sm
      q-file(v-model="inputVal" label="Select File" filled)
      q-select(v-model="language" :options="languageOptions" label="Language" filled :rules="[val => !!val || 'Language is required']" emit-value map-options)
      q-input(v-model="who" label="Who" filled :rules="[val => !!val || 'Who is required']")
      q-date(v-model="when" label="When" filled :rules="[val => !!val || 'When is required']")
      q-btn(type="submit" label="Upload" color="primary" :disable="this.uploading || !inputVal")
  
  .row.justify-center
    .col-auto
      q-banner(v-if="uploading" text-color="white" class="q-mt-md").bg-positive.rounded-borders.text-white.text-center
        .text-body1 Uploading now...
        q-circular-progress.q-my-md(  
          :value="uploadProgress * 100"
          color="white"
          size="6em"
        )
        .text-body1 Do not close this page while uploading...
    
</template>

<script>
import { defineComponent } from "vue";

import { useCurrentUser } from "vuefire";
import { storage, db } from "src/boot/firebase"; // Assuming you have a Firebase storage setup
import { ref, uploadBytesResumable } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore"; // Importing dbRef for database operations

// const user = useCurrentUser()

export default defineComponent({
  name: "UploadPage",
  data() {
    return {
      inputVal: null,
      uploadProgress: 0,
      uploading: false,
      language: "",
      who: "",
      when: "",
      languageOptions: [
        { value: "en-US", label: "English" },
        { value: "es-ES", label: "Spanish" },
        { value: "fr-FR", label: "French" },
        { value: "ar-EG", label: "Arabic" },
        { value: "zh-CN", label: "Chinese" },
      ],
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

          const uploadRef = ref(
            storage,
            `recordings/${this.user.email}/${this.language}_${Date.now()}_${this.inputVal.name}`
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
          const docRef = collection(db, `users/${this.user.email}/recordings`);

          await addDoc(docRef, {
            language: this.language,
            who: this.who,
            when: this.when,
            filePath: uploadRef.fullPath,
            status: "uploaded",
            createdAt: new Date().valueOf(),
          });
          this.$router.push("/"); // Redirect to the dashboard or any other page
        } catch {
          alert("Error uploading file. Please try again.");
        }

        this.uploading = false;
      }
    },
  },
});
</script>
