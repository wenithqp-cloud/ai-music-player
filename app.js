// -------------------- CONFIG --------------------
const CURRENT_VERSION = "1.0.0";
const VERSION_URL = "https://wenithqp-cloud.github.io/ai-music-player/version.json";
const APK_URL = "https://wenithqp-cloud.github.io/ai-music-player/ai-music-player.apk";
const CLIENT_ID = '412981941442-fpvklbdmdla6f57p6k6udckt2sdgm5ir.apps.googleusercontent.com';
const YOUTUBE_API_KEY = 'AIzaSyCAIUbGe6i20RFzU85O29DuL0cTuQi7ABo';
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

// -------------------- ELEMENTS --------------------
const filePicker = document.getElementById("file-picker");
const playLocalBtn = document.getElementById("play-local-btn");
const stopBtn = document.getElementById("stop-btn");
const currentFile = document.getElementById("current-file");
const youtubeURL = document.getElementById("youtube-url");
const playYouTubeBtn = document.getElementById("play-youtube-btn");
const suggestionsList = document.getElementById('suggestions-list');
const playlistList = document.getElementById('playlist-list');
const themeButtons = document.querySelectorAll("#settings button");
const shareBtn = document.getElementById("share-btn");
const loginBtn = document.getElementById('youtube-login-btn');
const playlistsContainer = document.getElementById('youtube-playlists');
const youtubeContainer = document.getElementById("youtube-player");

// -------------------- VARIABLES --------------------
let audio = new Audio();
let selectedFiles = [];
let playHistory = [];
let playlist = [];
let currentPlaylistIndex = 0;
let isPlayingYouTube = false;
let youtubePlayer, youtubeReady = false;

// -------------------- LOCAL FILE PLAYBACK --------------------
filePicker.addEventListener("change", e => { selectedFiles = Array.from(e.target.files); });
playLocalBtn.addEventListener("click", () => { if(selectedFiles.length===0) return; addLocalToPlaylist(selectedFiles[0]); playPlaylistItem(playlist.length-1); });
stopBtn.addEventListener("click", ()=>{ audio.pause(); audio.currentTime=0; });

function addLocalToPlaylist(file){ 
  const fileURL = URL.createObjectURL(file); 
  playlist.push({name:file.name,type:"local",src:fileURL}); 
  updatePlaylistUI(); 
  playHistory.push({name:file.name,type:"local"}); 
  suggestYouTubeVideos(); 
}

// -------------------- PLAYLIST --------------------
function updatePlaylistUI(){
  playlistList.innerHTML="";
  playlist.forEach((item,index)=>{
    const li=document.createElement("li");
    li.textContent=item.name;
    li.onclick=()=>playPlaylistItem(index);
    const removeBtn=document.createElement("button");
    removeBtn.textContent="X"; removeBtn.className="remove-btn";
    removeBtn.onclick=(e)=>{ e.stopPropagation(); playlist.splice(index,1); updatePlaylistUI(); };
    li.appendChild(removeBtn);
    playlistList.appendChild(li);
  });
}

function playPlaylistItem(index){
  currentPlaylistIndex=index;
  const item=playlist[index];
  if(item.type==="local"){ audio.src=item.src; audio.play(); currentFile.textContent="Playing: "+item.name; isPlayingYouTube=false;}
  else if(item.type==="youtube"){ youtubePlayer.loadVideoById(item.videoId); currentFile.textContent="Playing YouTube: "+item.name; isPlayingYouTube=true;}
}

audio.onended = ()=>{ if(!isPlayingYouTube) playNextPlaylist(); };
function playNextPlaylist(){ if(currentPlaylistIndex+1<playlist.length) playPlaylistItem(currentPlaylistIndex+1); else currentFile.textContent="Playlist ended"; }

// -------------------- THEMES --------------------
themeButtons.forEach(btn=>{ btn.addEventListener("click",()=>{ switch(btn.dataset.theme){ case"dark":document.body.style.backgroundColor="#121212";document.body.style.color="#fff";break; case"light":document.body.style.backgroundColor="#fff";document.body.style.color="#000";break; case"neon":document.body.style.backgroundColor="#000";document.body.style.color="#39ff14";break; case"ocean":document.body.style.backgroundColor="#001f3f";document.body.style.color="#7FDBFF";break; case"sunset":document.body.style.backgroundColor="#2b1d0e";document.body.style.color="#ffb347";break; } }); });

