<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { CSSProperties } from "vue";
import HeartDoodle from "./components/HeartDoodle.vue";
import AnnotationLabel from "./components/AnnotationLabel.vue";
import RibbonTitle from "./components/RibbonTitle.vue";
import MonthCalendar from "./components/MonthCalendar.vue";
import SketchFrame from "./components/SketchFrame.vue";
import AppButton from "./components/AppButton.vue";
import VkLogo from "./components/VkLogo.vue";

/* ----------------------------------------------------------------------------
   "У НАС СВАДЬБА" garland — letter-cards hung on a sagging rope that threads
   through a punched hole at the top of each card.
---------------------------------------------------------------------------- */
type GarlandCard = { ch: string; x: number; rot: number; top: number; holeY: number };

const garland: GarlandCard[] = (() => {
  const chars = ["У", "Н", "А", "С", "С", "В", "А", "Д", "Ь", "Б", "А"];
  //          У │  Н   А   С  │  С   В   А   Д   Ь   Б   А
  // intra-word step 7, word gap 14 — a real space after "У" and after "НАС".
  const xs = [8, 22, 29, 36, 50, 57, 64, 71, 78, 85, 92];
  const rots = [-5, 4, -3, 5, -4, 3, -5, 4, -3, 5, -4];
  const A = 15;
  const baseTop = 12;
  const holeFromTop = 9;
  const cx = 50; // apex of the rope sag, centred on the new layout
  return chars.map((ch, i) => {
    const x = xs[i];
    const sag = Math.max(0, A * (1 - Math.pow((x - cx) / 42, 2)));
    const top = baseTop + sag;
    return { ch, x, rot: rots[i], top, holeY: top + holeFromTop };
  });
})();

/** Rope path (viewBox 0 0 1000 96) threaded through every hole centre. */
const ropePath = (() => {
  const first = garland[0];
  const last = garland[garland.length - 1];
  let d = `M0,${(first.holeY + 7).toFixed(1)} `;
  for (const g of garland) d += `L${(g.x * 10).toFixed(1)},${g.holeY.toFixed(1)} `;
  d += `L1000,${(last.holeY + 7).toFixed(1)}`;
  return d;
})();

/* ----------------------------------------------------------------------------
   Schedule — clicking a row jumps to the RSVP form and pre-fills the venue.
---------------------------------------------------------------------------- */
type Where = "" | "zags" | "banquet" | "both";
const schedule: { time: string; text: string; where: Exclude<Where, "" | "both"> }[] = [
  { time: "14:30", text: "Торжественная церемония в ЗАГСе Ленинского района", where: "zags" },
  { time: "15:30", text: "Сбор гостей в Paradise Halls", where: "banquet" },
  { time: "16:00", text: "Банкет", where: "banquet" },
  { time: "22:00", text: "Завершение вечера", where: "banquet" },
];

/* ----------------------------------------------------------------------------
   Dress-code / wedding palette (from color-palette.jpg)
---------------------------------------------------------------------------- */
const palette: { name: string; hex: string; light?: boolean }[] = [
  { name: "Тёмно-синий", hex: "#17212E" },
  { name: "Бордовый", hex: "#6E081F" },
  { name: "Тёмный шоколад", hex: "#2A1C13" },
  { name: "Горчичный", hex: "#C88D2A" },
  { name: "Пыльная роза", hex: "#C2A2A6", light: true },
  { name: "Оливковый", hex: "#8A9B61" },
  { name: "Пудрово-голубой", hex: "#C5D5D6", light: true },
  { name: "Винный", hex: "#4A1330" },
];

/* ----------------------------------------------------------------------------
   Live countdown to 19 September 2026, 14:30
---------------------------------------------------------------------------- */
const days = ref("00");
const hours = ref("00");
const mins = ref("00");
const secs = ref("00");
let timer: ReturnType<typeof setInterval> | undefined;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function tick() {
  const target = new Date(2026, 8, 19, 14, 30, 0).getTime();
  let diff = Math.max(0, target - Date.now());
  const DAY = 86_400_000;
  const HR = 3_600_000;
  const MN = 60_000;
  const d = Math.floor(diff / DAY);
  diff -= d * DAY;
  const h = Math.floor(diff / HR);
  diff -= h * HR;
  const m = Math.floor(diff / MN);
  diff -= m * MN;
  const s = Math.floor(diff / 1000);
  days.value = pad(d);
  hours.value = pad(h);
  mins.value = pad(m);
  secs.value = pad(s);
}

const countdown = computed(() => [
  { value: days.value, label: "Дней" },
  { value: hours.value, label: "Часов" },
  { value: mins.value, label: "Минут" },
  { value: secs.value, label: "Секунд" },
]);

onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);
  lastScrollY = window.scrollY;
  window.addEventListener("scroll", onScroll, { passive: true });
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
  window.removeEventListener("scroll", onScroll);
});

/* ----------------------------------------------------------------------------
   RSVP form
---------------------------------------------------------------------------- */
const name = ref("");
const coming = ref<"yes" | "no" | null>(null);
const where = ref<Where>("");
const companions = ref<string[]>([]);
const drinks = ref("");
const honeypot = ref(""); // spam trap — real guests never see/fill this
const sent = ref(false);
const sending = ref(false);
const failed = ref(false);
const attempted = ref(false); // a submit was tried — enables inline validation hints

/** Inline "плашка" shown when the guest taps Confirm before filling the form. */
const formHint = computed(() => {
  if (!attempted.value) return "";
  const noName = !name.value.trim();
  const noChoice = !coming.value;
  const noWhere = coming.value === "yes" && !where.value;
  if (noName && noChoice) return "Укажите имя и выберите: придёте или нет.";
  if (noChoice) return "Пожалуйста, выберите: придёте или нет.";
  if (noName) return "Пожалуйста, укажите своё имя.";
  if (noWhere) return "Пожалуйста, выберите, куда вы придёте.";
  return "";
});

