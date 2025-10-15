import { watch } from "vue";

export function useCommuneWatcher(store, updatePolygonStyles) {
  watch(
    () => store.communes,
    () => {
      updatePolygonStyles(store);
    }
  );
}
