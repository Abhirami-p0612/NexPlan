import { db } from "./firebase.js";
import {
collection,
addDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("forumForm");

document.getElementById("showFormBtn").onclick = () => {
  form.classList.toggle("hidden");
};

document.getElementById("cancelForm").onclick = () => {
  form.classList.add("hidden");
  clearLogoPreview();
};

// File upload handling
let logoBase64 = '';

function clearLogoPreview() {
  logoBase64 = '';
  const preview = document.getElementById('logoPreview');
  const fileInput = document.getElementById('logoFile');
  const fileName = document.getElementById('logoFileName');
  if (preview) {
    preview.classList.add('hidden');
    preview.src = '';
  }
  if (fileInput) fileInput.value = '';
  if (fileName) fileName.textContent = '📷 Upload Logo (optional)';
}

document.getElementById('logoFile').onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 500000) {
      alert('Image too large. Please use an image under 500KB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      logoBase64 = event.target.result;
      const preview = document.getElementById('logoPreview');
      preview.src = logoBase64;
      preview.classList.remove('hidden');
      document.getElementById('logoFileName').textContent = '✅ ' + file.name;
    };
    reader.readAsDataURL(file);
  }
};

async function loadForums() {
  const snapshot = await getDocs(collection(db, "forums"));
  const list = document.getElementById("forumList");
  list.innerHTML = "";

  if (snapshot.empty) {
    list.innerHTML = '<p class="empty-state">No forums yet. Create your first forum!</p>';
    return;
  }

  snapshot.forEach(docSnap => {
    const f = docSnap.data();
    const docId = docSnap.id;

    const forumItem = document.createElement("div");
    forumItem.className = "forum-item";

    const btn = document.createElement("button");
    btn.className = "forum-btn";
    btn.title = f.description;
    btn.onclick = () => openForum(docId);

    // Create content wrapper
    const content = document.createElement("div");
    content.className = "forum-btn-content";

    // Add logo if exists - fills the sphere
    if (f.logoUrl && f.logoUrl.trim()) {
      const logo = document.createElement("img");
      logo.src = f.logoUrl;
      logo.alt = f.name;
      logo.className = "forum-logo";
      content.appendChild(logo);
    }

    btn.appendChild(content);
    forumItem.appendChild(btn);

    // Add name below the sphere
    const nameSpan = document.createElement("span");
    nameSpan.className = "forum-name";
    nameSpan.textContent = f.name;
    forumItem.appendChild(nameSpan);

    list.appendChild(forumItem);
  });
  
  // Set up arrow navigation
  setupSliderNavigation();
}

let currentIndex = 0;

function setupSliderNavigation() {
  const list = document.getElementById("forumList");
  const items = list.querySelectorAll(".forum-item");
  
  if (items.length === 0) return;
  
  currentIndex = Math.floor(items.length / 2);
  
  document.getElementById("prevBtn").onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderVisibleForums();
    }
  };
  
  document.getElementById("nextBtn").onclick = () => {
    if (currentIndex < items.length - 1) {
      currentIndex++;
      renderVisibleForums();
    }
  };
  
  renderVisibleForums();
}

function renderVisibleForums() {
  const list = document.getElementById("forumList");
  const items = Array.from(list.querySelectorAll(".forum-item"));
  
  if (items.length === 0) return;
  
  items.forEach((item, index) => {
    const btn = item.querySelector(".forum-btn");
    btn.classList.remove("center-item");
    const diff = Math.abs(index - currentIndex);
    if (diff <= 2) {
      item.style.display = "flex";
      if (index === currentIndex) {
        btn.classList.add("center-item");
      }
    } else {
      item.style.display = "none";
    }
  });
}

function openForum(id) {
  localStorage.setItem("forumId", id);
  localStorage.removeItem("isAuthenticated");
  window.location.href = "login.html";
}

document.getElementById("addForum").onclick = async () => {
  const nameInput = document.getElementById("name");
  const descInput = document.getElementById("desc");
  const domainInput = document.getElementById("domain");

  if (!nameInput.value.trim()) {
    alert("Please enter a forum name");
    return;
  }

  await addDoc(collection(db, "forums"), {
    name: nameInput.value,
    description: descInput.value,
    domain: domainInput.value,
    logoUrl: logoBase64
  });

  nameInput.value = "";
  descInput.value = "";
  domainInput.value = "";
  clearLogoPreview();
  
  form.classList.add("hidden");
  await loadForums();
};

loadForums();