/** Deployed Google Apps Script web-app URL; unset → local-only (dev) behaviour. */
const RSVP_ENDPOINT = import.meta.env.VITE_RSVP_ENDPOINT;

/** RSVP deadline — submissions close after the end of 15 July 2026. */
const deadlinePassed = Date.now() > new Date(2026, 6, 15, 23, 59, 59).getTime();

const whereLabels: Record<Where, string> = {
  "": "",
  zags: "ЗАГС",
  banquet: "Банкет",
  both: "ЗАГС и банкет",
};

const firstName = computed(() => name.value.trim().split(/\s+/)[0] || "друг");
const comingMsg = computed(() =>
  coming.value === "no"
    ? "Очень жаль… Надеемся, вы ещё передумаете!"
    : "Ждём вас с нетерпением!",
);

function chooseYes() {
  coming.value = "yes";
}
function chooseNo() {
  coming.value = "no";
}
function addCompanion() {
  companions.value.push("");
}
function removeCompanion(i: number) {
  companions.value.splice(i, 1);
}

async function submit() {
  if (sending.value) return;
  if (deadlinePassed) return; // submissions closed
  attempted.value = true;
  // name + attendance required; if coming, a venue choice is required too
  if (!name.value.trim() || !coming.value) return; // show inline hint instead
  if (coming.value === "yes" && !where.value) return; // must pick a venue
  failed.value = false;

  // honeypot filled → silently accept, send nothing (it's a bot)
  if (honeypot.value) {
    sent.value = true;
    return;
  }

  const isYes = coming.value === "yes";
  const payload = {
    name: name.value.trim(),
    coming: isYes ? "Придёт" : "Не придёт",
    where: isYes ? whereLabels[where.value] : "",
    companions: isYes ? companions.value.map((c) => c.trim()).filter(Boolean) : [],
    drinks: isYes ? drinks.value.trim() : "",
    submittedAt: new Date().toISOString(),
  };

  // No backend configured (e.g. local dev) → keep the local-only behaviour.
  if (!RSVP_ENDPOINT) {
    sent.value = true;
    return;
  }

  sending.value = true;
  try {
    // Apps Script web apps don't return CORS headers, so we send a no-cors
    // "simple" request (text/plain avoids a preflight). The response is opaque,
    // so a resolved fetch is treated as delivered; only network errors reject.
    await fetch(RSVP_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    sent.value = true;
  } catch (err) {
    console.error("RSVP submit failed:", err);
    failed.value = true;
  } finally {
    sending.value = false;
  }
}

function scrollToForm(target?: Exclude<Where, "" | "both">) {
  if (target) {
    coming.value = "yes";
    where.value = target;
  }
  document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });
}

const choiceBase = {
  width: "100%",
  padding: "12px 0",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "15px",
} as const;

function choiceStyle(selected: boolean) {
  return {
    ...choiceBase,
    background: selected ? "var(--accent)" : "var(--surface-sunken)",
    color: selected ? "#FBF9F4" : "var(--text-body)",
  };
}

/** Extra emoji shown on the submit button depending on the attendance choice. */
const submitEmoji = computed(() => {
  if (coming.value === "no") return "( ´•︵•` )";
  if (coming.value === "yes") return "\\^o^/";
  return "";
});

/* ----------------------------------------------------------------------------
   Celebratory fireworks shown on the "Спасибо" card when the guest is coming.
   Pure-CSS bursts: each burst fans out N sparks in the wedding palette.
---------------------------------------------------------------------------- */
const fireworkBursts = [
  { x: "20%", y: "26%", size: 64, delay: "0s", color: "var(--accent)" },
  { x: "78%", y: "20%", size: 56, delay: "0.45s", color: "#C88D2A" },
  { x: "50%", y: "44%", size: 72, delay: "0.9s", color: "#8A9B61" },
  { x: "30%", y: "62%", size: 52, delay: "1.35s", color: "#6E081F" },
  { x: "72%", y: "58%", size: 58, delay: "1.8s", color: "var(--accent)" },
];
const sparkCount = 14;

function sparkStyle(i: number, burst: (typeof fireworkBursts)[number]): CSSProperties {
  const angle = (i / sparkCount) * Math.PI * 2;
  return {
    "--tx": `${Math.cos(angle) * burst.size}px`,
    "--ty": `${Math.sin(angle) * burst.size}px`,
    background: burst.color,
    animationDelay: burst.delay,
  } as CSSProperties;
}

/* ----------------------------------------------------------------------------
   Mobile burger menu — hides on scroll-down, reappears on scroll-up
---------------------------------------------------------------------------- */
const menuOpen = ref(false);
const navHidden = ref(false);
const navItems = [
  { href: "#when", label: "Когда?", accent: false },
  { href: "#where", label: "Где?", accent: false },
  { href: "#dress", label: "Что надеть?", accent: false },
  { href: "#rsvp", label: "Хочу прийти", accent: true },
];

let lastScrollY = 0;
function onScroll() {
  const y = window.scrollY;
  if (y > lastScrollY && y > 90) {
    navHidden.value = true;
    menuOpen.value = false;
  } else if (y < lastScrollY) {
    navHidden.value = false;
  }
  lastScrollY = y;
}

/* ----------------------------------------------------------------------------
   Sticky bottom CTA — grows + swaps copy on hover
---------------------------------------------------------------------------- */
const hoverCta = ref(false);

