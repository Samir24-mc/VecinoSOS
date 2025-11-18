// main.js (module)
import { enviarEmergenciaDB, subirImagen, onEmergenciasChange } from "./firebase.js";

///// Helpers /////
function uidOrCreate() {
  let id = localStorage.getItem("vecinosos_reporterId");
  if (!id) {
    id = 'r-' + Math.random().toString(36).slice(2,10);
    localStorage.setItem("vecinosos_reporterId", id);
  }
  return id;
}
const REPORTER_ID = uidOrCreate();

///// DOM elements /////
const menuGrid = document.getElementById("menuGrid");
const reportSection = document.getElementById("reportSection");
const tipoSeleccionadoEl = document.getElementById("tipoSeleccionado");
const descripcionEl = document.getElementById("descripcion");
const fotoEl = document.getElementById("foto");
const mapaSection = document.getElementById("mapaSection");
const mapaDiv = document.getElementById("mapa");
const ubicacionManualEl = document.getElementById("ubicacionManual");
const enviarBtn = document.getElementById("enviarReporte");
const estadoEl = document.getElementById("estado");
const btnCloseForm = document.getElementById("btn-close-form");
const btnHistory = document.getElementById("btn-history");
const historyView = document.getElementById("historyView");
const historyList = document.getElementById("historyList");
const btnCloseHistory = document.getElementById("btn-close-history");

let leafletMap = null;
let userMarker = null;
let latActual = null;
let lngActual = null;

///// Menu: abrir formulario /////
menuGrid.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".menu-btn");
  if (!btn) return;
  const tipo = btn.dataset.tipo;
  abrirFormulario(tipo);
});

function abrirFormulario(tipo) {
  tipoSeleccionadoEl.textContent = `Tipo: ${tipo}`;
  reportSection.style.display = "block";
  mapaSection.style.display = "block";
  tipoSeleccionadoEl.dataset.tipo = tipo;
  // iniciar mapa (geolocalización)
  initMap();
}

btnCloseForm.addEventListener("click", () => {
  cerrarFormulario();
});
function cerrarFormulario() {
  reportSection.style.display = "none";
  mapaSection.style.display = "none";
  descripcionEl.value = "";
  ubicacionManualEl.value = "";
  estadoEl.innerHTML = "";
}

///// History open/close /////
btnHistory.addEventListener("click", () => {
  historyView.style.display = "flex";
  cargarHistorial(); // fetch current data
});
btnCloseHistory.addEventListener("click", () => {
  historyView.style.display = "none";
});

///// Leaflet - ubicación actual /////
function initMap() {
  if (!navigator.geolocation) {
    alert("Geolocalización no soportada por tu navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition((pos) => {
    latActual = pos.coords.latitude;
    lngActual = pos.coords.longitude;

    // remove map if exists
    if (leafletMap) {
      try { leafletMap.remove(); } catch(e){}
      leafletMap = null;
      userMarker = null;
    }

    leafletMap = L.map(mapaDiv).setView([latActual, lngActual], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(leafletMap);

    userMarker = L.marker([latActual, lngActual]).addTo(leafletMap).bindPopup("Tu ubicación").openPopup();
  }, (err) => {
    console.error(err);
    alert("No pudimos obtener tu ubicación. Revisa permisos.");
  }, { enableHighAccuracy: true, maximumAge:0, timeout:10000 });
}

///// Enviar reporte /////
enviarBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const tipo = tipoSeleccionadoEl.dataset.tipo;
  const descripcion = descripcionEl.value.trim();
  const ubicacionTexto = ubicacionManualEl.value.trim() || "No especificada";

  if (!tipo) return alert("Selecciona un tipo de emergencia.");
  if (!descripcion) return alert("Escribe una descripción.");

  estadoEl.innerText = "Enviando emergencia...";

  try {
    let imagenURL = null;
    const file = fotoEl.files && fotoEl.files[0];
    if (file) {
      imagenURL = await subirImagen(file);
    }

    const emergencia = {
      tipo,
      descripcion,
      ubicacion_texto: ubicacionTexto,
      lat: (latActual !== null ? latActual : null),
      lng: (lngActual !== null ? lngActual : null),
      imagenURL: imagenURL || null,
      estado: "En revisión",
      creadoEn: new Date().toISOString(),
      reporterId: REPORTER_ID
    };

    await enviarEmergenciaDB(emergencia);

    estadoEl.innerHTML = `✅ Emergencia enviada. Gracias.`;
    descripcionEl.value = "";
    ubicacionManualEl.value = "";
    fotoEl.value = "";

    setTimeout(() => cerrarFormulario(), 1400);
  } catch (err) {
    console.error("Error enviando emergencia:", err);
    estadoEl.innerText = "Error al enviar. Revisa conexión.";
  }
});

