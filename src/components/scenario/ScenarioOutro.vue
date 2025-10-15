<script setup>
import draggable from "vuedraggable";
import { ref, watch } from "vue";
import BlockText from "@/src/components/scenario-blocks/BlockText.vue";
import BlockImage from "@/src/components/scenario-blocks/BlockImage.vue";
import BlockVideo from "@/src/components/scenario-blocks/BlockVideo.vue";
import BlockAudio from "@/src/components/scenario-blocks/BlockAudio.vue";

/**
 * Props du composant ScenarioOutro
 * @property {Array} blocks - Liste des blocs de conclusion
 * @property {Boolean} showOutro - Affichage de la section conclusion
 * @property {Boolean} showOutroAddMenu - Affichage du menu d'ajout de bloc
 */
const props = defineProps({
  blocks: Array,
  showOutro: Boolean,
  showOutroAddMenu: Boolean,
});

/**
 * Événements émis par ScenarioOutro
 * @event toggleOutro - Ouverture/fermeture de la conclusion
 * @event addBlock - Ajout d'un bloc
 * @event removeBlock - Suppression d'un bloc
 * @event toggleAddMenu - Ouverture/fermeture du menu d'ajout
 * @event update:blocks - Mise à jour de la liste des blocs
 */
const emit = defineEmits([
  "toggleOutro",
  "addBlock",
  "removeBlock",
  "toggleAddMenu",
  "update:blocks",
]);

const localBlocks = ref([...props.blocks]);
watch(
  () => props.blocks,
  (newVal) => {
    localBlocks.value = [...newVal];
  }
);

function onBlocksReorder() {
  emit("update:blocks", localBlocks.value);
}

function removeBlock(blockId) {
  localBlocks.value = localBlocks.value.filter((b) => b.id !== blockId);
  emit("update:blocks", localBlocks.value);
  emit("removeBlock", blockId);
}

function addBlock(type) {
  const newBlock = { id: Date.now(), type };
  localBlocks.value.push(newBlock);
  emit("update:blocks", localBlocks.value);
  emit("addBlock", type);
}

// Mapping des types de blocs vers leurs composants
const blockComponentMap = {
  text: BlockText,
  image: BlockImage,
  video: BlockVideo,
  audio: BlockAudio,
};

function getBlockComponent(block) {
  return blockComponentMap[block.type] || BlockText;
}
</script>
<template>
  <div class="collapsible-card">
    <div class="collapsible-header" @click="emit('toggleOutro')">
      <h3>Conclusion</h3>
      <span class="material-symbols-rounded">{{
        props.showOutro ? "expand_less" : "expand_more"
      }}</span>
    </div>
    <div v-if="props.showOutro">
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
        <div v-if="props.showOutroAddMenu" class="add-block-menu">
          <button @click="emit('addBlock', 'text')">Texte</button>
          <button @click="emit('addBlock', 'image')">Image (lien)</button>
          <button @click="emit('addBlock', 'video')">Vidéo (lien)</button>
          <button @click="emit('addBlock', 'audio')">Audio (lien)</button>
        </div>
      </div>
    </div>
  </div>
</template>
