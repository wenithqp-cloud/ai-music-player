// Loading Animation
let progress = 0;
let fill = document.getElementById("fill");

let loading = setInterval(()=>{
  progress += 5;
  fill.style.width = progress + "%";

  if(progress >= 100){
    clearInterval(loading);
    document.getElementById("loadingScreen").style.display="none";
    document.getElementById("safeRoom").style.display="block";

    setTimeout(()=>{
      document.getElementById("safeRoom").style.display="none";
      document.getElementById("app").style.display="flex";
    },2000);
  }
},100);

// Player Setup
const audio = document.getElementById("audio");
const folderInput = document.getElementById("folderInput");
const localList = document.getElementById("localList");

let localTracks = [];
let current = 0;

folderInput.addEventListener("change", e=>{
  localTracks=[];
  localList.innerHTML="";

  const files=[...e.target.files].filter(f=>f.type.includes("audio"));

  files.forEach((file,i)=>{
    const url = URL.createObjectURL(file);
    localTracks.push({name:file.name,url});

    let div = document.createElement("div");
    div.className="song";
    div.textContent=file.name;
    div.onclick = ()=>loadTrack(i,true);
    localList.appendChild(div);
  });
});

function loadTrack(i,play){
  current=i;
  audio.src = localTracks[i].url;
  if(play) audio.play();
}

function playPause(){
  audio.paused?audio.play():audio.pause();
}

function next(){
  if(localTracks.length===0) return;
  loadTrack((current+1)%localTracks.length,true);
}

function prev(){
  if(localTracks.length===0) return;
  loadTrack((current-1+localTracks.length)%localTracks.length,true);
}

// Web Audio API
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const src = ctx.createMediaElementSource(audio);
const analyser = ctx.createAnalyser();
src.connect(analyser);
analyser.connect(ctx.destination);
analyser.fftSize = 64;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// EQ
const eqContainer = document.getElementById("eq");
let filters=[];
let previousNode = src;

for(let i=0;i<10;i++){
  let filter = ctx.createBiquadFilter();
  filter.type="peaking";
  filter.frequency.value = 60*Math.pow(2,i);
  filter.gain.value = 0;

  previousNode.connect(filter);
  previousNode = filter;

  filters.push(filter);

  let slider = document.createElement("input");
  slider.type="range";
  slider.min="-30";
  slider.max="30";
  slider.value="0";
  slider.oninput=(e)=>filter.gain.value=e.target.value;
  eqContainer.appendChild(slider);
}

previousNode.connect(analyser);

// Visualizer
const canvas = document.getElementById("visualizer");
const c = canvas.getContext("2d");

function draw(){
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  c.fillStyle="#111";
  c.fillRect(0,0,canvas.width,canvas.height);

  let x=0;
  for(let i=0;i<bufferLength;i++){
    let h=dataArray[i];
    c.fillStyle="#c40000";
    c.fillRect(x,canvas.height-h,8,h);
    x+=10;
  }
}
draw();
