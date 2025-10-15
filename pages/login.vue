<template>
  <div class="login-page">
    <h2>Connexion scénariste</h2>
    <form @submit.prevent="login">
      <input v-model="mail" type="email" placeholder="Email" required />
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        required
      />
      <button type="submit">Se connecter</button>
    </form>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const mail = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

async function login() {
  error.value = "";
  try {
    const res = await axios.post("http://localhost:3000/api/login", {
      mail_user: mail.value,
      password_user: password.value,
    });
    const data = res.data;
    console.log("Réponse API login:", data);
    localStorage.setItem("token", data.token);
    // Crée un objet user à partir des champs reçus
    const userObj = {
      id: data.id,
      username: data.username_user,
      mail: data.mail_user,
      role: data.role_user,
    };
    localStorage.setItem("user", JSON.stringify(userObj));
    // Debug: log ce qui est stocké
    console.log("user localStorage:", localStorage.getItem("user"));
    console.log("token localStorage:", localStorage.getItem("token"));
    router.push("/scenarios");
  } catch (e) {
    error.value = "Identifiants invalides ou erreur serveur.";
  }
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 3rem auto;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}
.error {
  color: #dc2626;
  margin-top: 1rem;
}
</style>
