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
                <span class="material-symbols-rounded">edit</span>
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
            <div class="commune-shapes-map" style="margin-top: 2rem">
              <h4>Choix visuel des communes</h4>
              <div v-if="communeShapes.length">
                <LMap
                  :zoom="7"
                  :center="[50.5, 4.5]"
                  :options="{ zoomControl: false }"
                  style="
                    height: 320px;
                    width: 100%;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    background: transparent;
                  "
                >
                  <template v-for="feature in communeShapes" :key="feature.id">
                    <LGeoJson
                      :geojson="feature.geojson"
                      :options="geoJsonOptions"
                    />
                  </template>
                </LMap>
              </div>
              <div v-else style="padding: 1rem; color: #888">
                Chargement des shapes…
              </div>
            </div>
          </div>
          <div class="collapsible-card">
            <div class="collapsible-header" @click="openCollapse('intro')">
              <h3>Introduction</h3>
              <span class="material-symbols-rounded">{{
                showIntro ? "expand_less" : "expand_more"
              }}</span>
            </div>
            <div v-if="showIntro">
              <div><strong>Blocs de contenu :</strong></div>
              <draggable
                v-model="store.scenarioDetails.introBlocks"
                item-key="id"
                handle=".block-drag-handle"
                @end="() => {}"
              >
                <template #item="{ element: block }">
                  <div
                    class="block-item"
                    style="display: flex; align-items: center; gap: 0.5rem"
                  >
                    <span
                      class="block-drag-handle material-symbols-rounded"
                      style="cursor: grab"
                      >drag_indicator</span
                    >
                    <component
                      :is="getBlockComponent(block)"
                      :block="block"
                      @remove="removeBlock('intro', block.id)"
                    />
                  </div>
                </template>
              </draggable>
              <div class="add-block-row">
                <button
                  class="add-block-btn"
                  @click="showIntroAddMenu = !showIntroAddMenu"
                >
                  +
                </button>
                <div v-if="showIntroAddMenu" class="add-block-menu">
                  <button @click="addBlock('intro', 'text')">Texte</button>
                  <button @click="addBlock('intro', 'image')">
                    Image (lien)
                  </button>
                  <button @click="addBlock('intro', 'video')">
                    Vidéo (lien)
                  </button>
                  <button @click="addBlock('intro', 'audio')">
                    Audio (lien)
                  </button>
                </div>
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
                  @click="openCollapse('mission', idx)"
                >
                  <span
                    class="drag-handle material-symbols-rounded"
                    style="cursor: grab; margin-right: 0.7rem"
                    >drag_indicator</span
                  >
                  <h3>Mission {{ idx + 1 }} : {{ mission.title }}</h3>
                  <span class="material-symbols-rounded">{{
                    mission._open ? "expand_less" : "expand_more"
                  }}</span>
                </div>
                <div v-if="mission._open">
                  <div class="mission-block">
                    <div>
                      <strong>Nom :</strong> <input v-model="mission.title" />
                    </div>
                    <div class="gps-section" style="margin: 1rem 0">
                      <label style="margin-right: 1rem">
                        <span>Latitude :</span>
                        <input
                          type="number"
                          step="any"
                          v-model.number="mission.latitude"
                          style="width: 7rem"
                        />
                      </label>
                      <label>
                        <span>Longitude :</span>
                        <input
                          type="number"
                          step="any"
                          v-model.number="mission.longitude"
                          style="width: 7rem"
                        />
                      </label>
                      <div style="margin-top: 1rem">
                        <LMap
                          :zoom="mission.latitude && mission.longitude ? 14 : 2"
                          :center="
                            mission.latitude && mission.longitude
                              ? [mission.latitude, mission.longitude]
                              : [48.858, 2.347]
                          "
                          :options="{ zoomControl: false }"
                          style="
                            height: 180px;
                            width: 100%;
                            border-radius: 0.5rem;
                            overflow: hidden;
                          "
                          @click="
                            (e) => {
                              mission.latitude = e.latlng.lat;
                              mission.longitude = e.latlng.lng;
                            }
                          "
                        >
                          <LTileLayer
                            :url="CARTO_DARK"
                            :attribution="CARTO_ATTR"
                          />
                          <LMarker
                            v-if="mission.latitude && mission.longitude"
                            :lat-lng="[mission.latitude, mission.longitude]"
                          />
                        </LMap>
                      </div>
                    </div>
                    <div>
                      <strong>Blocs de contenu :</strong>
                      <draggable
                        v-model="mission.blocks"
                        item-key="id"
                        handle=".block-drag-handle"
                        @end="() => {}"
                      >
                        <template #item="{ element: block }">
                          <div
                            class="block-item"
                            style="
                              display: flex;
                              align-items: center;
                              gap: 0.5rem;
                            "
                          >
                            <span
                              class="block-drag-handle material-symbols-rounded"
                              style="cursor: grab"
                              >drag_indicator</span
                            >
                            <component
                              :is="getBlockComponent(block)"
                              :block="block"
                              @remove="
                                removeBlock('mission', block.id, mission)
                              "
                            />
                          </div>
                        </template>
                      </draggable>
                      <div class="add-block-row">
                        <button
                          class="add-block-btn"
                          @click="mission._showAddMenu = !mission._showAddMenu"
                        >
                          +
                        </button>
                        <div v-if="mission._showAddMenu" class="add-block-menu">
                          <button @click="addBlock('mission', 'text', mission)">
                            Texte
                          </button>
                          <button
                            @click="addBlock('mission', 'image', mission)"
                          >
                            Image (lien)
                          </button>
                          <button
                            @click="addBlock('mission', 'video', mission)"
                          >
                            Vidéo (lien)
                          </button>
                          <button
                            @click="addBlock('mission', 'audio', mission)"
                          >
                            Audio (lien)
                          </button>
                        </div>
                      </div>
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
                  </div>
                </div>
              </div>
            </template>
          </draggable>
          <div class="collapsible-card">
            <div class="collapsible-header" @click="openCollapse('conclusion')">
              <h3>Conclusion</h3>
              <span class="material-symbols-rounded">{{
                showConclusion ? "expand_less" : "expand_more"
              }}</span>
            </div>
            <div v-if="showConclusion">
              <div><strong>Blocs de contenu :</strong></div>
              <draggable
                v-model="store.scenarioDetails.outroBlocks"
                item-key="id"
                handle=".block-drag-handle"
                @end="() => {}"
              >
                <template #item="{ element: block }">
                  <div
                    class="block-item"
                    style="display: flex; align-items: center; gap: 0.5rem"
                  >
                    <span
                      class="block-drag-handle material-symbols-rounded"
                      style="cursor: grab"
                      >drag_indicator</span
                    >
                    <component
                      :is="getBlockComponent(block)"
                      :block="block"
                      @remove="removeBlock('outro', block.id)"
                    />
                  </div>
                </template>
              </draggable>
              <div class="add-block-row">
                <button
                  class="add-block-btn"
                  @click="showOutroAddMenu = !showOutroAddMenu"
                >
                  +
                </button>
                <div v-if="showOutroAddMenu" class="add-block-menu">
                  <button @click="addBlock('outro', 'text')">Texte</button>
                  <button @click="addBlock('outro', 'image')">
                    Image (lien)
                  </button>
                  <button @click="addBlock('outro', 'video')">
                    Vidéo (lien)
                  </button>
                  <button @click="addBlock('outro', 'audio')">
                    Audio (lien)
                  </button>
                </div>
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
          <div
            class="scenario-actions"
            style="
              display: flex;
              gap: 1rem;
              justify-content: flex-end;
              margin-top: 2rem;
            "
          >
            <button @click="saveDraft" class="btn-draft">
              Sauvegarder en brouillon
            </button>
            <button @click="cancelChanges" class="btn-cancel">Annuler</button>
            <button @click="savePublish" class="btn-publish">
              Sauvegarder et publier
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
// Fonction utilitaire pour savoir si un bloc est vide
import { LGeoJson } from "@vue-leaflet/vue-leaflet";
import axios from "axios";

