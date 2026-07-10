const STORAGE_KEY = "mission180_milestones_v1";

const rewards = {
  daily: ["Movie Night", "Ice Cream Treat", "Gaming 30 Min", "Relax Time", "Favorite Snack"],
  weekly: ["Extra Game Time", "Burger Treat", "Mini Shopping", "Chill Session", "Dessert Reward"],
  monthly: ["New Accessory", "Special Meal", "Movie Outing", "Headphone Treat", "Long Gaming Session"],
  custom: ["Crazy Reward", "New Gadget", "Big Treat", "Day Trip Plan", "Premium Celebration"]
};

const punishments = [
  "Solve 100 MCQs",
  "No gaming for 1 day",
  "Extra revision session",
  "Clean study desk",
  "Wake up early tomorrow",
  "Write 2 pages summary",
  "Revise a weak topic",
  "30-minute workout",
  "Read for 1 hour",
  "No short videos tonight"
];

const el = {
  openAddBtn: document.getElementById("openAddBtn"),
  closeAddBtn: document.getElementById("closeAddBtn"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  addModal: document.getElementById("addModal"),
  stepChoose: document.getElementById("stepChoose"),
  stepForm: document.getElementById("stepForm"),
  saveBtn: document.getElementById("saveBtn"),
  backBtn: document.getElementById("backBtn"),
  titleInput: document.getElementById("titleInput"),
  descInput: document.getElementById("descInput"),
  customDaysWrap: document.getElementById("customDaysWrap"),
  customDaysInput: document.getElementById("customDaysInput"),
  selectedCategoryChip: document.getElementById("selectedCategoryChip"),
  milestoneList: document.getElementById("milestoneList"),
  rewardPopup: document.getElementById("rewardPopup"),
  punishPopup: document.getElementById("punishPopup"),
  popupBackdrop: document.getElementById("popupBackdrop"),
  rewardText: document.getElementById("rewardText"),
  punishText: document.getElementById("punishText"),
  rewardOkBtn: document.getElementById("rewardOkBtn"),
  punishOkBtn: document.getElementById("punishOkBtn"),
  sectionTitle: document.getElementById("sectionTitle"),
  sectionHint: document.getElementById("sectionHint"),
  totalCount: document.getElementById("totalCount"),
  dailyCount: document.getElementById("dailyCount"),
  weeklyCount: document.getElementById("weeklyCount"),
  monthlyCount: document.getElementById("monthlyCount"),
  customCount: document.getElementById("customCount"),
  tabs: [...document.querySelectorAll(".tab")]
};

let milestones = loadData();
let activeFilter = "all";
let selectedCategory = "daily";
let timerHandle = null;

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function now() {
  return Date.now();
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function dueAtFor(category, customDays = 0) {
  const base = new Date();
  if (category === "daily") return endOfToday();
  if (category === "weekly") return now() + 7 * 24 * 60 * 60 * 1000;
  if (category === "monthly") return now() + 30 * 24 * 60 * 60 * 1000;
  return now() + Math.max(1, Number(customDays || 1)) * 24 * 60 * 60 * 1000;
}

function formatDue(ts) {
  return new Date(ts).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function openModal() {
  el.modalBackdrop.classList.remove("hidden");
  el.addModal.classList.remove("hidden");
}

function closeModal() {
  el.modalBackdrop.classList.add("hidden");
  el.addModal.classList.add("hidden");
  el.stepChoose.classList.remove("hidden");
  el.stepForm.classList.add("hidden");
  el.titleInput.value = "";
  el.descInput.value = "";
  el.customDaysInput.value = "";
}

function openPopup(type, text) {
  el.popupBackdrop.classList.remove("hidden");
  if (type === "reward") {
    el.rewardText.textContent = text;
    el.rewardPopup.classList.remove("hidden");
  } else {
    el.punishText.textContent = text;
    el.punishPopup.classList.remove("hidden");
  }
}

function closePopup() {
  el.popupBackdrop.classList.add("hidden");
  el.rewardPopup.classList.add("hidden");
  el.punishPopup.classList.add("hidden");
}

function setCategory(cat) {
  selectedCategory = cat;
  el.selectedCategoryChip.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  el.customDaysWrap.classList.toggle("hidden", cat !== "custom");
  el.stepChoose.classList.add("hidden");
  el.stepForm.classList.remove("hidden");
}

function addMilestone() {
  const title = el.titleInput.value.trim();
  const description = el.descInput.value.trim();
  const customDays = el.customDaysInput.value;

  if (!title) {
    alert("Please enter a title.");
    return;
  }

  const item = {
    id: uid(),
    title,
    description,
    category: selectedCategory,
    createdAt: now(),
    dueAt: dueAtFor(selectedCategory, customDays),
    status: "active"
  };

  milestones.unshift(item);
  saveData();
  render();
  closeModal();
}

function completeMilestone(id) {
  const idx = milestones.findIndex(m => m.id === id);
  if (idx === -1) return;

  const item = milestones[idx];
  const reward = randomFrom(rewards[item.category]);
  milestones.splice(idx, 1);
  saveData();
  render();
  openPopup("reward", reward);
}

function deleteMilestone(id) {
  milestones = milestones.filter(m => m.id !== id);
  saveData();
  render();
}

function checkExpired() {
  const t = now();
  const expiredItems = milestones.filter(m => m.dueAt <= t);
  if (!expiredItems.length) return;

  const expired = expiredItems[0];
  milestones = milestones.filter(m => m.id !== expired.id);
  saveData();
  render();
  openPopup("punish", randomFrom(punishments));
}

function renderStats() {
  el.totalCount.textContent = milestones.length;
  el.dailyCount.textContent = milestones.filter(m => m.category === "daily").length;
  el.weeklyCount.textContent = milestones.filter(m => m.category === "weekly").length;
  el.monthlyCount.textContent = milestones.filter(m => m.category === "monthly").length;
  el.customCount.textContent = milestones.filter(m => m.category === "custom").length;
}

function filteredData() {
  if (activeFilter === "all") return milestones;
  return milestones.filter(m => m.category === activeFilter);
}

function render() {
  renderStats();

  const data = filteredData();
  el.sectionTitle.textContent = activeFilter === "all"
    ? "Home"
    : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);

  el.sectionHint.textContent = activeFilter === "all"
    ? "Select a category to view your milestones."
    : `Your ${activeFilter} milestones appear here.`;

  if (!data.length) {
    el.milestoneList.innerHTML = `<div class="empty">No milestones yet.</div>`;
    return;
  }

  el.milestoneList.innerHTML = data.map(item => `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="item-meta">${item.description ? escapeHtml(item.description) : "No description"}</p>
        </div>
        <span class="badge ${item.category}">${item.category.toUpperCase()}</span>
      </div>
      <div class="item-meta">Expires: ${formatDue(item.dueAt)}</div>
      <div class="card-actions">
        <button class="small-btn complete" data-complete="${item.id}">✓ Complete</button>
        <button class="small-btn delete" data-delete="${item.id}">Delete</button>
      </div>
    </article>
  `).join("");

  [...document.querySelectorAll("[data-complete]")].forEach(btn => {
    btn.addEventListener("click", () => completeMilestone(btn.dataset.complete));
  });
  [...document.querySelectorAll("[data-delete]")].forEach(btn => {
    btn.addEventListener("click", () => deleteMilestone(btn.dataset.delete));
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

el.openAddBtn.addEventListener("click", openModal);
el.closeAddBtn.addEventListener("click", closeModal);
el.modalBackdrop.addEventListener("click", closeModal);
el.popupBackdrop.addEventListener("click", closePopup);
el.rewardOkBtn.addEventListener("click", closePopup);
el.punishOkBtn.addEventListener("click", closePopup);
el.saveBtn.addEventListener("click", addMilestone);
el.backBtn.addEventListener("click", () => {
  el.stepForm.classList.add("hidden");
  el.stepChoose.classList.remove("hidden");
});

document.querySelectorAll(".choose-btn").forEach(btn => {
  btn.addEventListener("click", () => setCategory(btn.dataset.category));
});

el.tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    el.tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    render();
  });
});

render();
checkExpired();
timerHandle = setInterval(checkExpired, 60000);
