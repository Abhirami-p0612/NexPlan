import { db } from "./firebase.js";
import {collection,addDoc}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const forumId = localStorage.getItem("forumId");

// Check authentication
const isAuthenticated = localStorage.getItem("isAuthenticated");
if (!isAuthenticated || isAuthenticated !== "true") {
  window.location.href = "login.html";
}

document.getElementById("save").onclick = async () => {
  const title = document.getElementById("title").value;
  const type = document.getElementById("type").value;
  const budget = document.getElementById("budget").value;

  if (!title.trim()) {
    alert("Please enter event title");
    return;
  }

  await addDoc(collection(db, "events"), {
    forumId,
    title: title,
    type: type,
    budget: Number(budget) || 0
  });

  window.location.href = "forum.html";
};