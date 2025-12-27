let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let db;

// Open IndexedDB
const request = indexedDB.open("VoiceDumpDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("voices", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = e => {
  db = e.target.result;
  loadRecordings();
};

const recordBtn = document.getElementById("recordBtn");
const visualizer = document.getElementById("visualizer");
const recordingsDiv = document.getElementById("recordings");

recordBtn.onclick = async () => {
  if (!isRecording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    visualizer.style.display = "block";
    recordBtn.textContent = "⏹️ Stop Dumping";
    isRecording = true;

    mediaRecorder.onstop = saveRecording;
  } else {
    mediaRecorder.stop();
    visualizer.style.display = "none";
    recordBtn.textContent = "🎙️ Start Dumping";
    isRecording = false;
  }
};

function saveRecording() {
  const blob = new Blob(audioChunks, { type: "audio/webm" });
  const date = new Date().toLocaleString();

  const tx = db.transaction("voices", "readwrite");
  const store = tx.objectStore("voices");

  store.add({ audio: blob, date });
}

function loadRecordings() {
  const tx = db.transaction("voices", "readonly");
  const store = tx.objectStore("voices");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      displayRecording(cursor.value);
      cursor.continue();
    }
  };
}

function displayRecording(record) {
  const url = URL.createObjectURL(record.audio);

  const div = document.createElement("div");
  div.className = "record";
  div.innerHTML = `
    <p>${record.date}</p>
    <audio controls src="${url}"></audio>
  `;

  recordingsDiv.prepend(div);
}
