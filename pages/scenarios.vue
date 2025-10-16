<template>
  <div class="scenarios-page twocol">
    <ScenarioListSidebar
      :scenarios="store.scenarios"
      :selectedScenario="store.selectedScenario"
      :loading="store.loading"
      :error="store.error"
      @selectScenario="selectScenario"
      @createScenario="
        (title) => {
          newTitle = title;
          createScenario();
        }
      "
      @deleteScenario="deleteScenario"
    />
    <div class="main-content">
      <div v-if="store.detailsLoading">Chargement du détail…</div>
      <div v-else-if="store.detailsError" class="error">
        {{ store.detailsError }}
      </div>
      <div v-else-if="store.scenarioDetails">
        <div class="scenario-detail">
          <ScenarioTitleEditor
            :title="store.scenarioDetails.title_scenario"
            :editTitle="editTitle"
            @edit="editTitle = true"
            @save="
              (newTitle) => {
                store.scenarioDetails.title_scenario = newTitle;
                saveTitle();
              }
            "
          />
          <CommuneSelector
            :communes="store.communes"
            :communeShapes="communeShapes"
            :communeError="store.communeError"
            :maxCommunes="3"
            :newCommuneName="newCommuneName"
            @update:newCommuneName="(val) => (newCommuneName = val)"
            @addCommune="
              (name) => {
                store.addCommune(name, communeShapes);
                updatePolygonStyles(store);
              }
            "
            @removeCommune="
              (id) => {
                store.removeCommune(id);
                updatePolygonStyles(store);
              }
            "
            @toggleCommuneSelection="
              (id) => {
                toggleCommuneSelection(id);
                updatePolygonStyles(store);
              }
            "
            @polygonReady="
              (id, layer) => {
                setPolygonLayer(id, layer);
                updatePolygonStyles(store);
              }
            "
          />
          <ScenarioIntro
            :blocks="store.scenarioDetails.introBlocks"
            :showIntro="showIntro"
            :showIntroAddMenu="showIntroAddMenu"
            @toggleIntro="() => openCollapse('intro')"
            @addBlock="(type) => addBlock('intro', type)"
            @removeBlock="(id) => removeBlock('intro', id)"
            @toggleAddMenu="() => (showIntroAddMenu = !showIntroAddMenu)"
            @update:blocks="
              (blocks) => (store.scenarioDetails.introBlocks = blocks)
            "
          />
          <MissionList
            :missions="store.missions"
            @orderChange="onMissionOrderChange"
            @openCollapse="(idx) => openCollapse('mission', idx)"
            @addBlock="(type, mission) => addBlock('mission', type, mission)"
            @removeBlock="(id, mission) => removeBlock('mission', id, mission)"
            @removeMission="removeMission"
            @update:blocks="
              ({ blocks, missionIdx }) =>
                (store.missions[missionIdx].blocks = blocks)
            "
            @addMission="addMission"
          />
          <ScenarioOutro
            :blocks="store.scenarioDetails.outroBlocks"
            :showOutro="showConclusion"
            :showOutroAddMenu="showOutroAddMenu"
            @toggleOutro="() => openCollapse('conclusion')"
            @addBlock="(type) => addBlock('outro', type)"
            @removeBlock="(id) => removeBlock('outro', id)"
            @toggleAddMenu="() => (showOutroAddMenu = !showOutroAddMenu)"
            @update:blocks="
              (blocks) => (store.scenarioDetails.outroBlocks = blocks)
            "
          />
          <!-- Sections Prérequis & Progression et Communes supprimées -->
          <ScenarioActions
            :isPublished="store.scenarioDetails.is_published"
            @cancel="cancelChanges"
            @saveDraft="saveDraft"
            @savePublish="savePublish"
          />
        </div>
      </div>
      <div v-else class="empty-detail">
        <p>Sélectionne un scénario dans la liste pour voir le détail.</p>
      </div>
    </div>
    <div
      v-if="toastMsg"
      class="toast"
      style="
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 1000;
        background: #3b82f6;
        color: #fff;
        padding: 1rem 2rem;
        border-radius: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-weight: 600;
      "
    >
      {{ toastMsg }}
    </div>
  </div>
</template>

<script setup>
/**
 * Supprime un scénario (backend + store)
 * @param {object} scenario - Scénario à supprimer
 */
