import { db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const addForm = document.getElementById("addMentorForm");
const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");

let currentEditId = null;
let currentDeleteId = null;
let mentorPhotoBase64 = '';
let editMentorPhotoBase64 = '';
let allMentors = [];

// Photo upload handling for add form
function clearMentorPhotoPreview() {
  mentorPhotoBase64 = '';
  const preview = document.getElementById('mentorPhotoPreview');
  const fileInput = document.getElementById('mentorPhoto');
  const fileName = document.getElementById('mentorPhotoName');
  if (preview) {
    preview.classList.add('hidden');
    preview.src = '';
  }
  if (fileInput) fileInput.value = '';
  if (fileName) fileName.textContent = '📷 Upload Photo (optional)';
}

document.getElementById('mentorPhoto').onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 500000) {
      alert('Image too large. Please use an image under 500KB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      mentorPhotoBase64 = event.target.result;
      const preview = document.getElementById('mentorPhotoPreview');
      preview.src = mentorPhotoBase64;
      preview.classList.remove('hidden');
      document.getElementById('mentorPhotoName').textContent = '✅ ' + file.name;
    };
    reader.readAsDataURL(file);
  }
};

// Photo upload handling for edit modal
function clearEditMentorPhotoPreview() {
  editMentorPhotoBase64 = '';
  const preview = document.getElementById('editMentorPhotoPreview');
  const fileInput = document.getElementById('editMentorPhoto');
  const fileName = document.getElementById('editMentorPhotoName');
  if (preview) {
    preview.classList.add('hidden');
    preview.src = '';
  }
  if (fileInput) fileInput.value = '';
  if (fileName) fileName.textContent = '📷 Change Photo (optional)';
}

document.getElementById('editMentorPhoto').onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 500000) {
      alert('Image too large. Please use an image under 500KB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      editMentorPhotoBase64 = event.target.result;
      const preview = document.getElementById('editMentorPhotoPreview');
      preview.src = editMentorPhotoBase64;
      preview.classList.remove('hidden');
      document.getElementById('editMentorPhotoName').textContent = '✅ ' + file.name;
    };
    reader.readAsDataURL(file);
  }
};

// Show/Hide Add Form
document.getElementById("showAddForm").onclick = () => {
  addForm.classList.toggle("hidden");
};

document.getElementById("cancelAdd").onclick = () => {
  addForm.classList.add("hidden");
  clearMentorPhotoPreview();
};

// Load Mentors grouped by branch
async function load() {
  const snap = await getDocs(collection(db, "mentors"));
  const container = document.getElementById("mentorContainer");
  container.innerHTML = "";
  allMentors = [];

  if (snap.empty) {
    container.innerHTML = '<p class="empty-state">No mentors yet. Add your first mentor!</p>';
    return;
  }

  // Group mentors by branch
  const branchGroups = {};
  snap.forEach(docSnap => {
    const m = docSnap.data();
    const branch = m.branch || 'Other';
    const mentor = { ...m, id: docSnap.id };
    allMentors.push(mentor);
    if (!branchGroups[branch]) {
      branchGroups[branch] = [];
    }
    branchGroups[branch].push(mentor);
  });

  // Render each branch group
  Object.keys(branchGroups).sort().forEach(branch => {
    const mentors = branchGroups[branch];
    
    const branchSection = document.createElement('div');
    branchSection.className = 'branch-section';
    
    branchSection.innerHTML = `
      <h3 class="branch-title">${branch}</h3>
      <div class="mentor-slider-wrapper">
        <button class="mentor-arrow mentor-arrow-left" data-branch="${branch}">&#10094;</button>
        <div class="mentor-list" id="mentorList-${branch}"></div>
        <button class="mentor-arrow mentor-arrow-right" data-branch="${branch}">&#10095;</button>
      </div>
    `;
    
    container.appendChild(branchSection);
    
    const mentorList = document.getElementById(`mentorList-${branch}`);
    
    mentors.forEach(m => {
      const photoHtml = m.photoUrl 
        ? `<img src="${m.photoUrl}" alt="${m.name}" class="mentor-photo">` 
        : '<div class="mentor-photo-placeholder">👤</div>';

      mentorList.innerHTML += `
        <div class="mentor-card">
          ${photoHtml}
          <div class="mentor-info">
            <h3>${m.name}</h3>
            <p>${m.expertise}</p>
            <div class="btn-group">
              <button class="action-btn warning" onclick="openEditModal('${m.id}')">✏️ Edit</button>
              <button class="action-btn danger" onclick="openDeleteModal('${m.id}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `;
    });
  });

  // Setup arrow navigation for each branch
  setupMentorArrows();
}

