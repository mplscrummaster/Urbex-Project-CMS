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
              s.is_published ? 'published' : 'draft',
            ]"
            @click="selectScenario(s)"
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
                v-model="store.scenarioDetails.title_scenario"
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
              <h2>{{ store.scenarioDetails.title_scenario }}</h2>
              <button
                class="icon-btn"
                @click="editTitle = true"
                title="Éditer le titre"
              >
                <span class="material-symbols-rounded">edit</span>
              </button>
            </template>
          </div>
          <div class="scenario-global-infos">
            <h3>Communes liées</h3>
            <div class="commune-pills">
              <span
                v-for="commune in store.communes"
                :key="commune.id"
                class="commune-pill"
              >
                {{ commune.name_fr }}
                <button
                  class="pill-remove"
                  @click="removeCommune(commune.id)"
                  title="Retirer la commune"
                  type="button"
                >
                  &times;
                </button>
              </span>
            </div>

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
            <div class="commune-shapes-map" style="margin-top: 2rem">
              <h4>Choix visuel des communes</h4>
              <div v-if="communeShapes.length">
                <LMap
                  :key="
                    selectedCommuneIds.value
                      ? selectedCommuneIds.value.join(',')
                      : ''
                  "
                  :zoom="7"
                  :center="[50.5, 4.5]"
                  :options="{ zoomControl: false, minZoom: 7, maxZoom: 18 }"
                  style="
                    height: 320px;
                    width: 100%;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    background: #183a5a; /* bleu foncé custom */
                  "
                >
                  <template v-for="feature in communeShapes" :key="feature.id">
                    <LGeoJson
                      :geojson="feature.geojson"
                      :options="{
                        style: () => ({
                          color: '#1976d2',
                          weight: 1,
                          fillColor: '#1976d2',
                          fillOpacity: 0.2,
                          cursor: 'pointer',
                        }),
                      }"
                      @ready="(layer) => polygonLayers.set(feature.id, layer)"
                      @click="() => toggleCommuneSelection(feature.id)"
                    />
                  </template>
                </LMap>
              </div>
              <div v-else style="padding: 1rem; color: #888">
                Chargement des shapes…
              </div>
            </div>
          </div>
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
          <div
            class="scenario-actions"
            style="
              display: flex;
              gap: 1rem;
              justify-content: flex-end;
              margin-top: 2rem;
            "
          >
            <button @click="cancelChanges" class="btn-cancel">Annuler</button>
            <button @click="saveDraft" class="btn-draft">
              Sauvegarder en brouillon
            </button>
            <button @click="savePublish" class="btn-publish">
              {{
                store.scenarioDetails.is_published
                  ? "Mettre à jour la publication"
                  : "Sauvegarder et publier"
              }}
            </button>
          </div>
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
const deletedMissionIds = ref([]);
async function removeMission(missionId) {
  store.missions = store.missions.filter(
    (m) => (m._id_mission || m.id) !== missionId
  );
  store.deletedMissionIds.push(missionId);
}
// Fonction utilitaire pour savoir si un bloc est vide
import { LGeoJson } from "@vue-leaflet/vue-leaflet";
import axios from "axios";
import { ref, onMounted, watch, nextTick } from "vue";
import BlockText from "@/src/components/scenario-blocks/BlockText.vue";
import BlockImage from "@/src/components/scenario-blocks/BlockImage.vue";
import BlockVideo from "@/src/components/scenario-blocks/BlockVideo.vue";
import BlockAudio from "@/src/components/scenario-blocks/BlockAudio.vue";
import ScenarioIntro from "@/src/components/scenario/ScenarioIntro.vue";
import MissionList from "@/src/components/scenario/MissionList.vue";
import ScenarioOutro from "@/src/components/scenario/ScenarioOutro.vue";

import { useScenarioStore } from "@/src/stores/scenario";
import draggable from "vuedraggable";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";

const communeShapes = ref([]);
const showIntroAddMenu = ref(false);
const showOutroAddMenu = ref(false);
const store = useScenarioStore();
const editTitle = ref(false);
const newTitle = ref("");
const newCommuneName = ref("");
// Synchronise la sélection initiale des communes liées au scénario
const selectedCommuneIds = ref([]);

// Met à jour la sélection et la surbrillance au chargement du détail
watch(
  () => store.communes,
  (communes) => {
    if (communes && communes.length) {
      selectedCommuneIds.value = communes.map((c) => String(c.id));
      setTimeout(() => updatePolygonStyles(), 200);
    }
  },
  { immediate: true }
);

