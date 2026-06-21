const KEYS = {
  events: "laoli-events-v1",
  messages: "laoli-messages-v1",
  photos: "laoli-photos-v1"
};

const defaultEvents = [
  { id: "d1", title: "家庭周例会", date: nextDate(1), time: "20:00", owner: "郦明", category: "家事", note: "同步本周安排、采购和维修事项。", fixed: true },
  { id: "d2", title: "周末家庭聚餐", date: nextDate(6), time: "18:30", owner: "郦安", category: "聚会", note: "提前确认人数和菜单。", fixed: true },
  { id: "d3", title: "全家健康体检", date: nextDate(13), time: "09:00", owner: "郦晴", category: "健康", note: "带好证件，提前一天清淡饮食。", fixed: true }
];

const defaultMessages = [
  { id: "m1", name: "郦晴", text: "本周相册我来整理，大家有照片可以先发到群里。", time: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), fixed: true },
  { id: "m2", name: "郦安", text: "周末聚餐想吃清淡一点，菜单我周五前确认。", time: new Date(Date.now() - 3600 * 1000 * 22).toISOString(), fixed: true }
];

const defaultPhotos = [
  { title: "家庭聚餐", desc: "把节日餐桌和团圆时刻放在这里" },
  { title: "旅行记忆", desc: "记录一起走过的城市和风景" },
  { title: "成长瞬间", desc: "保存孩子、长辈和家人的日常片段" }
];

const $ = (id) => document.getElementById(id);

function nextDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function allEvents() {
  return [...defaultEvents, ...load(KEYS.events)].sort((a, b) =>
    `${a.date}T${a.time || "23:59"}`.localeCompare(`${b.date}T${b.time || "23:59"}`)
  );
}

function allMessages() {
  return [...load(KEYS.messages), ...defaultMessages].sort((a, b) =>
    new Date(b.time) - new Date(a.time)
  );
}

function formatDate(dateText) {
  const d = new Date(`${dateText}T00:00:00`);
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
}

function formatTime(iso) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, (s) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

function renderEvents() {
  const events = allEvents();
  $("eventCount").textContent = events.length;
  $("eventList").innerHTML = events.map(eventCard).join("");

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.date === today).slice(0, 3);
  $("todayTitle").textContent = todayEvents.length ? "今日有家庭安排" : "今日暂无新增日程";
  $("todayList").innerHTML = todayEvents.length
    ? todayEvents.map((e) => `<div class="today-item">${escapeHTML(e.time || "全天")} · ${escapeHTML(e.title)}</div>`).join("")
    : `<div class="empty">可以从“日程安排”里添加今天的家庭事项。</div>`;
}

function eventCard(e) {
  return `
    <article class="item">
      <div class="item-head">
        <div>
          <span class="event-cat">${escapeHTML(e.category)}</span>
          <h4>${escapeHTML(e.title)}</h4>
        </div>
        ${e.fixed ? "" : `<button class="delete" data-delete-event="${e.id}">删除</button>`}
      </div>
      <div class="meta">${formatDate(e.date)} ${e.time ? " · " + escapeHTML(e.time) : ""}${e.owner ? " · 负责人：" + escapeHTML(e.owner) : ""}</div>
      ${e.note ? `<div>${escapeHTML(e.note)}</div>` : ""}
    </article>
  `;
}

function renderMessages() {
  const messages = allMessages();
  $("messageCount").textContent = messages.length;
  $("messageList").innerHTML = messages.map((m) => `
    <article class="item">
      <div class="item-head">
        <div>
          <h4>${escapeHTML(m.name)}</h4>
          <div class="meta">${formatTime(m.time)}</div>
        </div>
        ${m.fixed ? "" : `<button class="delete" data-delete-message="${m.id}">删除</button>`}
      </div>
      <div>${escapeHTML(m.text)}</div>
    </article>
  `).join("");
}

function renderPhotos() {
  const photos = load(KEYS.photos);
  const placeholders = defaultPhotos.map((p) => `
    <article class="photo placeholder">
      <div><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.desc)}</p></div>
    </article>
  `).join("");

  const uploaded = photos.map((p) => `
    <article class="photo">
      <img src="${p.src}" alt="${escapeHTML(p.name)}">
      <button class="delete" data-delete-photo="${p.id}">删除</button>
    </article>
  `).join("");

  $("albumGrid").innerHTML = uploaded + placeholders;
}

function bindForms() {
  $("eventForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const item = {
      id: crypto.randomUUID(),
      title: $("eventTitle").value.trim(),
      date: $("eventDate").value,
      time: $("eventTime").value,
      owner: $("eventOwner").value.trim(),
      category: $("eventCategory").value,
      note: $("eventNote").value.trim()
    };
    const events = load(KEYS.events);
    events.push(item);
    save(KEYS.events, events);
    e.target.reset();
    renderEvents();
  });

  $("messageForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const item = {
      id: crypto.randomUUID(),
      name: $("messageName").value.trim(),
      text: $("messageText").value.trim(),
      time: new Date().toISOString()
    };
    const messages = load(KEYS.messages);
    messages.unshift(item);
    save(KEYS.messages, messages);
    e.target.reset();
    renderMessages();
  });

  $("photoInput").addEventListener("change", async (e) => {
    const files = [...e.target.files].filter((file) => file.type.startsWith("image/"));
    const photos = load(KEYS.photos);
    for (const file of files) {
      const src = await compressImage(file);
      photos.unshift({ id: crypto.randomUUID(), name: file.name, src });
    }
    save(KEYS.photos, photos.slice(0, 18));
    e.target.value = "";
    renderPhotos();
  });
}

function bindDeletes() {
  document.addEventListener("click", (e) => {
    const eventId = e.target.dataset.deleteEvent;
    const messageId = e.target.dataset.deleteMessage;
    const photoId = e.target.dataset.deletePhoto;

    if (eventId) {
      save(KEYS.events, load(KEYS.events).filter((x) => x.id !== eventId));
      renderEvents();
    }
    if (messageId) {
      save(KEYS.messages, load(KEYS.messages).filter((x) => x.id !== messageId));
      renderMessages();
    }
    if (photoId) {
      save(KEYS.photos, load(KEYS.photos).filter((x) => x.id !== photoId));
      renderPhotos();
    }
  });

  $("clearEvents").addEventListener("click", () => { save(KEYS.events, []); renderEvents(); });
  $("clearMessages").addEventListener("click", () => { save(KEYS.messages, []); renderMessages(); });
  $("clearPhotos").addEventListener("click", () => { save(KEYS.photos, []); renderPhotos(); });
  $("resetAll").addEventListener("click", () => {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    renderAll();
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;

    img.onload = () => {
      const max = 1100;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAll() {
  renderEvents();
  renderMessages();
  renderPhotos();
}

document.addEventListener("DOMContentLoaded", () => {
  $("eventDate").value = new Date().toISOString().slice(0, 10);
  bindForms();
  bindDeletes();
  renderAll();
});
