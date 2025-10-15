<script setup>
import draggable from "vuedraggable";
import { ref } from "vue";
import BlockText from "@/src/components/scenario-blocks/BlockText.vue";
import BlockImage from "@/src/components/scenario-blocks/BlockImage.vue";
import BlockVideo from "@/src/components/scenario-blocks/BlockVideo.vue";
import BlockAudio from "@/src/components/scenario-blocks/BlockAudio.vue";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";

/**
 * Props du composant MissionList
 * @property {Array} missions - Liste des missions à afficher
 */
const props = defineProps({
  missions: Array,
});

/**
 * Événements émis par MissionList
 * @event orderChange - Changement d'ordre des missions
 * @event openCollapse - Ouverture d'une mission
 * @event addBlock - Ajout d'un bloc à une mission
 * @event removeBlock - Suppression d'un bloc d'une mission
 * @event update:blocks - Mise à jour des blocs d'une mission
 * @event removeMission - Suppression d'une mission
 */
const emit = defineEmits([
  "orderChange",
  "openCollapse",
  "addBlock",
  "removeBlock",
  "update:blocks",
  "removeMission",
]);

function onOrderChange(e) {
  emit("orderChange", e.newList || props.missions);
}

function addBlock(type, mission, idx) {
  const newBlock = { id: Date.now(), type };
  mission.blocks.push(newBlock);
  emit("update:blocks", { blocks: mission.blocks, missionIdx: idx });
  emit("addBlock", type, mission);
}

function removeBlock(blockId, mission, idx) {
  mission.blocks = mission.blocks.filter((b) => b.id !== blockId);
  emit("update:blocks", { blocks: mission.blocks, missionIdx: idx });
  emit("removeBlock", blockId, mission);
}

function togglePrerequisite(mission, prev, idx) {
  const prereqId = Number(prev.id);
  if (!Array.isArray(mission.prerequisites)) mission.prerequisites = [];
  console.log(
    props.missions.map((m, i) => ({
      index: i,
      id: m.id ?? m._id_mission,
      prerequisites: m.prerequisites ? [...m.prerequisites] : [],
    }))
  );
  const isActive = mission.prerequisites.map(Number).includes(prereqId);
  if (!isActive) {
    // Ajoute le prérequis à la mission courante et toutes les suivantes
    for (let i = idx; i < props.missions.length; i++) {
      const m = props.missions[i];
      if (!Array.isArray(m.prerequisites)) m.prerequisites = [];
      if (!m.prerequisites.map(Number).includes(prereqId)) {
        m.prerequisites.push(prereqId);
      }
    }
  } else {
    // Retire le prérequis de la mission courante et toutes les précédentes
    for (let i = 0; i <= idx; i++) {
      const m = props.missions[i];
      if (!Array.isArray(m.prerequisites)) m.prerequisites = [];
      m.prerequisites = m.prerequisites.filter((id) => Number(id) !== prereqId);
    }
  }
}

// Mapping des types de blocs vers leurs composants
const blockComponentMap = {
  text: BlockText,
  image: BlockImage,
  video: BlockVideo,
  audio: BlockAudio,
};

function getBlockComponent(block) {
  return blockComponentMap[block.type] || BlockText;
}
const CARTO_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTR = '&copy; <a href="https://carto.com/attributions">CARTO</a>';
</script>
<template>
  <draggable
    :list="props.missions"
    item-key="id"
    handle=".drag-handle"
    @change="onOrderChange"
  >
    function onOrderChange(e) { emit('orderChange', e.newList ||
    props.missions); }
    <template #item="{ element: mission, index: idx }">
      <div class="collapsible-card">
        <div class="collapsible-header" @click="emit('openCollapse', idx)">
          <div
            style="display: flex; align-items: center; gap: 0.7rem; width: 100%"
          >
            <span
              class="drag-handle material-symbols-rounded"
              style="cursor: grab"
              >drag_indicator</span
            >
            <h3 style="flex: 1">Mission {{ idx + 1 }} : {{ mission.title }}</h3>
            <span class="material-symbols-rounded">{{
              mission._open ? "expand_less" : "expand_more"
            }}</span>
            <button
              class="remove-mission-btn"
              style="
                background: none;
                border: none;
                cursor: pointer;
                color: #e53935;
                margin-left: 0.7rem;
              "
              title="Supprimer la mission"
              @click.stop="
                emit('removeMission', mission._id_mission || mission.id)
              "
            >
              <span class="material-symbols-rounded">delete</span>
            </button>
          </div>
        </div>
        <div v-if="mission._open">
          <div class="mission-block">
            <div><strong>Nom :</strong> <input v-model="mission.title" /></div>
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
                  <LTileLayer :url="CARTO_DARK" :attribution="CARTO_ATTR" />
                  <LMarker
                    v-if="mission.latitude && mission.longitude"
                    :lat-lng="[mission.latitude, mission.longitude]"
                  />
                </LMap>
              </div>
            </div>
            <!-- Section Prérequis -->
            <div class="prereq-section" style="margin: 1rem 0">
              <strong>Prérequis :</strong>
              <div class="prereq-pills">
                <span
                  v-for="prev in props.missions.slice(0, idx)"
                  :key="prev.id"
                  class="prereq-pill"
                  :class="{
                    active: mission.prerequisites
                      ?.map(Number)
                      .includes(Number(prev.id)),
                  }"
                  @click="togglePrerequisite(mission, prev, idx)"
                  :style="{
                    cursor: 'pointer',
                    userSelect: 'none',
                    marginRight: '0.5em',
                    padding: '0.3em 0.8em',
                    borderRadius: '1em',
                    background: mission.prerequisites
                      ?.map(Number)
                      .includes(Number(prev.id))
                      ? '#1976d2'
                      : '#eee',
                    color: mission.prerequisites
                      ?.map(Number)
                      .includes(Number(prev.id))
                      ? '#fff'
                      : '#333',
                    border: 'none',
                  }"
                >
                  {{
                    prev.title || `Mission ${props.missions.indexOf(prev) + 1}`
                  }}
                </span>
              </div>
            </div>
            <div>
              <strong>Blocs de contenu :</strong>
              <draggable
                v-model="mission.blocks"
                item-key="id"
                handle=".block-drag-handle"
                @end="
                  () =>
                    emit('update:blocks', {
                      blocks: mission.blocks,
                      missionIdx: idx,
                    })
                "
              >
                <template #item="{ element: block }">
                  <div class="block-item">
                    <span class="block-drag-handle material-symbols-rounded"
                      >drag_indicator</span
                    >
                    <component
                      :is="getBlockComponent(block)"
                      :block="block"
                      @remove="emit('removeBlock', $event, mission)"
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
                  <button @click="emit('addBlock', 'text', mission)">
                    Texte
                  </button>
                  <button @click="emit('addBlock', 'image', mission)">
                    Image (lien)
                  </button>
                  <button @click="emit('addBlock', 'video', mission)">
                    Vidéo (lien)
                  </button>
                  <button @click="emit('addBlock', 'audio', mission)">
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
                class="mission-input"
              />
            </div>
            <div>
              <strong>Mot réponse :</strong>
              <input v-model="mission.answer_word" class="mission-input" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </draggable>
</template>
