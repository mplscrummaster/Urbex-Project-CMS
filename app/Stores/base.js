import { defineStore } from "pinia";

export const useBaseStore = defineStore("base", {
  state: () => ({
    variable: "value",
  }),
  getters: {
    getVariable: (state) => state.variable,
  },
  actions: {
    setVariable(newValue) {
      this.variable = newValue;
    },
  },
});
