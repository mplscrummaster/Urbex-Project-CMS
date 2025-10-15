<template>
  <div class="commune-selector">
    <h3>Communes liées</h3>
    <div class="commune-pills">
      <span v-for="commune in communes" :key="commune.id" class="commune-pill">
        {{ commune.name_fr }}
        <button
          class="pill-remove"
          @click="$emit('removeCommune', commune.id)"
          title="Retirer la commune"
          type="button"
        >
          &times;
        </button>
      </span>
    </div>
    <div v-if="communes.length < maxCommunes">
      <input
        :value="newCommuneName"
        @input="$emit('update:newCommuneName', $event.target.value)"
        placeholder="Ajouter une commune…"
      />
      <button
        @click="$emit('addCommune', newCommuneName)"
        :disabled="!newCommuneName"
      >
        Ajouter
      </button>
      <div v-if="communeError" class="error">
        {{ communeError }}
      </div>
    </div>
    <div v-else>
      <em>Maximum {{ maxCommunes }} communes liées.</em>
    </div>
    <div class="commune-shapes-map" style="margin-top: 2rem">
      <h4>Choix visuel des communes</h4>
      <div v-if="communeShapes.length">
        <LMap
          :zoom="7"
          :center="[50.5, 4.5]"
          :options="{ zoomControl: false, minZoom: 7, maxZoom: 18 }"
          style="
            height: 320px;
            width: 100%;
            border-radius: 0.5rem;
            overflow: hidden;
            background: #183a5a;
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
              @ready="(layer) => $emit('polygonReady', feature.id, layer)"
              @click="$emit('toggleCommuneSelection', feature.id)"
            />
          </template>
        </LMap>
      </div>
      <div v-else style="padding: 1rem; color: #888">
        Chargement des shapes…
      </div>
    </div>
  </div>
</template>

<script setup>
import { LMap, LGeoJson } from "@vue-leaflet/vue-leaflet";
const props = defineProps({
  communes: Array,
  communeShapes: Array,
  communeError: String,
  maxCommunes: Number,
  newCommuneName: String,
});
</script>

<style scoped>
.commune-selector .commune-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.commune-selector .commune-pill {
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
.commune-selector .pill-remove {
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
.commune-selector .pill-remove:hover {
  color: #d32f2f;
}
</style>
