<script setup>
import { defineProps, defineEmits } from "vue";
const props = defineProps({ block: Object });
const emit = defineEmits(["remove"]);
</script>
<template>
  <div class="block-image">
    <input
      v-model="props.block.url_media"
      placeholder="Lien image"
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
      <img
        :src="props.block.url_media"
        style="max-width: 100%; max-height: 120px; border-radius: 0.25rem"
      />
    </div>
  </div>
</template>
