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
          <button
            class="delete-scenario-btn"
            @click.stop="$emit('deleteScenario', s)"
            title="Supprimer le scénario"
            style="
              background: none;
              border: none;
              color: #e53935;
              cursor: pointer;
              margin-left: 0.5em;
            "
          >
            <span class="material-symbols-rounded">delete</span>
          </button>
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

/**
 * Props du composant ScenarioListSidebar
 * @property {Array} scenarios - Liste des scénarios à afficher
 * @property {Object} selectedScenario - Scénario actuellement sélectionné
 * @property {Boolean} loading - Indique si les scénarios sont en cours de chargement
 * @property {String} error - Message d'erreur éventuel
 */
const props = defineProps({
  scenarios: Array,
  selectedScenario: Object,
  loading: Boolean,
  error: String,
});

/**
 * Événements émis par le composant
 * @event selectScenario - Sélection d'un scénario
 * @event createScenario - Création d'un nouveau scénario
 */
const emit = defineEmits(["selectScenario", "createScenario"]);
const newTitle = ref("");
watch(
  () => props.selectedScenario,
  () => {
    newTitle.value = "";
  }
);
</script>

<!-- Styles locaux supprimés, sidebar.scss utilisé -->
<style scoped>
@import "@/src/styles/components/sidebar.scss";
</style>
