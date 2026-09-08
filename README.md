# ⚡ WebSpeed & SEO Audit

> **Błyskawiczne narzędzie online do audytu wydajności stron internetowych, Core Web Vitals i SEO.**  
> Zbudowane w czystym JavaScript (ES Modules), HTML5 i CSS3 bez zbędnych frameworków i zależności zewnętrznych (Zero Dependencies).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Author](https://img.shields.io/badge/Author-deloskiytbackup-blue.svg)](https://github.com/deloskiytbackup)

---

## 🎯 Czym jest WebSpeed & SEO Audit?

**WebSpeed & SEO Audit** to nowoczesna aplikacja webowa stworzona z myślą o klientach, właścicielach e-commerce i developerach, którzy chcą w kilka sekund dowiedzieć się:
- Jak szybko ładuje się ich strona internetowa na urządzeniach mobilnych i desktopowych.
- Czy spełniają kluczowe standardy Google **Core Web Vitals** (LCP, FCP, CLS, TTFB).
- Jakie błędy techniczne wpływają negatywnie na pozycjonowanie w wyszukiwarce Google (SEO).
- Co dokładnie należy poprawić, aby skrócić czas ładowania i zwiększyć konwersję sprzedaży.

---

## ✨ Główne funkcje

- 🚀 **Analiza Core Web Vitals w czasie rzeczywistym:**
  - **LCP (Largest Contentful Paint)** – czas wyrenderowania największego elementu strony.
  - **FCP (First Contentful Paint)** – pierwsze zauważalne pojawienie się treści.
  - **CLS (Cumulative Layout Shift)** – wskaźnik stabilności wizualnej układu.
  - **TTFB (Time to First Byte)** – czas odpowiedzi serwera hostingowego.
- 🎨 **Interaktywny wskaźnik SVG:** Płynna animacja kołowa ze wskaźnikiem punktacji (0-100) z dynamiczną kolorystyką (zielony / pomarańczowy / czerwony).
- 🔍 **Checklista diagnostyczna:** Analiza kompresji obrazów (WebP/AVIF), minifikacji CSS/JS, protokołu HTTPS, meta-tagów i indeksacji SEO.
- 📄 **Automatyczny eksport raportu:** Możliwość wygenerowania i pobrania gotowego raportu technicznego w formacie Markdown (`.md`) jednym kliknięciem.
- ⚡ **Zero Dependencies:** Całość działa na czystym JavaScript (ES Modules) i wbudowanym serwerze HTTP Node.js – żadnych ciężkich paczek `node_modules`.
- 📱 **Responsive & Modern UI:** Nowoczesny interfejs w stylu Glassmorphism i Dark Mode, zoptymalizowany pod ekrany telefonów, tabletów i laptopów.

---

## 🚀 Szybki start (Local Development)

### Wymagania:
- Node.js w wersji 18 lub nowszej

### Uruchomienie:
```bash
# 1. Sklonuj repozytorium
git clone https://github.com/deloskiytbackup/webspeed-audit.git
cd webspeed-audit

# 2. Uruchom serwer (bez instalowania pakietów npm!)
npm start
# lub: node server.js
```

Aplikacja natychmiast uruchomi się pod adresem:  
👉 **http://localhost:3000**

---

## 🌐 Wdrożenie (Deployment)

Aplikacja składa się z plików statycznych i natywnego `server.js`, dzięki czemu wdrożenie jest bajecznie proste:

### Opcja A: Vercel / Netlify (Polecane)
Projekt możesz wdrożyć bezpośrednio łącząc swoje konto GitHub z [Vercel](https://vercel.com) lub [Netlify](https://netlify.com) – zero konfiguracji, działa od razu.

### Opcja B: GitHub Pages
W ustawieniach repozytorium GitHub (`Settings` -> `Pages`) wybierz branch `main` i folder `/` (root) jako źródło. Aplikacja będzie dostępna pod darmowym adresem `https://deloskiytbackup.github.io/webspeed-audit`.

---

## 🛠️ Architektura i Technologie

```
webspeed-audit/
├── index.html        # Semantyczny szablon HTML5 z interfejsem wyników
├── server.js         # Lekki serwer HTTP napisany w czystym Node.js (bez frameworków)
├── package.json      # Konfiguracja projektu i skrypt npm start
├── src/
│   ├── app.js        # Główny kontroler aplikacji, obsługa DOM i animacji
│   ├── api.js        # Integracja z Google PageSpeed API + realistyczny fallback
│   └── styles.css    # Autorski arkusz CSS w stylu Glassmorphism Dark Theme
└── README.md         # Dokumentacja projektu
```

- **Frontend:** Vanilla HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism, SVG animations), Modern JavaScript (ES Modules, Async/Await, Fetch API).
- **Backend/Serwer:** Node.js native `http` module.
- **API:** Google PageSpeed Insights API v5.

---

## 👨‍💻 Autor & Kontakt

**Marcel** – *Web Developer & Twórca Nowoczesnych Stron WWW*

- 🌐 GitHub: [@deloskiytbackup](https://github.com/deloskiytbackup)
- ✉️ E-mail: [deloskiyt@gmail.com](mailto:deloskiyt@gmail.com)
- 📞 Telefon: [+48 607 396 610](tel:+48607396610)

Jeśli potrzebujesz przyspieszyć swoją stronę, stworzyć nową witrynę od zera lub zoptymalizować pozycjonowanie SEO – odezwij się!

---

## 📄 Licencja

Projekt udostępniony na licencji [MIT](LICENSE).
