import { db } from "./firebase.js";
import {
doc, getDoc, updateDoc,
collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const id = localStorage.getItem("forumId");
let forumData = null;

// Check authentication
const isAuthenticated = localStorage.getItem("isAuthenticated");
if (!isAuthenticated || isAuthenticated !== "true") {
  window.location.href = "login.html";
}

async function loadForum() {
  const snap = await getDoc(doc(db, "forums", id));
  forumData = snap.data();

  document.getElementById("forumInfo").innerHTML = `
    <h2>${forumData.name}</h2>
    <p>${forumData.description}</p>
    <p><strong>Domain:</strong> ${forumData.domain || 'N/A'}</p>
  `;
}

async function loadEvents() {
  const q = query(
    collection(db, "events"),
    where("forumId", "==", id)
  );

  const snapshot = await getDocs(q);
  const eventsDiv = document.getElementById("events");
  eventsDiv.innerHTML = "";

  if (snapshot.empty) {
    eventsDiv.innerHTML = '<p class="empty-state">No events yet. Add your first event!</p>';
    return;
  }

  snapshot.forEach(docSnap => {
    const e = docSnap.data();
    eventsDiv.innerHTML += `
      <div class="card">
        <h3>${e.title}</h3>
        <p><strong>Type:</strong> ${e.type}</p>
        <p><strong>Budget:</strong> $${e.budget || 0}</p>
      </div>
    `;
  });
}

// Edit Forum Modal
const editModal = document.getElementById("editModal");

document.getElementById("editForumBtn").onclick = () => {
  document.getElementById("editName").value = forumData.name || '';
  document.getElementById("editDesc").value = forumData.description || '';
  document.getElementById("editDomain").value = forumData.domain || '';
  editModal.classList.remove("hidden");
};

document.getElementById("cancelEdit").onclick = () => {
  editModal.classList.add("hidden");
};

document.getElementById("saveEdit").onclick = async () => {
  const newName = document.getElementById("editName").value;
  const newDesc = document.getElementById("editDesc").value;
  const newDomain = document.getElementById("editDomain").value;

  if (!newName.trim()) {
    alert("Forum name is required");
    return;
  }

  await updateDoc(doc(db, "forums", id), {
    name: newName,
    description: newDesc,
    domain: newDomain
  });

  editModal.classList.add("hidden");
  await loadForum();
};

// View History Button - scroll to events
document.getElementById("viewHistoryBtn").onclick = () => {
  document.getElementById("events").scrollIntoView({ behavior: 'smooth' });
};

// Close modal when clicking outside
editModal.onclick = (e) => {
  if (e.target === editModal) {
    editModal.classList.add("hidden");
  }
};

loadForum();
loadEvents();
