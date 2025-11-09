let tipoSeleccionado = "";

// Selección rápida de emergencia
document.querySelectorAll(".btn-emergencia").forEach(btn => {
  btn.addEventListener("click", () => {
    tipoSeleccionado = btn.dataset.tipo;
    document.getElementById("tipoSeleccionado").textContent = "Emergencia: " + tipoSeleccionado;
    document.getElementById("formulario").style.display = "block";
    document.getElementById("mapaSection").style.display = "block";
    initMap();
  });
});

// Enviar reporte (simulación)
document.getElementById("enviarReporte").addEventListener("click", () => {
  const descripcion = document.getElementById("descripcion").value;
  const estado = document.getElementById("estado");

  // Mostrar mensaje de emergencia en proceso
  estado.innerHTML = `
    🚨 TU EMERGENCIA ESTÁ SIENDO ATENDIDA 🚨<br>
    <strong>Tipo:</strong> ${tipoSeleccionado}<br>
    <strong>Descripción:</strong> ${descripcion || 'Ninguna'}<br>
    <strong>Estado:</strong> En proceso
  `;

  // Ocultar formulario y mapa
  document.getElementById("formulario").style.display = "none";
  document.getElementById("mapaSection").style.display = "none";

  // Aquí más adelante se actualizará "Estado" desde EL OJO en tiempo real
});

// Función para mostrar mapa con ubicación actual
function initMap() {
  if (!navigator.geolocation) {
    alert("Geolocalización no soportada por tu navegador");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Inicializar mapa
    const map = L.map('map').setView([lat, lng], 16);

    // Capa del mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Marcador de ubicación
    L.marker([lat, lng]).addTo(map)
      .bindPopup("¡Estás aquí!")
      .openPopup();
  }, () => alert("No se pudo obtener tu ubicación"));
}