function setupMentorArrows() {
  document.querySelectorAll('.mentor-arrow-left').forEach(btn => {
    btn.onclick = () => {
      const branch = btn.dataset.branch;
      const list = document.getElementById(`mentorList-${branch}`);
      list.scrollBy({ left: -250, behavior: 'smooth' });
    };
  });

  document.querySelectorAll('.mentor-arrow-right').forEach(btn => {
    btn.onclick = () => {
      const branch = btn.dataset.branch;
      const list = document.getElementById(`mentorList-${branch}`);
      list.scrollBy({ left: 250, behavior: 'smooth' });
    };
  });
}

// Add Mentor
document.getElementById("addMentor").onclick = async () => {
  const name = document.getElementById("mname").value;
  const expertise = document.getElementById("exp").value;
  const branch = document.getElementById("branch").value;

  if (!name.trim()) {
    alert("Please enter mentor name");
    return;
  }

  await addDoc(collection(db, "mentors"), {
    name: name,
    expertise: expertise,
    branch: branch.toUpperCase() || 'Other',
    photoUrl: mentorPhotoBase64
  });

  document.getElementById("mname").value = "";
  document.getElementById("exp").value = "";
  document.getElementById("branch").value = "";
  clearMentorPhotoPreview();
  addForm.classList.add("hidden");
  
  load();
};

// Edit Modal Functions
window.openEditModal = async (id) => {
  currentEditId = id;
  
  const snap = await getDoc(doc(db, "mentors", id));
  const mentorData = snap.data();
  
  document.getElementById("editName").value = mentorData.name || '';
  document.getElementById("editExp").value = mentorData.expertise || '';
  document.getElementById("editBranch").value = mentorData.branch || '';
  
  // Show current photo if exists
  if (mentorData.photoUrl) {
    editMentorPhotoBase64 = mentorData.photoUrl;
    const preview = document.getElementById('editMentorPhotoPreview');
    preview.src = mentorData.photoUrl;
    preview.classList.remove('hidden');
    document.getElementById('editMentorPhotoName').textContent = '📷 Current photo (select new to change)';
  } else {
    clearEditMentorPhotoPreview();
  }
  
  editModal.classList.remove("hidden");
};

document.getElementById("cancelEdit").onclick = () => {
  editModal.classList.add("hidden");
  currentEditId = null;
  clearEditMentorPhotoPreview();
};

document.getElementById("saveEdit").onclick = async () => {
  const newName = document.getElementById("editName").value;
  const newExp = document.getElementById("editExp").value;
  const newBranch = document.getElementById("editBranch").value;

  if (!newName.trim()) {
    alert("Mentor name is required");
    return;
  }

  await updateDoc(doc(db, "mentors", currentEditId), {
    name: newName,
    expertise: newExp,
    branch: newBranch.toUpperCase() || 'Other',
    photoUrl: editMentorPhotoBase64
  });

  editModal.classList.add("hidden");
  currentEditId = null;
  clearEditMentorPhotoPreview();
  load();
};

// Delete Modal Functions
window.openDeleteModal = (id) => {
  currentDeleteId = id;
  deleteModal.classList.remove("hidden");
};

document.getElementById("cancelDelete").onclick = () => {
  deleteModal.classList.add("hidden");
  currentDeleteId = null;
};

document.getElementById("confirmDelete").onclick = async () => {
  await deleteDoc(doc(db, "mentors", currentDeleteId));
  deleteModal.classList.add("hidden");
  currentDeleteId = null;
  load();
};

// Close modals when clicking outside
editModal.onclick = (e) => {
  if (e.target === editModal) {
    editModal.classList.add("hidden");
  }
};

deleteModal.onclick = (e) => {
  if (e.target === deleteModal) {
    deleteModal.classList.add("hidden");
  }
};

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectBranchFromQuery(query) {
  const text = normalizeText(query);
  const knownBranches = ['cs', 'cse', 'it', 'ece', 'eee', 'me', 'civil', 'biotech'];
  const found = knownBranches.find((branch) => text.includes(branch));
  return found ? found.toUpperCase() : '';
}

