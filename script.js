const map = new maplibregl.Map({
  container: 'map',
  style:
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center:[103.8,1.35],
  zoom:4
});

fetch('data.json')
.then(response=>response.json())
.then(data=>{

  const coordinates=[];

  const timeline =
  document.getElementById('timeline');

  data.forEach(p=>{

    coordinates.push([p.lon,p.lat]);

    timeline.innerHTML += `
      <div class="stop"
      onclick="goToStop(${p.id})">

        <h3>${p.day}</h3>
        <p>${p.title}</p>

      </div>
    `;

    const el =
    document.createElement('div');

    el.className='marker';

    el.addEventListener(
      'click',
      ()=>showStory(p)
    );

    new maplibregl.Marker({
      element:el
    })
    .setLngLat([p.lon,p.lat])
    .addTo(map);

  });

  window.goToStop =
  function(id){

    const p =
    data.find(
      d=>d.id===id
    );

    showStory(p);
  }

  function showStory(p){

    document.getElementById(
      'content'
    ).innerHTML = `

      <h1>A Journey of Learning</h1>

      <p class="subtitle">
      Singapore Internship Experience 2026
      </p>

      <img src="${p.image}">

      <h2>${p.title}</h2>

      <p><b>${p.day}</b></p>

      <h3>What I Saw</h3>

      <p>${p.description}</p>

      <h3>Key Lesson</h3>

      <p>${p.lesson}</p>
    `;

    const mobile =
      window.innerWidth < 900;

    map.flyTo({
      center:[p.lon,p.lat],
      zoom:12,
      speed:.8,
      offset:
      mobile
      ? [0,-200]
      : [-250,0]
    });
  }

  map.on('load',()=>{

    const layers =
      map.getStyle().layers;

    layers.forEach(layer=>{

      if(
        layer.type==='symbol'
      ){
        map.setLayoutProperty(
          layer.id,
          'visibility',
          'none'
        );
      }

    });

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
      id:'journey',
      type:'line',
      source:'journey',
      paint:{
        'line-color':'#f7c948',
        'line-width':3,
        'line-opacity':0.45
      }
    });

  });

});
