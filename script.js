// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-o1vUl0pZoBJUJ8ux_iSATNxCdhmzdvzbywKpkr14Ru02q2m0PZ0YPTEJt5dvH0DY/exec";

var SCORES = {
  ownership_status: { owner:30, renter:0 },
  home_type: { detached:30, semi_detached:20, townhouse:15, condo:10 },
  bathroom_count: { "1":10, "2":20, "3_plus":30 },
  renovation_count: { "1":10, "2":20, "3_plus":30 },
  renovation_timeline: { asap:30, "3_months":25, "6_months":15, browsing:5 },
  bathroom_style: { modern:10, classic:10, spa:10, undecided:5 },
  renovation_type: { full_remodel:30, tub_to_shower:25, refresh:15, accessibility:20, undecided:5 },
  country: { CA:20, US:20, other:0 }
};

// Auto-advance delay (ms) — gives user time to see their selection
var AUTO_ADVANCE_DELAY = 300;

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
var currentScreen = 0;
var hist = [0];
var answers = {};
var registroSaved = false;

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function goTo(n) {
  var curr = document.querySelector('.screen.active');
  if (curr) { curr.classList.remove('active'); curr.classList.add('exit-left'); }
  setTimeout(function(){ document.querySelectorAll('.screen.exit-left').forEach(function(s){ s.classList.remove('exit-left'); }); }, 350);
  var next = document.querySelector('[data-screen="'+n+'"]');
  if (next) { next.classList.add('active'); next.scrollTop = 0; }
  currentScreen = n;
  hist.push(n);
}

function goBack() {
  if (hist.length <= 1) return;
  hist.pop();
  var prev = hist[hist.length - 1];
  var curr = document.querySelector('.screen.active');
  if (curr) { curr.classList.remove('active'); curr.style.transform='translateX(50px)'; curr.style.opacity='0'; }
  var target = document.querySelector('[data-screen="'+prev+'"]');
  if (target) {
    target.style.transform = 'translateX(-50px)'; target.style.opacity = '0';
    target.classList.add('active'); target.scrollTop = 0;
    requestAnimationFrame(function(){
      target.style.transform = ''; target.style.opacity = '';
      if (curr) { curr.style.transform = ''; curr.style.opacity = ''; }
    });
  }
  currentScreen = prev;
}

// ═══════════════════════════════════════════
// SELECTION + AUTO-ADVANCE
// ═══════════════════════════════════════════
function sel(card, field, value, nextAction) {
  card.closest('.options').querySelectorAll('.option-card').forEach(function(c){ c.classList.remove('selected'); });
  card.classList.add('selected');
  answers[field] = value;

  // Auto-advance after brief visual feedback
  if (nextAction) {
    setTimeout(function(){ nextAction(); }, AUTO_ADVANCE_DELAY);
  }
}

// ═══════════════════════════════════════════
// BATHROOM COUNT → RENOVATION COUNT LOGIC
// ═══════════════════════════════════════════
function handleBathroomCountNext() {
  var count = answers.bathroom_count;
  if (count === '1') {
    answers.renovation_count = '1';
  } else {
    var reno3plus = document.getElementById('reno-3plus');
    if (count === '2') {
      reno3plus.style.display = 'none';
    } else {
      reno3plus.style.display = '';
    }
    // Reset previous selection
    document.querySelectorAll('[data-screen="5"] .option-card').forEach(function(c){ c.classList.remove('selected'); });
  }
  goTo(4); // Always go to nutrition screen first
}

function handleAfterNutrition1() {
  if (answers.bathroom_count === '1') {
    goTo(6); // Skip renovation count, go straight to timeline
  } else {
    goTo(5); // Show renovation count question
  }
}

// ═══════════════════════════════════════════
// COUNTRY → ZIP LOGIC
// ═══════════════════════════════════════════
function handleCountryNext() {
  var country = answers.country;
  if (country === 'CA' || country === 'US') {
    var zi = document.getElementById('zipInput');
    var zh = document.getElementById('zipHint');
    var zt = document.getElementById('zipTitle');
    if (country === 'US') { zt.textContent = 'What is your ZIP code?'; zi.placeholder = '12345'; zh.textContent = 'Enter your US ZIP code'; }
    else { zt.textContent = 'What is your postal code?'; zi.placeholder = 'A1A 1A1'; zh.textContent = 'Enter your Canadian postal code'; }
    goTo(11);
  } else {
    saveRegistro();
    goTo(12);
  }
}

function handleZipInput() {
  var val = document.getElementById('zipInput').value.trim();
  document.getElementById('zipBtn').classList.toggle('active', val.length >= 3);
}

function handleZipNext() {
  answers.zip_code = document.getElementById('zipInput').value.trim();
  saveRegistro();
  goTo(12);
}

// ═══════════════════════════════════════════
// LEAD INPUT
// ═══════════════════════════════════════════
function handleLeadInput() {
  var n = document.getElementById('nameInput').value.trim();
  var p = document.getElementById('phoneInput').value.trim();
  document.getElementById('leadBtn').classList.toggle('active', n.length > 1 && p.length > 5);
}

function handleLeadSubmit() {
  var btn = document.getElementById('leadBtn');
  btn.classList.add('sending');
  var payload = buildPayload('lead');
  payload.name = document.getElementById('nameInput').value.trim();
  payload.phone = document.getElementById('phoneInput').value.trim();
  sendToSheet(payload, function() {
    btn.classList.remove('sending');
    goTo(13);
  });
}

// ═══════════════════════════════════════════
// SCORE CALCULATION
// ═══════════════════════════════════════════
function calcScore() {
  var total = 0;
  for (var field in answers) {
    if (SCORES[field] && SCORES[field][answers[field]] !== undefined) {
      total += SCORES[field][answers[field]];
    }
  }
  return total;
}

// ═══════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════
function buildPayload(type) {
  return {
    type: type,
    ownership_status: answers.ownership_status || '',
    home_type: answers.home_type || '',
    bathroom_count: answers.bathroom_count || '',
    renovation_count: answers.renovation_count || '',
    renovation_timeline: answers.renovation_timeline || '',
    bathroom_style: answers.bathroom_style || '',
    renovation_type: answers.renovation_type || '',
    country: answers.country || '',
    zip_code: answers.zip_code || '',
    score: calcScore()
  };
}

function saveRegistro() {
  if (registroSaved) return;
  registroSaved = true;
  var payload = buildPayload('registro');
  sendToSheet(payload);

  // ═══════════════════════════════════════════
  // 🔥 CONVERSION TRACKING — FIRE HERE
  // This is the "Registro" moment: user completed the quiz.
  // Paste your Meta and Google conversion events below.
  //
  // META PIXEL:
  // fbq('track', 'CompleteRegistration', { value: payload.score, currency: 'CAD' });
  //
  // GOOGLE ADS:
  // gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXX' });
  //
  // GOOGLE ANALYTICS:
  // gtag('event', 'quiz_completed', { score: payload.score, country: payload.country });
  // ═══════════════════════════════════════════
}

function sendToSheet(payload, callback) {
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function() { if (callback) callback(); })
  .catch(function(err) {
    console.error('Sheet save error:', err);
    if (callback) callback();
  });
}
