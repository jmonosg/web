/* ============================================
   QUIZ FUNNEL — LENTES LUZ AZUL
   script.js — Logic, config, and Google Sheets
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Google Apps Script URL — replace with your deployed URL
  GOOGLE_SCRIPT_URL: '',

  // Discount code
  DISCOUNT_CODE: 'QUIZ15',
  DISCOUNT_PERCENT: '15%',

  // E-commerce URL — replace with your store URL
  STORE_URL: '#',

  // Timing
  AUTO_ADVANCE_DELAY: 300,
  ANIMATION_DELAY: 350,

  // Timezone for timestamps
  TIMEZONE: 'America/Mexico_City',
};

// ============================================
// QUIZ FLOW DEFINITION
// ============================================

const SCREENS = [
  { id: 'intro', type: 'intro' },
  { id: 'q1', type: 'question', field: 'primary_device',
    emoji: '📱',
    title: '¿Cuál es el dispositivo que más usas?',
    options: [
      { label: 'Teléfono celular', helper: 'Smartphone, scrolling, redes sociales', value: 'phone' },
      { label: 'Computadora / Laptop', helper: 'Trabajo, navegación, productividad', value: 'computer' },
      { label: 'Tablet', helper: 'Lectura, video, juegos', value: 'tablet' },
      { label: 'Televisión', helper: 'Series, películas, streaming', value: 'tv' },
    ]
  },
  { id: 'q2', type: 'question', field: 'screen_hours',
    emoji: '⏱️',
    title: '¿Cuántas horas al día pasas frente a pantallas?',
    options: [
      { label: 'Menos de 3 horas', helper: 'Uso ligero, ocasional', value: 'under_3' },
      { label: 'Entre 3 y 6 horas', helper: 'Uso moderado, trabajo parcial', value: '3_to_6' },
      { label: 'Entre 6 y 10 horas', helper: 'Uso intensivo, trabajo + ocio', value: '6_to_10' },
      { label: 'Más de 10 horas', helper: 'Pantallas prácticamente todo el día', value: 'over_10' },
    ]
  },
  { id: 'q3', type: 'question', field: 'screens_before_bed',
    emoji: '🌙',
    title: '¿Usas pantallas antes de dormir?',
    options: [
      { label: 'Sí, casi todas las noches', helper: 'Es parte de mi rutina nocturna', value: 'always' },
      { label: 'A veces', helper: 'Algunas noches sí, otras no', value: 'sometimes' },
      { label: 'Rara vez o nunca', helper: 'Evito las pantallas en la noche', value: 'rarely' },
    ]
  },
  { id: 'nutrition1', type: 'nutrition', nutritionId: 1 },
  { id: 'q4', type: 'question', field: 'sleep_quality',
    emoji: '💤',
    title: '¿Cómo describirías la calidad de tu sueño?',
    options: [
      { label: 'Duermo muy bien', helper: 'Me quedo dormido rápido y descanso', value: 'good' },
      { label: 'Me cuesta conciliar el sueño', helper: 'Tardo mucho en dormirme', value: 'hard_to_fall_asleep' },
      { label: 'Me despierto cansado/a', helper: 'Duermo suficiente pero no descanso', value: 'tired_wakeup' },
      { label: 'Tengo insomnio frecuente', helper: 'Me despierto varias veces en la noche', value: 'insomnia' },
    ]
  },
  { id: 'q5', type: 'question', field: 'screen_symptoms',
    emoji: '👁️',
    title: '¿Experimentas alguno de estos síntomas después de usar pantallas?',
    options: [
      { label: 'Fatiga visual / ojos cansados', helper: 'Sientes los ojos pesados o agotados', value: 'eye_fatigue' },
      { label: 'Dolor de cabeza', helper: 'Dolores frecuentes al final del día', value: 'headache' },
      { label: 'Ojos secos o irritados', helper: 'Sensación de ardor o resequedad', value: 'dry_eyes' },
      { label: 'Ninguno de los anteriores', helper: 'No presento síntomas notorios', value: 'none' },
    ]
  },
  { id: 'q6', type: 'question', field: 'peak_screen_time',
    emoji: '☀️',
    title: '¿En qué momento del día usas más las pantallas?',
    options: [
      { label: 'Principalmente en la mañana / mediodía', helper: 'Trabajo matutino, estudio', value: 'morning' },
      { label: 'Durante la tarde', helper: 'Productividad vespertina', value: 'afternoon' },
      { label: 'En la noche, después de las 6pm', helper: 'Ocio, streaming, redes sociales', value: 'night' },
      { label: 'Todo el día por igual', helper: 'Uso constante de mañana a noche', value: 'all_day' },
    ]
  },
  { id: 'nutrition2', type: 'nutrition', nutritionId: 2 },
  { id: 'q7', type: 'question', field: 'current_glasses',
    emoji: '👓',
    title: '¿Usas lentes actualmente?',
    options: [
      { label: 'Sí, con graduación', helper: 'Necesito lentes para ver bien', value: 'prescription' },
      { label: 'Sí, sin graduación', helper: 'Estéticos o de sol', value: 'non_prescription' },
      { label: 'No uso lentes', helper: 'No necesito corrección visual', value: 'none' },
    ]
  },
  { id: 'q7_1', type: 'question', field: 'wants_prescription',
    emoji: '🔍',
    title: '¿Te interesaría que los lentes incluyan tu graduación?',
    conditional: (answers) => answers.current_glasses === 'prescription',
    options: [
      { label: 'Sí, me interesa', helper: 'Quiero lentes con filtro + mi graduación', value: 'yes' },
      { label: 'No, los usaría aparte', helper: 'Los pondría sobre mis lentes o sin graduación', value: 'no' },
    ]
  },
  { id: 'q8', type: 'question', field: 'main_goal',
    emoji: '🎯',
    title: '¿Qué es lo que más te interesa mejorar?',
    options: [
      { label: 'Dormir mejor', helper: 'Conciliar el sueño más rápido, descansar más', value: 'sleep' },
      { label: 'Reducir la fatiga visual', helper: 'Menos ojos cansados durante el día', value: 'eye_fatigue' },
      { label: 'Proteger mi vista a largo plazo', helper: 'Prevención y cuidado ocular', value: 'protection' },
      { label: 'Todo lo anterior', helper: 'Quiero todos los beneficios', value: 'all' },
    ]
  },
  { id: 'nutrition3', type: 'nutrition', nutritionId: 3 },
  { id: 'lead_capture', type: 'lead_capture' },
  { id: 'recommendation', type: 'recommendation' },
  { id: 'thankyou', type: 'thankyou' },
];

// ============================================
// NUTRITION SCREEN CONTENT
// ============================================

const NUTRITION_CONTENT = {
  1: {
    badge: '¿SABÍAS QUE..?',
    badgeClass: 'amber',
    emoji: '🧠',
    title: 'Lo que tus pantallas le hacen a tu cerebro por la noche',
    body: 'Tu cerebro interpreta la luz de las pantallas como si fuera luz del día. Aunque sean las 11pm, tu cuerpo recibe la señal de que debe estar despierto.',
    bullets: [
      { icon: '😴', text: 'Dificultad para conciliar el sueño', iconClass: 'amber' },
      { icon: '👁️', text: 'Fatiga visual y ojos secos', iconClass: 'orange' },
      { icon: '🔄', text: 'Alteración del ritmo circadiano', iconClass: 'red' },
      { icon: '😩', text: 'Cansancio durante el día aunque duermas suficiente', iconClass: 'orange' },
    ],
    cta: 'Continuar',
  },
  2: {
    badge: 'TECNOLOGÍA',
    badgeClass: 'orange',
    emoji: '🔶',
    title: 'No todos los filtros son iguales',
    body: 'El color del lente determina cuánta luz azul bloquea y en qué momento del día te conviene usarlo.',
    tiers: true,
    cta: 'Continuar',
  },
  3: {
    badge: 'TESTIMONIALES',
    badgeClass: 'red',
    emoji: '⭐',
    title: 'Lo que dicen nuestros usuarios',
    testimonials: [
      {
        quote: 'Desde que uso los lentes naranjas 2 horas antes de dormir, me duermo en 15 minutos. Antes tardaba más de una hora.',
        name: 'Andrea M.',
        initial: 'A',
      },
      {
        quote: 'Trabajo 10 horas en computadora y los lentes amarillos me quitaron el dolor de cabeza que tenía todos los días.',
        name: 'Carlos R.',
        initial: 'C',
      },
      {
        quote: 'Pensé que era puro marketing pero después de una semana noté la diferencia. Mis ojos ya no se sienten tan secos.',
        name: 'Lucía G.',
        initial: 'L',
      },
      {
        quote: 'Mi esposa me los regaló y ahora quiero unos para la oficina también. Se nota la diferencia.',
        name: 'Roberto T.',
        initial: 'R',
      },
    ],
    cta: 'Ver mi recomendación',
  },
};

// ============================================
// RECOMMENDATION ENGINE
// ============================================

const LENS_DATA = {
  yellow: {
    name: 'Lentes Amarillos',
    use: 'Uso diurno — Mañana y mediodía',
    emoji: '🟡',
    colorClass: 'yellow',
    benefits: [
      'Reducen la fatiga visual durante horas de trabajo',
      'Mejoran el contraste y la percepción de profundidad',
      'Filtran la luz azul de pantallas y luz artificial',
    ],
    personalMsg: (answers) => {
      const device = answers.primary_device === 'computer' ? 'computadora' :
                     answers.primary_device === 'phone' ? 'celular' :
                     answers.primary_device === 'tablet' ? 'tablet' : 'televisión';
      return `Basado en tus respuestas, pasas mucho tiempo frente a la ${device} durante el día. Los lentes amarillos van a reducir la fatiga visual y proteger tu vista mientras trabajas.`;
    },
  },
  orange: {
    name: 'Lentes Naranjas',
    use: 'Uso vespertino — Tarde y transición al descanso',
    emoji: '🟠',
    colorClass: 'orange',
    benefits: [
      'Bloquean la mayoría de la luz azul para proteger tu descanso',
      'Ideales para la transición entre el día y la noche',
      'Reducen la fatiga visual y favorecen la relajación',
    ],
    personalMsg: (answers) => {
      return 'Basado en tus respuestas, necesitas protección durante varias horas del día. Los lentes naranjas son el equilibrio perfecto: filtran suficiente luz azul para proteger tu vista y tu descanso sin alterar demasiado los colores.';
    },
  },
  red: {
    name: 'Lentes Rojos',
    use: 'Uso nocturno — 2-3 horas antes de dormir',
    emoji: '🔴',
    colorClass: 'red',
    benefits: [
      'Bloquean hasta el 99.99% de la luz azul y verde',
      'Favorecen la producción natural de melatonina',
      'Ayudan a conciliar el sueño más rápido',
    ],
    personalMsg: (answers) => {
      const sleepIssue = answers.sleep_quality === 'hard_to_fall_asleep' ? 'te cuesta conciliar el sueño' :
                         answers.sleep_quality === 'tired_wakeup' ? 'te despiertas cansado/a' :
                         answers.sleep_quality === 'insomnia' ? 'experimentas insomnio' : 'quieres dormir mejor';
      return `Basado en tus respuestas, usas pantallas por la noche y ${sleepIssue}. Los lentes rojos bloquean casi toda la luz azul para que tu cerebro produzca melatonina naturalmente y descanses de verdad.`;
    },
  },
};

function getRecommendation(answers) {
  const time = answers.peak_screen_time;
  const goal = answers.main_goal;

  // Primary logic: time of day + goal
  if (goal === 'sleep' || time === 'night') {
    return 'red';
  }
  if (goal === 'eye_fatigue' && time === 'morning') {
    return 'yellow';
  }
  if (time === 'morning') {
    return 'yellow';
  }
  if (time === 'afternoon') {
    return 'orange';
  }
  // all_day, all, protection defaults
  return 'orange';
}

// ============================================
// STATE
// ============================================

let currentScreenIndex = 0;
let answers = {};
let activeFlow = []; // screens after conditional filtering
let recommendedLens = null;

// DOM refs
const quizContainer = document.getElementById('quizContainer');
const topBar = document.getElementById('topBar');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressBar = document.getElementById('progressBar');
const bottomBar = document.getElementById('bottomBar');
const ctaBtn = document.getElementById('ctaBtn');
const backBtn = document.getElementById('backBtn');

// ============================================
// FLOW MANAGEMENT
// ============================================

function buildActiveFlow() {
  activeFlow = SCREENS.filter(screen => {
    if (screen.conditional) {
      return screen.conditional(answers);
    }
    return true;
  });
}

function getTotalQuestions() {
  return activeFlow.filter(s => s.type === 'question').length;
}

function getCurrentQuestionNumber() {
  const currentId = activeFlow[currentScreenIndex]?.id;
  let count = 0;
  for (let i = 0; i <= currentScreenIndex; i++) {
    if (activeFlow[i].type === 'question') count++;
  }
  return count;
}

function getProgressPercent() {
  // Progress based on position in flow (exclude intro and thankyou)
  const totalSteps = activeFlow.length - 2; // minus intro and thankyou
  const current = currentScreenIndex - 1; // minus intro
  if (current <= 0) return 0;
  return Math.min((current / totalSteps) * 100, 100);
}

// ============================================
// RENDERING
// ============================================

function renderScreen(index) {
  const screen = activeFlow[index];
  if (!screen) return;

  // Clear container
  quizContainer.innerHTML = '';

  // Show/hide top bar and progress
  if (screen.type === 'intro') {
    topBar.style.display = 'none';
    progressBarContainer.style.display = 'none';
  } else {
    topBar.style.display = 'flex';
    progressBarContainer.style.display = 'block';
    // Update progress bar
    setTimeout(() => {
      progressBar.style.width = getProgressPercent() + '%';
    }, 50);
  }

  // Show/hide bottom bar
  const needsButton = ['nutrition', 'lead_capture', 'recommendation'].includes(screen.type);
  bottomBar.style.display = needsButton ? 'block' : 'none';

  // Render based on type
  switch (screen.type) {
    case 'intro':       renderIntro(); break;
    case 'question':    renderQuestion(screen); break;
    case 'nutrition':   renderNutrition(screen); break;
    case 'lead_capture': renderLeadCapture(); break;
    case 'recommendation': renderRecommendation(); break;
    case 'thankyou':    renderThankYou(); break;
  }

  // Scroll to top
  quizContainer.scrollTop = 0;
  window.scrollTo(0, 0);
}

// --- INTRO ---
function renderIntro() {
  const checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  const div = document.createElement('div');
  div.className = 'screen intro-screen active';
  div.innerHTML = `
    <div class="intro-emoji">📱</div>
    <h1 class="intro-title">Descubre cómo tus pantallas están afectando tu descanso</h1>
    <p class="intro-subtitle">Responde unas preguntas rápidas y recibe una recomendación personalizada.</p>
    <div class="intro-checks">
      <div class="intro-check">
        <div class="intro-check-icon">${checkSvg}</div>
        <span>Qué tan expuesto estás a la luz azul</span>
      </div>
      <div class="intro-check">
        <div class="intro-check-icon">${checkSvg}</div>
        <span>Cómo podría estar afectando tu sueño y tu vista</span>
      </div>
      <div class="intro-check">
        <div class="intro-check-icon">${checkSvg}</div>
        <span>Qué tipo de protección es ideal para ti</span>
      </div>
    </div>
    <div class="intro-footer">
      <p>Solo toma <strong>1 minuto</strong>.</p>
      <p>Sin compromiso.</p>
    </div>
  `;
  quizContainer.appendChild(div);

  // Show start button
  bottomBar.style.display = 'block';
  ctaBtn.textContent = 'Comenzar';
  ctaBtn.disabled = false;
  ctaBtn.onclick = () => goNext();
}

// --- QUESTION ---
function renderQuestion(screen) {
  const totalQ = getTotalQuestions();
  const currentQ = getCurrentQuestionNumber();

  const div = document.createElement('div');
  div.className = 'screen active';
  div.innerHTML = `
    <div class="question-emoji">${screen.emoji}</div>
    <h2 class="question-title">${screen.title}</h2>
    <div class="options-list" id="optionsList"></div>
    <div class="step-dots" id="stepDots"></div>
  `;
  quizContainer.appendChild(div);

  // Render options
  const optionsList = div.querySelector('#optionsList');
  screen.options.forEach((opt, i) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.setAttribute('role', 'radio');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <div class="option-radio"></div>
      <div class="option-content">
        <div class="option-label">${opt.label}</div>
        <div class="option-helper">${opt.helper}</div>
      </div>
    `;

    // If already answered, mark selected
    if (answers[screen.field] === opt.value) {
      card.classList.add('selected');
    }

    card.addEventListener('click', () => {
      // Deselect all
      optionsList.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      // Select this
      card.classList.add('selected');
      // Store answer
      answers[screen.field] = opt.value;
      // Rebuild flow (in case conditionals changed)
      buildActiveFlow();
      // Auto-advance after delay
      setTimeout(() => goNext(), CONFIG.AUTO_ADVANCE_DELAY);
    });

    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    optionsList.appendChild(card);
  });

  // Render step dots
  const dotsContainer = div.querySelector('#stepDots');
  for (let i = 1; i <= totalQ; i++) {
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    if (i === currentQ) dot.classList.add('active');
    else if (i < currentQ) dot.classList.add('completed');
    dotsContainer.appendChild(dot);
  }
}

// --- NUTRITION ---
function renderNutrition(screen) {
  const content = NUTRITION_CONTENT[screen.nutritionId];
  const div = document.createElement('div');
  div.className = 'screen nutrition-screen active';

  let innerHtml = `
    <div class="nutrition-badge ${content.badgeClass}">
      ${content.emoji} ${content.badge}
    </div>
    <h2 class="nutrition-title">${content.title}</h2>
    <p class="nutrition-body">${content.body || ''}</p>
  `;

  // Bullets
  if (content.bullets) {
    innerHtml += '<div class="nutrition-bullets">';
    content.bullets.forEach(b => {
      innerHtml += `
        <div class="nutrition-bullet">
          <div class="nutrition-bullet-icon ${b.iconClass}">${b.icon}</div>
          <div class="nutrition-bullet-text">${b.text}</div>
        </div>
      `;
    });
    innerHtml += '</div>';
  }

  // Lens tiers (nutrition 2)
  if (content.tiers) {
    innerHtml += `
      <div class="lens-tiers">
        <div class="lens-tier yellow">
          <div class="lens-tier-header">
            <div class="lens-tier-dot yellow"></div>
            <div class="lens-tier-name">Lentes Amarillos</div>
            <div class="lens-tier-time">☀️ Mañana</div>
          </div>
          <div class="lens-tier-desc">Reducen la fatiga visual y mejoran el contraste frente a pantallas y luz artificial. Ideales para trabajar o estudiar.</div>
        </div>
        <div class="lens-tier orange">
          <div class="lens-tier-header">
            <div class="lens-tier-dot orange"></div>
            <div class="lens-tier-name">Lentes Naranjas</div>
            <div class="lens-tier-time">🌅 Tarde</div>
          </div>
          <div class="lens-tier-desc">Bloquean la mayoría de la luz azul. Perfectos para la transición entre el día y la noche.</div>
        </div>
        <div class="lens-tier red">
          <div class="lens-tier-header">
            <div class="lens-tier-dot red"></div>
            <div class="lens-tier-name">Lentes Rojos</div>
            <div class="lens-tier-time">🌙 Noche</div>
          </div>
          <div class="lens-tier-desc">Bloquean hasta el 99.99% de la luz azul y verde. Favorecen la producción de melatonina para dormir mejor.</div>
        </div>
      </div>
    `;
  }

  // Testimonials (nutrition 3)
  if (content.testimonials) {
    innerHtml += '<div class="testimonial-carousel">';
    content.testimonials.forEach(t => {
      innerHtml += `
        <div class="testimonial-card">
          <div class="testimonial-stars">★★★★★</div>
          <div class="testimonial-quote">"${t.quote}"</div>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${t.initial}</div>
            <div class="testimonial-name">${t.name}</div>
          </div>
        </div>
      `;
    });
    innerHtml += '</div>';
  }

  div.innerHTML = innerHtml;
  quizContainer.appendChild(div);

  // CTA button
  ctaBtn.textContent = content.cta;
  ctaBtn.disabled = false;
  ctaBtn.onclick = () => goNext();
}

// --- LEAD CAPTURE ---
function renderLeadCapture() {
  // Compute recommendation before showing this screen
  recommendedLens = getRecommendation(answers);

  // Send registro to Google Sheets
  sendRegistro();

  const div = document.createElement('div');
  div.className = 'screen lead-screen active';
  div.innerHTML = `
    <div class="lead-emoji">🎁</div>
    <h2 class="lead-title">Tu recomendación personalizada está lista</h2>
    <p class="lead-subtitle">Te enviamos tu recomendación + un código de descuento exclusivo. Déjanos tus datos.</p>
    <div class="lead-form">
      <div class="form-group">
        <label class="form-label" for="leadName">Nombre</label>
        <input class="form-input" type="text" id="leadName" placeholder="ej. Andrea Martínez" autocomplete="name" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="leadEmail">Email</label>
        <input class="form-input" type="email" id="leadEmail" placeholder="ej. andrea@email.com" autocomplete="email" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="leadWhatsapp">WhatsApp <span class="form-optional">(opcional)</span></label>
        <input class="form-input" type="tel" id="leadWhatsapp" placeholder="ej. 55 1234 5678" autocomplete="tel">
      </div>
    </div>
    <div class="lead-social-proof">⭐ 4.8 — Más de 5,000 usuarios satisfechos</div>
    <div class="lead-reassurance">Sin compromiso. Sin spam.</div>
  `;
  quizContainer.appendChild(div);

  // CTA button
  ctaBtn.textContent = 'Ver mi recomendación';
  ctaBtn.disabled = true;
  ctaBtn.onclick = () => submitLead();

  // Validate on input
  const nameInput = div.querySelector('#leadName');
  const emailInput = div.querySelector('#leadEmail');

  const validate = () => {
    const nameOk = nameInput.value.trim().length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    ctaBtn.disabled = !(nameOk && emailOk);
  };

  nameInput.addEventListener('input', validate);
  emailInput.addEventListener('input', validate);
}

function submitLead() {
  const name = document.getElementById('leadName').value.trim();
  const email = document.getElementById('leadEmail').value.trim();
  const whatsapp = document.getElementById('leadWhatsapp').value.trim();

  // Store lead data
  answers._lead_name = name;
  answers._lead_email = email;
  answers._lead_whatsapp = whatsapp;
  answers._recommended_lens = recommendedLens;

  // Send lead to Google Sheets
  sendLead();

  // Go to recommendation
  goNext();
}

// --- RECOMMENDATION ---
function renderRecommendation() {
  const lens = LENS_DATA[recommendedLens];
  const checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  const div = document.createElement('div');
  div.className = 'screen reco-screen active';

  let benefitsHtml = '';
  lens.benefits.forEach(b => {
    benefitsHtml += `
      <div class="reco-benefit">
        <div class="reco-benefit-check">${checkSvg}</div>
        <span>${b}</span>
      </div>
    `;
  });

  div.innerHTML = `
    <div class="reco-badge ${lens.colorClass}" style="background: var(--${lens.colorClass}-light); color: var(--${lens.colorClass === 'yellow' ? 'yellow' : lens.colorClass});">
      ✨ TU RECOMENDACIÓN
    </div>
    <h2 class="reco-title">Tu protección ideal</h2>
    <div class="reco-card">
      <div class="reco-card-header ${lens.colorClass}">
        <div class="reco-lens-icon">${lens.emoji}</div>
        <div class="reco-lens-name">${lens.name}</div>
        <div class="reco-lens-use">${lens.use}</div>
      </div>
      <div class="reco-card-body">
        <div class="reco-benefits">
          ${benefitsHtml}
        </div>
        <div class="reco-discount">
          <div class="reco-discount-text">${CONFIG.DISCOUNT_PERCENT} OFF con código ${CONFIG.DISCOUNT_CODE}</div>
          <div class="reco-discount-code">Aplica en tu primera compra</div>
        </div>
      </div>
    </div>
    <p class="reco-personalized">${lens.personalMsg(answers)}</p>
  `;
  quizContainer.appendChild(div);

  // CTA button
  ctaBtn.textContent = 'Obtener los míos';
  ctaBtn.disabled = false;
  ctaBtn.onclick = () => {
    // Go to thank you, then could redirect to store
    goNext();
  };
}

// --- THANK YOU ---
function renderThankYou() {
  bottomBar.style.display = 'none';
  progressBar.style.width = '100%';

  const div = document.createElement('div');
  div.className = 'screen thankyou-screen active';
  div.innerHTML = `
    <div class="thankyou-emoji">🎉</div>
    <h2 class="thankyou-title">¡Listo! Revisa tu correo</h2>
    <p class="thankyou-subtitle">Te enviamos tu recomendación personalizada y tu código de descuento.</p>
    <div class="thankyou-code">
      <div class="thankyou-code-label">Tu código de descuento</div>
      <div class="thankyou-code-value">${CONFIG.DISCOUNT_CODE}</div>
    </div>
    <p style="font-size:13px; color:var(--text-light); margin-top:8px; margin-bottom:32px;">
      O usa el código <strong>${CONFIG.DISCOUNT_CODE}</strong> en el checkout.
    </p>
  `;

  // Store button
  const storeBtn = document.createElement('button');
  storeBtn.className = 'cta-btn shimmer';
  storeBtn.textContent = 'Ir a la tienda';
  storeBtn.style.margin = '0 0 16px';
  storeBtn.onclick = () => {
    if (CONFIG.STORE_URL && CONFIG.STORE_URL !== '#') {
      window.open(CONFIG.STORE_URL, '_blank');
    }
  };
  div.appendChild(storeBtn);

  quizContainer.appendChild(div);
}

// ============================================
// NAVIGATION
// ============================================

function goNext() {
  if (currentScreenIndex < activeFlow.length - 1) {
    currentScreenIndex++;

    // Skip conditional screens that don't apply
    const screen = activeFlow[currentScreenIndex];
    if (screen.conditional && !screen.conditional(answers)) {
      goNext();
      return;
    }

    renderScreen(currentScreenIndex);
  }
}

function goBack() {
  if (currentScreenIndex > 0) {
    currentScreenIndex--;

    // Skip conditional screens when going back
    const screen = activeFlow[currentScreenIndex];
    if (screen.conditional && !screen.conditional(answers)) {
      goBack();
      return;
    }

    renderScreen(currentScreenIndex);
  }
}

// Back button
backBtn.addEventListener('click', goBack);

// ============================================
// GOOGLE SHEETS INTEGRATION
// ============================================

function getTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-CA', { timeZone: CONFIG.TIMEZONE, hour12: false }).replace(',', '');
}

function sendRegistro() {
  if (!CONFIG.GOOGLE_SCRIPT_URL) return;

  const data = {
    action: 'registro',
    timestamp: getTimestamp(),
    ...answers,
    recommended_lens: recommendedLens,
  };

  fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.warn('Registro send failed:', err));
}

function sendLead() {
  if (!CONFIG.GOOGLE_SCRIPT_URL) return;

  const data = {
    action: 'lead',
    timestamp: getTimestamp(),
    name: answers._lead_name,
    email: answers._lead_email,
    whatsapp: answers._lead_whatsapp,
    recommended_lens: recommendedLens,
    discount_code: CONFIG.DISCOUNT_CODE,
    ...answers,
  };

  fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.warn('Lead send failed:', err));
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  buildActiveFlow();
  currentScreenIndex = 0;
  renderScreen(0);
}

// Start
init();