// Ajout : synchronise la sélection dès que le détail du scénario change (communes initiales)
watch(
  () => store.scenarioDetails && store.scenarioDetails.communes,
  (communes) => {
    if (communes && communes.length) {
      selectedCommuneIds.value = communes.map((c) => String(c.id));
      nextTick(() => updatePolygonStyles());
    }
  },
  { immediate: true }
);

// Met à jour communeShapes côté window pour le store
watch(
  communeShapes,
  (shapes) => {
    if (typeof window !== "undefined") {
      window.communeShapes = shapes;
    }
  },
  { immediate: true }
);

const communeError = ref("");
const showIntro = ref(false);
const showConclusion = ref(false);
const user = ref(null);
const token = ref(null);
const isClientReady = ref(false);
const toastMsg = ref("");
const toastTimeout = ref(null);

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
function isBlockEmpty(block) {
  if (!block) return true;
  // Un bloc est vide seulement si aucun champ utile n'est rempli
  if (block.type === "text") {
    return !block.content_text || block.content_text.trim() === "";
  }
  if (["image", "video", "audio"].includes(block.type)) {
    return !block.url_media || block.url_media.trim() === "";
  }
  // Si le type n'est pas reconnu, on l'affiche
  return false;
  return true;
}

// Utilitaires pour compatibilité structure API
function getIntroBlocks() {
  return (
    store.scenarioDetails.introBlocks ||
    store.scenarioDetails.intro_blocks ||
    []
  );
}
function getOutroBlocks() {
  return (
    store.scenarioDetails.outroBlocks ||
    store.scenarioDetails.outro_blocks ||
    []
  );
}
function getMissionBlocks(mission) {
  return mission.blocks || mission.mission_blocks || [];
}

function getBlockComponent(block) {
  switch (block.type) {
    case "text":
      return BlockText;
    case "image":
      return BlockImage;
    case "video":
      return BlockVideo;
    case "audio":
      return BlockAudio;
    default:
      return BlockText;
  }
}

