<template>
  <div class="sidebar">
    <h2>Mes scénarios</h2>
    <div v-if="loading">Chargement…</div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>
      <ul class="scenario-list">
        <li
          v-for="s in scenarios"
          :key="s.id"
          :class="[
            'scenario-item',
            selectedScenario && selectedScenario.id === s.id ? 'active' : '',
            s.is_published ? 'published' : 'draft',
          ]"
          @click="$emit('selectScenario', s)"
        >
          <strong>{{ s.title_scenario }}</strong>
          <span
            class="scenario-status-badge"
            :class="s.is_published ? 'badge-published' : 'badge-draft'"
          >
            {{ s.is_published ? "Publié" : "Brouillon" }}
          </span>
        </li>
      </ul>
      <form
        @submit.prevent="$emit('createScenario', newTitle)"
        class="scenario-form"
      >
        <input v-model="newTitle" placeholder="Nouveau scénario" />
        <button type="submit">Créer</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
const props = defineProps({
  scenarios: Array,
  selectedScenario: Object,
  loading: Boolean,
  error: String,
});
const emit = defineEmits(["selectScenario", "createScenario"]);
const newTitle = ref("");
watch(
  () => props.selectedScenario,
  () => {
    newTitle.value = "";
  }
);
</script>

<style scoped>
.sidebar {
  background: #183a5a;
  padding: 2rem 1.5rem;
  border-right: 1px solid #22476b;
}
.scenario-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}
.scenario-item {
  padding: 0.7em 1em;
  border-radius: 0.5em;
  margin-bottom: 0.5em;
  cursor: pointer;
  background: #22476b;
  color: #e3e7f7;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.scenario-item.active {
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
}
.scenario-status-badge {
  font-size: 0.85em;
  padding: 0.2em 0.7em;
  border-radius: 0.5em;
  margin-left: 0.7em;
}
.badge-published {
  background: #42a5f5;
  color: #fff;
}
.badge-draft {
  background: #22476b;
  color: #e3e7f7;
}
.scenario-form {
  display: flex;
  gap: 0.7em;
  margin-top: 1em;
}
.scenario-form input {
  flex: 1;
  padding: 0.4em 0.8em;
  border-radius: 0.4em;
  border: 1px solid #22476b;
  background: #22476b;
  color: #e3e7f7;
}
.scenario-form input::placeholder {
  color: #90caf9;
}
.scenario-form button {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 0.4em;
  padding: 0.4em 1em;
  font-weight: 500;
  cursor: pointer;
}
.error {
  color: #f59e0b;
  margin-bottom: 1em;
}
</style>
