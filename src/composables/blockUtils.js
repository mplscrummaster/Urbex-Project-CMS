// src/composables/blockUtils.js
// Utilitaires pour la gestion des blocs de scénario

export function isBlockEmpty(block) {
  if (!block) return true;
  if (block.type === "text") {
    return !block.content_text || block.content_text.trim() === "";
  }
  if (["image", "video", "audio"].includes(block.type)) {
    return !block.url_media || block.url_media.trim() === "";
  }
  return false;
}

export const blockUtils = {
  getIntroBlocks(details) {
    return details.introBlocks || details.intro_blocks || [];
  },
  getOutroBlocks(details) {
    return details.outroBlocks || details.outro_blocks || [];
  },
  getMissionBlocks(mission) {
    return mission.blocks || mission.mission_blocks || [];
  },
};
