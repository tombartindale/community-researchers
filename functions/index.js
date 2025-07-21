/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";
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
import reader from "any-text";
import flatten from "lodash/flatten.js";
import find from "lodash/find.js";
import { convertMarkdownToDocx } from "./md-to-docx-main/dist/index.js";
import * as XLSX from "xlsx/xlsx.mjs";
// import * as fs from "fs";
// Set internal fs instance

// import { Storage } from "@google-cloud/storage";
// const storage = new Storage();
// import filter from "lodash/filter.js";

const region = "europe-west1";

export const convert_file_1 = onDocumentCreated(
  {
    memory: "4GiB",
    document: "users/{email}/recordings/{recordingId}",
    region: region,
  },

  async (event) => {
    const record = event.data.data();
    const fileExt = record.filePath.split(".").pop();
    console.log("New recording created:", event.data.data());
    try {
      if (fileExt === "docx") {
        console.log("docx convert");
        const localFile = `${os.tmpdir()}/${
          event.params.recordingId
        }.${fileExt}`;

        const bucket = getStorage().bucket();
        await bucket.file(record.filePath).download({
          destination: localFile,
        });

        //get contents of doc
        const text = await reader.getText(localFile);

        //split by sentence:
        // console.log(text);

        //create transcption object:
        const lines = text.split("\n");
        let sentences = lines.map((l) => {
          return l.split(".");
        });

        console.log(sentences);

        sentences = flatten(sentences);

        console.log(sentences);

        let transcription = {
          results: [],
        };
        for (const line of sentences) {
          transcription.results.push({
            alternatives: [
              {
                transcript: line.trim(),
              },
            ],
          });
        }

        await event.data.ref.update({
          status: "transcribed",
          transcription: transcription,
        });

        // const transcption = lines.map((f)=>{})
      } else {
        console.log("Audio convert");
        // const inputPath = `${os.tmpdir()}/${event.params.recordingId}`;
        const outputPath = `recordings/${event.params.email}/audio/${record.language}_${event.params.recordingId}.wav`;
        const outputFile = `${os.tmpdir()}/output.wav`;

        // fs.ensureDirSync(inputPath);

        // console.log("Input path:", inputPath);

        //get the file from storage into tmp:

        const localFile = `${os.tmpdir()}/${
          event.params.recordingId
        }.${fileExt}`;

        const bucket = getStorage().bucket();
        await bucket.file(record.filePath).download({
          destination: localFile,
        });

        // const info = fs.statSync(localFile);

        // console.log(info);

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
      }
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
export const transcribe2 = onObjectFinalized(
  { region: region },
  async (event) => {
    //if its a transcription file
    if (
      event.data.name.startsWith(`recordings`) &&
      event.data.name.indexOf("transcriptions/") > -1 &&
      event.data.name.endsWith(".json")
    ) {
      const folders = event.data.name.split("/");
      const email = folders[1];
      const id = folders.pop().replace(".json", "").split("_")[1];

      console.log(
        "Transcription file detected for email:",
        email,
        "and id:",
        id
      );

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
          model: languageCode != "zh-CN" ? "latest_long" : "default",
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
        //   console.log("Transcription Started:", outputPath);
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
  }
);

export const getClustersForRegion = onCall(
  { region: region },
  async (request) => {
    if (request.auth) {
      // return data:

      //get clusters from this region:
      try {
        const clusters = await getFirestore()
          .collectionGroup("clusters")
          .where("region", "==", request.data.region)
          .get();

        //get all records :
        const records = await getFirestore()
          .collectionGroup("recordings")
          .get();

        let output = [];

        // console.log(clusters.docs);

        for (let cluster of clusters.docs) {
          //for each cluster, get the records for that person:
          // console.log(records.docs);
          // const foruser = filter(records.docs, (d) => {
          //   console.log(d.ref.parent.parent.id);
          //   return d.ref.parent.parent.id == cluster.ref.parent.parent.id;
          // });

          let outt = cluster.data();
          outt.quotes = [];

          for (const recording of records.docs) {
            if (
              recording.data().transcription &&
              recording.data().transcription.results
            )
              for (const quote of recording.data().transcription?.results) {
                console.log(quote);

                if (
                  quote.codes?.includes(cluster.data().code) &&
                  quote.highlighted
                )
                  outt.quotes.push(quote);
              }

            // console.log(foruser);
          }

          output.push(outt);
        }

        return output;
      } catch (e) {
        console.log(e);
        throw e;
      }
    } else {
      return [];
    }
  }
);

export const startExport = onCall({ region: region }, async (request) => {
  if (request.auth) {
    console.log("Starting Export");
    const [clusters, records, regions, users, codebook_db] = await Promise.all([
      getFirestore().collectionGroup("clusters").get(),
      getFirestore().collectionGroup("recordings").get(),
      getFirestore().collection("regions").get(),
      getFirestore().collection("users").get(),
      getFirestore().collection("codebook").get(),
    ]);

    let output = [];

    //for each region:
    for (let region of regions.docs) {
      let reg_out = {
        name: region.id,
        summary: region.data().description,
        clusters: [],
        recordings: [],
        users: [],
      };

      //users for this region
      for (const user of users.docs) {
        if (user.data().region == region.id) reg_out.users.push(user.id);
      }

      console.log(reg_out.users);

      //recordings from users from this region
      for (const recording of records.docs) {
        // console.log(recording.ref.parent.parent.id);
        if (reg_out.users.includes(recording.ref.parent.parent.id))
          reg_out.recordings.push({
            ...recording.data(),
            researcher: recording.ref.parent.parent.id,
          });
      }

      //for each cluster
      for (let cluster of clusters.docs) {
        let outt = cluster.data();

        if (outt.region === region.id) {
          outt.id = cluster.id;
          outt.code = cluster.data().code;
          outt.quotes = [];

          //for each recording:
          for (const recording of records.docs) {
            if (
              recording.data().transcription &&
              recording.data().transcription.results
            )
              for (const quote of recording.data().transcription.results) {
                // console.log(quote);

                if (
                  quote.codes?.includes(cluster.data().code) &&
                  quote.highlighted
                )
                  outt.quotes.push(quote);
              }

            // console.log(foruser);
          }

          // output.push(outt);
          reg_out.clusters.push(outt);
        }
      }

      output.push(reg_out);
    }

    // console.log(output);

    //MARKDOWN:s
    let markdown = `# Community Research Analysis\n${new Date().toUTCString()}\n\\pagebreak\n[TOC]\n\\pagebreak\n`;

    //create markdown:

    for (const region of output) {
      markdown += `# ${region.name}\n`;

      markdown += `Contributions by `;
      // for (const user of region.users) {
      markdown += `${region.users.join(", ")}`;
      // }

      markdown += `\n`;
      //summary
      markdown += `## Summary\n ${region.summary}\n`;

      //clusters:
      markdown += `## Clusters\n`;
      for (const cluster of region.clusters) {
        markdown += `### ${cluster.title}\n`;
        //meta:
        markdown += `${cluster.description}\n\n`;
        markdown += `${cluster.learn}\n\n`;
        // markdown += `${cluster.questions}\n`;
        //quotes:
        for (const quote of cluster.quotes) {
          markdown += `> ${
            quote.alternatives[0].transcript
          } [${quote.codes.join(",")}]\n\n`;
        }
      }

      //recordings:
      markdown += `## Interviews\n`;
      for (const recording of region.recordings) {
        markdown += `### ${recording.who} on ${recording.when}\n`;
        markdown += ``;

        if (recording.transcription && recording.transcription.results)
          for (const line of recording.transcription.results) {
            if (line.codes)
              markdown += `**${
                line.alternatives[0].transcript
              }.** *[${line.codes.join(",")}]* `;
            else markdown += `${line.alternatives[0].transcript}. `;
          }
        markdown += `\n`;
      }

      markdown += `\n\\pagebreak\n`;
    }

    const docx = await convertMarkdownToDocx(markdown);

    //XLSX:
    const rows = [];
    const clusters_data = [];
    const codebook = [];

    for (const code of codebook_db.docs) {
      codebook.push({
        code: code.data().code,
        description: code.data().description.en,
        name: code.data().name.en,
      });
    }

    for (const region of output) {
      // console.log(region);

      //for each recording:
      //if its coded, push it
      for (const recording of region.recordings) {
        //for each transcription line:
        // console.log(recording);
        if (recording.transcription && recording.transcription.results)
          for (const line of recording.transcription.results) {
            // console.log(line);

            //get cluster (assumes limit of 1 code per line):

            if (line.codes) {
              let row = {};
              // console.log(line.codes[0]);

              // console.log(region.clusters);

              const clus = find(region.clusters, { code: line.codes[0] })?.id;
              console.log(clus);
              row.region = region.name;
              row.content = line.alternatives[0].transcript;
              row.codes = line.codes.join(",");
              row.highlighted = line?.highlighted || false;
              row.researcher = recording.researcher;
              row.cluster = `${recording.researcher}_${clus}`;
              row.who = recording.who;
              row.when = recording.when;
              row.language = recording.language;

              rows.push(row);
            }
          }
      }

      for (const cluster of region.clusters) {
        clusters_data.push({
          region: cluster.region,
          researcher: cluster.parent,
          title: cluster.title,
          // description: cluster.description,
          lessons: cluster.learn,
          code: cluster.code,
          id: `${cluster.parent}_${cluster.id}`,
        });
      }

      // markdown += `# ${region.name}\n`;

      // markdown += `Contributions by `;
      // // for (const user of region.users) {
      // markdown += `${region.users.join(", ")}`;
      // // }

      // markdown += `\n`;
      // //summary
      // markdown += `## Summary\n ${region.summary}\n`;

      //clusters:
      // markdown += `## Clusters\n`;
      // for (const cluster of region.clusters) {
      //   markdown += `### ${cluster.title}\n`;
      //   //meta:
      //   markdown += `${cluster.description}\n\n`;
      //   markdown += `${cluster.learn}\n\n`;
      //   // markdown += `${cluster.questions}\n`;
      //   //quotes:
      //   for (const quote of cluster.quotes) {
      //     markdown += `> ${
      //       quote.alternatives[0].transcript
      //     } [${quote.codes.join(",")}]\n\n`;
      //   }
      // }
    } // for each region

    // console.log(rows);

    // XLSX.set_fs(fs);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Codes");
    const worksheet1 = XLSX.utils.json_to_sheet(clusters_data);
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Clusters");
    const worksheet2 = XLSX.utils.json_to_sheet(codebook);
    XLSX.utils.book_append_sheet(workbook, worksheet2, "Codebook");

    const excel = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    await Promise.all([
      getStorage().bucket().file(`exports/latestExport.xlsx`).save(excel),
      getStorage()
        .bucket()
        .file(`exports/latestExport.docx`)
        .save(docx.stream()),
      getStorage().bucket().file(`exports/latestExport.md`).save(markdown),
      getStorage()
        .bucket()
        .file(`exports/latestExport.json`)
        .save(JSON.stringify(output)),
    ]);
  }
});
