/**
 * cms-loader.js
 * Reads JSON files from _data/ and populates page content dynamically.
 * All content is managed via Decap CMS at /admin.
 */

const CMS = {

  async fetch(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },

  async fetchAll(folder, files) {
    const results = await Promise.all(files.map(f => this.fetch(`/_data/${folder}/${f}`)));
    return results.filter(Boolean);
  },

  // ── Populate the homepage ──────────────────────────────────────────────────
  async loadHomepage() {
    const data = await this.fetch('/_data/homepage.json');
    if (!data) return;

    // Hero
    if (data.hero) {
      const h = data.hero;
      const heroImg = document.querySelector('.hero img');
      const heroTitle = document.querySelector('.hero-title');
      const heroDesc = document.querySelector('.hero-desc');
      const heroBtn = document.querySelector('.hero-content .btn-member');
      if (heroImg && h.image) heroImg.src = h.image;
      if (heroTitle && h.heading) heroTitle.textContent = h.heading;
      if (heroDesc && h.description) heroDesc.textContent = h.description;
      if (heroBtn) { heroBtn.textContent = h.button_label; heroBtn.href = h.button_url; }
    }

    // Drive section
    if (data.drive_section) {
      const title = document.querySelector('.section-title');
      const desc = document.querySelector('.section-desc');
      if (title) title.textContent = data.drive_section.heading;
      if (desc) desc.textContent = data.drive_section.description;
    }

    // Join section
    if (data.join_section) {
      const j = data.join_section;
      const joinTitle = document.querySelector('.join-title');
      const joinDesc = document.querySelector('.join-desc');
      const joinList = document.querySelector('.join-list');
      const joinPhoto = document.querySelector('.join-photo-col img');
      const joinCaption = document.querySelector('.join-photo-caption');
      const joinBtn = document.querySelector('.join-content .btn-member');
      if (joinTitle) joinTitle.textContent = j.heading;
      if (joinDesc) joinDesc.textContent = j.body;
      if (joinList && j.bullets) {
        joinList.innerHTML = j.bullets.map(b => `<li>${b}</li>`).join('');
      }
      if (joinPhoto && j.photo) joinPhoto.src = j.photo;
      if (joinCaption && j.photo_caption) {
        joinCaption.innerHTML = `<strong>${j.photo_caption}</strong>`;
      }
      if (joinBtn) { joinBtn.textContent = j.button_label; joinBtn.href = j.button_url; }
    }
  },

  // ── Populate upcoming events crawl ────────────────────────────────────────
  async loadEvents() {
    // Fetch the file list from _data/events/ via a manifest
    const manifest = await this.fetch('/_data/events/_manifest.json');
    if (!manifest) return;

    const events = (await Promise.all(
      manifest.map(f => this.fetch(`/_data/events/${f}`))
    )).filter(Boolean);

    // Sort by date ascending, take next 3
    const now = new Date();
    const upcoming = events
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);

    if (!upcoming.length) return;

    // Render into events crawl
    const crawl = document.querySelector('.events-crawl');
    if (!crawl) return;

    // Remove existing cal items
    crawl.querySelectorAll('.cal-item').forEach(el => el.remove());

    upcoming.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'cal-item';
      item.innerHTML = `
        <div class="cal-icon">
          <div class="cal-month">${ev.month_label}</div>
          <div class="cal-day">${ev.day}</div>
        </div>
        <div class="cal-info">
          <div class="cal-title">${ev.title}</div>
          <div class="cal-desc">${ev.description}</div>
        </div>`;
      crawl.appendChild(item);
    });
  },

  // ── Populate homepage news cards ──────────────────────────────────────────
  async loadNews() {
    const manifest = await this.fetch('/_data/news/_manifest.json');
    if (!manifest) return;

    const articles = (await Promise.all(
      manifest.map(f => this.fetch(`/_data/news/${f}`))
    )).filter(Boolean);

    const featured = articles
      .filter(a => a.featured)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 2);

    if (!featured.length) return;

    const newsRow = document.querySelector('.news-row');
    if (!newsRow) return;
    newsRow.innerHTML = '';

    featured.forEach(article => {
      const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const card = document.createElement('div');
      card.className = 'story-card';
      card.innerHTML = `
        <div class="story-img">
          <img src="${article.image || ''}" alt="${article.title}" />
        </div>
        <div class="story-body">
          <span class="story-tag">${article.category.toUpperCase()}</span>
          <a href="article.html?slug=${slug}" class="story-title">${article.title}</a>
          <p class="story-text">${article.summary}</p>
          <a href="article.html?slug=${slug}" class="read-more">Read more &gt;</a>
        </div>`;
      newsRow.appendChild(card);
    });
  },

  // ── Populate newsletter banner ─────────────────────────────────────────────
  async loadNewsletter() {
    const manifest = await this.fetch('/_data/newsletter/_manifest.json');
    if (!manifest) return;

    const issues = (await Promise.all(
      manifest.map(f => this.fetch(`/_data/newsletter/${f}`))
    )).filter(Boolean);

    const featured = issues.filter(i => i.featured)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (!featured) return;

    const img = document.querySelector('.newsletter-img');
    const date = document.querySelector('.newsletter-date');
    const title = document.querySelector('.newsletter-title');
    const desc = document.querySelector('.newsletter-text');
    const btn = document.querySelector('.btn-primary[href]');
    if (img) img.src = featured.cover;
    if (date) date.textContent = featured.title;
    if (title) title.textContent = `Fill up with the latest ${featured.title} Der Gasser`;
    if (desc) desc.textContent = featured.description;
    if (btn) btn.href = featured.download_url;
  },

  // ── Populate sponsors ──────────────────────────────────────────────────────
  async loadSponsors() {
    const manifest = await this.fetch('/_data/sponsors/_manifest.json');
    if (!manifest) return;

    const sponsors = (await Promise.all(
      manifest.map(f => this.fetch(`/_data/sponsors/${f}`))
    )).filter(Boolean).sort((a, b) => a.order - b.order);

    const grid = document.querySelector('.sponsors-grid');
    if (!grid || !sponsors.length) return;

    grid.innerHTML = sponsors.map(s => `
      <a href="${s.url}" target="_blank" rel="noopener"
         style="display:flex;align-items:center;justify-content:center;background:#f5f5f5;flex:1;height:200px;border-radius:4px;padding:20px;">
        <img src="${s.logo}" alt="${s.name}" style="max-width:100%;max-height:120px;object-fit:contain;" />
      </a>`).join('');
  },

  // ── Populate anniversaries ticker ──────────────────────────────────────────
  async loadAnniversaries() {
    const manifest = await this.fetch('/_data/anniversaries/_manifest.json');
    if (!manifest) return;

    const members = (await Promise.all(
      manifest.map(f => this.fetch(`/_data/anniversaries/${f}`))
    )).filter(Boolean);

    if (!members.length) return;

    const prompt = document.getElementById('anniv-upload-prompt');
    const trackOuter = document.getElementById('anniv-track-outer');
    const track = document.getElementById('anniv-track');
    if (!track) return;

    track.innerHTML = '';
    // Duplicate for seamless scroll
    [members, members].forEach(group => {
      group.forEach(m => {
        const el = document.createElement('div');
        el.className = 'anniv-member';
        el.innerHTML = `
          <div class="anniv-badge"><span>${m.years}</span></div>
          <div>
            <span class="anniv-name">${m.name}</span>
            ${m.location ? `<span class="anniv-location">${m.location}</span>` : ''}
          </div>`;
        track.appendChild(el);
      });
    });

    const duration = Math.max(15, members.length * 5);
    track.style.animationDuration = duration + 's';
    if (prompt) prompt.style.display = 'none';
    if (trackOuter) trackOuter.classList.add('active');
  },

  // ── Load HPDE events schedule ──────────────────────────────────────────────
  async loadHPDESchedule() {
    const manifest = await this.fetch('/_data/hpde/_manifest.json');
    if (!manifest) return [];

    const events = (await Promise.all(
      manifest.map(f => this.fetch(`/_data/hpde/${f}`))
    )).filter(Boolean)
     .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

    return events;
  },

  // ── Run everything for the homepage ───────────────────────────────────────
  async initHomepage() {
    await Promise.all([
      this.loadHomepage(),
      this.loadEvents(),
      this.loadNews(),
      this.loadNewsletter(),
      this.loadSponsors(),
      this.loadAnniversaries(),
    ]);
  },

  // ── Run for HPDE events page ──────────────────────────────────────────────
  async initHPDEEvents() {
    const events = await this.loadHPDESchedule();
    const container = document.getElementById('hpde-events-container');
    if (!container || !events.length) return;

    container.innerHTML = events.map(ev => `
      <div class="hpde-event">
        <div class="hpde-event-header">
          <div class="hpde-event-date-badge">
            <span class="m">${ev.month_label}</span>
            <span class="d">${ev.day}</span>
          </div>
          <div class="hpde-event-name">${ev.title} – ${ev.venue}</div>
          ${ev.intro_de ? '<span class="hpde-event-intro-badge">Intro to DE</span>' : ''}
        </div>
        <div class="hpde-event-body">
          <div class="hpde-track-outline">
            ${ev.track_map
              ? `<img src="${ev.track_map}" alt="${ev.title} track map" style="width:100%;border-radius:4px;" />`
              : `<div style="background:#f0f0f0;height:120px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#999;font-size:13px;">Track map coming soon</div>`
            }
          </div>
          <div class="hpde-event-details">
            <div class="hpde-event-meta">
              <div><span class="hpde-event-meta-label">Event date:</span>
                   <span class="hpde-event-meta-val">${this.formatDateRange(ev.date_start, ev.date_end)}</span></div>
              <div><span class="hpde-event-meta-label">Safety tech date:</span>
                   <span class="hpde-event-meta-val">${this.formatDate(ev.tech_date)}</span></div>
              <div><span class="hpde-event-meta-label">Safety tech location:</span>
                   <span class="hpde-event-meta-val">
                     ${ev.tech_location_url
                       ? `<a href="${ev.tech_location_url}">${ev.tech_location}</a>`
                       : ev.tech_location}
                   </span></div>
            </div>
            <p class="hpde-event-desc">${ev.description}</p>
            ${ev.register_url ? `<a href="${ev.register_url}" class="btn-register" target="_blank">Register ↗</a>` : ''}
          </div>
        </div>
        ${(ev.lap_video_url || ev.photos_url || ev.track_map) ? `
        <div class="hpde-media-grid">
          ${ev.lap_video_url ? `<a href="${ev.lap_video_url}" class="hpde-media-thumb" target="_blank"><div class="hpde-media-label">LAP<br>VIDEO</div></a>` : ''}
          ${ev.photos_url ? `<a href="${ev.photos_url}" class="hpde-media-thumb" target="_blank"><div class="hpde-media-label">EVENT<br>PHOTOS</div></a>` : ''}
          ${ev.track_map ? `<div class="hpde-media-thumb" style="background:#e8f0e8;"><div class="hpde-media-label" style="color:#333;text-shadow:none;">TRACK<br>MAP</div></div>` : ''}
        </div>` : ''}
      </div>`).join('');
  },

  formatDate(str) {
    if (!str) return '';
    const d = new Date(str + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  },

  formatDateRange(start, end) {
    if (!start) return '';
    const s = new Date(start + 'T12:00:00');
    const e = end ? new Date(end + 'T12:00:00') : null;
    const mo = s.toLocaleDateString('en-US', { month: 'long' });
    const sd = s.getDate();
    const ed = e ? e.getDate() : null;
    return ed && ed !== sd ? `${mo} ${sd}–${ed}` : `${mo} ${sd}`;
  },
};
