import { ref } from "vue";

export function useLeafletMap() {
  // Map des layers Leaflet par id
  const polygonLayers = ref(new Map());

  function setPolygonLayer(id, layer) {
    polygonLayers.value.set(id, layer);
  }

  function updatePolygonStyles(store) {
    polygonLayers.value.forEach((layer, id) => {
      if (!layer || typeof layer.setStyle !== "function") return;
      const selected = store.isCommuneSelected(id);
      layer.setStyle(
        selected
          ? {
              color: "#f59e0b",
              weight: 4,
              opacity: 0.8,
              fillColor: "#fde68a",
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

  return { polygonLayers, setPolygonLayer, updatePolygonStyles };
}
