/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
import { initializeApp } from "firebase-admin/app";
initializeApp();
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
// import speech from "@google-cloud/speech";
// const client = new speech.SpeechClient();
import { v1p1beta1 } from "@google-cloud/speech";
const { SpeechClient } = v1p1beta1;
import ffmpeg from "fluent-ffmpeg";
import os from "os";
import fs from "fs";

//TODO: make them long running with more memory and timeout
export const convertfile = onDocumentCreated(
  {
    memory: "4GiB",
    document: "users/{email}/recordings/{recordingId}",
  },

  async (event) => {
    console.log("New recording created:", event.data.data());
    const record = event.data.data();

    // const inputPath = `${os.tmpdir()}/${event.params.recordingId}`;
    const outputPath = `recordings/${event.params.email}/audio/${record.language}_${event.params.recordingId}.wav`;
    const outputFile = `${os.tmpdir()}/output.wav`;

    // fs.ensureDirSync(inputPath);

    // console.log("Input path:", inputPath);

    //get the file from storage into tmp:
    const fileExt = record.filePath.split(".").pop();
    const localFile = `${os.tmpdir()}/${event.params.recordingId}.${fileExt}`;

    const bucket = getStorage().bucket();
    await bucket.file(record.filePath).download({
      destination: localFile,
    });

    const info = fs.statSync(localFile);

    console.log(info);

    try {
      // -acodec pcm_s16le -ac 1 -ar 16000
      await new Promise((resolve, reject) => {
        ffmpeg(localFile)
          .audioChannels(1)
          .audioFrequency(16000)
          .audioCodec("pcm_s16le")
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            reject(err);
          })
          .on("start", (commandLine) => {
            console.log("FFmpeg command:", commandLine);
          })
          // .on("progress", (progress) => {
          //   console.log(`FFmpeg progress: ${progress.percent}%`);
          // })
          .on("end", () => {
            console.log("FFmpeg conversion completed successfully");
            resolve();
            // res.sendFile("/tmp/mini.mp4");
          })
          .output(outputFile)
          .run();
      });

      console.log("FFmpeg conversion completed");

      const info2 = fs.statSync(outputFile);

      console.log(info2);

      await bucket.upload(outputFile, {
        destination: outputPath,
      });

      //   await bucket.file(outputPath).save(outputFile, {
      //     metadata: {
      //       contentType: "audio/wav",
      //     },
      //   });
      await event.data.ref.update({
        status: "converted",
      });
    } catch (error) {
      console.error("Error during FFmpeg conversion:", error);
      await event.data.ref.update({
        status: "error",
        error: error.message,
      });
    }
  }
);

//TODO: make them long running:
export const transcribe = onObjectFinalized(async (event) => {
  //if its a transcription file
  if (
    event.data.name.startsWith(`recordings`) &&
    event.data.name.indexOf("transcriptions/") > -1 &&
    event.data.name.endsWith(".json")
  ) {
    const folders = event.data.name.split("/");
    const email = folders[1];
    const id = folders.pop().replace(".json", "").split("_")[1];

    console.log("Transcription file detected for email:", email, "and id:", id);

    // const theFile = await getStorage().file(event.data.name).download();

    const bucket = getStorage().bucket();
    const theFile = await bucket.file(event.data.name).download();

    const doc = getFirestore().doc(`users/${email}/recordings/${id}`);
    await doc.update({
      status: "transcribed",
      transcription: JSON.parse(theFile),
    });
  }

  //if its an audio file needing to be transcribed
  if (
    event.data.name.startsWith(`recordings`) &&
    event.data.name.indexOf("audio/") > -1 &&
    event.data.name.endsWith(".wav")
  ) {
    try {
      const languageCode = event.data.name.split("_")[0].split("audio/")[1];

      console.log("languageCode:", languageCode);

      const config = {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: languageCode,
        model: "latest_long",
      };

      const audio = {
        uri: `gs://${event.data.bucket}/${event.data.name}`,
        //   uri: "gs://community-researchers.firebasestorage.app/recordings/tom@bartindale.com/audio/en_5FzvfzwlyuJ6dRmRj64u.wav",
      };
      const outputname = event.data.name
        .replace(".wav", ".json")
        .replace("audio/", "transcriptions/");
      console.log("Output name:", outputname);

      // console.log("Transcribing audio file:", event.data.name);
      console.log("Audio URI:", audio.uri);

      //V1

      const request = {
        config: config,
        audio: audio,
        outputConfig: {
          gcsUri: `gs://${event.data.bucket}/${outputname}`,
        },
      };
      // // Detects speech in the audio file. This creates a recognition job that you
      // // can wait for now, or get its result later.
      // const [operation] = await client.longRunningRecognize(request);
      // // Get a Promise representation of the final result of the job
      // const [response] = await operation.promise();

      //V2
      const speechClient = new SpeechClient();
      // const response = await speechClient.getRecognizer({name:'projects/{project}/locations/{location}/recognizers/{recognizer}'});

      // const config = RecognitionConfig(
      //   (auto_decoding_config = cloud_speech.AutoDetectDecodingConfig()),
      //   (language_codes = ["en-US"]),
      //   (model = "long")
      // );

      // const config = RecognitionConfig({
      //   auto_decoding_config : AutoDetectDecodingConfig(),
      //   language_codes : ["en-US"],
      //   model : "long"
      // );

      // request = cloud_speech.RecognizeRequest(
      //   (recognizer = `projects/${process.env.PROJECT_ID}/locations/global/recognizers/_`),
      //   (config = config),
      //   (content = audio_content)
      // );

      // const config = {
      //   encoding: "LINEAR16",
      //   sampleRateHertz: 16000,
      //   languageCode: languageCode,
      //   model: "long",
      //   useEnhanced: true,
      // };

      // console.log(process.env);

      // const request = {
      //   recognizer: `projects/905414776864/locations/global/recognizers/_`,
      //   config: config,
      //   audio: audio,
      // };

      // const [response] = await speechClient.recognize(request);
      // console.log(response);

      const [operation] = await speechClient.longRunningRecognize(request);
      console.log("Transcription Started:", outputPath);
    } catch (error) {
      console.error("Error during transcription:", error);
      const folders = event.data.name.split("/");
      const email = folders[1];
      const id = folders.pop().replace(".wav", "").split("_")[1];

      const doc = getFirestore().doc(`users/${email}/recordings/${id}`);
      await doc.update({
        status: "error",
        error: error.message,
      });
    }
    // // Get a Promise representation of the final result of the job
    //   const [response] = await operation.promise();
  }
});
