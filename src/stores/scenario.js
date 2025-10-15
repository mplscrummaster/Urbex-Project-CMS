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

  async function saveScenarioFull(status, token) {
    if (!scenarioDetails.value || !selectedScenario.value) return;
    const scenarioId = selectedScenario.value.id;
    console.log("Token utilisé pour la requête:", token);
    // 1. Mettre à jour le scénario (titre, statut)
    await axios.put(
      `${API_URL}/${scenarioId}`,
      {
        title_scenario: scenarioDetails.value.title_scenario,
        is_published: status === "published" ? 1 : 0,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 2. Mettre à jour les missions
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

    // 3. Mettre à jour les prérequis des missions
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

    // 4. Mettre à jour l'ordre des missions
    await axios.put(
      `http://localhost:3000/api/scenarios/${scenarioId}/missions/reorder`,
      missions.value.map((m, idx) => ({
        id: m._id_mission || m.id,
        position: idx + 1,
      })),
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 5. Mettre à jour les communes liées
    await axios.post(
      `http://localhost:3000/api/scenarios/${scenarioId}/communes`,
      {
        commune_ids: communes.value.map((c) => c.id),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 6. Mettre à jour les blocs (intro, outro, mission)
    const allBlocks = [
      ...(scenarioDetails.value.introBlocks || []),
      ...(scenarioDetails.value.outroBlocks || []),
      ...missions.value.flatMap((m) => m.blocks || []),
    ];
    for (const b of allBlocks) {
      let blockId = b._id_block || b.id;
      // Si l'id est temporaire (pas un entier), créer le bloc
      console.log("typeof blockId ", typeof blockId);

      if (!blockId || typeof blockId !== "number") {
        try {
          let res;
          if (b.owner_type === "scenario_intro") {
            console.log(
              "POST bloc intro",
              `http://localhost:3000/api/scenarios/${scenarioId}/intro/blocks`,
              b
            );
            res = await axios.post(
              `http://localhost:3000/api/scenarios/${scenarioId}/intro/blocks`,
              {
                position_block: b.position,
                type_block: b.type,
                content_text: b.content_text,
                url_media: b.url_media,
                caption: b.caption,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else if (b.owner_type === "scenario_outro") {
            console.log(
              "POST bloc outro",
              `http://localhost:3000/api/scenarios/${scenarioId}/outro/blocks`,
              b
            );
            res = await axios.post(
              `http://localhost:3000/api/scenarios/${scenarioId}/outro/blocks`,
              {
                position_block: b.position,
                type_block: b.type,
                content_text: b.content_text,
                url_media: b.url_media,
                caption: b.caption,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else if (b.owner_type === "mission" && b._id_mission) {
            console.log(
              "POST bloc mission",
              `http://localhost:3000/api/missions/${b._id_mission}/blocks`,
              b
            );
            res = await axios.post(
              `http://localhost:3000/api/missions/${b._id_mission}/blocks`,
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
            console.error("Type de bloc inconnu ou mission manquante", b);
            error.value = "Type de bloc inconnu ou mission manquante.";
            continue;
          }
          console.log("Réponse POST bloc:", res?.data, b);
          if (!res?.data?.id || typeof res.data.id !== "number") {
            console.error("POST bloc n'a pas renvoyé d'id réel", res?.data, b);
            error.value = "Erreur création bloc : id non retourné.";
            continue;
          }
          blockId = res.data.id;
          b._id_block = blockId;
          b.id = blockId;
        } catch (e) {
          console.error("Erreur création bloc POST", b, e);
          error.value = "Erreur création bloc.";
          continue;
        }
      }
      if (!blockId || typeof blockId !== "number") {
        console.error("PUT ignoré : id bloc non valide", b);
        continue;
      }
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
    }

    // 7. Mettre à jour l'ordre des blocs
    if (scenarioDetails.value.introBlocks?.length) {
      await axios.put(
        `http://localhost:3000/api/scenarios/${scenarioId}/intro/blocks/reorder`,
        {
          blockIds: scenarioDetails.value.introBlocks.map(
            (b) => b._id_block || b.id
          ),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    if (scenarioDetails.value.outroBlocks?.length) {
      await axios.put(
        `http://localhost:3000/api/scenarios/${scenarioId}/outro/blocks/reorder`,
        {
          blockIds: scenarioDetails.value.outroBlocks.map(
            (b) => b._id_block || b.id
          ),
        },
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
    // Optionnel: recharger le détail pour refléter la sauvegarde
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
      missions.value = scenarioDetails.value.missions.map((m) => ({
        ...m,
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
      // Correction: si l'id est absent, utiliser _id_commune
      communes.value = (scenarioDetails.value.communes || []).map((c) => ({
        id: c.id ?? c._id_commune,
        name_fr: c.name_fr,
        name_nl: c.name_nl,
        name_de: c.name_de,
        ...c,
      }));
      // Correction mapping intro/outro blocks
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
      // Optionnel: recharger le détail pour refléter la sauvegarde
      await selectScenario(selectedScenario.value);
    } catch (e) {
      error.value = "Erreur lors de la sauvegarde.";
    }
  }

  function setSelectedCommunes(communeIds) {
    // Récupère le vrai nom depuis communeShapes si possible
    let shapes = [];
    try {
      // Accès direct à communeShapes depuis le module principal
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
  };
});
