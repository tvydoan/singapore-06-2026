const map = new maplibregl.Map({
container:'map',

style:
'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',

center:[103.8,1.35],
zoom:4
});

fetch('data.json')
.then(res=>res.json())
.then(data=>{

const coordinates=[];

data.forEach(p=>{

coordinates.push([p.lon,p.lat]);

const el=document.createElement('div');
el.className='marker';

new maplibregl.Marker(el)
.setLngLat([p.lon,p.lat])
.addTo(map);

el.addEventListener('click',()=>{
showPoint(p);
});

const card=document.createElement('div');
card.className='timeline-card';

card.innerHTML=`
<h3>${p.day}</h3>
<p>${p.title}</p>
`;

card.onclick=()=>{
showPoint(p);
};

document
.getElementById('timeline')
.appendChild(card);

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
id:'journey',
type:'line',
source:'journey',
paint:{
'line-color':'#f7c948',
'line-width':4
}
});

});

showPoint(data[0]);

});

function showPoint(p){

document.getElementById('hero-image').src=p.image;
document.getElementById('hero-title').innerHTML=p.title;
document.getElementById('hero-day').innerHTML=p.day;
document.getElementById('hero-saw').innerHTML=p.whatISaw;
document.getElementById('hero-learned').innerHTML=p.whatILearned;
document.getElementById('hero-future').innerHTML=p.futurePractice;

map.flyTo({
center:[p.lon,p.lat],
zoom:11,
speed:0.7
});

}
