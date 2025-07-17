<template lang="pug">
q-card(class="list-group-item" :bordered="!simple" flat).text-left.q-pa-none
  //- div {{clusters}}
  q-card-section(horizontal)
    q-card-section(side v-if="highlight")
      q-checkbox(:model-value="element.highlighted || false" @update:model-value="updateHigh(element,$event)")  
    q-card-section.q-pl-sm.q-pb-none.q-pr-sm.q-pt-sm.transcription.text-secondary.q-mb-sm
      .scroll-me {{ element.alternatives[0].transcript }}
  q-separator(inset v-if="(!simple || (simple && clusters.length)) && !cluster").q-mt-sm
  q-card-actions(align="between" v-if="clusters.length")
    //- div {{element}}
    div
      span(v-for="code of element.codes" :style="{'color':getCode(code)?.color}") {{getCode(code)?.name[locale]}}&nbsp;
    q-btn(icon-right="add" flat dense no-caps ) {{(element.cluster)?getName(element.cluster)?.title:''}}
      q-menu()
        q-list(separator)
          q-item(v-for="cluster in clusters" :key="cluster.id" @click="element.cluster = cluster.id" clickable v-close-popup :active="cluster.id == element.cluster")
            q-item-section
              q-item-label {{cluster.title}}
          q-item(@click="delete element.cluster" clickable v-close-popup)
            q-item-section
              q-item-label() {{ $t('remove-from-cluster') }}
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
  ],
  setup() {
    const q = useQuasar();
    const { t } = useI18n();
    return { q, t };
  },
  methods: {
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

<style lang="scss">
.scroll-me {
  max-height: 200px;
  overflow: auto;
}
</style>
