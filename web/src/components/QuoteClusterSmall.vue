<template lang="pug">
div.q-pa-none
  .text-secondary.text-tiny.text-left.ellipsis-2-lines {{ element.alternatives[0].transcript }}
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
  max-height: 233px;
  // background-color: red;
  overflow: auto;
}
</style>