/* ----------------------------------------------------------------------------
   Shared inline styles reused across sections
---------------------------------------------------------------------------- */
/** Public asset URL, base-path aware so it works under GitHub Pages subpaths. */
const logoUrl = `${import.meta.env.BASE_URL}photos/restaurant-logo.jpg`;
const heroPhotoUrl = `${import.meta.env.BASE_URL}photos/child-photo.png`;
const polaroidPhotoUrl = `${import.meta.env.BASE_URL}photos/polaroid-photo.jpg`;

/** VK links: the host's page (contacts) and the guest-chat invite. */
const vkPageUrl = "https://vk.ru/i_andreev_tut";
const vkChatUrl = "https://vk.me/join/IHKUr3ahSbEY93/1I/JdT751/9HQVXkFcB8=";
function openVkChat() {
  window.open(vkChatUrl, "_blank", "noopener");
}

const sectionTitleStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  color: "var(--text-heading)",
  fontSize: "clamp(2.2rem, 8vw, 3.4rem)",
  lineHeight: 1,
  margin: 0,
};
</script>

<template>
  <div
    :style="{
      backgroundColor: '#F5F1E9',
      backgroundImage: 'var(--paper-grain)',
      fontFamily: 'var(--font-body)',
      minHeight: '100vh',
      paddingBottom: '72px',
      overflowX: 'hidden',
    }"
  >
    <!-- ============ ANCHOR NAV ============ -->
    <nav class="nav" :class="{ 'nav--hidden': navHidden }">
      <!-- desktop: inline links -->
      <div class="nav__links">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="item.href"
          class="nav-link"
          :class="{ 'nav-link--accent': item.accent }"
          >{{ item.label }}</a
        >
      </div>

      <!-- mobile: burger -->
      <button
        type="button"
        class="nav__burger"
        :aria-expanded="menuOpen"
        aria-label="Меню"
        @click="menuOpen = !menuOpen"
      >
        <span :class="{ 'nav__burger-open': menuOpen }" />
        <span :class="{ 'nav__burger-open': menuOpen }" />
        <span :class="{ 'nav__burger-open': menuOpen }" />
      </button>

      <!-- mobile: dropdown drawer -->
      <transition name="drawer">
        <div v-if="menuOpen" class="nav__drawer">
          <a
            v-for="item in navItems"
            :key="item.href"
            :href="item.href"
            class="nav-link"
            :class="{ 'nav-link--accent': item.accent }"
            @click="menuOpen = false"
            >{{ item.label }}</a
          >
        </div>
      </transition>
    </nav>

    <!-- ============ HERO ============ -->
    <header
      :style="{
        textAlign: 'center',
        maxWidth: '980px',
        margin: '0 auto',
        padding: 'clamp(20px, 5vw, 52px) clamp(20px, 5vw, 40px) clamp(16px, 4vw, 32px)',
      }"
    >
      <!-- garland: letters hung on a rope -->
      <div class="garland">
        <svg class="garland__rope" viewBox="0 0 1000 96" preserveAspectRatio="none" aria-hidden="true">
          <path :d="ropePath" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke" />
        </svg>
        <div
          v-for="(g, i) in garland"
          :key="i"
          class="garland__card"
          :style="{ left: g.x + '%', top: g.top + 'px', transform: `translateX(-50%) rotate(${g.rot}deg)` }"
        >
          <span class="garland__hole" />
          {{ g.ch }}
        </div>
      </div>

      <h1
        :style="{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          fontSize: 'clamp(2.7rem, 11vw, 6rem)',
          lineHeight: 0.92,
          margin: 0,
        }"
      >
        Гордей&nbsp;+ Елизавета
      </h1>

      <!-- arrows + photo placeholder -->
      <div :style="{ position: 'relative', maxWidth: '640px', margin: 'clamp(8px,2vw,16px) auto 0' }">
        <div
          :style="{
            position: 'absolute',
            top: 'clamp(8px,3vw,18px)',
            left: 'clamp(4px,3vw,26px)',
            transform: 'rotate(-8deg)',
            zIndex: 3,
          }"
        >
          <AnnotationLabel direction="down-left">невеста</AnnotationLabel>
        </div>
        <div
          :style="{
            position: 'absolute',
            top: 'clamp(8px,3vw,18px)',
            right: 'clamp(4px,3vw,26px)',
            transform: 'rotate(8deg)',
            zIndex: 3,
          }"
        >
          <AnnotationLabel direction="down-right">жених</AnnotationLabel>
        </div>
        <div
          :style="{
            position: 'absolute',
            top: 'clamp(58px,18vw,90px)',
            left: '50%',
            marginLeft: '-12px',
            zIndex: 3,
          }"
        >
          <HeartDoodle :filled="true" :size="24" />
        </div>

        <div
          :style="{
            marginTop: 'clamp(10px,3vw,20px)',
            width: '100%',
            aspectRatio: '1 / 1',
            background: 'var(--surface-sunken)',
            border: '2px solid var(--accent)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }"
        >
          <img
            :src="heroPhotoUrl"
            alt="Гордей и Елизавета в детстве"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }"
          />
        </div>
      </div>

      <!-- date oval, overlapping the photo -->
      <div
        :style="{
          marginTop: 'clamp(-22px,-4vw,-16px)',
          position: 'relative',
          zIndex: 4,
          display: 'flex',
          justifyContent: 'center',
        }"
      >
        <RibbonTitle>19 сентября 2026 года</RibbonTitle>
      </div>
    </header>

    <!-- ============ GREETING ============ -->
    <section
      :style="{
        textAlign: 'center',
        maxWidth: '660px',
        margin: '0 auto',
        padding: 'clamp(28px,6vw,56px) clamp(22px,5vw,40px) clamp(10px,3vw,24px)',
      }"
    >
      <h2
        :style="{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          fontSize: 'clamp(2.2rem, 8vw, 3.4rem)',
          lineHeight: 0.98,
          margin: 0,
        }"
      >
        Дорогие наши друзья и&nbsp;родные!
      </h2>
      <p
        :style="{
          fontFamily: 'var(--font-script)',
          color: 'var(--text-romantic)',
          fontSize: 'clamp(1.15rem, 3.4vw, 1.5rem)',
          lineHeight: 1.45,
          margin: 'clamp(14px,3vw,22px) auto 0',
          maxWidth: '460px',
        }"
      >
        Это официальное приглашение на нашу свадьбу! А получили вы его потому, что мы очень хотим
        видеть вас в этот день рядом с нами.
      </p>
    </section>

    <!-- ============ WHEN — date + calendar ============ -->
    <section
      id="when"
      :style="{
        maxWidth: '960px',
        margin: '0 auto',
        padding: 'clamp(20px,5vw,44px) clamp(22px,5vw,40px)',
        scrollMarginTop: '72px',
      }"
    >
      <div class="when__inner">
        <div class="when__date">
          <div class="when__label">
            <AnnotationLabel direction="down-left">когда</AnnotationLabel>
          </div>
          <div class="when__digits">
            <span class="when__digit">19</span>
            <span class="when__sep">·</span>
            <span class="when__digit">09</span>
            <span class="when__sep">·</span>
            <span class="when__digit">26</span>
          </div>
        </div>

        <div class="when__connector" aria-hidden="true" />

        <div class="when__cal">
          <MonthCalendar />
        </div>
      </div>
    </section>

    <!-- ============ WHERE — venue + map ============ -->
    <section
      id="where"
      :style="{
        maxWidth: '880px',
        margin: '0 auto',
        padding: 'clamp(28px,6vw,52px) clamp(22px,5vw,40px)',
        textAlign: 'center',
        scrollMarginTop: '72px',
      }"
    >
      <h2 :style="sectionTitleStyle">Место проведения</h2>
      <p
        :style="{
          fontFamily: 'var(--font-script)',
          color: 'var(--text-romantic)',
          fontSize: 'clamp(1.15rem, 3.4vw, 1.45rem)',
          lineHeight: 1.4,
          margin: '14px 0 0',
        }"
      >
        Paradise Halls · Кемерово
      </p>

      <!-- restaurant logo, framed as an inky stamp on paper -->
      <div class="venue-logo">
        <img :src="logoUrl" alt="Paradise Halls Restaurant Club" />
      </div>
      <p
        :style="{
          fontFamily: 'var(--font-body)',
          color: 'var(--text-muted)',
          fontSize: 'clamp(13px, 3.2vw, 15px)',
          lineHeight: 1.4,
          margin: '12px auto 0',
          maxWidth: '360px',
        }"
      >
        ул. Ноябрьская, 61, Кемерово, Кемеровская обл.
      </p>

      <div :style="{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: 'clamp(16px,3vw,24px)' }">
        <AnnotationLabel direction="down-left" :show-arrow="false" />
        <span
          :style="{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--accent)',
            fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
          }"
          >Как добраться</span
        >
      </div>

      <div
        :style="{
          position: 'relative',
          width: '100%',
          height: 'clamp(240px, 46vw, 420px)',
          margin: 'clamp(16px,3vw,22px) auto 0',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
          border: '2px solid var(--accent)',
        }"
      >
        <iframe
          title="Карта — как добраться"
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=86.1488%2C55.3699%2C86.1728%2C55.3819&layer=mapnik&marker=55.37589%2C86.16077"
          :style="{
            display: 'block',
            width: '100%',
            /* taller than the frame so OpenStreetMap's bottom attribution bar
               (cramped on mobile) is clipped by the container's overflow */
            height: 'calc(100% + 48px)',
            border: 0,
            filter: 'sepia(0.42) saturate(1.18) hue-rotate(-12deg) contrast(0.95) brightness(1.03)',
          }"
        />
        <div
          :style="{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 50% 50%, transparent 55%, rgba(178,58,34,0.14))',
          }"
        />
      </div>
      <!-- attribution kept (clipped from the iframe above), per OSM usage policy -->
      <p class="map-credit">
        Карта: ©&nbsp;<a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          >OpenStreetMap</a
        >
      </p>
    </section>

    <!-- ============ SCHEDULE ============ -->
    <section
      :style="{
        maxWidth: '580px',
        margin: '0 auto',
        padding: 'clamp(24px,5vw,48px) clamp(22px,5vw,40px)',
        textAlign: 'center',
      }"
    >
      <h2 :style="{ ...sectionTitleStyle, margin: '0 0 clamp(14px,3vw,24px)' }">Расписание дня</h2>
      <div style="text-align: left">
        <button
          v-for="(row, i) in schedule"
          :key="row.time"
          type="button"
          class="schedule__row"
          :style="{ borderBottom: i < schedule.length - 1 ? '1px solid var(--hairline)' : 'none' }"
          @click="scrollToForm(row.where)"
        >
          <span
            :style="{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--text-heading)',
              fontSize: 'clamp(1.7rem, 6vw, 2.4rem)',
              minWidth: 'clamp(76px,18vw,104px)',
            }"
          >
            {{ row.time }}
          </span>
          <span
            :style="{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-body)',
              fontSize: 'clamp(15px, 3.6vw, 17px)',
              lineHeight: 1.4,
            }"
          >
            {{ row.text }}
          </span>
        </button>
      </div>
    </section>

    <!-- ============ DRESS CODE — wedding palette ============ -->
    <section
      id="dress"
      :style="{
        maxWidth: '880px',
        margin: '0 auto',
        padding: 'clamp(24px,5vw,48px) clamp(22px,5vw,40px)',
        textAlign: 'center',
        scrollMarginTop: '72px',
      }"
    >
      <h2 :style="sectionTitleStyle">Дресс-код</h2>
      <p
        :style="{
          fontFamily: 'var(--font-script)',
          color: 'var(--text-romantic)',
          fontSize: 'clamp(1.15rem, 3.4vw, 1.45rem)',
          lineHeight: 1.45,
          margin: '14px auto 0',
          maxWidth: '460px',
        }"
      >
        Будем рады, если вы поддержите палитру нашего дня в своих нарядах
      </p>

      <div class="palette">
        <div v-for="c in palette" :key="c.hex" class="swatch" :class="{ 'swatch--light': c.light }">
          <div class="swatch__dot" :style="{ background: c.hex }" />
          <div class="swatch__name">{{ c.name }}</div>
          <div class="swatch__hex">{{ c.hex }}</div>
        </div>
      </div>
    </section>

    <!-- ============ COUNTDOWN ============ -->
    <section
      :style="{
        maxWidth: '560px',
        margin: '0 auto',
        padding: 'clamp(20px,5vw,40px) clamp(22px,5vw,40px)',
      }"
    >
      <SketchFrame>
        <h3
          :style="{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--text-heading)',
            fontSize: 'clamp(1.7rem, 6vw, 2.3rem)',
            lineHeight: 1,
            textAlign: 'center',
            margin: '0 0 clamp(14px,3vw,20px)',
          }"
        >
          До свадьбы осталось
        </h3>
        <div :style="{ display: 'flex', justifyContent: 'space-between', gap: 'clamp(8px,2vw,16px)' }">
          <div v-for="u in countdown" :key="u.label" :style="{ textAlign: 'center', flex: 1 }">
            <div
              :style="{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'var(--text-heading)',
                fontSize: 'clamp(1.9rem, 8vw, 2.8rem)',
                lineHeight: 1,
              }"
            >
              {{ u.value }}
            </div>
            <div
              :style="{
                fontFamily: 'var(--font-script)',
                color: 'var(--text-romantic)',
                fontSize: 'clamp(0.95rem,3vw,1.15rem)',
              }"
            >
              {{ u.label }}
            </div>
          </div>
        </div>
      </SketchFrame>
    </section>

    <!-- ============ GUEST CHAT (VK) ============ -->
    <section
      :style="{
        maxWidth: '560px',
        margin: '0 auto',
        padding: 'clamp(16px,4vw,28px) clamp(22px,5vw,40px) clamp(6px,2vw,12px)',
      }"
    >
      <SketchFrame :padding="'clamp(26px,6vw,44px)'">
        <div style="text-align: center">
          <h2
            :style="{
              fontFamily: 'var(--font-script)',
              fontWeight: 400,
              color: 'var(--text-heading)',
              fontSize: 'clamp(2rem, 7vw, 3rem)',
              lineHeight: 1.1,
              margin: '0 0 14px',
            }"
          >
            Чат гостей
          </h2>
          <p
            :style="{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-muted)',
              fontSize: 'clamp(1rem, 3vw, 1.15rem)',
              lineHeight: 1.5,
              maxWidth: '360px',
              margin: '0 auto 22px',
            }"
          >
            Предлагаем вступить в чат гостей — здесь можно обмениваться фото и видео со свадьбы.
          </p>
          <AppButton variant="outline" size="sm" @click="openVkChat">
            <VkLogo :size="22" />
            Вступить
          </AppButton>
        </div>
      </SketchFrame>
    </section>

    <!-- ============ HOST CONTACTS ============ -->
    <section
      :style="{
        maxWidth: '560px',
        margin: '0 auto',
        padding: 'clamp(24px,5vw,44px) clamp(22px,5vw,40px)',
        textAlign: 'center',
      }"
    >
      <h2 :style="sectionTitleStyle">Контакты</h2>
      <p
        :style="{
          fontFamily: 'var(--font-script)',
          color: 'var(--text-romantic)',
          fontSize: 'clamp(1.1rem, 3.2vw, 1.35rem)',
          lineHeight: 1.4,
          margin: '16px auto 18px',
          maxWidth: '320px',
        }"
      >
        По всем вопросам, связанным с мероприятием, обращайтесь к нашему ведущему
      </p>
      <div
        :style="{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
          lineHeight: 1.15,
        }"
      >
        Ведущий Илья
      </div>
      <a
        href="tel:+79235022070"
        :style="{
          display: 'inline-block',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--accent)',
          fontSize: 'clamp(1.7rem, 6.5vw, 2.4rem)',
          textDecoration: 'none',
          marginTop: '2px',
        }"
        >+7 (923) 502 20 70</a
      >
      <div style="margin-top: 14px">
        <!-- VK — host's page -->
        <a
          :href="vkPageUrl"
          target="_blank"
          rel="noopener"
          aria-label="Страница ВКонтакте"
          class="vk-link"
          :style="{ color: 'var(--accent)' }"
        >
          <VkLogo :size="34" />
        </a>
      </div>
    </section>

    <!-- ============ RSVP ============ -->
    <section
      id="rsvp"
      :style="{
        maxWidth: '540px',
        margin: '0 auto',
        padding: 'clamp(20px,5vw,40px) clamp(22px,5vw,40px)',
        scrollMarginTop: '72px',
      }"
    >
      <SketchFrame>
        <template v-if="!sent">
          <h3
            :style="{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--text-heading)',
              fontSize: 'clamp(1.9rem, 7vw, 2.4rem)',
              textAlign: 'center',
              margin: '0 0 6px',
            }"
          >
            Анкета гостя
          </h3>
          <p
            :style="{
              fontFamily: 'var(--font-script)',
              color: 'var(--text-romantic)',
              fontSize: 'clamp(1.05rem,3vw,1.2rem)',
              textAlign: 'center',
              lineHeight: 1.35,
              margin: '0 0 18px',
            }"
          >
            Пожалуйста, подтвердите своё присутствие до
            <span class="deadline-date">15&nbsp;июля</span> 2026
          </p>

          <!-- name -->
          <label style="display: block; text-align: left; margin-bottom: 16px">
            <span class="field-label">Ваше имя</span>
            <input v-model="name" placeholder="Имя и фамилия" class="field-input" />
          </label>

          <!-- honeypot: hidden from real guests, catches bots -->
          <input
            v-model="honeypot"
            class="hp-field"
            type="text"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
          />

          <!-- coming? -->
          <span class="field-label" style="margin-bottom: 6px">Придёте?</span>
          <div style="display: flex; gap: 10px; margin-bottom: 20px">
            <div style="flex: 1 1 0; display: flex">
              <button type="button" :style="choiceStyle(coming === 'yes')" @click="chooseYes">
                Буду
              </button>
            </div>
            <div style="flex: 1 1 0; display: flex">
              <button type="button" :style="choiceStyle(coming === 'no')" @click="chooseNo">
                Не смогу
              </button>
            </div>
          </div>

          <!-- details (only if coming) -->
          <template v-if="coming === 'yes'">
            <!-- where -->
            <label style="display: block; text-align: left; margin-bottom: 16px">
              <span class="field-label">Куда придёте?</span>
              <select v-model="where" class="field-input field-select">
                <option value="">Выберите вариант</option>
                <option value="zags">На церемонию в ЗАГСе</option>
                <option value="banquet">На банкет</option>
                <option value="both">И туда, и туда</option>
              </select>
            </label>

            <!-- companions -->
            <div style="text-align: left; margin-bottom: 16px">
              <span class="field-label">С кем придёте?</span>
              <div
                v-for="(_, i) in companions"
                :key="i"
                style="display: flex; gap: 8px; margin-bottom: 8px"
              >
                <input
                  v-model="companions[i]"
                  placeholder="Имя спутника"
                  class="field-input"
                  style="margin: 0"
                />
                <button
                  type="button"
                  class="companion-remove"
                  aria-label="Убрать спутника"
                  @click="removeCompanion(i)"
                >
                  ×
                </button>
              </div>
              <button type="button" class="companion-add" @click="addCompanion">
                + Добавить спутника
              </button>
            </div>

            <!-- drinks (optional) -->
            <label style="display: block; text-align: left; margin-bottom: 20px">
              <span class="field-label">Что предпочитаете пить? <em>(необязательно)</em></span>
              <input
                v-model="drinks"
                placeholder="Например: красное вино, сок, чай…"
                class="field-input"
              />
            </label>
          </template>

          <AppButton :full="true" :disabled="sending || deadlinePassed" @click="submit">
            <span class="submit-content">
              <template v-if="sending">Отправляем…</template>
              <template v-else-if="!coming">(･_･?)</template>
              <template v-else
                >Подтвердить<span class="submit-emoji">{{ submitEmoji }}</span></template
              >
            </span>
          </AppButton>
          <p v-if="formHint" class="rsvp-hint">{{ formHint }}</p>
          <p v-if="deadlinePassed" class="rsvp-error">
            Приём анкет завершён 15 июля. Если планы изменились — напишите
            ведущему:&nbsp;+7&nbsp;(923)&nbsp;502&nbsp;20&nbsp;70.
          </p>
          <p v-if="failed" class="rsvp-error">
            Не получилось отправить анкету. Проверьте интернет и попробуйте ещё раз — или напишите
            ведущему:&nbsp;+7&nbsp;(923)&nbsp;502&nbsp;20&nbsp;70.
          </p>
        </template>

        <div v-else style="position: relative; text-align: center; padding: 12px 0">
          <div v-if="coming === 'yes'" class="fireworks" aria-hidden="true">
            <span
              v-for="(burst, b) in fireworkBursts"
              :key="b"
              class="burst"
              :style="{ left: burst.x, top: burst.y }"
            >
              <i v-for="s in sparkCount" :key="s" class="spark" :style="sparkStyle(s - 1, burst)" />
            </span>
          </div>
          <div style="position: relative; z-index: 1">
            <HeartDoodle :filled="true" :size="42" />
          <h3
            :style="{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--text-heading)',
              fontSize: 'clamp(1.8rem, 7vw, 2.3rem)',
              margin: '10px 0 4px',
            }"
          >
            Спасибо, {{ firstName }}!
          </h3>
          <p
            :style="{
              fontFamily: 'var(--font-script)',
              color: 'var(--text-romantic)',
              fontSize: 'clamp(1.1rem,3.4vw,1.3rem)',
              margin: 0,
            }"
          >
            {{ comingMsg }}
          </p>
          </div>
        </div>
      </SketchFrame>
    </section>

    <!-- ============ CLOSING ============ -->
    <section
      :style="{
        maxWidth: '640px',
        margin: '0 auto',
        padding: 'clamp(26px,6vw,52px) clamp(22px,5vw,40px) clamp(40px,8vw,72px)',
        textAlign: 'center',
        position: 'relative',
      }"
    >
      <div
        :style="{
          position: 'absolute',
          left: 'clamp(18px,5vw,40px)',
          top: 'clamp(14px,3vw,24px)',
          transform: 'rotate(-12deg)',
        }"
      >
        <HeartDoodle :size="26" :tilt="-12" />
      </div>
      <p
        :style="{
          fontFamily: 'var(--font-script)',
          color: 'var(--text-romantic)',
          fontSize: 'clamp(1.15rem,3.4vw,1.4rem)',
          lineHeight: 1.4,
          margin: 0,
        }"
      >
        До скорой встречи!<br />С любовью,
      </p>
      <h2
        :style="{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          fontSize: 'clamp(2.4rem, 9vw, 3.6rem)',
          lineHeight: 1,
          margin: '12px 0 0',
        }"
      >
        Гордей &amp; Елизавета
      </h2>

      <div :style="{ position: 'relative', maxWidth: '360px', margin: 'clamp(18px,4vw,28px) auto 0' }">
        <div
          :style="{
            width: '100%',
            aspectRatio: '4 / 5',
            maxHeight: '360px',
            background: 'var(--surface-sunken)',
            border: '2px solid var(--accent)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }"
        >
          <img
            :src="polaroidPhotoUrl"
            alt="Гордей и Елизавета"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }"
          />
        </div>
      </div>
    </section>

    <!-- ============ STICKY BOTTOM CTA ============ -->
    <a
      href="#rsvp"
      class="sticky-cta"
      :style="{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: hoverCta ? '66px' : '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hoverCta ? 'var(--forest-800)' : 'var(--forest-900)',
        color: '#FBF9F4',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: hoverCta ? 'clamp(1.45rem, 4.6vw, 1.75rem)' : 'clamp(1.25rem, 4vw, 1.5rem)',
        textDecoration: 'none',
        zIndex: 60,
        transition: 'height var(--dur-base) var(--ease-soft), font-size var(--dur-base) var(--ease-soft), background var(--dur-base) var(--ease-soft)',
      }"
      @mouseenter="hoverCta = true"
      @mouseleave="hoverCta = false"
      >{{ hoverCta ? "Да-да, приду ^-^ !" : "Приду!" }}</a
    >
  </div>
