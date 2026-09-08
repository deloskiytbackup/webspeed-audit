import { runWebsiteAudit, normalizeUrl } from './api.js';

let currentAuditData = null;

// Elementy DOM
const form = document.getElementById('audit-form');
const urlInput = document.getElementById('url-input');
const loadingBox = document.getElementById('loading-box');
const resultsBox = document.getElementById('results-container');

const gaugeCircle = document.getElementById('gauge-progress');
const scoreText = document.getElementById('score-text');
const targetUrlBadge = document.getElementById('target-url-badge');
const metricsGrid = document.getElementById('metrics-grid');
const checklistContainer = document.getElementById('checklist-container');
const btnExport = document.getElementById('btn-export');
const btnContact = document.getElementById('btn-contact');

// Nowe kontenery na bogate dane
const pillarsContainer = document.getElementById('pillars-container');
const resourcesContainer = document.getElementById('resources-container');
const timelineContainer = document.getElementById('timeline-container');
const businessContainer = document.getElementById('business-container');

// Inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
  // Obsługa kliknięć w przykłady
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleUrl = chip.getAttribute('data-url');
      urlInput.value = sampleUrl;
      triggerAudit(sampleUrl);
    });
  });

  // Obsługa wysyłki formularza
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = urlInput.value.trim();
    if (val) triggerAudit(val);
  });

  // Eksport raportu
  btnExport.addEventListener('click', exportReport);
});

async function triggerAudit(url) {
  loadingBox.style.display = 'block';
  resultsBox.style.display = 'none';
  loadingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

  try {
    const data = await runWebsiteAudit(url);
    currentAuditData = data;
    renderResults(data);
  } catch (err) {
    alert(err.message || 'Wystąpił błąd podczas analizy strony.');
  } finally {
    loadingBox.style.display = 'none';
  }
}

function renderResults(data) {
  resultsBox.style.display = 'block';
  targetUrlBadge.textContent = data.url;

  // Główny wskaźnik kołowy
  animateGauge(data.performanceScore);

  // 1. Główne filary audytu (Performance, SEO, Security, UX)
  renderPillars(data);

  // 2. Kafelki Core Web Vitals (6 metryk)
  renderMetrics(data.metrics);

  // 3. Rozkład wagi strony i transferu zasobów
  renderResources(data.resources);

  // 4. Oś czasu ładowania (Waterfall Timeline)
  renderTimeline(data.timeline);

  // 5. Wpływ na biznes i konwersję (ROI Impact)
  renderBusinessImpact(data.businessImpact);

  // 6. Szczegółowa checklista diagnostyczna
  renderChecklist(data.checklist);

  // Aktualizacja linku kontaktowego z tematem
  btnContact.href = `mailto:deloskiyt@gmail.com?subject=Optymalizacja%20strony%20${encodeURIComponent(data.url)}&body=Dzie%C5%84%20dobry%20Marcel,%0A%0AChc%C4%99%20skonsultowa%C4%87%20wynik%20audytu%20dla%20strony:%20${encodeURIComponent(data.url)}%20(Wynik:%20${data.performanceScore}/100).%0A%0AProsz%C4%99%20o%20kontakt.`;

  resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function animateGauge(targetScore) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  gaugeCircle.style.strokeDasharray = circumference;

  let color = '#10b981'; // green
  if (targetScore < 50) color = '#f43f5e'; // red/rose
  else if (targetScore < 85) color = '#f59e0b'; // amber

  gaugeCircle.style.stroke = color;
  scoreText.style.color = color;

  let current = 0;
  const stepTime = 12;
  const step = Math.max(1, Math.floor(targetScore / 40));

  const timer = setInterval(() => {
    current += step;
    if (current >= targetScore) {
      current = targetScore;
      clearInterval(timer);
    }
    scoreText.textContent = current;
    const offset = circumference - (current / 100) * circumference;
    gaugeCircle.style.strokeDashoffset = offset;
  }, stepTime);
}