const communeShapes = ref([]);

const geoJsonOptions = {
  style: () => ({
    color: "#90caf9",
    weight: 2,
    fillColor: "#1976d2",
    fillOpacity: 0.2,
  }),
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
import { ref, onMounted, defineComponent, watch, h } from "vue";
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
const BlockText = defineComponent({
  props: { block: Object },
  emits: ["remove"],
  render() {
    return h("div", { class: "block-text" }, [
      h("textarea", {
        rows: 2,
        style: "width: 100%",
        value: this.block.content_text,
        onInput: (e) => {
          this.block.content_text = e.target.value;
        },
      }),
      h(
        "button",
        {
          class: "remove-block-btn",
          style: "margin-left:auto;",
          onClick: () => this.$emit("remove"),
        },
        [h("span", { class: "material-symbols-rounded" }, "delete")]
      ),
    ]);
  },
});
const BlockImage = defineComponent({
  props: { block: Object },
  emits: ["remove"],
  render() {
    return h("div", { class: "block-image" }, [
      h("input", {
        value: this.block.url_media,
        placeholder: "Lien image",
        style: "width: 100%",
        onInput: (e) => {
          this.block.url_media = e.target.value;
        },
      }),
      h(
        "button",
        {
          class: "remove-block-btn",
          style: "margin-left:auto;",
          onClick: () => this.$emit("remove"),
        },
        [h("span", { class: "material-symbols-rounded" }, "delete")]
      ),
      this.block.url_media
        ? h("div", { style: "margin-top:0.5rem" }, [
            h("img", {
              src: this.block.url_media,
              style: "max-width:100%;max-height:120px;border-radius:0.25rem",
            }),
          ])
        : null,
    ]);
  },
});
const BlockVideo = defineComponent({
  props: { block: Object },
  emits: ["remove"],
  render() {
    return h("div", { class: "block-video" }, [
      h("input", {
        value: this.block.url_media,
        placeholder: "Lien vidéo",
        style: "width: 100%",
        onInput: (e) => {
          this.block.url_media = e.target.value;
        },
      }),
      h(
        "button",
        {
          class: "remove-block-btn",
          style: "margin-left:auto;",
          onClick: () => this.$emit("remove"),
        },
        [h("span", { class: "material-symbols-rounded" }, "delete")]
      ),
      this.block.url_media
        ? h("div", { style: "margin-top:0.5rem" }, [
            h("video", {
              src: this.block.url_media,
              controls: true,
              style: "max-width:100%;max-height:120px;border-radius:0.25rem",
            }),
          ])
        : null,
    ]);
  },
});
const BlockAudio = defineComponent({
  props: { block: Object },
  emits: ["remove"],
  render() {
    return h("div", { class: "block-audio" }, [
      h("input", {
        value: this.block.url_media,
        placeholder: "Lien audio",
        style: "width: 100%",
        onInput: (e) => {
          this.block.url_media = e.target.value;
        },
      }),
      h(
        "button",
        {
          class: "remove-block-btn",
          style: "margin-left:auto;",
          onClick: () => this.$emit("remove"),
        },
        [h("span", { class: "material-symbols-rounded" }, "delete")]
      ),
      this.block.url_media
        ? h("div", { style: "margin-top:0.5rem" }, [
            h("audio", {
              src: this.block.url_media,
              controls: true,
              style: "width:100%",
            }),
          ])
        : null,
    ]);
  },
});

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

const showIntroAddMenu = ref(false);
const showOutroAddMenu = ref(false);

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

function addBlock(section, type, mission = null) {
  const newBlock = {
    id: Date.now() + Math.random(),
    type,
    content_text: "",
    content_url: "",
  };
  if (section === "intro") {
    store.scenarioDetails.introBlocks.push(newBlock);
    showIntroAddMenu.value = false;
  } else if (section === "outro") {
    store.scenarioDetails.outroBlocks.push(newBlock);
    showOutroAddMenu.value = false;
  } else if (section === "mission" && mission) {
    if (!mission.blocks) mission.blocks = [];
    mission.blocks.push(newBlock);
    mission._showAddMenu = false;
  }
}

function removeBlock(section, blockId, mission = null) {
  if (section === "intro") {
    store.scenarioDetails.introBlocks =
      store.scenarioDetails.introBlocks.filter((b) => b.id !== blockId);
  } else if (section === "outro") {
    store.scenarioDetails.outroBlocks =
      store.scenarioDetails.outroBlocks.filter((b) => b.id !== blockId);
  } else if (section === "mission" && mission) {
    mission.blocks = mission.blocks.filter((b) => b.id !== blockId);
  }
}
import { useScenarioStore } from "@/src/stores/scenario";
import draggable from "vuedraggable";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
// Import Leaflet et CSS côté client uniquement
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

const store = useScenarioStore();
const editTitle = ref(false);
const newTitle = ref("");
const newCommuneName = ref("");
const communeError = ref("");
const showIntro = ref(false);
const showConclusion = ref(false);

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

const user = ref(null);
const token = ref(null);
const isClientReady = ref(false);
const toastMsg = ref("");
const toastTimeout = ref(null);

const CARTO_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTR = '&copy; <a href="https://carto.com/attributions">CARTO</a>';

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
  await store.saveScenario("draft");
  showToast("Sauvegardé en brouillon !");
}
async function savePublish() {
  await store.saveScenario("published");
  showToast("Sauvegardé et publié !");
}
function cancelChanges() {
  if (store.selectedScenario) {
    store.selectScenario(store.selectedScenario, token.value);
    showToast("Modifications annulées.");
  }
}

