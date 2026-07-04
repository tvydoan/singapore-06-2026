const map = new maplibregl.Map({
container:'map',

style:
'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',

center:[103.8,1.35],
zoom:4
});

fetch('data.json')
.then(response=>response.json())
.then(data=>{

const coordinates=[];

data.forEach(p=>{

coordinates.push([p.lon,p.lat]);

const el=document.createElement('div');
el.className='marker';

new maplibregl.Marker({
element:el,
anchor:'center'
})
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
'line-color':'#d4d4d4',
'line-width':2,
'line-opacity':0.6,
'line-blur':1
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
