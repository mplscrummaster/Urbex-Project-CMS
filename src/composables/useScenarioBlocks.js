import { ref } from "vue";
import axios from "axios";

export function useScenarioBlocks(store, token, showToast) {
  const showIntroAddMenu = ref(false);
  const showOutroAddMenu = ref(false);

  async function addBlock(section, type, mission = null) {
    const payload = {
      position_block: 1,
      type_block: type,
      content_text: "",
      url_media: "",
      caption: "",
    };
    let res;
    try {
      if (section === "intro") {
        res = await axios.post(
          `http://localhost:3000/api/scenarios/${store.selectedScenario.id}/intro/blocks`,
          payload,
          { headers: { Authorization: `Bearer ${token.value}` } }
        );
        if (res?.data?.id) {
          store.scenarioDetails.introBlocks = [
            ...store.scenarioDetails.introBlocks,
            {
              ...payload,
              id: res.data.id,
              _id_block: res.data.id,
              type: type,
            },
          ];
        }
        showIntroAddMenu.value = false;
      } else if (section === "outro") {
        res = await axios.post(
          `http://localhost:3000/api/scenarios/${store.selectedScenario.id}/outro/blocks`,
          payload,
          { headers: { Authorization: `Bearer ${token.value}` } }
        );
        if (res?.data?.id) {
          store.scenarioDetails.outroBlocks = [
            ...store.scenarioDetails.outroBlocks,
            {
              ...payload,
              id: res.data.id,
              _id_block: res.data.id,
              type: type,
            },
          ];
        }
        showOutroAddMenu.value = false;
      } else if (section === "mission" && mission) {
        res = await axios.post(
          `http://localhost:3000/api/missions/${
            mission._id_mission || mission.id
          }/blocks`,
          payload,
          { headers: { Authorization: `Bearer ${token.value}` } }
        );
        if (res?.data?.id) {
          if (!mission.blocks) mission.blocks = [];
          mission.blocks.push({
            ...payload,
            id: res.data.id,
            _id_block: res.data.id,
            type: type,
          });
        }
        mission._showAddMenu = false;
      }
    } catch (e) {
      showToast("Erreur lors de la création du bloc.");
    }
  }

  function removeBlock(section, blockId, mission = null) {
    if (section === "intro") {
      store.scenarioDetails.introBlocks =
        store.scenarioDetails.introBlocks.filter((b) => {
          const realId = b._id_block || b.id;
          if (realId === blockId) store.deletedBlockIds.push(realId);
          return realId !== blockId;
        });
    } else if (section === "outro") {
      store.scenarioDetails.outroBlocks =
        store.scenarioDetails.outroBlocks.filter((b) => {
          const realId = b._id_block || b.id;
          if (realId === blockId) store.deletedBlockIds.push(realId);
          return realId !== blockId;
        });
    } else if (section === "mission" && mission) {
      mission.blocks = mission.blocks.filter((b) => {
        const realId = b._id_block || b.id;
        if (realId === blockId) store.deletedBlockIds.push(realId);
        return realId !== blockId;
      });
    }
  }

  return {
    showIntroAddMenu,
    showOutroAddMenu,
    addBlock,
    removeBlock,
  };
}
