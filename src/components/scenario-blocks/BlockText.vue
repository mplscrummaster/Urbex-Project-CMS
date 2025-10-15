<script setup>
import { defineProps, defineEmits } from "vue";
const props = defineProps({ block: Object });
const emit = defineEmits(["remove"]);
</script>
<template>
  <div class="block-text">
    <textarea rows="2" style="width: 100%" v-model="props.block.content_text" />
    <button
      class="remove-block-btn"
      style="margin-left: auto"
      @click="emit('remove')"
    >
      <span class="material-symbols-rounded">delete</span>
    </button>
  </div>
</template>
