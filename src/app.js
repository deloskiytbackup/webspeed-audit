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

  // Animacja kołowego wskaźnika (0-100)
  animateGauge(data.performanceScore);

  // Renderowanie 4 kart Core Web Vitals
  renderMetrics(data.metrics);

  // Renderowanie checklisty
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
  if (targetScore < 50) color = '#ef4444'; // red
  else if (targetScore < 85) color = '#f59e0b'; // yellow

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

function renderMetrics(metrics) {
  metricsGrid.innerHTML = '';
  const statusColors = {
    good: '#10b981',
    warn: '#f59e0b',
    poor: '#ef4444'
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
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
    `;
    checklistContainer.appendChild(row);
  });
}

function exportReport() {
  if (!currentAuditData) return;

  const d = currentAuditData;
  const markdown = `# Raport Audytu Wydajności & SEO: ${d.url}
Data audytu: ${new Date().toLocaleDateString('pl-PL')}  
Narzędzie: WebSpeed & SEO Audit by Marcel (deloskiytbackup)

---

### Wynik Ogólny Performance: ${d.performanceScore} / 100
Wskaźnik SEO & Best Practices: ${d.seoScore} / 100

### Kluczowe wskaźniki Core Web Vitals:
- **LCP (Largest Contentful Paint):** ${d.metrics.lcp.value} (${d.metrics.lcp.desc})
- **FCP (First Contentful Paint):** ${d.metrics.fcp.value} (${d.metrics.fcp.desc})
- **CLS (Cumulative Layout Shift):** ${d.metrics.cls.value} (${d.metrics.cls.desc})
- **TTFB (Odpowiedź serwera):** ${d.metrics.ttfb.value} (${d.metrics.ttfb.desc})

### Wnioski i diagnostyka:
${d.checklist.map(c => `- [${c.status.toUpperCase()}] ${c.title}: ${c.desc}`).join('\n')}

---
**Chcesz przyspieszyć tę stronę i poprawić pozycję w Google?**
Skontaktuj się ze mną:
- E-mail: deloskiyt@gmail.com
- Telefon: +48 607 396 610
- GitHub: https://github.com/deloskiytbackup
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