</template>

<style scoped>
/* ---- Nav ---- */
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(245, 241, 233, 0.92);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  border-bottom: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 3.5vw, 38px);
  padding: 13px clamp(12px, 4vw, 24px);
  transition: transform var(--dur-base) var(--ease-soft);
}
.nav__links {
  display: flex;
  gap: clamp(12px, 3.5vw, 38px);
}
.nav__burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 30px;
  padding: 6px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
}
.nav__burger span {
  display: block;
  width: 24px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--accent);
  transition:
    transform var(--dur-base) var(--ease-soft),
    opacity var(--dur-fast) var(--ease-soft);
}
.nav__drawer {
  display: none;
}
.nav-link {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: clamp(12px, 3.3vw, 15px);
  color: var(--text-heading);
  text-decoration: none;
  white-space: nowrap;
}
.nav-link--accent {
  font-weight: 700;
  color: var(--accent);
}
@media (max-width: 759px) {
  .nav {
    justify-content: flex-start;
  }
  .nav--hidden {
    transform: translateY(-100%);
  }
  .nav__links {
    display: none;
  }
  .nav__burger {
    display: flex;
  }
  .nav__burger span.nav__burger-open:nth-child(1) {
    transform: translateY(7.5px) rotate(45deg);
  }
  .nav__burger span.nav__burger-open:nth-child(2) {
    opacity: 0;
  }
  .nav__burger span.nav__burger-open:nth-child(3) {
    transform: translateY(-7.5px) rotate(-45deg);
  }
  .nav__drawer {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--paper-50);
    border-bottom: 1px solid var(--hairline);
    box-shadow: var(--shadow-card);
    padding: 4px 0 8px;
  }
  .nav__drawer .nav-link {
    padding: 13px clamp(18px, 5vw, 26px);
    font-size: 17px;
  }
}
.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity var(--dur-base) var(--ease-soft),
    transform var(--dur-base) var(--ease-soft);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---- Garland ---- */
