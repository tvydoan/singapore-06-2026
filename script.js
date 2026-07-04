const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [103.8, 3],
  zoom: 4
});

const content = document.getElementById('content');

fetch('data.json')
  .then(res => res.json())
  .then(data => {

    const coordinates = [];

    data.forEach(p => {

      coordinates.push([p.lon, p.lat]);

      const el = document.createElement('div');
      el.className = 'dot';

      new maplibregl.Marker({
        element: el
      })
        .setLngLat([p.lon, p.lat])
        .addTo(map);

      const img = new Image();
      img.src = p.image;

    });

    map.on('load', () => {

      map.addSource('journey', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
      });

      map.addLayer({
        id: 'journey',
        type: 'line',
        source: 'journey',
        paint: {
          'line-color': '#d8d8d8',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

    });

    function showStory(id){

      const p = data.find(
        item => item.id == id
      );

      if (!p) return;

      content.innerHTML = `
        <h1>A Journey of Learning</h1>

        <div class="subtitle">
          Singapore Internship Experience 2026
        </div>

        <img src="${p.image}">

        <h2>${p.title}</h2>

        <div class="day">${p.day}</div>

        <h3>WHAT I SAW</h3>
        <p>${p.whatISaw}</p>

        <h3>KEY LESSON</h3>
        <p>${p.whatILearned}</p>

        <h3>FUTURE PRACTICE</h3>
        <p>${p.futurePractice}</p>
      `;

      content.scrollTop = 0;
      content.style.setProperty(
        '--fade-top',
        '0px'
      );

      map.flyTo({
        center: [p.lon, p.lat],
        zoom: 11,
        duration: 1800,
        speed: 0.9,
        curve: 1.1,
        essential: true
      });

    }

    document
      .querySelectorAll('.day-btn')
      .forEach(btn => {

        btn.addEventListener(
          'click',
          () => showStory(btn.dataset.id)
        );

      });

    showStory(1);

    /* ==========================
       FADE TOP WHILE SCROLLING
       ========================== */

    content.addEventListener(
      'scroll',
      () => {

        const fade =
          Math.min(
            content.scrollTop,
            100
          );

        content.style.setProperty(
          '--fade-top',
          `${fade}px`
        );

      }
    );

  });