// Ajoute ici la logique pour addCommune et removeCommune si tu veux les centraliser dans le store
</script>

<style>
/* Masquer le logo Leaflet en bas à droite */
.leaflet-control-attribution {
  display: none !important;
}
/* Ajoute ici tes styles spécifiques si besoin */

.collapsible-card {
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  padding: 0;
}

.collapsible-header {
  background-color: #f7f7f9;
  margin: 0;
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

.block-item {
  background: #16243a;
  border: 1px solid #223b54;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.7rem;
  padding: 0.7rem 1.2rem;
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 0.7rem;
  position: relative;
}
.block-drag-handle.material-symbols-rounded {
  color: #90caf9;
  font-size: 1.6em;
  align-self: flex-start;
}
.remove-block-btn {
  margin-left: auto !important;
  background: none;
  border: none;
  color: #90caf9;
  font-size: 1.6em;
  cursor: pointer;
  align-self: flex-start;
  padding: 0.2em 0.3em;
  transition: color 0.2s;
}
.remove-block-btn:hover {
  color: #e57373;
}
.block-drag-handle.material-symbols-rounded {
  color: #90caf9;
}

.block-text {
  flex: 1;
  padding: 0;
  border: none;
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

.toast {
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
}
/* Masquer le logo Leaflet en bas à droite */
.leaflet-control-attribution {
  display: none !important;
}
</style>
