<script setup>
import { defineProps, defineEmits } from "vue";
const props = defineProps({ block: Object });
const emit = defineEmits(["remove"]);
</script>
<template>
  <div class="block-audio">
    <input
      v-model="props.block.url_media"
      placeholder="Lien audio"
      style="width: 100%"
    />
    <button
      class="remove-block-btn"
      style="margin-left: auto"
      @click="
        () => {
          console.log('Suppression demandée pour bloc', props.block);
          emit('remove', props.block._id_block || props.block.id);
        }
      "
    >
      <span class="material-symbols-rounded">delete</span>
    </button>
    <div v-if="props.block.url_media" style="margin-top: 0.5rem">
      <audio :src="props.block.url_media" controls style="width: 100%" />
    </div>
  </div>
</template>