.garland {
  position: relative;
  height: 96px;
  max-width: 560px;
  margin: 0 auto clamp(8px, 2vw, 18px);
}
.garland__rope {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.garland__card {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  padding: 15px 7px 8px;
  background: var(--paper-50);
  box-shadow: inset 0 0 0 1.6px var(--accent);
  border-radius: 4px 4px 9px 9px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(0.85rem, 3.4vw, 1.3rem);
  color: var(--accent);
  transform-origin: 50% 7px;
}
.garland__hole {
  position: absolute;
  top: 4px;
  left: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--accent);
}

/* ---- WHEN: stacked on mobile, horizontal + connector on landscape ---- */
.when__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 4vw, 40px);
}
.when__date {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.when__label {
  margin-bottom: clamp(8px, 2.5vw, 14px);
  transform: rotate(-4deg);
}
.when__digits {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.when__digit {
  position: relative;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-heading);
  font-size: clamp(3.6rem, 17vw, 5rem);
  line-height: 1.04;
}
.when__sep {
  display: none;
}
/* mobile: a downward arrow leading to the calendar below */
.when__connector {
  position: relative;
  width: 2px;
  height: clamp(26px, 7vw, 44px);
  background: var(--accent);
  opacity: 0.55;
  margin: clamp(4px, 1.5vw, 10px) auto 0;
}
.when__connector::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: 9px;
  height: 9px;
  border-bottom: 2px solid var(--accent);
  border-right: 2px solid var(--accent);
  transform: translateX(-50%) rotate(45deg);
}
@media (min-width: 760px) {
  .when__inner {
    flex-direction: row;
    gap: clamp(8px, 2vw, 22px);
  }
  .when__digits {
    flex-direction: row;
    align-items: baseline;
    gap: clamp(6px, 1.5vw, 14px);
  }
  .when__digit {
    font-size: clamp(2.6rem, 7vw, 4.2rem);
  }
  .when__sep {
    display: inline;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--accent);
    opacity: 0.6;
    font-size: clamp(2rem, 6vw, 3rem);
  }
  /* desktop: the connector points right toward the calendar */
  .when__connector {
    flex: 0 0 auto;
    width: clamp(40px, 7vw, 90px);
    height: 2px;
    margin: 0;
  }
  .when__connector::after {
    left: auto;
    right: -1px;
    bottom: auto;
    top: 50%;
    border-bottom: none;
    border-top: 2px solid var(--accent);
    border-right: 2px solid var(--accent);
    transform: translateY(-50%) rotate(45deg);
  }
}

