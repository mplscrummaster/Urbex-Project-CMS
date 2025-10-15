import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useScenarioStore = defineStore("scenario", () => {
  const scenarios = ref([]);
  const loading = ref(false);
  const error = ref("");
  const selectedScenario = ref(null);
  const scenarioDetails = ref(null);
  const detailsLoading = ref(false);
  const detailsError = ref("");
  const missions = ref([]);
  const communes = ref([]);
  const API_URL = "http://localhost:3000/api/scenarios";
  const deletedMissionIds = ref([]);
  const deletedBlockIds = ref([]);

  async function saveScenarioFull(status, token) {
    // Supprimer les missions supprimées côté front
    if (deletedMissionIds.value?.length) {
      for (const missionId of deletedMissionIds.value) {
        try {
          await axios.delete(
            `http://localhost:3000/api/missions/${missionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.error("Erreur suppression mission", missionId, e);
        }
      }
      deletedMissionIds.value = [];
    }
    // Supprimer les blocs supprimés côté front
    if (deletedBlockIds.value?.length) {
      for (const blockId of deletedBlockIds.value) {
        try {
          await axios.delete(`http://localhost:3000/api/blocks/${blockId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          console.error("Erreur suppression bloc", blockId, e);
        }
      }
      deletedBlockIds.value = [];
    }
    if (!scenarioDetails.value || !selectedScenario.value) return;
    const scenarioId = selectedScenario.value.id;
    await axios.put(
      `${API_URL}/${scenarioId}`,
      {
        title_scenario: scenarioDetails.value.title_scenario,
        is_published: status === "published" ? 1 : 0,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    for (const m of missions.value) {
      const missionId = m._id_mission || m.id;
      if (!missionId) continue;
      await axios.put(
        `http://localhost:3000/api/missions/${missionId}`,
        {
          position_mission: m.position,
          title_mission: m.title,
          latitude: m.latitude,
          longitude: m.longitude,
          riddle_text: m.riddle_text,
          answer_word: m.answer_word,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    for (const m of missions.value) {
      const missionId = m._id_mission || m.id;
      if (!missionId) continue;
      await axios.put(
        `http://localhost:3000/api/missions/${missionId}/prerequisites`,
        {
          prerequisites: Array.isArray(m.prerequisites)
            ? m.prerequisites.map(Number)
            : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    await axios.put(
      `http://localhost:3000/api/scenarios/${scenarioId}/missions/reorder`,
      missions.value.map((m, idx) => ({
        id: m._id_mission || m.id,
        position: idx + 1,
      })),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await axios.post(
      `http://localhost:3000/api/scenarios/${scenarioId}/communes`,
      {
        commune_ids: communes.value.map((c) => c.id),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const allBlocks = [
      ...(scenarioDetails.value.introBlocks || []),
      ...(scenarioDetails.value.outroBlocks || []),
      ...missions.value.flatMap((m) => m.blocks || []),
    ];
    for (const b of allBlocks) {
      let ownerType = b.owner_type || b.type_owner;
      if (!ownerType && b._id_mission) ownerType = "mission";
      if (!ownerType && b._id_scenario) ownerType = "scenario_intro";
      let missionId = b._id_mission || b.mission_id;
      let scenarioIdBlock = b._id_scenario || scenarioId;
      let blockId = b._id_block || b.id;
      if (!blockId || typeof blockId !== "number") {
        try {
          let res;
          if (ownerType === "scenario_intro") {
            res = await axios.post(
              `http://localhost:3000/api/scenarios/${scenarioIdBlock}/intro/blocks`,
              {
                position_block: b.position,
                type_block: b.type,
                content_text: b.content_text,
                url_media: b.url_media,
                caption: b.caption,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else if (ownerType === "scenario_outro") {
            res = await axios.post(
              `http://localhost:3000/api/scenarios/${scenarioIdBlock}/outro/blocks`,
              {
                position_block: b.position,
                type_block: b.type,
                content_text: b.content_text,
                url_media: b.url_media,
                caption: b.caption,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else if (ownerType === "mission" && missionId) {
            res = await axios.post(
              `http://localhost:3000/api/missions/${missionId}/blocks`,
              {
                position_block: b.position,
                type_block: b.type,
                content_text: b.content_text,
                url_media: b.url_media,
                caption: b.caption,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
            error.value = "Type de bloc ou parent inconnu.";
            continue;
          }
          if (!res?.data?.id || typeof res.data.id !== "number") {
            error.value = "Erreur création bloc : id non retourné.";
            continue;
          }
          blockId = res.data.id;
          b._id_block = blockId;
          b.id = blockId;
        } catch (e) {
          error.value = "Erreur création bloc.";
          continue;
        }
      }
      if (!blockId || typeof blockId !== "number") {
        continue;
      }
      try {
        await axios.put(
          `http://localhost:3000/api/blocks/${blockId}`,
          {
            position_block: b.position,
            type_block: b.type,
            content_text: b.content_text,
            url_media: b.url_media,
            caption: b.caption,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        error.value = "Erreur mise à jour bloc.";
        continue;
      }
    }
    if (scenarioDetails.value.introBlocks?.length) {
      const blockIds = scenarioDetails.value.introBlocks.map(
        (b) => b._id_block || b.id
      );
      await axios.put(
        `http://localhost:3000/api/scenarios/${scenarioId}/intro/blocks/reorder`,
        { blockIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    if (scenarioDetails.value.outroBlocks?.length) {
      const blockIds = scenarioDetails.value.outroBlocks.map(
        (b) => b._id_block || b.id
      );
      await axios.put(
        `http://localhost:3000/api/scenarios/${scenarioId}/outro/blocks/reorder`,
        { blockIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    for (const m of missions.value) {
      const missionId = m._id_mission || m.id;
      if (missionId && m.blocks?.length) {
        const reorderPayload = m.blocks
          .map((b, idx) => {
            const id = Number(b._id_block || b.id);
            const position = Number(idx);
            if (!Number.isFinite(id) || !Number.isFinite(position)) return null;
            return { id, position };
          })
          .filter(Boolean);
        if (reorderPayload.length) {
          await axios.put(
            `http://localhost:3000/api/missions/${missionId}/blocks/reorder`,
            reorderPayload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
    }
    await selectScenario(selectedScenario.value, token);
  }

  async function fetchScenarios(userId, token) {
    loading.value = true;
    error.value = "";
    try {
      const res = await axios.get(`${API_URL}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      scenarios.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      error.value = "Erreur de chargement des scénarios.";
    } finally {
      loading.value = false;
    }
  }

  async function selectScenario(s, token) {
    selectedScenario.value = s;
    scenarioDetails.value = null;
    detailsError.value = "";
    detailsLoading.value = true;
    try {
      const res = await axios.get(`${API_URL}/${s.id}/fullVue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      scenarioDetails.value = res.data;
      missions.value = scenarioDetails.value.missions.map((m, idx) => ({
        ...m,
        id: m._id_mission || m.id || idx + 1,
        title: m.title_mission || m.title,
        prerequisites: Array.isArray(m.prerequisites)
          ? m.prerequisites.map((p) =>
              typeof p === "object" && p._id_mission_required
                ? p._id_mission_required
                : p
            )
          : [],
        blocks: (m.blocks || m.mission_blocks || []).map((b) => ({
          ...b,
          type: b.type || b.type_block,
        })),
        _open: false,
      }));
      communes.value = scenarioDetails.value.communes || [];
      communes.value = (scenarioDetails.value.communes || []).map((c) => ({
        id: c.id ?? c._id_commune,
        name_fr: c.name_fr,
        name_nl: c.name_nl,
        name_de: c.name_de,
        ...c,
      }));
      scenarioDetails.value.introBlocks = (
        scenarioDetails.value.introBlocks ||
        scenarioDetails.value.intro_blocks ||
        []
      ).map((b) => ({
        ...b,
        type: b.type || b.type_block,
      }));
      scenarioDetails.value.outroBlocks = (
        scenarioDetails.value.outroBlocks ||
        scenarioDetails.value.outro_blocks ||
        []
      ).map((b) => ({
        ...b,
        type: b.type || b.type_block,
      }));
    } catch (e) {
      detailsError.value = "Erreur de chargement du détail du scénario.";
    } finally {
      detailsLoading.value = false;
    }
  }

  async function createScenario(title, userId, token) {
    try {
      const res = await axios.post(
        API_URL,
        { title_scenario: title, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      scenarios.value.push(res.data);
    } catch (e) {
      error.value = "Erreur lors de la création.";
    }
  }

  function reorderMissions(newOrder) {
    missions.value = [...newOrder];
    missions.value.forEach((mission, idx) => {
      mission.position = idx + 1;
    });
    scenarioDetails.value.missions = [...missions.value];
    // TODO: Appeler l'API pour sauvegarder l'ordre si nécessaire
  }

  async function saveScenario(status) {
    if (!scenarioDetails.value || !selectedScenario.value) return;
    const scenarioId = selectedScenario.value.id;
    const payload = {
      ...scenarioDetails.value.scenario,
      status,
      missions: missions.value.map((m) => {
        const { _open, ...rest } = m;
        return rest;
      }),
      communes: communes.value,
    };
    try {
      await axios.put(`${API_URL}/${scenarioId}`, payload);
      await selectScenario(selectedScenario.value);
    } catch (e) {
      error.value = "Erreur lors de la sauvegarde.";
    }
  }

  function setSelectedCommunes(communeIds) {
    let shapes = [];
    try {
      shapes = require("@/src/pages/scenarios.vue").communeShapes?.value || [];
    } catch (e) {
      if (
        typeof window !== "undefined" &&
        window.communeShapes &&
        window.communeShapes.length
      ) {
        shapes = window.communeShapes;
      }
    }
    communes.value = communeIds.map((id) => {
      const shape = shapes.find((c) => String(c.id) === String(id));
      return shape && shape.geojson?.properties?.name_fr
        ? { id, name_fr: shape.geojson.properties.name_fr }
        : { id, name_fr: `Commune ${id}` };
    });
    if (scenarioDetails.value) {
      scenarioDetails.value.communes = communes.value;
    }
  }

  return {
    scenarios,
    loading,
    error,
    selectedScenario,
    scenarioDetails,
    detailsLoading,
    detailsError,
    missions,
    communes,
    fetchScenarios,
    selectScenario,
    createScenario,
    reorderMissions,
    saveScenario,
    setSelectedCommunes,
    saveScenarioFull,
    deletedMissionIds,
    deletedBlockIds,
  };
});
