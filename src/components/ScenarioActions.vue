<template>
  <div class="scenario-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
    <button @click="$emit('cancel')" class="btn-cancel">Annuler</button>
    <button @click="$emit('saveDraft')" class="btn-draft">Sauvegarder en brouillon</button>
    <button @click="$emit('savePublish')" class="btn-publish">
      {{ isPublished ? "Mettre à jour la publication" : "Sauvegarder et publier" }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  isPublished: Boolean
});
</script>

<style scoped>
.scenario-actions .btn-cancel {
  background: #e3e7f7;
  color: #183a5a;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
}
.scenario-actions .btn-draft {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
}
.scenario-actions .btn-publish {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
}
</style>
