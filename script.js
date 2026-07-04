const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [103.8, 1.3],
  zoom: 10.5
});

const content = document.getElementById('content');

fetch('data.json')
  .then(res => res.json())
  .then(({ days }) => {

    const markers = []; // { el, marker, dayId, index }

    /* ==========================
       BUILD MARKERS + ROUTE LINES
       ========================== */

    map.on('load', () => {

      days.forEach(day => {

        const coords = day.stops.map(s => [s.lon, s.lat]);

        map.addSource(`route-${day.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords }
          }
        });

        map.addLayer({
          id: `route-${day.id}`,
          type: 'line',
          source: `route-${day.id}`,
          paint: {
            'line-color': day.color,
            'line-width': 2,
            'line-opacity': 0.55,
            'line-dasharray': [1, 1.6]
          }
        });

        day.stops.forEach((stop, index) => {

          const el = document.createElement('div');
          el.className = 'dot';
          el.style.setProperty('--dot-color', day.color);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([stop.lon, stop.lat])
            .addTo(map);

          markers.push({ el, dayId: day.id, index });
        });

      });

    });

    /* ==========================
       BUILD SCROLL CONTENT
       ========================== */

    let html = `
      <h1>A Journey of Learning</h1>
      <div class="subtitle">Singapore Internship Experience 2026</div>
    `;

    days.forEach(day => {

      html += `
        <section class="day-block" data-day="${day.id}" style="--day-color:${day.color}">

          <div class="day-header">
            <span class="day-tag">${day.label}</span>
          </div>

          <p class="day-insight">${day.insight}</p>

          <div class="stops">
      `;

      day.stops.forEach((stop, index) => {
        html += `
          <div class="stop-block" data-day="${day.id}" data-index="${index}">
            <div class="stop-marker" style="--dot-color:${day.color}">${stop.icon || ''}</div>
            <div class="stop-body">
              <h3 class="stop-title">${stop.title}</h3>
              ${stop.caption ? `<p class="stop-caption">${stop.caption}</p>` : ''}
              ${stop.image ? `<img src="${stop.image}">` : ''}
            </div>
          </div>
        `;
      });

      html += `
          </div>

          <div class="day-recap">
            <h3>KEY LESSON</h3>
            <p>${day.learned}</p>
            <h3>FUTURE PRACTICE</h3>
            <p>${day.futurePractice}</p>
          </div>

        </section>
      `;

    });

    content.innerHTML = html;

    /* ==========================
       SCROLLYTELLING OBSERVER
       ========================== */

    const dayBlocks = content.querySelectorAll('.day-block');

    let activeDay = null;
    let flyTimer = null;
    const intersecting = new Map();

    function fitDay(dayId) {

      const day = days.find(d => d.id === dayId);
      const bounds = new maplibregl.LngLatBounds();
      day.stops.forEach(s => bounds.extend([s.lon, s.lat]));

      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 460 },
        duration: 900,
        maxZoom: 14,
        essential: true
      });

    }

    function setActiveDay(dayId) {

      if (dayId === activeDay) return;
      activeDay = dayId;

      markers.forEach(m => {
        m.el.classList.toggle('active', m.dayId === dayId);
      });

      document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.id) === dayId);
      });

      clearTimeout(flyTimer);
      flyTimer = setTimeout(() => fitDay(dayId), 160);

    }

    const observer = new IntersectionObserver((entries) => {

      entries.forEach(entry => {

        const key = entry.target;

        if (entry.isIntersecting) {
          intersecting.set(key, entry);
        } else {
          intersecting.delete(key);
        }

      });

      if (intersecting.size === 0) return;

      const rootRect = content.getBoundingClientRect();
      const centerY = rootRect.top + rootRect.height / 2;

      let closest = null;
      let closestDist = Infinity;

      intersecting.forEach(entry => {
        const r = entry.boundingClientRect;
        const mid = r.top + r.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = entry.target;
        }
      });

      if (!closest) return;

      setActiveDay(Number(closest.dataset.day));

    }, {
      root: content,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0
    });

    dayBlocks.forEach(block => observer.observe(block));

    /* ==========================
       DAY BUTTON JUMP
       ========================== */

    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayId = btn.dataset.id;
        const target = content.querySelector(`.day-block[data-day="${dayId}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* ==========================
       FADE TOP WHILE SCROLLING
       ========================== */

    content.addEventListener('scroll', () => {
      const fade = Math.min(content.scrollTop, 100);
      content.style.setProperty('--fade-top', `${fade}px`);
    });

  });
