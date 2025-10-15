<script setup>
import draggable from "vuedraggable";
import { ref } from "vue";
import BlockText from "@/src/components/scenario-blocks/BlockText.vue";
import BlockImage from "@/src/components/scenario-blocks/BlockImage.vue";
import BlockVideo from "@/src/components/scenario-blocks/BlockVideo.vue";
import BlockAudio from "@/src/components/scenario-blocks/BlockAudio.vue";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";

const props = defineProps({
  missions: Array,
});

const emit = defineEmits([
  "orderChange",
  "openCollapse",
  "addBlock",
  "removeBlock",
]);

function togglePrerequisite(mission, prev) {
  const id = Number(prev.id);
  if (!Array.isArray(mission.prerequisites)) mission.prerequisites = [];
  const idx = mission.prerequisites.map(Number).indexOf(id);
  if (idx === -1) {
    mission.prerequisites.push(id);
  } else {
    mission.prerequisites.splice(idx, 1);
  }
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
                  style="
                    cursor: pointer;
                    user-select: none;
                    margin-right: 0.5em;
                  "
                >
                  {{
                    prev.title || `Mission ${props.missions.indexOf(prev) + 1}`
                  }}
                  <!-- ✔ retiré, pill active = couleur uniquement -->
                </span>
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
                      @remove="emit('removeBlock', block.id, mission)"
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
</template>

<style scoped>
.prereq-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.prereq-pill {
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
  transition: background 0.2s, color 0.2s;
}
.prereq-pill.active {
  background: #6366f1;
  color: #fff;
  opacity: 1;
}
.prereq-pill:not(.active) {
  background: #6366f1;
  color: #fff;
  opacity: 0.4;
}
</style>
