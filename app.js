const API_URL = "https://script.google.com/macros/s/AKfycbyfV6thk64ft2YgfYg8Aj3zXkxwX0wsfvwji6QhfGAcoF9K3KnQvPVQsDS0KRWy2rgb/exec";

let DOCS = [];
let CATEGORIES = [];
let selectedCategory = "All";

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "className") node.className = v;
    else if (k === "onclick") node.onclick = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}

function baseLayout() {
  document.body.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
  document.body.style.maxWidth = "980px";
  document.body.style.margin = "0 auto";
  document.body.style.padding = "16px";

  document.body.innerHTML = `
    <h1 style="margin:0">Hadassah GICU Guidelines</h1>
    <div style="opacity:.7; font-size:13px; margin-top:4px;">Auto-updated from Google Sheet (Form uploads)</div>

    <div style="margin-top:16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <input id="search" placeholder="Search title or tags…" style="flex:1; min-width:240px; padding:10px; border:1px solid #ddd; border-radius:10px; font-size:16px;" />
      <button id="refresh" style="padding:10px 12px; border:1px solid #ddd; border-radius:10px; background:#fff; cursor:pointer;">Refresh</button>
    </div>

    <div id="status" style="margin-top:10px; opacity:.75; font-size:13px;"></div>
    <div id="pills" style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;"></div>
    <div id="list" style="margin-top:18px;"></div>
  `;
}

function setCategoriesFromDocs() {
  const set = new Set();
  DOCS.forEach(d => {
    const c = (d.category || "").trim();
    if (c) set.add(c);
  });
  CATEGORIES = Array.from(set).sort((a, b) => a.localeCompare(b));
}

function renderPills(pillsEl) {
  function pill(name) {
    const active = selectedCategory === name;
    const p = el("span", { onclick: () => { selectedCategory = name; draw(); } }, [name]);
    p.style.padding = "6px 10px";
    p.style.borderRadius = "999px";
    p.style.border = active ? "2px solid #111" : "1px solid #ddd";
    p.style.cursor = "pointer";
    p.style.userSelect = "none";
    return p;
  }

  pillsEl.innerHTML = "";
  pillsEl.appendChild(pill("All"));
  CATEGORIES.forEach((c) => pillsEl.appendChild(pill(c)));
}

function draw() {
  const pills = document.getElementById("pills");
  const list = document.getElementById("list");
  const search = document.getElementById("search");

  renderPills(pills);

  const q = search.value.trim().toLowerCase();

  const filtered = DOCS.filter((d) => {
    const catOk = selectedCategory === "All" || (d.category || "") === selectedCategory;
    const qOk =
      !q ||
      (d.title || "").toLowerCase().includes(q) ||
      (d.tags || []).some((t) => String(t).toLowerCase().includes(q));
    return catOk && qOk;
  });

  list.innerHTML = "";
  list.style.opacity = "1";

  if (filtered.length === 0) {
    const empty = el("div", {}, ["No documents found."]);
    empty.style.opacity = "0.7";
    list.appendChild(empty);
    return;
  }

  filtered.forEach((d) => {
    const card = el("div", { onclick: () => window.open(d.url, "_blank") });
    card.style.border = "1px solid #e5e5e5";
    card.style.borderRadius = "12px";
    card.style.padding = "12px";
    card.style.marginTop = "10px";
    card.style.cursor = "pointer";
    card.style.background = "white";

    card.appendChild(el("div", {}, ["📄 ", el("strong", {}, [d.title || "Untitled"])]));
    const metaText = `${d.category || ""} • ${(d.tags || []).map((t) => "#" + t).join(" ")}`;
    const meta = el("div", {}, [metaText]);
    meta.style.fontSize = "12px";
    meta.style.opacity = "0.75";
    meta.style.marginTop = "6px";
    card.appendChild(meta);

    list.appendChild(card);
  });
}

async function loadDocs() {
  const status = document.getElementById("status");
  status.textContent = "Loading documents…";

  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    DOCS = Array.isArray(data.docs) ? data.docs : [];
    setCategoriesFromDocs();
    status.textContent = `Loaded ${DOCS.length} documents.`;
    draw();
  } catch (e) {
    status.textContent = "Failed to load documents. Check the API / permissions.";
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  baseLayout();

  const search = document.getElementById("search");
  const refresh = document.getElementById("refresh");

  search.addEventListener("input", draw);
  refresh.addEventListener("click", loadDocs);

  // Initial load
  await loadDocs();

  // Refresh whenever the app becomes visible again (works well on iOS / PWA)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      loadDocs();
    }
  });

  // Also refresh when the page is shown from the back/forward cache (iOS Safari)
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      loadDocs();
    }
  });
});
