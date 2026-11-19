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
        <polygon points="30,16 64,16 58,22 24,22" fill="#84BCA5" fill-opacity="0.32" />
        <polygon points="50,22 64,16 64,26 50,32" fill="#215B48" fill-opacity="0.85" />
        <polygon points="24,66 58,66 64,72 30,72" fill="#065F46" fill-opacity="0.7" />
        <path
          d="M36 44C42 36 54 36 60 42C54 50 42 50 36 44Z"
          fill="url(#sageLeaf)"
        />
        <path
          d="M24 22L32 14H66V24L58 32H36V40H54L60 44L54 50H36V58H58L66 66V74H32L24 66V22Z"
          stroke="#EDF2EF"
          stroke-width="2.2"
          stroke-linejoin="round"
        />
        <path
          d="M32 14V66M24 22H58M24 66H58M24 44L36 40"
          stroke="#95A29C"
          stroke-width="1.5"
          stroke-opacity="0.6"
        />
        <defs>
          <linearGradient id="sageLeaf" x1="36" y1="36" x2="60" y2="50" gradientUnits="userSpaceOnUse">
            <stop stop-color="#98CBB5" />
            <stop offset="1" stop-color="#065F46" />
          </linearGradient>
        </defs>
      </svg>

      <span class="brand-pill">HelpDesk TI · Precision Operations</span>

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
  background: radial-gradient(circle at 75% 40%, #152821 0%, #0D1512 58%, #0A0D0C 100%);
  color: #EDF2EF;
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
      rgba(132, 188, 165, 0.06) 0,
      rgba(132, 188, 165, 0.06) 1px,
      transparent 1px,
      transparent 68px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(132, 188, 165, 0.06) 0,
      rgba(132, 188, 165, 0.06) 1px,
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
  background: linear-gradient(135deg, rgba(132, 188, 165, 0.16), rgba(6, 95, 70, 0.05));
  border: 1px solid rgba(132, 188, 165, 0.16);

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
    font-size: 1.95rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.28;
    color: #EDF2EF;
    margin: 0;
  }
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(132, 188, 165, 0.12);
  border: 1px solid rgba(132, 188, 165, 0.24);
  color: #98CBB5;
  margin-bottom: 16px;
}

.iso-logo {
  width: 82px;
  height: 82px;
  margin-bottom: 20px;
}
</style>
