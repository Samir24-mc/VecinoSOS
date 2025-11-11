// main.js (module)
// VecinoSOS - formulario + Leaflet + Firebase Realtime DB
// Asegúrate de cargar este archivo como <script type="module" src="...">

// ----------------------
// IMPORTAR FIREBASE (CDN modules)
// ----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ----------------------
// CONFIGURACIÓN FIREBASE (tu proyecto)
// ----------------------
const firebaseConfig = {
  apiKey: "AIzaSyC4EU6DaP0o5glt84yl40jOsYKQc3PUY8E",
  authDomain: "vecinosos-c9a17.firebaseapp.com",
  databaseURL: "https://vecinosos-c9a17-default-rtdb.firebaseio.com",
  projectId: "vecinosos-c9a17",
  storageBucket: "vecinosos-c9a17.firebasestorage.app",
  messagingSenderId: "447312521513",
  appId: "1:447312521513:web:1acf34a6634ff05ee12f38"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ----------------------
// ESTADO GLOBAL
// ----------------------
let tipoSeleccionado = "";
let latActual = null;
let lngActual = null;
let mapaInicializado = false;
let leafletMap = null;
let usuarioMarker = null;

// ----------------------
// INIT (esperar DOM)
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  setupTipoButtons();
  setupEnviarReporte();
  // ocultar inicialmente formulario y mapa (por si no lo están)
  const formEl = document.getElementById("formulario");
  const mapaSec = document.getElementById("mapaSection");
  if (formEl) formEl.style.display = "none";
  if (mapaSec) mapaSec.style.display = "none";
});

// ----------------------
// SETUP: botones tipo emergencia
// ----------------------
function setupTipoButtons() {
  const botones = document.querySelectorAll(".btn-emergencia");
  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      tipoSeleccionado = btn.dataset.tipo || "";
      const tipoDisplay = document.getElementById("tipoSeleccionado");
      if (tipoDisplay) tipoDisplay.textContent = "Emergencia: " + tipoSeleccionado;

      // mostrar formulario y mapa
      const formEl = document.getElementById("formulario");
      const mapaSec = document.getElementById("mapaSection");
      if (formEl) formEl.style.display = "block";
      if (mapaSec) mapaSec.style.display = "block";

      // iniciar mapa y geolocalización (si no está ya)
      initMapIfNeeded();
    });
  });
}

// ----------------------
// INICIALIZAR MAPA (solo ubicación actual) con Leaflet
// ----------------------
function initMapIfNeeded() {
  if (mapaInicializado) return;
  mapaInicializado = true;

  // verificar geolocalización
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      latActual = position.coords.latitude;
      lngActual = position.coords.longitude;

      // crear mapa Leaflet
      const mapDiv = document.getElementById("mapa");
      if (!mapDiv) return;

      // Si ya existe un mapa construido por Leaflet, removerlo (por seguridad)
      if (leafletMap) {
        try { leafletMap.remove(); } catch(e) { /* ignore */ }
      }

      leafletMap = L.map(mapDiv).setView([latActual, lngActual], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(leafletMap);

      // marcador del usuario
      usuarioMarker = L.marker([latActual, lngActual]).addTo(leafletMap).bindPopup("Tu ubicación").openPopup();
    },
    (err) => {
      console.error("Error geolocalización:", err);
      alert("No pudimos obtener tu ubicación. Revisa permisos del navegador.");
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
}

// ----------------------
// ENVIAR REPORTE: setup listener
// ----------------------
function setupEnviarReporte() {
  const botonEnviar = document.getElementById("enviarReporte");
  if (!botonEnviar) return;

  botonEnviar.addEventListener("click", (e) => {
    e.preventDefault();
    enviarReporte();
  });
}

// ----------------------
// FUNCIÓN: enviarReporte (valida + push a Firebase)
// ----------------------
function enviarReporte() {
  const descripcionEl = document.getElementById("descripcion");
  const ubicacionManualEl = document.getElementById("ubicacionManual");
  const estadoEl = document.getElementById("estado");

  const descripcion = descripcionEl ? descripcionEl.value.trim() : "";
  const ubicacionManual = ubicacionManualEl ? ubicacionManualEl.value.trim() : "";

  if (!tipoSeleccionado) {
    alert("Por favor selecciona un tipo de emergencia.");
    return;
  }

  // construir objeto emergencia
  const emergenciaObj = {
    tipo: tipoSeleccionado,
    descripcion: descripcion || "Sin descripción",
    ubicacion_texto: ubicacionManual || "No especificada",
    lat: (latActual !== null ? latActual : null),
    lng: (lngActual !== null ? lngActual : null),
    estado: "Pendiente",
    creadoEn: new Date().toISOString()
  };

  // push a Realtime Database
  push(ref(database, "emergencias"), emergenciaObj)
    .then(() => {
      // mostrar mensaje al usuario
      if (estadoEl) {
        estadoEl.innerHTML = `
          🚨 TU EMERGENCIA ESTÁ SIENDO ATENDIDA 🚨<br>
          <strong>Tipo:</strong> ${emergenciaObj.tipo}<br>
          <strong>Descripción:</strong> ${emergenciaObj.descripcion}<br>
          <strong>Ubicación:</strong> ${emergenciaObj.ubicacion_texto}<br>
          <strong>Estado:</strong> ${emergenciaObj.estado}
        `;
      }
      // limpiar y ocultar formulario/mapa
      if (descripcionEl) descripcionEl.value = "";
      if (ubicacionManualEl) ubicacionManualEl.value = "";
      const formEl = document.getElementById("formulario");
      const mapaSec = document.getElementById("mapaSection");
      if (formEl) formEl.style.display = "none";
      if (mapaSec) mapaSec.style.display = "none";

      // opcional: volver a resetear tipo seleccionado
      tipoSeleccionado = "";
      const tipoDisplay = document.getElementById("tipoSeleccionado");
      if (tipoDisplay) tipoDisplay.textContent = "Emergencia: --";
    })
    .catch((err) => {
      console.error("Error enviando emergencia:", err);
      alert("Ocurrió un error al enviar la emergencia. Revisa la consola.");
    });
}
