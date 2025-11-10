// ========================
// IMPORTAR FIREBASE
// ========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ========================
// CONFIGURACIÓN FIREBASE
// ========================
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
// DATOS DEL SUPERVISOR
// ========================
const supervisor = {
  dni: "74190232",
  nombre: "Samir Mallqui",
  password: "Mallquis"
};

// ========================
// ELEMENTOS DEL DOM
// ========================
const loginSection = document.getElementById("loginSection");
const panel = document.getElementById("panel");
const loginError = document.getElementById("loginError");

// ========================
// LOGIN FUNCIONAL
// ========================
document.getElementById("btnLogin").addEventListener("click", () => {
  const dni = document.getElementById("dni").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const password = document.getElementById("password").value.trim();

  if (dni === supervisor.dni && nombre === supervisor.nombre && password === supervisor.password) {
    loginSection.style.display = "none";
    panel.style.display = "block";
    cargarEmergencias();
  } else {
    loginError.textContent = "DNI, nombre o contraseña incorrectos";
  }
});

// ========================
// SIMULACIÓN DE EMERGENCIAS
// ========================
let emergencias = [
  {
    id: 1,
    tipo: "Robo",
    descripcion: "Robo en la esquina",
    estado: "En proceso",
    ubicacion: "Av. Principal 123",
    lat: -12.0464,
    lng: -77.0428
  },
  {
    id: 2,
    tipo: "Incendio",
    descripcion: "Incendio en edificio",
    estado: "En proceso",
    ubicacion: "Calle Secundaria 456",
    lat: -12.045,
    lng: -77.03
  }
];

// ========================
// FUNCIÓN CARGAR EMERGENCIAS
// ========================
function cargarEmergencias() {
  const lista = document.getElementById("emergenciasList");
  lista.innerHTML = "";
  emergencias.forEach(e => {
    const div = document.createElement("div");
    div.className = "emergencia-item";
    div.innerHTML = `
      <strong>Tipo:</strong> ${e.tipo}<br>
      <strong>Descripción:</strong> ${e.descripcion}<br>
      <strong>Ubicación:</strong> ${e.ubicacion || "No disponible"}<br>
      <strong>Estado:</strong> <span id="estado-${e.id}">${e.estado}</span><br>
      <button onclick="marcarResuelta(${e.id})">Marcar como resuelta</button>
    `;
    div.addEventListener("click", (event) => {
      if (event.target.tagName !== "BUTTON") {
        mostrarDetalle(e.id);
      }
    });
    lista.appendChild(div);
  });
}

// ========================
// FUNCIÓN MARCAR EMERGENCIA RESUELTA
// ========================
window.marcarResuelta = function (id) {
  const emergencia = emergencias.find(e => e.id === id);
  if (emergencia) {
    emergencia.estado = "Resuelta";
    document.getElementById(`estado-${id}`).textContent = "Resuelta";
  }
};

// ========================
// FUNCIÓN MOSTRAR DETALLE CON MINIMAPA
// ========================
window.mostrarDetalle = function (id) {
  const emergencia = emergencias.find(e => e.id === id);
  if (!emergencia) return;

  const detalleDiv = document.createElement("div");
  detalleDiv.id = "detalleEmergencia";
  detalleDiv.style.position = "fixed";
  detalleDiv.style.top = "0";
  detalleDiv.style.left = "0";
  detalleDiv.style.width = "100%";
  detalleDiv.style.height = "100%";
  detalleDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
  detalleDiv.style.display = "flex";
  detalleDiv.style.justifyContent = "center";
  detalleDiv.style.alignItems = "center";
  detalleDiv.style.zIndex = "9999";

  detalleDiv.innerHTML = `
    <div style="background:#fff; padding:20px; border-radius:12px; width:90%; max-width:500px; position:relative;">
      <h3>Detalle Emergencia</h3>
      <p><strong>Tipo:</strong> ${emergencia.tipo}</p>
      <p><strong>Descripción:</strong> ${emergencia.descripcion}</p>
      <p><strong>Ubicación:</strong> ${emergencia.ubicacion || "No disponible"}</p>
      <p><strong>Estado:</strong> <span id="estado-detalle">${emergencia.estado}</span></p>
      <div id="mapDetalle" style="height:250px; margin:15px 0; border-radius:8px;"></div>
      <button id="resueltaDetalle" style="background:#00796b; color:white; padding:8px 15px; border:none; border-radius:8px;">Marcar como resuelta</button>
      <button id="cerrarDetalle" style="background:#c62828; color:white; padding:8px 15px; border:none; border-radius:8px; margin-left:10px;">Cerrar</button>
    </div>
  `;

  document.body.appendChild(detalleDiv);

  if (emergencia.lat && emergencia.lng) {
    const map = L.map('mapDetalle').setView([emergencia.lat, emergencia.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker([emergencia.lat, emergencia.lng]).addTo(map).bindPopup(emergencia.tipo).openPopup();
  } else {
    document.getElementById("mapDetalle").innerHTML = "<p>Ubicación no disponible</p>";
  }

  document.getElementById("resueltaDetalle").addEventListener("click", () => {
    marcarResuelta(id);
    document.getElementById("estado-detalle").textContent = "Resuelta";
  });

  document.getElementById("cerrarDetalle").addEventListener("click", () => {
    detalleDiv.remove();
  });
};

// ========================
// 🔥 NUEVA FUNCIÓN: ENVIAR EMERGENCIA A FIREBASE
// ========================
window.enviarEmergencia = function (tipo, descripcion, ubicacion, lat, lng) {
  const nuevaEmergencia = {
    tipo,
    descripcion,
    ubicacion,
    lat,
    lng,
    estado: "En proceso"
  };

  push(ref(database, "emergencias"), nuevaEmergencia)
    .then(() => {
      alert("🚨 Emergencia enviada correctamente a Firebase");
    })
    .catch((error) => {
      console.error("Error al enviar emergencia:", error);
    });
};
