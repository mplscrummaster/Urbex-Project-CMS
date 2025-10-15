<template>
  <div class="scenarios-page twocol">
    <div class="sidebar">
      <h2>Mes scénarios</h2>
      <div v-if="store.loading">Chargement…</div>
      <div v-else>
        <div v-if="store.error" class="error">{{ store.error }}</div>
        <ul class="scenario-list">
          <li
            v-for="s in store.scenarios"
            :key="s.id"
            :class="[
              'scenario-item',
              store.selectedScenario && store.selectedScenario.id === s.id
                ? 'active'
                : '',
            ]"
            @click="selectScenario(s)"
          >
            <strong>{{ s.title_scenario }}</strong>
          </li>
        </ul>
        <form @submit.prevent="createScenario" class="scenario-form">
          <input v-model="newTitle" placeholder="Nouveau scénario" />
          <button type="submit">Créer</button>
        </form>
      </div>
    </div>
    <div class="main-content">
      <div v-if="store.detailsLoading">Chargement du détail…</div>
      <div v-else-if="store.detailsError" class="error">
        {{ store.detailsError }}
      </div>
      <div v-else-if="store.scenarioDetails">
        <div class="scenario-detail">
          <div class="scenario-title-row">
            <template v-if="editTitle">
              <input
                v-model="store.scenarioDetails.scenario.title_scenario"
                class="edit-title-input"
              />
              <button class="icon-btn" @click="saveTitle" title="Valider">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path
                    d="M7 13.5l-3.5-3.5 1.41-1.41L7 10.67l7.09-7.09 1.41 1.41z"
                    fill="#6366f1"
                  />
                </svg>
              </button>
            </template>
            <template v-else>
              <h2>{{ store.scenarioDetails.scenario.title_scenario }}</h2>
              <button
                class="icon-btn"
                @click="editTitle = true"
                title="Éditer le titre"
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path
                    d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                    fill="#6366f1"
                  />
                </svg>
              </button>
            </template>
          </div>
          <div class="scenario-global-infos">
            <h3>Communes liées</h3>
            <ul>
              <li v-for="commune in store.communes" :key="commune.id">
                {{ commune.name_fr }}
                <!-- Ajoute ici le bouton de suppression et la logique si besoin -->
              </li>
            </ul>
            <div v-if="store.communes.length < 3">
              <input
                v-model="newCommuneName"
                placeholder="Ajouter une commune…"
              />
              <button @click="addCommune" :disabled="!newCommuneName">
                Ajouter
              </button>
              <div v-if="communeError" class="error">{{ communeError }}</div>
            </div>
            <div v-else>
              <em>Maximum 3 communes liées.</em>
            </div>
          </div>
          <div class="collapsible-card">
            <div class="collapsible-header" @click="showIntro = !showIntro">
              <h3>Introduction</h3>
              <span>{{ showIntro ? "▲" : "▼" }}</span>
            </div>
            <div v-if="showIntro">
              <div
                v-for="block in store.scenarioDetails.introBlocks"
                :key="block.id"
                class="block-text"
              >
                <textarea
                  v-model="block.content_text"
                  rows="2"
                  style="width: 100%"
                />
              </div>
            </div>
          </div>
          <draggable
            v-model="store.missions"
            item-key="id"
            handle=".drag-handle"
            @end="onMissionOrderChange"
          >
            <template #item="{ element: mission, index: idx }">
              <div class="collapsible-card">
                <div
                  class="collapsible-header"
                  @click="mission._open = !mission._open"
                >
                  <span
                    class="drag-handle"
                    style="cursor: grab; margin-right: 0.7rem"
                    >≡</span
                  >
                  <h3>Mission {{ idx + 1 }} : {{ mission.title }}</h3>
                  <span>{{ mission._open ? "▲" : "▼" }}</span>
                </div>
                <div v-if="mission._open">
                  <div class="mission-block">
                    <div>
                      <strong>Nom :</strong> <input v-model="mission.title" />
                    </div>
                    <div>
                      <strong>Texte énigme :</strong>
                      <textarea
                        v-model="mission.riddle_text"
                        rows="2"
                        style="width: 100%"
                      />
                    </div>
                    <div>
                      <strong>Mot réponse :</strong>
                      <input v-model="mission.answer_word" />
                    </div>
                    <div>
                      <strong>Blocs de texte :</strong>
                      <div
                        v-for="block in mission.blocks"
                        :key="block.id"
                        class="block-text"
                      >
                        <textarea
                          v-model="block.content_text"
                          rows="2"
                          style="width: 100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
          <div class="collapsible-card">
            <div
              class="collapsible-header"
              @click="showConclusion = !showConclusion"
            >
              <h3>Conclusion</h3>
              <span>{{ showConclusion ? "▲" : "▼" }}</span>
            </div>
            <div v-if="showConclusion">
              <div
                v-for="block in store.scenarioDetails.outroBlocks"
                :key="block.id"
                class="block-text"
              >
                <textarea
                  v-model="block.content_text"
                  rows="2"
                  style="width: 100%"
                />
              </div>
            </div>
          </div>
          <p><strong>Prérequis & Progression :</strong></p>
          <pre>{{ store.scenarioDetails.progress }}</pre>
          <p><strong>Communes :</strong></p>
          <ul>
            <li v-for="commune in store.communes" :key="commune.id">
              {{ commune.name_fr }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else class="empty-detail">
        <p>Sélectionne un scénario dans la liste pour voir le détail.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useScenarioStore } from "@/src/stores/scenario";
import draggable from "vuedraggable";

const store = useScenarioStore();
const editTitle = ref(false);
const newTitle = ref("");
const newCommuneName = ref("");
const communeError = ref("");
const showIntro = ref(true);
const showConclusion = ref(false);

const user = ref(null);
const token = ref(null);
const isClientReady = ref(false);

onMounted(() => {
  const userStr = window.localStorage.getItem("user");
  if (userStr) {
    try {
      user.value = JSON.parse(userStr);
    } catch (e) {
      user.value = null;
    }
  }
  token.value = window.localStorage.getItem("token");
  isClientReady.value = true;
  store.fetchScenarios(user.value?.id, token.value);
});

function selectScenario(s) {
  store.selectScenario(s, token.value);
}

function createScenario() {
  store.createScenario(newTitle.value, user.value?.id, token.value);
  newTitle.value = "";
}

function onMissionOrderChange() {
  store.reorderMissions(store.missions);
}

// Ajoute ici la logique pour addCommune et removeCommune si tu veux les centraliser dans le store
</script>

<style scoped>
/* Ajoute ici tes styles spécifiques si besoin */
.collapsible-card {
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
}

.collapsible-header {
  background-color: #f7f7f9;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collapsible-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.collapsible-header span {
  font-size: 1.2rem;
}

.block-text {
  padding: 0.5rem 1rem;
  border-top: 1px solid #ddd;
}

.block-text textarea {
  width: 100%;
  border: none;
  resize: none;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background-color: #fff;
}

.mission-block {
  padding: 0.5rem 1rem;
  border-top: 1px solid #ddd;
}

.mission-block div {
  margin-bottom: 0.5rem;
}
</style>
