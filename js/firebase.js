// firebase.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4EU6DaP0o5glt84yl40jOsYKQc3PUY8E",
  authDomain: "vecinosos-c9a17.firebaseapp.com",
  databaseURL: "https://vecinosos-c9a17-default-rtdb.firebaseio.com",
  projectId: "vecinosos-c9a17",
  storageBucket: "vecinosos-c9a17.firebasestorage.app",
  messagingSenderId: "447312521513",
  appId: "1:447312521513:web:1acf34a6634ff05ee12f38"
};

// init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// push emergencia (obj)
export function enviarEmergenciaDB(obj) {
  return push(ref(db, 'emergencias'), obj);
}

// subir imagen a Storage -> devuelve URL
export async function subirImagen(file) {
  if (!file) return null;
  const path = `fotos/${Date.now()}_${file.name}`;
  const storageRef = sRef(storage, path);
  const snap = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snap.ref);
  return url;
}

// onValue listener para emergencias (callback recibe objeto o null)
export function onEmergenciasChange(callback) {
  const r = ref(db, 'emergencias');
  onValue(r, (snap) => {
    callback(snap.val());
  });
}

// actualizar estado (ej. El OJO puede usar esto)
export function updateEstado(id, obj) {
  return update(ref(db, `emergencias/${id}`), obj);
}
