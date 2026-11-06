<template>
  <div class="login-left">
    <div class="diamond-grid" aria-hidden="true">
      <span class="tile tile--1" />
      <span class="tile tile--2" />
      <span class="tile tile--3" />
      <span class="tile tile--4" />
    </div>

    <div class="brand-content">
      <svg
        class="iso-logo"
        viewBox="0 0 88 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- Sombra/acento teal en barras superior, media e inferior -->
        <polygon points="30,16 64,16 58,22 24,22" fill="#14b8a6" fill-opacity="0.35" />
        <polygon points="50,22 64,16 64,26 50,32" fill="#0d9488" fill-opacity="0.75" />
        <polygon points="24,66 58,66 64,72 30,72" fill="#0d9488" fill-opacity="0.65" />
        <!-- Hoja/acento curvo teal central -->
        <path
          d="M36 44C42 36 54 36 60 42C54 50 42 50 36 44Z"
          fill="url(#tealLeaf)"
        />
        <!-- Estructura isométrica blanca en E -->
        <path
          d="M24 22L32 14H66V24L58 32H36V40H54L60 44L54 50H36V58H58L66 66V74H32L24 66V22Z"
          stroke="#f8fafc"
          stroke-width="2.2"
          stroke-linejoin="round"
        />
        <path
          d="M32 14V66M24 22H58M24 66H58M24 44L36 40"
          stroke="#cbd5e1"
          stroke-width="1.5"
          stroke-opacity="0.7"
        />
        <defs>
          <linearGradient id="tealLeaf" x1="36" y1="36" x2="60" y2="50" gradientUnits="userSpaceOnUse">
            <stop stop-color="#2dd4bf" />
            <stop offset="1" stop-color="#0f766e" />
          </linearGradient>
        </defs>
      </svg>

      <h2>
        Impulsando el flujo de<br />
        trabajo de tu empresa
      </h2>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-left {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 75% 45%, #17375e 0%, #0c1f38 55%, #071324 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px;
}

.diamond-grid {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      45deg,
      rgba(148, 163, 184, 0.08) 0,
      rgba(148, 163, 184, 0.08) 1px,
      transparent 1px,
      transparent 68px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(148, 163, 184, 0.08) 0,
      rgba(148, 163, 184, 0.08) 1px,
      transparent 1px,
      transparent 68px
    );
  pointer-events: none;
}

.tile {
  position: absolute;
  width: 67px;
  height: 67px;
  transform: rotate(45deg);
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.38), rgba(15, 118, 110, 0.05));
  border: 1px solid rgba(45, 212, 191, 0.22);

  &--1 { top: 11%; left: 16%; }
  &--2 { top: 26%; left: 5%; opacity: 0.7; }
  &--3 { top: 58%; left: 2%; opacity: 0.55; }
  &--4 { bottom: 9%; left: 11%; opacity: 0.85; }
}

.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  h2 {
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.28;
    color: #f8fafc;
    margin: 0;
  }
}

.iso-logo {
  width: 82px;
  height: 82px;
  margin-bottom: 22px;
  filter: drop-shadow(0 8px 20px rgba(15, 118, 110, 0.25));
}
</style>

