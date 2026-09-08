import { runWebsiteAudit, normalizeUrl, probeCustomEndpoint, crawlAndProbeLiveEndpoints, sendRequestThroughPage } from './api.js';

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
const btnToggleAll = document.getElementById('btn-toggle-all');

// Kontenery na bogate dane
const pillarsContainer = document.getElementById('pillars-container');
const resourcesContainer = document.getElementById('resources-container');
const timelineContainer = document.getElementById('timeline-container');
const businessContainer = document.getElementById('business-container');

// Elementy skanera endpointów
const endpointsContainer = document.getElementById('endpoints-container');
const endpointCustomInput = document.getElementById('endpoint-custom-input');
const btnProbeEndpoint = document.getElementById('btn-probe-endpoint');
const endpointsList = document.getElementById('endpoints-list');
const epStatTotal = document.getElementById('ep-stat-total');
const epStatActive = document.getElementById('ep-stat-active');
const epStatIssues = document.getElementById('ep-stat-issues');
const epStatAvg = document.getElementById('ep-stat-avg');
const endpointSearchFilter = document.getElementById('endpoint-search-filter');
const epScanStatus = document.getElementById('ep-scan-status');

let currentEndpoints = [];
let activeEndpointCategory = 'all';
let endpointSearchQuery = '';

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

  // Obsługa testowania własnych endpointów
  setupEndpointProbe();

  // Obsługa interaktywnej konsoli zapytań HTTP
  setupEndpointRequester();

  // Inicjalizacja zwijania sekcji (Collapsible / Accordion)
  setupCollapsibleSections();
});

function setupCollapsibleSections() {
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.getAttribute('data-target');
      const body = document.getElementById(targetId);
      if (!body) return;

      const isClosed = header.classList.toggle('is-closed');
      body.classList.toggle('is-hidden', isClosed);
    });
  });

  if (btnToggleAll) {
    let allCollapsed = false;
    btnToggleAll.addEventListener('click', () => {
      allCollapsed = !allCollapsed;
      document.querySelectorAll('.collapsible-header').forEach(header => {
        const targetId = header.getAttribute('data-target');
        const body = document.getElementById(targetId);
        if (body) {
          header.classList.toggle('is-closed', allCollapsed);
          body.classList.toggle('is-hidden', allCollapsed);
        }
      });
      btnToggleAll.textContent = allCollapsed ? 'Rozwiń wszystkie sekcje ▾' : 'Zwiń wszystkie sekcje ▴';
    });
  }
}

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

  // 7. Rozpoczęcie analizy i badania endpointów na żywo (1:1 ze strony bez danych mockowanych)
  startLiveEndpointDiscovery(data.url);

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

    const tip = getRemediationTip(item.title, item.status);

    row.innerHTML = `
      <div class="check-icon check-${item.status}">${icons[item.status]}</div>
      <div class="check-content">
        <div class="check-header">
          <h4>${item.title}</h4>
          <div class="check-header-right">
            ${item.category ? `<span class="check-category">${item.category}</span>` : ''}
          </div>
        </div>
        <p>${item.desc}</p>
        ${tip ? `<div class="check-remediation">${tip}</div>` : ''}
      </div>
    `;

    checklistContainer.appendChild(row);
  });
}

