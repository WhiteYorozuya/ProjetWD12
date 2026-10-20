<template>
  <div>
    <h1>Page introuvable</h1>
    <p>Cette adresse ne correspond à aucune page. Le matériel ou le poste a peut-être été supprimé.</p>
    <RouterLink :to="{ name: 'tableau-de-bord' }" class="btn">Retour au tableau de bord</RouterLink>
  </div>
</template>