async function deleteScenario(scenario) {
  if (!scenario?.id) return;
  try {
    await axios.delete(
      `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenario.id}`,
      {
        headers: { Authorization: `Bearer ${token.value}` },
      }
    );
    // Retire du store
    store.scenarios = store.scenarios.filter((s) => s.id !== scenario.id);
    if (store.selectedScenario?.id === scenario.id) {
      store.selectedScenario = null;
      store.scenarioDetails = null;
    }
    showToast("Scénario supprimé !");
  } catch (e) {
    showToast("Erreur lors de la suppression");
  }
}
/**
 * Ajoute une nouvelle mission à la fin de la liste
 */
function addMission() {
  // Ajoute la mission uniquement côté front, id temporaire
  const newMission = {
    id: Date.now(),
    title: "Nouvelle mission",
    latitude: null,
    longitude: null,
    riddle_text: "",
    answer_word: "",
    prerequisites: [],
    blocks: [],
    _open: true,
    position: store.missions.length + 1,
  };
  store.missions.push(newMission);
  // Ferme toutes les autres missions
  store.missions.forEach(
    (m, idx) => (m._open = idx === store.missions.length - 1)
  );
}
import { useUser } from "@/src/composables/useUser";
import { useMissions } from "@/src/composables/useMissions";

// Sous-composants principaux
/**
 * ScenarioListSidebar
 * Props: scenarios, selectedScenario, loading, error
 * Events: selectScenario(scenario), createScenario(title)
 */
import ScenarioListSidebar from "@/src/components/ScenarioListSidebar.vue";
/**
 * ScenarioTitleEditor
 * Props: title, editTitle
 * Events: edit(), save(newTitle)
 */
import ScenarioTitleEditor from "@/src/components/ScenarioTitleEditor.vue";
/**
 * CommuneSelector
 * Props: communes, communeShapes, communeError, maxCommunes, newCommuneName
 * Events: update:newCommuneName(val), addCommune(name), removeCommune(id), toggleCommuneSelection(id), polygonReady(id, layer)
 */
import CommuneSelector from "@/src/components/CommuneSelector.vue";
/**
 * ScenarioActions
 * Props: isPublished
 * Events: cancel(), saveDraft(), savePublish()
 */
import ScenarioActions from "@/src/components/ScenarioActions.vue";
/**
 * ScenarioIntro
 * Props: blocks, showIntro, showIntroAddMenu
 * Events: toggleIntro(), addBlock(type), removeBlock(id), toggleAddMenu(), update:blocks(blocks)
 */
import ScenarioIntro from "@/src/components/scenario/ScenarioIntro.vue";
/**
 * MissionList
 * Props: missions
 * Events: orderChange(), openCollapse(idx), addBlock(type, mission), removeBlock(id, mission), removeMission(id), update:blocks({blocks, missionIdx})
 */
import MissionList from "@/src/components/scenario/MissionList.vue";
/**
 * ScenarioOutro
 * Props: blocks, showOutro, showOutroAddMenu
 * Events: toggleOutro(), addBlock(type), removeBlock(id), toggleAddMenu(), update:blocks(blocks)
 */
import ScenarioOutro from "@/src/components/scenario/ScenarioOutro.vue";
// Blocs
// Utilitaires
import axios from "axios";
import { ref, onMounted } from "vue";
import { useScenarioBlocks } from "@/src/composables/useScenarioBlocks";
import { useScenarioStore } from "@/src/stores/scenario";
import { useToast } from "@/src/composables/useToast";
import { useLeafletMap } from "@/src/composables/useLeafletMap";
import { useCommuneWatcher } from "@/src/composables/useCommuneWatcher";

const store = useScenarioStore();
const { user, token, isClientReady, loadUserAndToken } = useUser();
const communeShapes = ref([]);
const editTitle = ref(false);
const newTitle = ref("");
const newCommuneName = ref("");
const showIntro = ref(false);
const showConclusion = ref(false);
const { toastMsg, showToast } = useToast();
const { showIntroAddMenu, showOutroAddMenu, addBlock, removeBlock } =
  useScenarioBlocks(store, token, showToast);
const { removeMission, reorderMissions } = useMissions(store);

const CARTO_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTR = '&copy; <a href="https://carto.com/attributions">CARTO</a>';