function getRemediationTip(title, status) {
  if (status === 'pass') return null;

  if (title.includes('obrazów')) {
    return '<strong>💡 Rekomendacja developera:</strong> Skonwertuj pliki PNG/JPG do nowoczesnego formatu <code>.webp</code> lub <code>.avif</code>. Zastosuj tag <code>&lt;picture&gt;</code> i atrybut <code>loading="lazy"</code> dla grafik poniżej pierwszego ekranu.';
  }
  if (title.includes('renderowanie')) {
    return '<strong>💡 Rekomendacja developera:</strong> Dodaj atrybuty <code>defer</code> lub <code>async</code> do zewnętrznych skryptów JavaScript. Wydziel krytyczny CSS (Critical CSS) i wstrzyknij go w <code>&lt;style&gt;</code> w nagłówku.';
  }
  if (title.includes('podręczna')) {
    return '<strong>💡 Rekomendacja developera:</strong> Skonfiguruj nagłówek serwera <code>Cache-Control: public, max-age=31536000, immutable</code> dla plików statycznych w Nginx/Apache lub na CDN Cloudflare.';
  }
  if (title.includes('meta-tagów')) {
    return '<strong>💡 Rekomendacja developera:</strong> Uzupełnij tag <code>&lt;meta name="description" content="..."&gt;</code> (optymalnie 140–160 znaków) oraz tagi <code>og:title</code> i <code>og:image</code> dla podglądu w mediach społecznościowych.';
  }
  if (title.includes('nagłówków')) {
    return '<strong>💡 Rekomendacja developera:</strong> Upewnij się, że strona posiada dokładnie jeden główny nagłówek <code>&lt;h1&gt;</code> z główną frazą kluczową, a kolejne sekcje korzystają z hierarchii <code>&lt;h2&gt;</code> i <code>&lt;h3&gt;</code>.';
  }
  if (title.includes('dotykowych')) {
    return '<strong>💡 Rekomendacja developera:</strong> Zwiększ odstępy (padding) dla przycisków i linków mobilnych do minimum 48x48px, aby ułatwić obsługę kciukiem.';
  }
  if (title.includes('SSL')) {
    return '<strong>💡 Rekomendacja developera:</strong> Wygeneruj darmowy certyfikat SSL Let\'s Encrypt na hostingu i wymuś przekierowanie 301 z HTTP na HTTPS.';
  }
  return null;
}

