<template lang="pug">
div(class="list-group-item").q-pa-none.full-height
  //- div {{clusters}}
  //- q-card-section(horizontal)
    //- q-card-section(side v-if="highlight")
      //- q-checkbox(:model-value="element.highlighted || false" @update:model-value="updateHigh(element,$event)")  
    q-card-section
  .column.fit
    .col
      .q-pl-sm.q-pr-sm.text-secondary.text-body1.q-mb-none.fit
        .scroll-me {{ element.alternatives[0].transcript }}
      //- q-separator(inset v-if="(!simple || (simple && clusters.length)) && !cluster").q-mt-sm
      //- .row
        //- div {{element}}
    //- .col-auto
    //-   span(v-for="code of element.codes" :style="{'color':getCode(code)?.color}") {{getCode(code)?.name[locale]}}&nbsp;
    .col-auto.text-smallish Put this quote in a cluster? 
    .col-auto
      //- div {{element.cluster}}
      //- q-btn-toggle(v-model="element.cluster" :options="clusterOptions" clearable no-caps outline)  
      .row.justify-between
        .col-auto(v-for="(cluster,index) of clusters" @click="updateCluster(element,index)")
          q-btn(icon="arrow_downward" flat size="lg" :color="(index == element.cluster)?'primary':''" :loading="saving")
      //- q-btn(@click="delete element.cluster" clickable v-close-popup) {{ $t('remove-from-cluster') }}
</template>

<script>
import { defineComponent } from "vue";
import find from "lodash/find";
import filter from "lodash/filter";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "ErrorNotFound",
  props: [
    "element",
    "codeBook",
    "clusters",
    "locale",
    "highlight",
    "simple",
    "cluster",
    "saving",
  ],
  setup() {
    const q = useQuasar();
    const { t } = useI18n();
    return { q, t };
  },
  computed: {
    clusterOptions() {
      return this.clusters.map((c, index) => {
        return {
          value: index,
          label: c.title,
        };
      });
    },
  },
  methods: {
    updateCluster(element, cluster) {
      if (element.cluster === cluster.toString()) delete element.cluster;
      else element.cluster = cluster.toString();
    },
    updateHigh(element, event) {
      const count = filter(this.cluster.quotes, { highlighted: true });
      console.log(count);
      if (event == false) element.highlighted = false;
      else if (count.length < 3) element.highlighted = true;
      else
        this.q.notify({
          type: "negative",
          message: this.t("select-a-maximum-of-3-quotes"),
        });
    },
    // updateCheck(val) {
    // console.log(val);
    // if (val) this.element.highlighted = true;
    // else this.element.highlighted = false;
    // (element.highlighted==true)?element.highlighted=false:element.highlight=true
    // },
    getCode(code) {
      return find(this.codeBook, { code: code });
    },
    getName(cluster) {
      // console.log(this.clusters);
      return find(this.clusters, { id: "" + cluster });
    },
  },
  // watch: {
  //   "element.cluster"() {
  //     // console.log(this.element.cluster);
  //     // this.$emit("cluster", this.element, this.element.cluster);
  //   },
  // },
});
</script>

<style lang="scss" scoped>
.scroll-me {
  max-height: 183px;
  // background-color: red;
  overflow: auto;
}
</style>