/* ---- Venue logo ---- */
.venue-logo {
  width: clamp(116px, 30vw, 156px);
  aspect-ratio: 1;
  margin: clamp(16px, 3.5vw, 24px) auto 0;
  border-radius: 50%;
  background: var(--paper-50);
  box-shadow: var(--shadow-card), inset 0 0 0 2px var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transform: rotate(-3deg);
}
.venue-logo img {
  width: 92%;
  height: 92%;
  object-fit: contain;
  border-radius: 50%;
  mix-blend-mode: multiply;
  filter: sepia(0.5) saturate(1.5) hue-rotate(-12deg) brightness(0.92);
}

/* ---- Schedule rows (clickable) ---- */
.schedule__row {
  display: flex;
  width: 100%;
  gap: clamp(14px, 4vw, 28px);
  align-items: baseline;
  padding: 16px 4px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-base) var(--ease-soft);
  -webkit-tap-highlight-color: transparent;
}
.schedule__row:hover {
  background: rgba(178, 58, 34, 0.06);
}

/* ---- Palette: 2x4 on mobile, 4x2 on desktop, hover reveals hex ---- */
.palette {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(12px, 4vw, 20px) clamp(10px, 4vw, 22px);
  max-width: 340px;
  margin: clamp(20px, 4vw, 32px) auto 0;
}
@media (min-width: 760px) {
  .palette {
    grid-template-columns: repeat(4, 1fr);
    max-width: 680px;
    gap: clamp(20px, 3vw, 30px) clamp(16px, 2.5vw, 26px);
  }
}
.swatch {
  text-align: center;
}
.swatch__dot {
  width: 48px;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 50%;
  box-shadow: var(--shadow-card);
}
@media (min-width: 760px) {
  .swatch__dot {
    width: 64px;
  }
}
.swatch--light .swatch__dot {
  box-shadow: inset 0 0 0 1.5px var(--hairline), var(--shadow-card);
}
.swatch__name {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: clamp(10px, 2.4vw, 12px);
  letter-spacing: 0.03em;
  color: var(--text-heading);
  margin-top: 10px;
  line-height: 1.2;
}
.swatch__hex {
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-top: 3px;
  min-height: 14px;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-soft);
}
.swatch:hover .swatch__hex,
.swatch:active .swatch__hex {
  opacity: 1;
}

