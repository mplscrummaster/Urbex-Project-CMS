<script setup>
import draggable from "vuedraggable";
import { ref } from "vue";
import BlockText from "@/src/components/scenario-blocks/BlockText.vue";
import BlockImage from "@/src/components/scenario-blocks/BlockImage.vue";
import BlockVideo from "@/src/components/scenario-blocks/BlockVideo.vue";
import BlockAudio from "@/src/components/scenario-blocks/BlockAudio.vue";

import { computed } from "vue";
const props = defineProps({
  blocks: Array,
  showIntro: Boolean,
  showIntroAddMenu: Boolean,
});
const emit = defineEmits([
  "toggleIntro",
  "addBlock",
  "removeBlock",
  "toggleAddMenu",
  "update:blocks",
]);

// Modèle local pour le drag and drop
const localBlocks = ref([...props.blocks]);
watch(
  () => props.blocks,
  (newVal) => {
    localBlocks.value = [...newVal];
  }
);

function onBlocksReorder(e) {
  emit("update:blocks", localBlocks.value);
}

function getBlockComponent(block) {
  switch (block.type) {
    case "text":
      return BlockText;
    case "image":
      return BlockImage;
    case "video":
      return BlockVideo;
    case "audio":
      return BlockAudio;
    default:
      return BlockText;
  }
}
</script>
<template>
  <div class="collapsible-card">
    <div class="collapsible-header" @click="emit('toggleIntro')">
      <h3>Introduction</h3>
      <span class="material-symbols-rounded">{{
        props.showIntro ? "expand_less" : "expand_more"
      }}</span>
    </div>
    <div v-if="props.showIntro">
      <div><strong>Blocs de contenu :</strong></div>
      <draggable
        v-model="localBlocks"
        item-key="id"
        handle=".block-drag-handle"
        @end="onBlocksReorder"
      >
        <template #item="{ element: block }">
          <div
            class="block-item"
            style="display: flex; align-items: center; gap: 0.5rem"
          >
            <span
              class="block-drag-handle material-symbols-rounded"
              style="cursor: grab"
              >drag_indicator</span
            >
            <component
              :is="getBlockComponent(block)"
              :block="block"
              @remove="emit('removeBlock', $event)"
            />
          </div>
        </template>
      </draggable>
      <div class="add-block-row">
        <button class="add-block-btn" @click="emit('toggleAddMenu')">+</button>
        <div v-if="props.showIntroAddMenu" class="add-block-menu">
          <button @click="emit('addBlock', 'text')">Texte</button>
          <button @click="emit('addBlock', 'image')">Image (lien)</button>
          <button @click="emit('addBlock', 'video')">Vidéo (lien)</button>
          <button @click="emit('addBlock', 'audio')">Audio (lien)</button>
        </div>
      </div>
    </div>
  </div>
</template>