async function startLiveEndpointDiscovery(url) {
  if (!endpointsList) return;
  currentEndpoints = [];
  updateEndpointStats([]);
  endpointsList.innerHTML = '';

  let host = '';
  try {
    host = new URL(url).hostname;
  } catch (e) {
    host = url;
  }

  if (epScanStatus) {
    epScanStatus.style.display = 'flex';
    epScanStatus.className = 'endpoint-scan-status is-scanning';
    epScanStatus.innerHTML = `
      <div class="endpoint-scan-spinner"></div>
      <span>Skanowanie kodu aplikacji i badanie endpointów na żywo dla <strong>${host}</strong>...</span>
    `;
  }

  try {
    const liveResults = await crawlAndProbeLiveEndpoints(
      url,
      (newEndpoint) => {
        currentEndpoints.push(newEndpoint);
        updateEndpointStats(currentEndpoints);
        updateEndpointsView();
      },
      (current, total) => {
        if (epScanStatus) {
          epScanStatus.className = 'endpoint-scan-status is-scanning';
          epScanStatus.innerHTML = `
            <div class="endpoint-scan-spinner"></div>
            <span>Badanie na żywo: sprawdzono <strong>${current}</strong> z <strong>${total}</strong> ścieżek kodu...</span>
          `;
        }
      }
    );

    if (currentAuditData) {
      currentAuditData.endpoints = liveResults;
    }

    if (epScanStatus) {
      epScanStatus.className = 'endpoint-scan-status is-finished';
      epScanStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--emerald-400); flex-shrink: 0;"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Zakończono analizę: zbadano <strong>${liveResults.length}</strong> wykrytych endpointów serwera.</span>
      `;
    }
  } catch (err) {
    console.error('Live crawl error:', err);
    if (epScanStatus) {
      epScanStatus.className = 'endpoint-scan-status';
      epScanStatus.innerHTML = `<span>Zakończono analizę endpointów serwera.</span>`;
    }
  }
}

function setupEndpointProbe() {
  // 1. Próbnik własnych endpointów
  if (btnProbeEndpoint && endpointCustomInput) {
    const handleProbe = async () => {
      const customPath = endpointCustomInput.value.trim();
      if (!customPath) return;
      if (!currentAuditData) {
        alert('Najpierw wykonaj audyt strony, aby sprawdzić endpoint.');
        return;
      }

      btnProbeEndpoint.disabled = true;
      btnProbeEndpoint.textContent = 'Sprawdzam...';

      try {
        const result = await probeCustomEndpoint(currentAuditData.url, customPath);
        if (currentAuditData.endpoints) {
          currentAuditData.endpoints.unshift(result);
        }
        currentEndpoints.unshift(result);
        updateEndpointStats(currentEndpoints);
        updateEndpointsView();
        endpointCustomInput.value = '';
      } catch (err) {
        alert('Błąd podczas sprawdzania endpointu: ' + (err.message || err));
      } finally {
        btnProbeEndpoint.disabled = false;
        btnProbeEndpoint.textContent = 'Zbadaj ścieżkę';
      }
    };

    btnProbeEndpoint.addEventListener('click', handleProbe);
    endpointCustomInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleProbe();
      }
    });
  }

  // 2. Filtry kategorii
  document.querySelectorAll('.endpoint-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.endpoint-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeEndpointCategory = btn.getAttribute('data-filter') || 'all';
      updateEndpointsView();
    });
  });

  // 3. Wyszukiwarka na żywo
  if (endpointSearchFilter) {
    endpointSearchFilter.addEventListener('input', (e) => {
      endpointSearchQuery = e.target.value.toLowerCase().trim();
      updateEndpointsView();
    });
  }
}

function renderEndpoints(endpoints, baseUrl) {
  currentEndpoints = endpoints || [];
  updateEndpointStats(currentEndpoints);
  updateEndpointsView();
}

function updateEndpointStats(endpoints) {
  if (!endpoints || !endpoints.length) return;

  const total = endpoints.length;
  const active = endpoints.filter(e => (e.status >= 200 && e.status < 300) || (e.category === 'API' && [400, 401, 403, 405].includes(e.status))).length;
  const issues = total - active;
  const totalLatency = endpoints.reduce((sum, e) => sum + (parseInt(e.latency) || 0), 0);
  const avgLatency = total ? Math.round(totalLatency / total) : 0;

  if (epStatTotal) epStatTotal.textContent = total;
  if (epStatActive) epStatActive.textContent = active;
  if (epStatIssues) epStatIssues.textContent = issues;
  if (epStatAvg) epStatAvg.textContent = `${avgLatency} ms`;
}

function updateEndpointsView() {
  if (!endpointsList) return;
  endpointsList.innerHTML = '';

  const filtered = currentEndpoints.filter(ep => {
    // Filtr kategorii
    if (activeEndpointCategory === '200' && !((ep.status >= 200 && ep.status < 300) || (ep.category === 'API' && [400, 401, 403, 405].includes(ep.status)))) return false;
    if (activeEndpointCategory === 'API' && ep.category !== 'API') return false;
    if (activeEndpointCategory === 'Routing' && ep.category !== 'Routing') return false;
    if (activeEndpointCategory === 'SEO' && ep.category !== 'SEO') return false;
    if (activeEndpointCategory === 'Security' && ep.category !== 'Security') return false;

    // Wyszukiwarka tekstowa
    if (endpointSearchQuery) {
      const matchPath = ep.path.toLowerCase().includes(endpointSearchQuery);
      const matchCategory = ep.category.toLowerCase().includes(endpointSearchQuery);
      const matchDesc = (ep.desc || '').toLowerCase().includes(endpointSearchQuery);
      const matchStatus = String(ep.status).includes(endpointSearchQuery) || (ep.statusText || '').toLowerCase().includes(endpointSearchQuery);
      if (!matchPath && !matchCategory && !matchDesc && !matchStatus) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    endpointsList.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--zinc-500); font-size: 12px;">
        Brak endpointów spełniających kryteria wyszukiwania.
      </div>
    `;
    return;
  }

  filtered.forEach(ep => {
    endpointsList.appendChild(createEndpointRow(ep));
  });
}

