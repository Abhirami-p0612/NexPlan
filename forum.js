import { db } from "./firebase.js";
import {
doc, getDoc, updateDoc,
collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const id = localStorage.getItem("forumId");
let forumData = null;
let editLogoBase64 = '';

// Check authentication
const isAuthenticated = localStorage.getItem("isAuthenticated");
if (!isAuthenticated || isAuthenticated !== "true") {
  window.location.href = "login.html";
}

async function loadForum() {
  const snap = await getDoc(doc(db, "forums", id));
  forumData = snap.data();

  const logoHtml = forumData.logoUrl && forumData.logoUrl.trim()
    ? `<img src="${forumData.logoUrl}" alt="${forumData.name} logo" class="upload-preview" style="margin: 0 auto 12px; display: block;">`
    : '';

  document.getElementById("forumInfo").innerHTML = `
    ${logoHtml}
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
const editLogoInput = document.getElementById("editLogoFile");

function clearEditLogoPreview() {
  editLogoBase64 = '';
  const preview = document.getElementById('editLogoPreview');
  const label = document.getElementById('editLogoFileName');
  if (preview) {
    preview.classList.add('hidden');
    preview.src = '';
  }
  if (editLogoInput) {
    editLogoInput.value = '';
  }
  if (label) {
    label.textContent = '📷 Upload Forum Logo (optional)';
  }
}

if (editLogoInput) {
  editLogoInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (file.size > 500000) {
      alert('Image too large. Please use an image under 500KB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      editLogoBase64 = loadEvent.target.result;
      const preview = document.getElementById('editLogoPreview');
      const label = document.getElementById('editLogoFileName');
      if (preview) {
        preview.src = editLogoBase64;
        preview.classList.remove('hidden');
      }
      if (label) {
        label.textContent = `✅ ${file.name}`;
      }
    };
    reader.readAsDataURL(file);
  };
}

document.getElementById("editForumBtn").onclick = () => {
  document.getElementById("editName").value = forumData.name || '';
  document.getElementById("editDesc").value = forumData.description || '';
  document.getElementById("editDomain").value = forumData.domain || '';

  if (forumData.logoUrl && forumData.logoUrl.trim()) {
    editLogoBase64 = forumData.logoUrl;
    const preview = document.getElementById('editLogoPreview');
    const label = document.getElementById('editLogoFileName');
    if (preview) {
      preview.src = forumData.logoUrl;
      preview.classList.remove('hidden');
    }
    if (label) {
      label.textContent = '📷 Current logo (select new to change)';
    }
    if (editLogoInput) {
      editLogoInput.value = '';
    }
  } else {
    clearEditLogoPreview();
    const label = document.getElementById('editLogoFileName');
    if (label) {
      label.textContent = '📷 Upload Forum Logo (required for this forum)';
    }
  }

  editModal.classList.remove("hidden");
};

document.getElementById("cancelEdit").onclick = () => {
  editModal.classList.add("hidden");
  clearEditLogoPreview();
};

document.getElementById("saveEdit").onclick = async () => {
  const newName = document.getElementById("editName").value;
  const newDesc = document.getElementById("editDesc").value;
  const newDomain = document.getElementById("editDomain").value;

  if (!newName.trim()) {
    alert("Forum name is required");
    return;
  }

  if ((!forumData.logoUrl || !forumData.logoUrl.trim()) && !editLogoBase64) {
    alert("Please upload a forum logo before saving.");
    return;
  }

  await updateDoc(doc(db, "forums", id), {
    name: newName,
    description: newDesc,
    domain: newDomain,
    logoUrl: editLogoBase64 || ''
  });

  editModal.classList.add("hidden");
  clearEditLogoPreview();
  await loadForum();
};

// Close modal when clicking outside
editModal.onclick = (e) => {
  if (e.target === editModal) {
    editModal.classList.add("hidden");
    clearEditLogoPreview();
  }
};

loadForum();
loadEvents();
