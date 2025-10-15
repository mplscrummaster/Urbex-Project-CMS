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
import BlockText from "@/src/components/scenario-blocks/BlockText.vue";
import BlockImage from "@/src/components/scenario-blocks/BlockImage.vue";
import BlockVideo from "@/src/components/scenario-blocks/BlockVideo.vue";
import BlockAudio from "@/src/components/scenario-blocks/BlockAudio.vue";
// Utilitaires
import { LGeoJson } from "@vue-leaflet/vue-leaflet";
import axios from "axios";
import { ref, onMounted, watch, nextTick } from "vue";
import { useScenarioBlocks } from "@/src/composables/useScenarioBlocks";

import { useScenarioStore } from "@/src/stores/scenario";
import { LMap } from "@vue-leaflet/vue-leaflet";
import { blockUtils, isBlockEmpty } from "@/src/composables/blockUtils";
import { useToast } from "@/src/composables/useToast";
import { useLeafletMap } from "@/src/composables/useLeafletMap";

const store = useScenarioStore();
const token = ref(null);
const communeShapes = ref([]);
const editTitle = ref(false);
const newTitle = ref("");
const newCommuneName = ref("");
const showIntro = ref(false);
const showConclusion = ref(false);
const user = ref(null);
const isClientReady = ref(false);
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

watch(
  () => store.communes,
  () => {
    updatePolygonStyles(store);
  }
);

onMounted(async () => {
  try {
    const res = await axios.get(
      "http://localhost:3000/api/communes/shapes.geojson"
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

// Initialisation utilisateur et missions
onMounted(() => {
  if (typeof window !== "undefined") {
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
  }
});

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

onMounted(() => {
  // Initialisation utilisateur et missions
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
  // Initialisation des blocks dans chaque mission si absent
  watch(
    () => store.missions,
    (missions) => {
      if (Array.isArray(missions)) {
        missions.forEach((m) => {
          if (!m.blocks && m.mission_blocks) m.blocks = m.mission_blocks;
          if (!m.blocks) m.blocks = [];
        });
      }
    },
    { immediate: true }
  );
});

function selectScenario(s) {
  store.selectScenario(s, token.value);
}

function createScenario() {
  store.createScenario(newTitle.value, user.value?.id, token.value);
  newTitle.value = "";
}

function onMissionOrderChange() {
  reorderMissions();
}

async function saveDraft() {
  await store.saveScenarioFull("draft", token.value);
  showToast("Sauvegardé en brouillon !");
}
async function savePublish() {
  await store.saveScenarioFull("published", token.value);
  showToast("Sauvegardé et publié !");
}
function cancelChanges() {
  if (store.selectedScenario) {
    store.selectScenario(store.selectedScenario, token.value);
    showToast("Modifications annulées.");
  }
}

const { polygonLayers, setPolygonLayer, updatePolygonStyles } = useLeafletMap();
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
