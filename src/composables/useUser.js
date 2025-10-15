import { ref } from "vue";

export function useUser() {
  const user = ref(null);
  const token = ref(null);
  const isClientReady = ref(false);

  function loadUserAndToken() {
    if (typeof window !== "undefined") {
      const userStr = window.localStorage.getItem("user");
      if (userStr) {
        try {
          user.value = JSON.parse(userStr);
        } catch (e) {
          user.value = null;
        }
      }
      token.value = window.localStorage.getItem("token");
      isClientReady.value = true;
    }
  }

  function setUser(newUser) {
    user.value = newUser;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("user", JSON.stringify(newUser));
    }
  }

  function setToken(newToken) {
    token.value = newToken;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", newToken);
    }
  }

  return {
    user,
    token,
    isClientReady,
    loadUserAndToken,
    setUser,
    setToken,
  };
}