// Initialisation des blocks dans chaque mission si absent
onMounted(() => {
  // Initialisation utilisateur et missions
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

async function addBlock(section, type, mission = null) {
  const payload = {
    position_block: 1,
    type_block: type,
    content_text: "",
    url_media: "",
    caption: "",
  };
  let res;
  try {
    if (section === "intro") {
      res = await axios.post(
        `http://localhost:3000/api/scenarios/${store.selectedScenario.id}/intro/blocks`,
        payload,
        { headers: { Authorization: `Bearer ${token.value}` } }
      );
      if (res?.data?.id) {
        store.scenarioDetails.introBlocks = [
          ...store.scenarioDetails.introBlocks,
          {
            ...payload,
            id: res.data.id,
            _id_block: res.data.id,
            type: type,
          },
        ];
      }
      showIntroAddMenu.value = false;
    } else if (section === "outro") {
      res = await axios.post(
        `http://localhost:3000/api/scenarios/${store.selectedScenario.id}/outro/blocks`,
        payload,
        { headers: { Authorization: `Bearer ${token.value}` } }
      );
      if (res?.data?.id) {
        store.scenarioDetails.outroBlocks = [
          ...store.scenarioDetails.outroBlocks,
          {
            ...payload,
            id: res.data.id,
            _id_block: res.data.id,
            type: type,
          },
        ];
      }
      showOutroAddMenu.value = false;
    } else if (section === "mission" && mission) {
      res = await axios.post(
        `http://localhost:3000/api/missions/${
          mission._id_mission || mission.id
        }/blocks`,
        payload,
        { headers: { Authorization: `Bearer ${token.value}` } }
      );
      if (res?.data?.id) {
        if (!mission.blocks) mission.blocks = [];
        mission.blocks.push({
          ...payload,
          id: res.data.id,
          _id_block: res.data.id,
          type: type,
        });
      }
      mission._showAddMenu = false;
    }
  } catch (e) {
    toastMsg.value = "Erreur lors de la création du bloc.";
    setTimeout(() => (toastMsg.value = ""), 3000);
  }
}

function removeBlock(section, blockId, mission = null) {
  console.log(
    "Suppression bloc",
    section,
    blockId,
    store.scenarioDetails.introBlocks
  );
  if (section === "intro") {
    store.scenarioDetails.introBlocks =
      store.scenarioDetails.introBlocks.filter((b) => {
        const realId = b._id_block || b.id;
        if (realId === blockId) store.deletedBlockIds.push(realId);
        return realId !== blockId;
      });
  } else if (section === "outro") {
    store.scenarioDetails.outroBlocks =
      store.scenarioDetails.outroBlocks.filter((b) => {
        const realId = b._id_block || b.id;
        if (realId === blockId) store.deletedBlockIds.push(realId);
        return realId !== blockId;
      });
  } else if (section === "mission" && mission) {
    mission.blocks = mission.blocks.filter((b) => {
      const realId = b._id_block || b.id;
      if (realId === blockId) store.deletedBlockIds.push(realId);
      return realId !== blockId;
    });
  }
}

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
  store.reorderMissions(store.missions);
}

function showToast(msg) {
  toastMsg.value = msg;
  if (toastTimeout.value) clearTimeout(toastTimeout.value);
  toastTimeout.value = setTimeout(() => {
    toastMsg.value = "";
  }, 2500);
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

const polygonLayers = new Map(); // id -> leaflet layer
function toggleCommuneSelection(communeId) {
  const id = typeof communeId === "string" ? communeId : String(communeId);
  const idx = selectedCommuneIds.value.findIndex((cid) => String(cid) === id);
  if (idx === -1) {
    if (selectedCommuneIds.value.length < 3) {
      selectedCommuneIds.value.push(id);
    }
  } else {
    selectedCommuneIds.value.splice(idx, 1);
  }
  store.setSelectedCommunes(selectedCommuneIds.value);
  // Met à jour le style du polygone sélectionné
  updatePolygonStyles();
}
function updatePolygonStyles() {
  polygonLayers.forEach((layer, id) => {
    if (!layer || typeof layer.setStyle !== "function") return;
    const selected = selectedCommuneIds.value.includes(String(id));
    layer.setStyle(
      selected
        ? {
            color: "#f59e0b", // amber border
            weight: 4,
            opacity: 0.8,
            fillColor: "#fde68a", // amber light fill
            fillOpacity: 0.4,
            cursor: "pointer",
          }
        : {
            color: "#1976d2",
            weight: 1,
            opacity: 0.5,
            fillColor: "#1976d2",
            fillOpacity: 0.2,
            cursor: "pointer",
          }
    );
  });
}

function isCommuneSelected(communeId) {
  const id = typeof communeId === "string" ? communeId : String(communeId);
  return selectedCommuneIds.value.some((cid) => String(cid) === id);
}

function getCommuneName(communeId) {
  // Cherche le nom dans communeShapes
  const shape = communeShapes.value.find((c) => c.id === communeId);
  return shape?.geojson?.properties?.name_fr || `Commune ${communeId}`;
}

function removeCommune(communeId) {
  // Retire la commune du store et met à jour la sélection
  store.communes = store.communes.filter((c) => c.id !== communeId);
  if (store.scenarioDetails) {
    store.scenarioDetails.communes = store.communes;
  } // Met à jour la sélection visuelle sur la carte
  const idx = selectedCommuneIds.value.findIndex(
    (cid) => String(cid) === String(communeId)
  );
  if (idx !== -1) {
    selectedCommuneIds.value.splice(idx, 1);
    updatePolygonStyles();
  }
}

// Ajoute ici la logique pour addCommune et removeCommune si tu veux les centraliser dans le store
function addCommune() {
  const input = newCommuneName.value.trim().toLowerCase();
  if (!input) return;
  // Cherche la commune par nom (insensible à la casse, ignore espaces)
  const found = communeShapes.value.find((c) => {
    const name = c.geojson?.properties?.name_fr
      ?.toLowerCase()
      .replace(/\s+/g, "");
    return name === input.replace(/\s+/g, "");
  });
  if (!found) {
    communeError.value = "Commune introuvable.";
    return;
  }
  if (selectedCommuneIds.value.includes(String(found.id))) {
    communeError.value = "Commune déjà sélectionnée.";
    return;
  }
  if (selectedCommuneIds.value.length >= 3) {
    communeError.value = "Maximum 3 communes.";
    return;
  }
  selectedCommuneIds.value.push(String(found.id));
  store.setSelectedCommunes(selectedCommuneIds.value);
  updatePolygonStyles();
  newCommuneName.value = "";
  communeError.value = "";
}
</script>

<style scoped>
.commune-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.commune-pill {
  display: inline-flex;
  align-items: center;
  background: #e3e7f7;
  color: #183a5a;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.95em;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(24, 58, 90, 0.07);
  position: relative;
}
.pill-remove {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 1.1em;
  margin-left: 0.5em;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}
.pill-remove:hover {
  color: #d32f2f;
}
</style>