// -------------------- YOUTUBE PLAYER --------------------
function onYouTubeIframeAPIReady(){ 
  youtubePlayer = new YT.Player("youtube-player",{height:'315',width:'560',videoId:'',events:{'onStateChange':function(e){if(e.data===YT.PlayerState.ENDED) playNextPlaylist();}}});
  youtubeReady=true; 
}

playYouTubeBtn.addEventListener("click",()=>{
  const videoId=extractYouTubeID(youtubeURL.value);
  if(videoId && youtubeReady){ addYouTubeToPlaylist(videoId,youtubeURL.value); playPlaylistItem(playlist.length-1);}
});

function addYouTubeToPlaylist(videoId,title){ playlist.push({name:title,type:"youtube",videoId:videoId}); updatePlaylistUI(); }
function extractYouTubeID(url){ const regExp=/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/; const match=url.match(regExp); return match?match[1]:null; }

// -------------------- AI SUGGESTIONS --------------------
function suggestYouTubeVideos(){ 
  const suggestions=[]; 
  if(playHistory.length>0){ const last=playHistory[playHistory.length-1]; const keyword=last.name.split(" ")[0]; suggestions.push(keyword+" song",keyword+" remix","top hits "+keyword);}
  else{ suggestions.push("top hits","popular music","trending music"); }
  suggestionsList.innerHTML=""; 
  suggestions.forEach(term=>{ const li=document.createElement("li"); li.textContent=term; li.onclick=()=>searchYouTube(term); suggestionsList.appendChild(li); });
}

function searchYouTube(query){ 
  fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`)
    .then(res=>res.json())
    .then(data=>{ if(data.items && data.items.length>0){ addYouTubeToPlaylist(data.items[0].id.videoId,data.items[0].snippet.title); playPlaylistItem(playlist.length-1); playHistory.push({name:data.items[0].snippet.title,type:"youtube"}); } });
}

// -------------------- YOUTUBE LOGIN --------------------
function loadGapi(){ gapi.load('client:auth2', initClient); }
function initClient(){ gapi.client.init({ apiKey: YOUTUBE_API_KEY, clientId: CLIENT_ID, scope: SCOPES }); }

loginBtn.addEventListener('click', async ()=>{
  try{ const GoogleAuth=gapi.auth2.getAuthInstance(); await GoogleAuth.signIn(); fetchUserPlaylists(); }catch(err){console.error(err);}
});

async function fetchUserPlaylists(){
  const response=await gapi.client.youtube.playlists.list({part:'snippet,contentDetails',mine:true,maxResults:10});
  playlistsContainer.innerHTML="";
  response.result.items.forEach(pl=>{ const div=document.createElement('div'); div.textContent=pl.snippet.title; div.style.cursor='pointer'; div.onclick=()=>fetchPlaylistItems(pl.id); playlistsContainer.appendChild(div); });
}

async function fetchPlaylistItems(playlistId){
  const response=await gapi.client.youtube.playlistItems.list({part:'snippet',playlistId:playlistId,maxResults:20});
  response.result.items.forEach(item=>{ addYouTubeToPlaylist(item.snippet.resourceId.videoId,item.snippet.title); });
}

// -------------------- SHARE --------------------
shareBtn.addEventListener("click",()=>{ navigator.clipboard.writeText(window.location.href).then(()=>alert("App link copied!")).catch(()=>alert("Failed to copy.")); });

// -------------------- VERSION CHECK --------------------
async function checkForUpdate(){
  try{ const response=await fetch(VERSION_URL); const data=await response.json(); if(data.version!==CURRENT_VERSION){ if(confirm(`New version ${data.version} available. Download now?`)) window.location.href=data.apk; } }catch(err){console.log(err);}
}
checkForUpdate();

// -------------------- INIT --------------------
window.onload=()=>{ const script=document.createElement('script'); script.src='https://apis.google.com/js/api.js'; script.onload=loadGapi; document.body.appendChild(script); };
