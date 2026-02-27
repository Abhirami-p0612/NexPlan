import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const forumId = localStorage.getItem("forumId");

// Load forum name
async function loadForumInfo() {
  if (!forumId) {
    window.location.href = "index.html";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "forums", forumId));
    if (snap.exists()) {
      const forum = snap.data();
      document.getElementById("forumName").textContent = forum.name;
    } else {
      document.getElementById("forumName").textContent = "Forum not found";
    }
  } catch (error) {
    console.error("Error loading forum:", error);
    document.getElementById("forumName").textContent = "Error loading forum";
  }
}

// Login handler
document.getElementById("loginBtn").onclick = () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username.trim() || !password.trim()) {
    alert("Please enter username and password");
    return;
  }

  // Simple authentication - in production, use Firebase Auth
  // For demo, accept any non-empty credentials
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("currentUser", username);
  
  // Navigate to forum page
  window.location.href = "forum.html";
};

// Allow Enter key to submit
document.getElementById("password").onkeypress = (e) => {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
};

loadForumInfo();
