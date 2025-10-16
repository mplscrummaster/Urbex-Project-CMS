import { ref, watch } from "vue";

export function useMissions(store) {
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

  function removeMission(missionId) {
    store.missions = store.missions.filter(
      (m) => (m._id_mission || m.id) !== missionId
    );
    store.deletedMissionIds.push(missionId);
  }

  function reorderMissions() {
    store.reorderMissions(store.missions);
  }

  return {
    removeMission,
    reorderMissions,
  };
}
