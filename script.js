const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [103.8, 1.3],
  zoom: 10
});

const content = document.getElementById('content');
let closingEnding = false;
fetch('data.json?v=' + Date.now())
  .then(res => res.json())
  .then(({ days }) => {

    const stopMeta = []; // { id, dayId, index }

    /* ==========================
       BUILD STOPS AS GL LAYERS + ROUTE LINES
       ========================== */

    map.on('load', () => {

      const features = [];
      let uid = 0;

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

          features.push({
            type: 'Feature',
            id: uid,
            properties: { dayId: day.id, index, color: day.color },
            geometry: { type: 'Point', coordinates: [stop.lon, stop.lat] }
          });

          stopMeta.push({ id: uid, dayId: day.id, index });
          uid++;

        });

      });

      map.addSource('stops', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
      });

      map.addLayer({
        id: 'stops-glow',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 20, 0],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
          'circle-blur': 1
        }
      });

      map.addLayer({
        id: 'stops-dot',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 7, 5],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': ['case', ['boolean', ['feature-state', 'active'], false], 1, 0.5]
        }
      });

    });

    /* ==========================
       BUILD SCROLL CONTENT
       ========================== */

    let html = `
      <h1>A Journey of Learning</h1>
      <div class="subtitle">CPG Internship Experience 2026</div>
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
            <div class="stop-body">
              <h3 class="stop-title">${stop.title}</h3>
              ${stop.caption ? `<p class="stop-caption">${stop.caption}</p>` : ''}
              ${stop.images ? stop.images.map(img => `<img src="${img}">`).join('') : ''}
              ${stop.image ? `<img src="${stop.image}">` : ''}
            </div>
          </div>
        `;
      });

      html += `
          </div>

          <div class="day-recap">
            <h3>WHAT I SAW</h3>
            <p>${day.learned}</p>
            <h3>WHAT I TAKE AWAY</h3>
            <p>${day.futurePractice}</p>
          </div>

        </section>
      `;

    });

    html += `
  <section id="ending-trigger"></section>
`;

content.innerHTML = html;

    /* ==========================
       SCROLLYTELLING OBSERVER
       ========================== */

    const dayBlocks =
  content.querySelectorAll('.day-block');

let activeDay = null;
let flyTimer = null;
const intersecting = new Map();

function fitDay(dayId) {

  const day = days.find(
    d => d.id === dayId
  );

  if (!day) return;

  const bounds =
    new maplibregl.LngLatBounds();

  day.stops.forEach(stop => {
    bounds.extend([
      stop.lon,
      stop.lat
    ]);
  });

  const isMobile =
    window.innerWidth <= 500;

  map.fitBounds(bounds, {
    padding: isMobile
      ? {
          top: 90,
          bottom: 320,
          left: 30,
          right: 30
        }
      : {
          top: 80,
          bottom: 80,
          left: 80,
          right: 460
        },

    duration: 900,
    maxZoom: isMobile ? 16 : 14,
    essential: true
  });
}

function setActiveDay(dayId) {

  if (dayId === activeDay)
    return;

  activeDay = dayId;

  stopMeta.forEach(m => {
    map.setFeatureState(
      {
        source: 'stops',
        id: m.id
      },
      {
        active:
          m.dayId === dayId
      }
    );
  });

  document
    .querySelectorAll('.day-btn')
    .forEach(btn => {
      btn.classList.toggle(
        'active',
        Number(btn.dataset.id) ===
          dayId
      );
    });

  clearTimeout(flyTimer);

  flyTimer = setTimeout(() => {
    fitDay(dayId);
  }, 150);
}

const observer =
  new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        const key =
          entry.target;

        if (entry.isIntersecting) {
          intersecting.set(
            key,
            entry
          );
        } else {
          intersecting.delete(
            key
          );
        }
      });

      if (
        intersecting.size === 0
      )
        return;

      const rootRect = {
        top: 0,
        height:
          window.innerHeight
      };

      const centerY =
        rootRect.top +
        rootRect.height / 2;

      let closest = null;
      let closestDist =
        Infinity;

      intersecting.forEach(
        entry => {

          const r =
            entry.boundingClientRect;

          const mid =
            r.top +
            r.height / 2;

          const dist =
            Math.abs(
              mid - centerY
            );

          if (
            dist <
            closestDist
          ) {
            closestDist =
              dist;
            closest =
              entry.target;
          }
        }
      );

      if (!closest) return;

      setActiveDay(
        Number(
          closest.dataset.day
        )
      );
    },
    {
      root: null,
      rootMargin:
        '-35% 0px -35% 0px',
      threshold: 0
    }
  );

dayBlocks.forEach(block => {
  observer.observe(block);
});

setTimeout(() => {
  if (days.length) {
    setActiveDay(
      days[0].id
    );
  }
}, 500);

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

  const threshold =
    content.scrollHeight -
    content.clientHeight -
    100;

  if (closingEnding) return;

  if (content.scrollTop >= threshold) {
    document.body.classList.add('ending-active');
  } else {
    document.body.classList.remove('ending-active');
  }
});

/* ===== CLICK TO EXIT ENDING ===== */

document.getElementById('ending-screen')
  .addEventListener('click', () => {

    closingEnding = true;

    // đẩy panel lên trước khi tắt overlay
    content.scrollTop =
  document.getElementById('ending-trigger').offsetTop - 100;

    // đợi 1 frame rồi mới remove class
    requestAnimationFrame(() => {
      document.body.classList.remove(
        'ending-active'
      );
    });

    setTimeout(() => {
      closingEnding = false;
    }, 200);

  });

});
