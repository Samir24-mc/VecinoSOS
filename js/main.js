// ========================
// VARIABLES GLOBALES
// ========================
let tipoSeleccionado = "";
let latActual = null;
let lngActual = null;

// ========================
// SELECCIÓN DE TIPO DE EMERGENCIA
// ========================
document.querySelectorAll(".btn-emergencia").forEach(btn => {
  btn.addEventListener("click", () => {
    tipoSeleccionado = btn.dataset.tipo;
    document.getElementById("tipoSeleccionado").textContent = "Emergencia: " + tipoSeleccionado;
    document.getElementById("formulario").style.display = "block";
    document.getElementById("mapaSection").style.display = "block";
    initMap();
  });
});

// ========================
// FIREBASE CONFIG
// ========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4EU6DaP0o5glt84yl40jOsYKQc3PUY8E",
  authDomain: "vecinosos-c9a17.firebaseapp.com",
  databaseURL: "https://vecinosos-c9a17-default-rtdb.firebaseio.com",
  projectId: "vecinosos-c9a17",
  storageBucket: "vecinosos-c9a17.firebasestorage.app",
  messagingSenderId: "447312521513",
  appId: "1:447312521513:web:1acf34a6634ff05ee12f38"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ========================
// FUNCIÓN PARA MOSTRAR MAPA
// ========================
function initMap() {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    latActual = position.coords.latitude;
    lngActual = position.coords.longitude;

    const map = L.map('mapa').setView([latActual, lngActual], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    L.marker([latActual, lngActual]).addTo(map).bindPopup("Tu ubicación actual").openPopup();
  }, () => {
    alert("No se pudo obtener la ubicación.");
  });
}

// ========================
// ENVIAR EMERGENCIA
// ========================
document.getElementById("enviarReporte").addEventListener("click", () => {
  const descripcion = document.getElementById("descripcion").value.trim();
  const ubicacion = document.getElementById("ubicacionManual").value.trim();

  if (!tipoSeleccionado) {
    alert("Selecciona un tipo de emergencia.");
    return;
  }

  const nuevaEmergencia = {
    tipo: tipoSeleccionado,
    descripcion: descripcion || "Sin descripción",
    ubicacion: ubicacion || "No especificada",
    lat: latActual,
    lng: lngActual,
    estado: "En proceso"
  };

  // Enviar a Firebase
  push(ref(database, "emergencias"), nuevaEmergencia)
    .then(() => {
      document.getElementById("estado").innerHTML = `
        🚨 EMERGENCIA ENVIADA 🚨<br>
        <strong>Tipo:</strong> ${tipoSeleccionado}<br>
        <strong>Descripción:</strong> ${descripcion}<br>
        <strong>Ubicación:</strong> ${ubicacion || "No disponible"}<br>
        <strong>Estado:</strong> En proceso
      `;
      document.getElementById("formulario").style.display = "none";
      document.getElementById("mapaSection").style.display = "none";
      document.getElementById("descripcion").value = "";
      document.getElementById("ubicacionManual").value = "";
    })
    .catch((error) => {
      console.error("Error al enviar la emergencia:", error);
      alert("Error al enviar la emergencia. Inténtalo nuevamente.");
    });
});