function createEndpointRow(ep) {
  const row = document.createElement('div');
  row.className = 'endpoint-row';

  const badgeClass = ep.status >= 500 ? 'badge-http-500' :
                     ep.status >= 400 ? 'badge-http-400' :
                     ep.status >= 300 ? 'badge-http-300' : 'badge-http-200';

  const latencyColor = ep.latency < 50 ? 'var(--emerald-400)' : ep.latency < 120 ? 'var(--amber-400)' : 'var(--rose-400)';

  row.innerHTML = `
    <div class="endpoint-left">
      <span class="endpoint-path" title="${ep.fullUrl}">${ep.path}</span>
      <span class="endpoint-tag">${ep.category}</span>
      ${ep.desc ? `<span class="endpoint-desc" title="${ep.desc}">${ep.desc}</span>` : ''}
    </div>
    <div class="endpoint-right">
      <span class="endpoint-latency" style="color: ${latencyColor};">⚡ ${ep.latency} ms</span>
      <span class="badge-http ${badgeClass}">${ep.status} ${ep.statusText}</span>
      <button type="button" class="btn-query-row" title="Wyślij zapytanie do tego endpointu przez naszą stronę">⚡ Zapytaj</button>
      <a href="${ep.fullUrl}" target="_blank" rel="noopener noreferrer" class="endpoint-link" title="Otwórz URL w nowej karcie">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
  `;

  const btnQuery = row.querySelector('.btn-query-row');
  if (btnQuery) {
    btnQuery.addEventListener('click', (e) => {
      e.stopPropagation();
      openRequesterForUrl(ep.fullUrl, ep.path, ep.category);
    });
  }

  return row;
}

