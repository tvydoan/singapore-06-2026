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

    const stopMeta = [];

    map.on('load', () => {

      const features = [];
      let uid = 0;

      days.forEach(day => {

        const coords = day.stops.map(s => [s.lon, s.lat]);

        map.addSource(`route-${day.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
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
            properties: {
              dayId: day.id,
              index,
              color: day.color
            },
            geometry: {
              type: 'Point',
              coordinates: [stop.lon, stop.lat]
            }
          });

          stopMeta.push({
            id: uid,
            dayId: day.id,
            index
          });

          uid++;
        });
      });

      map.addSource('stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      map.addLayer({
        id: 'stops-glow',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'active'], false],
            20,
            0
          ],
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
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'active'], false],
            7,
            5
          ],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': [
            'case',
            ['boolean', ['feature-state', 'active'], false],
            1,
            0.5
          ]
        }
      });

    });

    /* ==========================
       BUILD HTML
       ========================== */

    let html = `
      <section class="hero">
        <h1>A Journey of Learning</h1>
        <div class="subtitle">
          Singapore Internship Experience 2026
        </div>
      </section>
    `;

    days.forEach(day => {

      html += `
        <section
          class="day-block"
          data-day="${day.id}"
          style="--day-color:${day.color}"
        >

          <div class="day-inner">

            <div class="day-header">
              <span class="day-tag">${day.label}</span>
            </div>

            <p class="day-insight">
              ${day.insight}
            </p>

            <div class="stops">
      `;

      day.stops.forEach((stop, index) => {

        html += `
          <div
            class="stop-block"
            data-day="${day.id}"
            data-index="${index}"
          >
            <div
              class="stop-marker"
              style="--dot-color:${day.color}"
            >
              ${stop.icon || ''}
            </div>

            <div class="stop-body">
              <h3 class="stop-title">
                ${stop.title}
              </h3>

              ${
                stop.caption
                  ? `<p class="stop-caption">${stop.caption}</p>`
                  : ''
              }

              ${
                stop.image
                  ? `<img src="${stop.image}">`
                  : ''
              }
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

          </div>

        </section>
      `;
    });

    content.innerHTML = html;

    /* ==========================
       ACTIVE DAY
       ========================== */

    let activeDay = null;
    let flyTimer = null;

    function fitDay(dayId) {

      const day = days.find(d => d.id === dayId);
      if (!day) return;

      const bounds = new maplibregl.LngLatBounds();

      day.stops.forEach(stop => {
        bounds.extend([stop.lon, stop.lat]);
      });

      const isMobile = window.innerWidth < 768;

      map.fitBounds(bounds, {
        padding: isMobile
          ? {
              top: 100,
              bottom: 100,
              left: 40,
              right: 40
            }
          : {
              top: 100,
              bottom: 100,
              left: 80,
              right: 500
            },
        duration: 1200,
        maxZoom: 14,
        essential: true
      });
    }

    function setActiveDay(dayId) {

      if (activeDay === dayId) return;

      activeDay = dayId;

      stopMeta.forEach(stop => {
        map.setFeatureState(
          {
            source: 'stops',
            id: stop.id
          },
          {
            active: stop.dayId === dayId
          }
        );
      });

      document
        .querySelectorAll('.day-btn')
        .forEach(btn => {
          btn.classList.toggle(
            'active',
            Number(btn.dataset.id) === dayId
          );
        });

      clearTimeout(flyTimer);

      flyTimer = setTimeout(() => {
        fitDay(dayId);
      }, 100);
    }

    /* ==========================
       OBSERVE SECTIONS
       ========================== */

    const dayBlocks =
      document.querySelectorAll('.day-block');

    const observer =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const dayId =
              Number(entry.target.dataset.day);

            setActiveDay(dayId);
          });
        },
        {
          threshold: 0.6
        }
      );

    dayBlocks.forEach(block => {
      observer.observe(block);
    });

    /* ==========================
       FADE + SLIDE
       ========================== */

    const panelObserver =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            entry.target.classList.toggle(
              'active',
              entry.isIntersecting
            );
          });
        },
        {
          threshold: 0.55
        }
      );

    dayBlocks.forEach(block => {
      panelObserver.observe(block);
    });

    /* ==========================
       BUTTON NAVIGATION
       ========================== */

    document
      .querySelectorAll('.day-btn')
      .forEach(btn => {

        btn.addEventListener(
          'click',
          () => {

            const dayId =
              Number(btn.dataset.id);

            const target =
              document.querySelector(
                `.day-block[data-day="${dayId}"]`
              );

            if (!target) return;

            window.scrollTo({
              top: target.offsetTop,
              behavior: 'smooth'
            });
          }
        );

      });

    /* ==========================
       INIT
       ========================== */

    if (days.length) {
      setTimeout(() => {
        setActiveDay(days[0].id);
      }, 500);
    }

  });
