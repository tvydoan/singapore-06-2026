const map = new maplibregl.Map({
  container:'map',
  style:'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center:[103.8,1.35],
  zoom:5
});

fetch('data.json')
.then(res=>res.json())
.then(data=>{

  const coordinates=[];

  data.forEach(p=>{
    coordinates.push([p.lon,p.lat]);
  });

  map.on('load',()=>{

    map.addSource('journey',{
      type:'geojson',
      data:{
        type:'Feature',
        geometry:{
          type:'LineString',
          coordinates:coordinates
        }
      }
    });

    map.addLayer({
      id:'journey-glow',
      type:'line',
      source:'journey',
      paint:{
        'line-color':'#ffffff',
        'line-width':7,
        'line-opacity':0.05,
        'line-blur':6
      }
    });

    map.addLayer({
      id:'journey',
      type:'line',
      source:'journey',
      layout:{
        'line-cap':'round',
        'line-join':'round'
      },
      paint:{
        'line-color':'#bfbfbf',
        'line-width':2.2,
        'line-opacity':0.75
      }
    });

  });

  const timeline=document.getElementById('timeline');

  data.forEach((p,i)=>{

    const marker=document.createElement('div');
    marker.className='marker';

    new maplibregl.Marker({
      element:marker
    })
    .setLngLat([p.lon,p.lat])
    .addTo(map);

    const card=document.createElement('div');
    card.className='day-card';
    card.innerHTML=`DAY ${i+1}`;

    timeline.appendChild(card);

    function activate(){

      document.querySelectorAll('.day-card')
        .forEach(c=>c.classList.remove('active'));

      card.classList.add('active');

      showPoint(p);
    }

    marker.addEventListener('click',activate);
    card.addEventListener('click',activate);
  });

  showPoint(data[0]);

  map.fitBounds(
    [
      [103.65,1.25],
      [106.85,10.90]
    ],
    {
      padding:120
    }
  );
});

function showPoint(p){

  document.getElementById('content').innerHTML=`

  <h1>A Journey of Learning</h1>

  <div class="subtitle">
    Singapore Internship Experience 2026
  </div>

  <img src="${p.image}">

  <h2>${p.title}</h2>

  <div class="subtitle">${p.day}</div>

  <div class="section-title">
    WHAT I SAW
  </div>

  <p>${p.whatISaw}</p>

  <div class="section-title">
    KEY LESSON
  </div>

  <p>${p.whatILearned}</p>

  <div class="section-title">
    FUTURE PRACTICE
  </div>

  <p>${p.futurePractice}</p>
  `;

  map.flyTo({
    center:[p.lon,p.lat],
    zoom:10,
    speed:0.8
  });
}
