const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);
document.getElementById("themeSelect")?.value = savedTheme;

function changeTheme(theme){
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}

function applyTheme(theme){
  document.body.className="";
  switch(theme){
    case "dark": document.body.style.background="#121212"; document.body.style.color="#fff"; break;
    case "light": document.body.style.background="#f4f4f4"; document.body.style.color="#121212"; break;
    case "ocean": document.body.style.background="linear-gradient(135deg,#2e8bff,#00c9ff)"; document.body.style.color="#fff"; break;
    case "sunset": document.body.style.background="linear-gradient(135deg,#ff7e5f,#feb47b)"; document.body.style.color="#121212"; break;
  }
}