function renderPillars(data) {
  if (!pillarsContainer) return;
  pillarsContainer.innerHTML = `
    <div class="pillar-card">
      <div class="pillar-label">Szybkość (Speed)</div>
      <div class="pillar-val ${getScoreClass(data.performanceScore)}">${data.performanceScore}<span>/100</span></div>
    </div>
    <div class="pillar-card">
      <div class="pillar-label">Optymalizacja SEO</div>
      <div class="pillar-val ${getScoreClass(data.seoScore)}">${data.seoScore}<span>/100</span></div>
    </div>
    <div class="pillar-card">
      <div class="pillar-label">Bezpieczeństwo SSL</div>
      <div class="pillar-val ${getScoreClass(data.securityScore)}">${data.securityScore}<span>/100</span></div>
    </div>
    <div class="pillar-card">
      <div class="pillar-label">Mobile & UX</div>
      <div class="pillar-val ${getScoreClass(data.uxScore)}">${data.uxScore}<span>/100</span></div>
    </div>
  `;
}

function getScoreClass(score) {
  if (score >= 85) return 'score-green';
  if (score >= 60) return 'score-amber';
  return 'score-rose';
}

function renderMetrics(metrics) {
  metricsGrid.innerHTML = '';
  const statusColors = {
    good: '#10b981',
    warn: '#f59e0b',
    poor: '#f43f5e'
  };

  for (const [key, item] of Object.entries(metrics)) {
    const card = document.createElement('div');
    card.className = 'metric-card';

    card.innerHTML = `
      <div class="metric-header">
        <span class="metric-name">${item.name}</span>
        <span class="metric-status-dot" style="background-color: ${statusColors[item.status]};"></span>
      </div>
      <div class="metric-val" style="color: ${statusColors[item.status]};">${item.value}</div>
      <div class="metric-desc">${item.desc}</div>
    `;
    metricsGrid.appendChild(card);
  }
}

function renderResources(res) {
  if (!resourcesContainer) return;

  const barSegments = res.breakdown.map(b => 
    `<div class="res-bar-segment" style="width: ${b.pct}%; background-color: ${b.color};" title="${b.type}: ${b.size} (${b.pct}%)"></div>`
  ).join('');

  const items = res.breakdown.map(b => `
    <div class="res-item">
      <div class="res-item-left">
        <span class="res-color-badge" style="background-color: ${b.color};"></span>
        <span class="res-name">${b.type}</span>
      </div>
      <div class="res-item-right">
        <span class="res-size">${b.size}</span>
        <span class="res-pct">${b.pct}%</span>
      </div>
    </div>
  `).join('');

  resourcesContainer.innerHTML = `
    <div class="res-summary-header">
      <div>
        <span class="res-total-label">Łączny rozmiar strony:</span>
        <strong class="res-total-val">${res.totalSize}</strong>
      </div>
      <div>
        <span class="res-total-label">Zapytania sieciowe:</span>
        <strong class="res-total-val">${res.requests} requestów</strong>
      </div>
    </div>
    <div class="res-bar">${barSegments}</div>
    <div class="res-grid">${items}</div>
  `;
}

function renderTimeline(timeline) {
  if (!timelineContainer) return;

  const rows = timeline.map(step => `
    <div class="timeline-row">
      <div class="timeline-label">
        <span>${step.name}</span>
        <span class="timeline-time">${step.time}</span>
      </div>
      <div class="timeline-track">
        <div class="timeline-fill" style="width: ${step.pct}%;"></div>
      </div>
    </div>
  `).join('');

  timelineContainer.innerHTML = `
    <div class="timeline-card">
      ${rows}
    </div>
  `;
}

function renderBusinessImpact(biz) {
  if (!businessContainer) return;

  businessContainer.innerHTML = `
    <div class="biz-grid">
      <div class="biz-card">
        <div class="biz-label">Szacowany Bounce Rate</div>
        <div class="biz-val text-rose">${biz.bounceRate}</div>
        <div class="biz-desc">Odsetek użytkowników opuszczających stronę z powodu powolnego działania</div>
      </div>
      <div class="biz-card">
        <div class="biz-label">Potencjalny wzrost konwersji</div>
        <div class="biz-val text-emerald">${biz.potentialLift}</div>
        <div class="biz-desc">Średni prognozowany zysk w sprzedaży/zapytaniach po optymalizacji technicznej</div>
      </div>
      <div class="biz-card">
        <div class="biz-label">Ocena wydajności Google Mobile</div>
        <div class="biz-badge">${biz.mobileSpeedStatus}</div>
        <div class="biz-desc">Spełnienie norm Google Core Web Vitals kluczowe dla pozycji w SEO</div>
      </div>
    </div>
  `;
}

