<template>
  <div
    class="scenario-actions"
    style="
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    "
  >
    <button @click="$emit('cancel')" class="btn-cancel">Annuler</button>
    <button @click="$emit('saveDraft')" class="btn-draft">
      Sauvegarder en brouillon
    </button>
    <button @click="$emit('savePublish')" class="btn-publish">
      {{
        isPublished ? "Mettre à jour la publication" : "Sauvegarder et publier"
      }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  isPublished: Boolean,
});
</script>

<style scoped>
.scenario-actions {
  background: transparent;
}
.scenario-actions .btn-cancel {
  background: #22476b;
  color: #e3e7f7;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.scenario-actions .btn-cancel:hover {
  background: #183a5a;
  color: #f59e0b;
}
.scenario-actions .btn-draft {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.scenario-actions .btn-draft:hover {
  background: #42a5f5;
}
.scenario-actions .btn-publish {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.scenario-actions .btn-publish:hover {
  background: #42a5f5;
}
</style>
