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

  async function fetchScenarios(userId, token) {
    loading.value = true;
    error.value = "";
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId },
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
      const res = await axios.get(`${API_URL}/${s.id}/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      scenarioDetails.value = res.data;
      missions.value = scenarioDetails.value.missions.map((m) => ({
        ...m,
        _open: false,
      }));
      communes.value = scenarioDetails.value.communes || [];
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
  };
});
