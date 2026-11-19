<template>
  <div class="fullscreen text-white text-center q-pa-md flex flex-center not-found">
    <div>
      <div style="font-size: 30vh">404</div>

      <div class="text-h2" style="opacity: 0.4">Oops. Nothing here...</div>

      <q-btn
        class="q-mt-xl"
        color="primary"
        unelevated
        to="/"
        label="Go Home"
        no-caps
        :ripple="false"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  background: radial-gradient(circle at 75% 40%, #152821 0%, #0d1512 58%, #0a0d0c 100%);
}
</style>