const geoJsonOptions = {
  style: () => ({
    color: "#90caf9",
    weight: 2,
    fillColor: "#1976d2",
    fillOpacity: 0.2,
  }),
};

const selectedGeoJsonStyle = {
  ...geoJsonOptions.style(),
  fillColor: "#42a5f5",
};

// Watcher sur store.communes extrait dans useCommuneWatcher

onMounted(async () => {
  try {
    const res = await axios.get(
      "https://michonmaximilien.dev/urbex-api/api/communes/shapes.geojson"
    );
    if (res.data && res.data.features) {
      communeShapes.value = res.data.features.map((f) => ({
        id: f.properties.id || f.properties._id_commune,
        geojson: f,
      }));
    }
  } catch (e) {
    // Optionally handle error
  }
});
// ...existing code...

/**
 * Initialise l'utilisateur et charge les scénarios si le client est prêt
 */
onMounted(() => {
  loadUserAndToken();
  if (isClientReady.value) {
    store.fetchScenarios(user.value?.id, token.value);
  }
});

/**
 * Initialise Leaflet et ses icônes à l'arrivée sur le client
 */
let L;
onMounted(async () => {
  if (typeof window !== "undefined") {
    L = (await import("leaflet")).default;
    await import("leaflet/dist/leaflet.css");
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: new URL(
        "leaflet/dist/images/marker-icon-2x.png",
        import.meta.url
      ).href,
      iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url)
        .href,
      shadowUrl: new URL(
        "leaflet/dist/images/marker-shadow.png",
        import.meta.url
      ).href,
    });
  }
});

/**
 * Gère l'ouverture/fermeture des sections collapsibles (intro, missions, conclusion)
 * @param {string} type - Type de section à ouvrir ('intro', 'mission', 'conclusion')
 * @param {number|null} idx - Index de la mission à ouvrir (si applicable)
 */
function openCollapse(type, idx = null) {
  if (type === "intro") {
    showIntro.value = !showIntro.value;
    showConclusion.value = false;
    store.missions.forEach((m) => (m._open = false));
  } else if (type === "conclusion") {
    showConclusion.value = !showConclusion.value;
    showIntro.value = false;
    store.missions.forEach((m) => (m._open = false));
  } else if (type === "mission") {
    showIntro.value = false;
    showConclusion.value = false;
    store.missions.forEach((m, i) => {
      m._open = i === idx ? !m._open : false;
    });
  }
}

/**
 * Sélectionne un scénario dans la liste
 * @param {object} s - Scénario sélectionné
 */
function selectScenario(s) {
  store.selectScenario(s, token.value);
}

/**
 * Crée un nouveau scénario avec le titre saisi
 */
function createScenario() {
  store.createScenario(newTitle.value, user.value?.id, token.value);
  newTitle.value = "";
}

/**
 * Réordonne les missions après un drag & drop
 */
function onMissionOrderChange() {
  reorderMissions();
}

/**
 * Sauvegarde le scénario en brouillon
 */
async function saveDraft() {
  await store.saveScenarioFull("draft", token.value);
  showToast("Sauvegardé en brouillon !");
}

/**
 * Sauvegarde et publie le scénario
 */
async function savePublish() {
  await store.saveScenarioFull("published", token.value);
  showToast("Sauvegardé et publié !");
}

/**
 * Annule les modifications et recharge le scénario sélectionné
 */
function cancelChanges() {
  if (store.selectedScenario) {
    store.selectScenario(store.selectedScenario, token.value);
    showToast("Modifications annulées.");
  }
}

const { polygonLayers, setPolygonLayer, updatePolygonStyles } = useLeafletMap();
useCommuneWatcher(store, updatePolygonStyles);

/**
 * Sélectionne ou désélectionne une commune et met à jour le style du polygone
 * @param {string|number} communeId - Identifiant de la commune
 */
function toggleCommuneSelection(communeId) {
  const id = typeof communeId === "string" ? communeId : String(communeId);
  if (store.isCommuneSelected(id)) {
    store.removeCommune(id);
  } else {
    store.addCommune(
      store.getCommuneName(id, communeShapes.value),
      communeShapes.value
    );
  }
  updatePolygonStyles(store);
}
// updatePolygonStyles est maintenant géré par le composable useLeafletMap
</script>