function renderChecklist(checklist) {
  checklistContainer.innerHTML = '';
  const icons = {
    pass: '✓',
    warn: '!',
    fail: '✕'
  };

  checklist.forEach(item => {
    const row = document.createElement('div');
    row.className = 'checklist-item';

    row.innerHTML = `
      <div class="check-icon check-${item.status}">${icons[item.status]}</div>
      <div class="check-content">
        <div class="check-header">
          <h4>${item.title}</h4>
          ${item.category ? `<span class="check-category">${item.category}</span>` : ''}
        </div>
        <p>${item.desc}</p>
      </div>
    `;
    checklistContainer.appendChild(row);
  });
}

function exportReport() {
  if (!currentAuditData) return;

  const d = currentAuditData;
  const markdown = `# Raport Audytu Wydajności, Core Web Vitals & SEO: ${d.url}
Data audytu: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}  
Audytor: WebSpeed.eu by Marcel (@deloskiytbackup)

---

## 🎯 Główne Wskaźniki Audytu:
- **Wydajność (Performance):** ${d.performanceScore} / 100
- **Optymalizacja SEO:** ${d.seoScore} / 100
- **Bezpieczeństwo & SSL:** ${d.securityScore} / 100
- **Mobile UX:** ${d.uxScore} / 100

---

## 📊 Core Web Vitals (Google UX):
- **LCP (Largest Contentful Paint):** ${d.metrics.lcp.value} — ${d.metrics.lcp.desc}
- **FCP (First Contentful Paint):** ${d.metrics.fcp.value} — ${d.metrics.fcp.desc}
- **CLS (Cumulative Layout Shift):** ${d.metrics.cls.value} — ${d.metrics.cls.desc}
- **TTFB (Time to First Byte):** ${d.metrics.ttfb.value} — ${d.metrics.ttfb.desc}
- **TBT (Total Blocking Time):** ${d.metrics.tbt.value} — ${d.metrics.tbt.desc}
- **Speed Index:** ${d.metrics.si.value} — ${d.metrics.si.desc}

---

## 📦 Waga Strony i Transfer Zasobów:
- **Łączna waga strony:** ${d.resources.totalSize}
- **Liczba zapytań HTTP:** ${d.resources.requests}
- **Podział zasobów:**
${d.resources.breakdown.map(b => `  - ${b.type}: ${b.size} (${b.pct}%)`).join('\n')}

---

## ⏱️ Oś Czasu Ładowania (Waterfall Timeline):
${d.timeline.map(t => `- **${t.name}:** ${t.time}`).join('\n')}

---

## 💼 Wpływ na Biznes i Konwersję:
- **Szacowany Bounce Rate:** ${d.businessImpact.bounceRate}
- **Potencjalny wzrost konwersji po optymalizacji:** ${d.businessImpact.potentialLift}
- **Status Google Mobile:** ${d.businessImpact.mobileSpeedStatus}

---

## 🔍 Szczegółowa Diagnostyka i Zalecenia Techniczne:
${d.checklist.map(c => `- [${c.status.toUpperCase()}] [${c.category || 'Ogólne'}] ${c.title}: ${c.desc}`).join('\n')}

---

## 👨‍💻 Chcesz przyspieszyć tę stronę i wyeliminować błędy?
Skontaktuj się ze mną – zajmuję się profesjonalną optymalizacją szybkości stron i Core Web Vitals:
- **Autor:** Marcel
- **E-mail:** deloskiyt@gmail.com
- **Telefon:** +48 607 396 610
- **GitHub:** https://github.com/deloskiytbackup
`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const safeHost = new URL(d.url).hostname.replace(/[^a-z0-9]/gi, '_');
  a.download = `audyt-${safeHost}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
