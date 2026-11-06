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
  background: linear-gradient(135deg, #0f1e33 0%, #1e3a5f 100%);
}
</style>
