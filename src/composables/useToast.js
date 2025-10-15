import { ref } from "vue";

export function useToast(duration = 2500) {
  const toastMsg = ref("");
  let timeoutId = null;

  function showToast(msg) {
    toastMsg.value = msg;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      toastMsg.value = "";
    }, duration);
  }

  return { toastMsg, showToast };
}
