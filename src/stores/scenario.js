/**
 * Publication complète du scénario (missions, blocs, communes, etc.)
 * @param {string} status - 'published' ou autre
 * @param {string} token - JWT utilisateur
 * @returns {Promise<void>}
 */
/**
 * Normalise une commune reçue de l'API
 * @param {object} c
 * @returns {object}
 */
const mapCommune = (c) => ({
  id: c.id ?? c._id_commune,
  name_fr:
    c.geojson?.properties?.name_fr ||
    c.name_fr ||
    `Commune ${c.id ?? c._id_commune}`,
  name_nl: c.name_nl,
  name_de: c.name_de,
  ...c,
});
// --- Gestion centralisée des erreurs ---
const handleApiError = (e, context = "") => {
  console.error(`Erreur ${context}:`, e);
  error.value = `Erreur ${context}`;
};
// --- Helpers ---
/**
 * Normalise une mission reçue de l'API
 */
const mapMission = (m, idx) => ({
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
  blocks: (m.blocks || m.mission_blocks || []).map(mapBlock),
  _open: false,
});

/**
 * Normalise un bloc reçu de l'API
 */
const mapBlock = (b) => ({
  ...b,
  type: b.type || b.type_block,
});
import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useScenarioStore = defineStore("scenario", () => {
  /**
   * @type {import('vue').Ref<Array>} scenarios - Liste des scénarios
   */
  const scenarios = ref([]);
  /**
   * @type {import('vue').Ref<Boolean>} loading - Indique si les scénarios sont en cours de chargement
   */
  const loading = ref(false);
  /**
   * @type {import('vue').Ref<String>} error - Message d'erreur éventuel
   */
  const error = ref("");
  /**
   * @type {import('vue').Ref<Object|null>} selectedScenario - Scénario actuellement sélectionné
   */
  const selectedScenario = ref(null);
  /**
   * @type {import('vue').Ref<Object|null>} scenarioDetails - Détail du scénario sélectionné
   */
  const scenarioDetails = ref(null);
  /**
   * @type {import('vue').Ref<Boolean>} detailsLoading - Indique si le détail du scénario est en cours de chargement
   */
  const detailsLoading = ref(false);
  /**
   * @type {import('vue').Ref<String>} detailsError - Message d'erreur du détail
   */
  const detailsError = ref("");
  /**
   * @type {import('vue').Ref<Array>} missions - Liste des missions du scénario
   */
  const missions = ref([]);
  /**
   * @type {import('vue').Ref<Array>} communes - Liste des communes sélectionnées
   */
  const communes = ref([]);
  /**
   * @type {import('vue').Ref<String>} communeError - Message d'erreur lié aux communes
   */
  const communeError = ref("");
  const API_URL = "https://michonmaximilien.dev/urbex-api/api/scenarios";
  /**
   * @type {import('vue').Ref<Array>} deletedMissionIds - Identifiants des missions supprimées
   */
  const deletedMissionIds = ref([]);
  /**
   * @type {import('vue').Ref<Array>} deletedBlockIds - Identifiants des blocs supprimés
   */
  const deletedBlockIds = ref([]);

  // Ajoute une commune par nom (case insensitive, max 3)
  const addCommune = (name, shapes) => {
    if (!name || !shapes) return;
    const input = name.trim().toLowerCase();
    const found = shapes.find((c) => {
      const n = c.geojson?.properties?.name_fr
        ?.toLowerCase()
        .replace(/\s+/g, "");
      return n === input.replace(/\s+/g, "");
    });
    if (!found) {
      communeError.value = "Commune introuvable.";
      return;
    }
    if (communes.value.some((c) => String(c.id) === String(found.id))) {
      communeError.value = "Commune déjà sélectionnée.";
      return;
    }
    if (communes.value.length >= 3) {
      communeError.value = "Maximum 3 communes.";
      return;
    }
    communes.value.push(mapCommune(found));
    communeError.value = "";
  };

  // Supprime une commune par id
  const removeCommune = (id) => {
    communes.value = communes.value.filter((c) => String(c.id) !== String(id));
    if (scenarioDetails.value) {
      scenarioDetails.value.communes = communes.value;
    }
    communeError.value = "";
  };

  // Vérifie si une commune est sélectionnée
  const isCommuneSelected = (id) => {
    return communes.value.some((c) => String(c.id) === String(id));
  };

  // Retourne le nom d'une commune
  const getCommuneName = (id, shapes) => {
    const shape = shapes.find((c) => String(c.id) === String(id));
    return shape?.geojson?.properties?.name_fr || `Commune ${id}`;
  };

  const saveScenarioFull = async (status, token) => {
    // --- Publication complète du scénario ---
    // Suppression missions et blocs supprimés côté front
    if (deletedMissionIds.value?.length) {
      for (const missionId of deletedMissionIds.value) {
        try {
          await axios.delete(
            `https://michonmaximilien.dev/urbex-api/api/missions/${missionId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (e) {
          handleApiError(e, `suppression mission ${missionId}`);
        }
      }
      deletedMissionIds.value = [];
    }
    if (deletedBlockIds.value?.length) {
      for (const blockId of deletedBlockIds.value) {
        try {
          await axios.delete(
            `https://michonmaximilien.dev/urbex-api/api/blocks/${blockId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (e) {
          handleApiError(e, `suppression bloc ${blockId}`);
        }
      }
      deletedBlockIds.value = [];
    }
    if (!scenarioDetails.value || !selectedScenario.value) return;
    const scenarioId = selectedScenario.value.id;
    // 1. Créer toutes les missions manquantes (async/await sur chaque POST)
    for (const m of missions.value) {
      if (!m._id_mission) {
        try {
          const res = await axios.post(
            `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioId}/missions`,
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
          if (res.data && res.data.id) {
            m._id_mission = res.data.id;
            m.id = res.data.id;
          }
        } catch (e) {
          handleApiError(e, `création mission ${m.title}`);
        }
      }
    }
    // 2. Créer tous les blocs manquants (après que toutes les missions aient un id)
    const allBlocksToCreate = [
      ...(scenarioDetails.value.introBlocks || []),
      ...(scenarioDetails.value.outroBlocks || []),
      ...missions.value.flatMap((m) => m.blocks || []),
    ];
    for (const b of allBlocksToCreate) {
      let ownerType = b.owner_type || b.type_owner;
      if (!ownerType && b._id_mission) ownerType = "mission";
      if (!ownerType && b._id_scenario) ownerType = "scenario_intro";
      let missionId = b._id_mission || b.mission_id;
      let scenarioIdBlock = b._id_scenario || scenarioId;
      let blockId = b._id_block || b.id;
      // Si le bloc n'a pas d'id backend, on le crée
      if (!b._id_block) {
        try {
          let res;
          if (ownerType === "scenario_intro") {
            res = await axios.post(
              `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioIdBlock}/intro/blocks`,
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
              `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioIdBlock}/outro/blocks`,
              {
                position_block: b.position,
                type_block: b.type,
                content_text: b.content_text,
                url_media: b.url_media,
                caption: b.caption,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else if (ownerType === "mission") {
            // missionId doit être à jour
            res = await axios.post(
              `https://michonmaximilien.dev/urbex-api/api/missions/${
                b._id_mission || b.mission_id
              }/blocks`,
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
          if (res?.data?.id) {
            b._id_block = res.data.id;
            b.id = res.data.id;
          }
        } catch (e) {
          error.value = "Erreur création bloc.";
          continue;
        }
      }
    }
    // 3. Mettre à jour toutes les missions
    for (const m of missions.value) {
      const missionId = m._id_mission || m.id;
      if (!missionId) continue;
      await axios.put(
        `https://michonmaximilien.dev/urbex-api/api/missions/${missionId}`,
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
    // 3. Mettre à jour les prérequis
    for (const m of missions.value) {
      const missionId = m._id_mission || m.id;
      if (!missionId) continue;
      await axios.put(
        `https://michonmaximilien.dev/urbex-api/api/missions/${missionId}/prerequisites`,
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
      `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioId}/missions/reorder`,
      missions.value.map((m, idx) => ({
        id: m._id_mission || m.id,
        position: idx + 1,
      })),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // 5. Mettre à jour les communes
    await axios.post(
      `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioId}/communes`,
      {
        commune_ids: communes.value.map((c) => c.id),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // 6. Créer tous les blocs manquants
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
      // Si le bloc n'a pas d'id backend, on le crée
      if (!b._id_block) {
        try {
          let res;
          if (ownerType === "scenario_intro") {
            res = await axios.post(
              `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioIdBlock}/intro/blocks`,
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
              `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioIdBlock}/outro/blocks`,
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
              `https://michonmaximilien.dev/urbex-api/api/missions/${missionId}/blocks`,
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
          if (res?.data?.id) {
            b._id_block = res.data.id;
            b.id = res.data.id;
          }
        } catch (e) {
          error.value = "Erreur création bloc.";
          continue;
        }
      }
      // Mettre à jour le bloc (PUT)
      if (b._id_block) {
        try {
          await axios.put(
            `https://michonmaximilien.dev/urbex-api/api/blocks/${b._id_block}`,
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
    }
    // 7. Réordonner les blocs intro/outro/missions
    if (scenarioDetails.value.introBlocks?.length) {
      const blockIds = scenarioDetails.value.introBlocks.map(
        (b) => b._id_block || b.id
      );
      await axios.put(
        `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioId}/intro/blocks/reorder`,
        { blockIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    if (scenarioDetails.value.outroBlocks?.length) {
      const blockIds = scenarioDetails.value.outroBlocks.map(
        (b) => b._id_block || b.id
      );
      await axios.put(
        `https://michonmaximilien.dev/urbex-api/api/scenarios/${scenarioId}/outro/blocks/reorder`,
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
            `https://michonmaximilien.dev/urbex-api/api/missions/${missionId}/blocks/reorder`,
            reorderPayload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
    }
    await selectScenario(selectedScenario.value, token);
  };

  const fetchScenarios = async (userId, token) => {
    /**
     * Récupère tous les scénarios de l'utilisateur
     * @param {string|number} userId
     * @param {string} token
     * @returns {Promise<void>}
     */
    // --- Récupère tous les scénarios de l'utilisateur ---
    loading.value = true;
    error.value = "";
    try {
      const res = await axios.get(`${API_URL}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      scenarios.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      handleApiError(e, "chargement des scénarios");
    } finally {
      loading.value = false;
    }
  };

  const selectScenario = async (s, token) => {
    /**
     * Sélectionne et charge un scénario complet
     * @param {object} s - Scénario
     * @param {string} token
     * @returns {Promise<void>}
     */
    selectedScenario.value = s;
    scenarioDetails.value = null;
    detailsError.value = "";
    detailsLoading.value = true;
    try {
      const res = await axios.get(`${API_URL}/${s.id}/fullVue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      scenarioDetails.value = res.data;
      missions.value = scenarioDetails.value.missions.map(mapMission);
      communes.value = (scenarioDetails.value.communes || []).map(mapCommune);
      scenarioDetails.value.introBlocks = (
        scenarioDetails.value.introBlocks ||
        scenarioDetails.value.intro_blocks ||
        []
      ).map(mapBlock);
      scenarioDetails.value.outroBlocks = (
        scenarioDetails.value.outroBlocks ||
        scenarioDetails.value.outro_blocks ||
        []
      ).map(mapBlock);
    } catch (e) {
      handleApiError(e, "chargement du détail du scénario");
      detailsError.value = "Erreur de chargement du détail du scénario.";
    } finally {
      detailsLoading.value = false;
    }
  };

  const createScenario = async (title, userId, token) => {
    /**
     * Crée un nouveau scénario
     * @param {string} title
     * @param {string|number} userId
     * @param {string} token
     * @returns {Promise<void>}
     */
    // --- Crée un nouveau scénario ---
    try {
      const res = await axios.post(
        API_URL,
        { title_scenario: title, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      scenarios.value.push(res.data);
    } catch (e) {
      handleApiError(e, "création scénario");
    }
  };

  const reorderMissions = (newOrder) => {
    /**
     * Réordonne les missions localement
     * @param {Array} newOrder
     * @returns {void}
     */
    // --- Réordonne les missions localement ---
    missions.value = [...newOrder];
    missions.value.forEach((mission, idx) => {
      mission.position = idx + 1;
    });
    scenarioDetails.value.missions = [...missions.value];
    // TODO: Appeler l'API pour sauvegarder l'ordre si nécessaire
  };

  const saveScenario = async (status) => {
    /**
     * Sauvegarde rapide du scénario (sans suppression)
     * @param {string} status
     * @returns {Promise<void>}
     */
    // --- Sauvegarde rapide du scénario (sans suppression) ---
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
      handleApiError(e, "sauvegarde scénario");
    }
  };

  const setSelectedCommunes = (communeIds) => {
    /**
     * Met à jour la sélection des communes
     * @param {Array} communeIds
     * @returns {void}
     */
    // --- Met à jour la sélection des communes ---
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
      return shape ? mapCommune(shape) : { id, name_fr: `Commune ${id}` };
    });
    if (scenarioDetails.value) {
      scenarioDetails.value.communes = communes.value;
    }
  };

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
    communeError,
    addCommune,
    removeCommune,
    isCommuneSelected,
    getCommuneName,
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