/* ---- Form fields ---- */
.field-label {
  display: block;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.field-label em {
  font-style: italic;
  opacity: 0.8;
}
.field-input {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0;
  padding: 11px 14px;
  border: none;
  border-radius: 10px;
  background: var(--surface-sunken);
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--ink);
  outline: none;
}
.field-select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23b23a22' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 38px;
}
.companion-add {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  color: var(--accent);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 2px;
}
.companion-add:hover {
  text-decoration: underline;
}
.companion-remove {
  flex: 0 0 auto;
  width: 42px;
  border: none;
  border-radius: 10px;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.companion-remove:hover {
  color: var(--accent);
}

/* ---- Honeypot: visually removed, off the tab order ---- */
.hp-field {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

/* ---- Deadline date emphasis in the RSVP subtitle ---- */
.deadline-date {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  text-decoration-color: var(--accent);
  white-space: nowrap;
}

/* ---- RSVP validation hint ("плашка": fill the form first) ---- */
.rsvp-hint {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.4;
  color: var(--accent);
  text-align: center;
  margin: 12px auto 0;
  padding: 10px 14px;
  background: var(--surface-sunken);
  border: 1.5px dashed var(--hairline);
  border-radius: var(--radius-md);
  animation: hint-pop var(--dur-base) var(--ease-soft);
}
@keyframes hint-pop {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---- RSVP submit error ---- */
.rsvp-error {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.45;
  color: var(--accent);
  text-align: center;
  margin: 12px 2px 0;
}

/* ---- Submit button label: emoji wraps to its own line on mobile ---- */
.submit-content {
  display: block;
  text-align: center;
}
.submit-emoji {
  margin-left: 0.4em;
}
@media (max-width: 759px) {
  .submit-emoji {
    display: block;
    margin-left: 0;
    margin-top: 2px;
  }
}

/* ---- Map attribution caption ---- */
.map-credit {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
  margin: 6px 4px 0;
}
.map-credit a {
  color: var(--text-muted);
  text-decoration: underline;
}

/* ---- "Спасибо" fireworks (shown when the guest is coming) ---- */
.fireworks {
  position: absolute;
  inset: -12px 0;
  pointer-events: none;
  overflow: hidden;
}
.burst {
  position: absolute;
  width: 0;
  height: 0;
}
.spark {
  position: absolute;
  left: 0;
  top: 0;
  width: 7px;
  height: 7px;
  margin: -3.5px;
  border-radius: 50%;
  opacity: 0;
  transform: translate(0, 0) scale(0.4);
  animation: spark-fly 1.8s var(--ease-soft) infinite;
}
@keyframes spark-fly {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.4);
  }
  12% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .fireworks {
    display: none;
  }
}

/* ---- VK link ---- */
.vk-link {
  display: inline-flex;
  transition: transform var(--dur-fast) var(--ease-soft);
}
.vk-link:hover {
  transform: scale(1.1);
}
</style>