const intentRules = [
  {
    intentWords: ['ai', 'ml', 'machine learning', 'deep learning', 'data science', 'python'],
    mentorWords: ['ai', 'ml', 'machine learning', 'deep learning', 'data science', 'python'],
    label: 'AI/ML'
  },
  {
    intentWords: ['web', 'frontend', 'backend', 'react', 'javascript', 'app', 'android', 'ios'],
    mentorWords: ['web', 'frontend', 'backend', 'react', 'javascript', 'app', 'mobile', 'android', 'ios'],
    label: 'Web/App Development'
  },
  {
    intentWords: ['placement', 'interview', 'resume', 'career', 'aptitude'],
    mentorWords: ['placement', 'interview', 'resume', 'career', 'aptitude'],
    label: 'Placement Guidance'
  },
  {
    intentWords: ['iot', 'embedded', 'electronics', 'hardware', 'robotics'],
    mentorWords: ['iot', 'embedded', 'electronics', 'hardware', 'robotics'],
    label: 'Core/Hardware'
  }
];

function rankMentorsByQuery(query) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(' ').filter(token => token.length > 2);
  const requestedBranch = detectBranchFromQuery(normalizedQuery);

  const ranked = allMentors.map((mentor) => {
    const searchable = normalizeText(`${mentor.name || ''} ${mentor.expertise || ''} ${mentor.branch || ''}`);
    const reasons = [];
    let score = 0;

    queryTokens.forEach((token) => {
      if (searchable.includes(token)) {
        score += 8;
        reasons.push(`matches "${token}"`);
      }
    });

    intentRules.forEach((rule) => {
      const userIntent = rule.intentWords.some(word => normalizedQuery.includes(word));
      const mentorIntent = rule.mentorWords.some(word => searchable.includes(word));
      if (userIntent && mentorIntent) {
        score += 25;
        reasons.push(`${rule.label} alignment`);
      }
    });

    if (requestedBranch && normalizeText(mentor.branch || '').includes(requestedBranch.toLowerCase())) {
      score += 20;
      reasons.push(`branch fit (${requestedBranch})`);
    }

    if (!mentor.expertise || !mentor.expertise.trim()) {
      score += 2;
    }

    return { mentor, score, reasons };
  });

  ranked.sort((a, b) => b.score - a.score || (a.mentor.name || '').localeCompare(b.mentor.name || ''));
  return ranked.slice(0, 3);
}

function addChatMessage(sender, text, rankedMentors = []) {
  const chatMessages = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = `chat-row ${sender}`;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  const textNode = document.createElement('p');
  textNode.className = 'chat-text';
  textNode.textContent = text;
  bubble.appendChild(textNode);

  if (sender === 'bot' && rankedMentors.length > 0) {
    const listTitle = document.createElement('div');
    listTitle.className = 'suggestion-title';
    listTitle.textContent = 'Top mentor matches:';
    bubble.appendChild(listTitle);

    const list = document.createElement('ul');
    list.className = 'suggestion-list';

    rankedMentors.forEach((entry, index) => {
      const item = document.createElement('li');
      item.textContent = `${index + 1}. ${entry.mentor.name} — ${entry.mentor.expertise || 'General guidance'} (${entry.mentor.branch || 'Other'})`;
      list.appendChild(item);
    });

    bubble.appendChild(list);
  }

  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function buildBotReply(message) {
  if (!allMentors.length) {
    return {
      text: 'No mentors are available yet. Please add mentors first, then I can suggest the best match.',
      ranked: []
    };
  }

  const ranked = rankMentorsByQuery(message);
  const topScore = ranked[0]?.score || 0;

  if (topScore <= 0) {
    return {
      text: 'I could not find strong keyword matches, so I picked versatile options. Try adding specific skills like AI, web, interviews, or branch.',
      ranked
    };
  }

  return {
    text: 'Based on your requirement, these mentors look like the best fit right now.',
    ranked
  };
}

function handleChatSubmit(prefilledMessage = '') {
  const input = document.getElementById('chatInput');
  const message = (prefilledMessage || input.value).trim();

  if (!message) {
    return;
  }

  addChatMessage('user', message);
  input.value = '';

  const reply = buildBotReply(message);
  addChatMessage('bot', reply.text, reply.ranked);
}

function setupMentorChatbot() {
  const chatMessages = document.getElementById('chatMessages');
  const sendButton = document.getElementById('sendChat');
  const chatInput = document.getElementById('chatInput');

  if (!chatMessages || !sendButton || !chatInput) {
    return;
  }

  if (chatMessages.childElementCount === 0) {
    addChatMessage('bot', 'Hi! Describe your goal and I will suggest the best mentors for you.');
  }

  sendButton.onclick = () => handleChatSubmit();
  chatInput.onkeypress = (event) => {
    if (event.key === 'Enter') {
      handleChatSubmit();
    }
  };

  document.querySelectorAll('.quick-chat-btn').forEach((button) => {
    button.onclick = () => {
      handleChatSubmit(button.dataset.prompt || '');
    };
  });
}

setupMentorChatbot();
load();