function setupEndpointRequester() {
  const requesterBox = document.getElementById('endpoint-requester-box');
  const btnOpenConsole = document.getElementById('btn-open-console');
  const btnCloseRequester = document.getElementById('btn-close-requester');
  const reqMethod = document.getElementById('req-method');
  const reqUrl = document.getElementById('req-url');
  const btnSendRequest = document.getElementById('btn-send-request');
  const btnToggleAdvanced = document.getElementById('btn-toggle-req-advanced');
  const advancedPanel = document.getElementById('requester-advanced-panel');
  const reqParams = document.getElementById('req-params');
  const reqBody = document.getElementById('req-body');
  const reqBodyGroup = document.getElementById('req-body-group');
  const reqHeaders = document.getElementById('req-headers');
  const resBox = document.getElementById('requester-response-box');
  const resBadge = document.getElementById('req-res-badge');
  const resTime = document.getElementById('req-res-time');
  const resSize = document.getElementById('req-res-size');
  const resMode = document.getElementById('req-res-mode');
  const resBody = document.getElementById('req-res-body');
  const btnCopyRes = document.getElementById('btn-copy-response');

  if (!requesterBox || !btnSendRequest) return;

  // Przycisk otwierający konsolę z paska kontrolnego
  if (btnOpenConsole) {
    btnOpenConsole.addEventListener('click', () => {
      const isHidden = requesterBox.style.display === 'none';
      requesterBox.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        if (!reqUrl.value && currentAuditData) {
          reqUrl.value = currentAuditData.url;
        }
        requesterBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Przycisk zamykający
  if (btnCloseRequester) {
    btnCloseRequester.addEventListener('click', () => {
      requesterBox.style.display = 'none';
    });
  }

  // Zmiana metody HTTP -> przełączenie widoczności pola Body
  if (reqMethod && reqBodyGroup) {
    reqMethod.addEventListener('change', () => {
      const m = reqMethod.value;
      reqBodyGroup.style.display = (m === 'POST' || m === 'PUT' || m === 'PATCH') ? 'flex' : 'none';
    });
  }

  // Przełącznik opcji zaawansowanych
  if (btnToggleAdvanced && advancedPanel) {
    btnToggleAdvanced.addEventListener('click', () => {
      const isHidden = advancedPanel.style.display === 'none';
      advancedPanel.style.display = isHidden ? 'flex' : 'none';
    });
  }

  // Kopiowanie odpowiedzi do schowka
  if (btnCopyRes && resBody) {
    btnCopyRes.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(resBody.textContent);
        const prevText = btnCopyRes.textContent;
        btnCopyRes.textContent = 'Skopiowano!';
        setTimeout(() => { btnCopyRes.textContent = prevText; }, 2000);
      } catch (err) {
        alert('Nie udało się skopiować zawartości do schowka.');
      }
    });
  }

  // Wysłanie zapytania przez naszą stronę
  btnSendRequest.addEventListener('click', async () => {
    const method = reqMethod.value || 'GET';
    const rawUrl = reqUrl.value.trim();
    if (!rawUrl) {
      alert('Podaj adres URL lub wybierz endpoint do odpytania.');
      return;
    }

    btnSendRequest.disabled = true;
    btnSendRequest.innerHTML = `
      <div class="endpoint-scan-spinner" style="width: 12px; height: 12px; border-width: 1.5px;"></div>
      <span>Wysyłam...</span>
    `;
    resBox.style.display = 'none';

    try {
      const result = await sendRequestThroughPage(
        method,
        rawUrl,
        reqParams.value.trim(),
        reqHeaders.value.trim(),
        reqBody.value.trim()
      );

      resBadge.className = `badge-http ${result.status >= 500 ? 'badge-http-500' : result.status >= 400 ? 'badge-http-400' : result.status >= 300 ? 'badge-http-300' : 'badge-http-200'}`;
      resBadge.textContent = `${result.status} ${result.statusText}`;
      resTime.textContent = `⚡ ${result.duration} ms`;
      resSize.textContent = `📦 ${(result.size / 1024).toFixed(1)} KB`;
      resMode.textContent = result.usedProxy ? 'CORS Gateway Proxy' : 'Bezpośrednio z przeglądarki';
      resMode.style.color = result.usedProxy ? 'var(--amber-400)' : 'var(--emerald-400)';

      resBody.textContent = result.body || '(Pusta odpowiedź serwera)';
      resBox.style.display = 'block';
    } catch (err) {
      resBadge.className = 'badge-http badge-http-500';
      resBadge.textContent = 'BŁĄD ZAPYTANIA';
      resTime.textContent = '⚡ -- ms';
      resSize.textContent = '📦 0 B';
      resMode.textContent = 'Błąd sieci';
      resBody.textContent = err.message || 'Wystąpił błąd podczas wysyłania zapytania do endpointu.';
      resBox.style.display = 'block';
    } finally {
      btnSendRequest.disabled = false;
      btnSendRequest.innerHTML = `
        <span>Wyślij zapytanie</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
    }
  });
}

function openRequesterForUrl(fullUrl, path, category) {
  const requesterBox = document.getElementById('endpoint-requester-box');
  const reqMethod = document.getElementById('req-method');
  const reqUrl = document.getElementById('req-url');
  const reqParams = document.getElementById('req-params');
  const advancedPanel = document.getElementById('requester-advanced-panel');
  const btnSendRequest = document.getElementById('btn-send-request');

  if (!requesterBox || !reqUrl) return;

  requesterBox.style.display = 'block';
  reqUrl.value = fullUrl;

  // Inteligentne podpowiedzi parametrów dla znanych endpointów
  if (path === '/api/check') {
    if (reqParams) reqParams.value = 'model=SM-S928B&region=EUX';
    if (advancedPanel) advancedPanel.style.display = 'flex';
  } else if (path === '/api/download') {
    if (reqParams) reqParams.value = '';
  }

  if (category === 'API') {
    if (reqMethod) reqMethod.value = 'GET';
  }

  requesterBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (btnSendRequest) {
    btnSendRequest.focus();
  }
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

## 📡 Przetestowane Endpointy i Dostępność:
${(d.endpoints || []).map(ep => `- [HTTP ${ep.status}] ${ep.path} (${ep.category}) — ${ep.latency} ms [${ep.statusText}]`).join('\n')}

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