///// Historial: leer DB y renderizar solo los tuyos /////
let latestDataCache = null;
function cargarHistorial() {
  historyList.innerHTML = "<p style='color:#6b7280'>Cargando...</p>";

  // Use onEmergenciasChange to get the whole object (real-time)
  onEmergenciasChange((data) => {
    latestDataCache = data;
    renderHistorialFromData(data);
  });
}

function renderHistorialFromData(data) {
  const list = [];
  if (!data) {
    historyList.innerHTML = "<p style='color:#6b7280'>No tienes reportes aún.</p>";
    return;
  }
  // collect only reporterId matches
  Object.entries(data).forEach(([id, val]) => {
    if (val && val.reporterId === REPORTER_ID) list.push({ id, ...val });
  });

  if (list.length === 0) {
    historyList.innerHTML = "<p style='color:#6b7280'>No tienes reportes aún.</p>";
    return;
  }

  list.sort((a,b)=> (b.creadoEn > a.creadoEn ? 1:-1));
  historyList.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <h4>${item.tipo} <small style="color:#9ca3af">• ${new Date(item.creadoEn).toLocaleString()}</small></h4>
      <p>${item.descripcion}</p>
      <p style="font-size:13px;color:#6b7280">Ubicación: ${item.ubicacion_texto || 'No disponible'}</p>
      <p style="font-size:13px;color:#6b7280">Estado: ${item.estado}</p>
      ${item.imagenURL ? `<img src="${item.imagenURL}" alt="foto" style="width:100%;border-radius:8px;margin-top:8px">` : ""}
      <div style="margin-top:6px"><button data-id="${item.id}" class="btn-view-detail" style="padding:6px 10px;border-radius:8px;border:1px solid #e6eefc;background:white;cursor:pointer">Ver en mapa</button></div>
    `;
    historyList.appendChild(div);
  });

  // attach listeners
  document.querySelectorAll(".btn-view-detail").forEach(b=>{
    b.addEventListener("click",(ev)=>{
      const id = ev.target.dataset.id;
      const found = list.find(x=>x.id === id);
      if (!found) return alert("No se encontró el reporte");
      mostrarMapaDetalle(found);
    });
  });
}

///// Mostrar detalle con mapa overlay
function mostrarMapaDetalle(item) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.width = "92%";
  box.style.maxWidth = "420px";
  box.style.background = "#fff";
  box.style.borderRadius = "12px";
  box.style.padding = "12px";
  box.innerHTML = `
    <h3 style="margin:0 0 8px 0">${item.tipo}</h3>
    <p style="margin:0 0 6px 0">${item.descripcion}</p>
    <div id="mapDetail" style="height:220px;border-radius:8px"></div>
    ${item.imagenURL ? `<img src="${item.imagenURL}" style="width:100%;border-radius:8px;margin-top:8px">` : ""}
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button id="closeMapDetail" style="padding:8px 12px;border-radius:8px;border:none;background:#0b63d6;color:#fff;cursor:pointer">Cerrar</button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  if (item.lat !== null && item.lng !== null) {
    const mapD = L.map(box.querySelector('#mapDetail')).setView([item.lat, item.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapD);
    L.marker([item.lat, item.lng]).addTo(mapD).bindPopup(item.tipo).openPopup();
  } else {
    box.querySelector('#mapDetail').innerHTML = "<p style='color:#6b7280'>Ubicación no disponible</p>";
  }

  box.querySelector('#closeMapDetail').addEventListener('click', ()=> overlay.remove());
}

///// start a silent listener for live updates (keeps latestDataCache updated)
onEmergenciasChange((data) => {
  latestDataCache = data;
  // optional: you could show a small toast when a new emergency appears globally
});

