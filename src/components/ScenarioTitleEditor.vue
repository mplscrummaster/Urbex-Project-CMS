<template>
  <div class="scenario-title-row">
    <template v-if="editTitle">
      <input v-model="title" class="edit-title-input" />
      <button class="icon-btn" @click="$emit('save', title)" title="Valider">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M7 13.5l-3.5-3.5 1.41-1.41L7 10.67l7.09-7.09 1.41 1.41z"
            fill="#6366f1"
          />
        </svg>
      </button>
    </template>
    <template v-else>
      <h2>{{ title }}</h2>
      <button class="icon-btn" @click="$emit('edit')" title="Éditer le titre">
        <span class="material-symbols-rounded">edit</span>
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
const props = defineProps({
  title: String,
  editTitle: Boolean,
});
const emit = defineEmits(["edit", "save"]);
const title = ref(props.title);
watch(
  () => props.title,
  (val) => {
    title.value = val;
  }
);
</script>

<style scoped>
.scenario-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.edit-title-input {
  font-size: 1.3em;
  font-weight: 600;
  padding: 0.3em 0.7em;
  border-radius: 0.4em;
  border: 1px solid #42a5f5;
  margin-right: 0.5em;
  background: #22476b;
  color: #e3e7f7;
}
.edit-title-input::placeholder {
  color: #90caf9;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2em;
  border-radius: 0.3em;
  transition: background 0.2s;
  color: #42a5f5;
}
.icon-btn:hover {
  background: #22476b;
}
h2 {
  color: #e3e7f7;
  font-weight: 700;
}
</style>
