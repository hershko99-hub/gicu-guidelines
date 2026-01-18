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
  const desiredOrder = [
    "Guidelines",
    "Ventilation and Pulmonology",
    "Hematology",
    "Trauma",
    "Neuro",
    "Burns",
    "infectious diseases",
    "Toxicology",
    "GI and liver",
    "Endocrinology",
    "Surgery",
    "Nephro",
    "Other"
  ];

  const present = new Set(
    DOCS.map(d => (d.category || "").trim()).filter(Boolean)
  );

  // Keep your preferred order first
  const ordered = desiredOrder.filter(c => present.has(c));

  // Add any unexpected categories at the end
  const extras = Array.from(present).filter(c => !desiredOrder.includes(c)).sort((a,b)=>a.localeCompare(b));

  CATEGORIES = [...ordered, ...extras];
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

    if (d.summary) {
      const s = el("div", {}, [d.summary]);
      s.style.marginTop = "8px";
      s.style.opacity = "0.85";
      s.style.fontSize = "13px";
      card.appendChild(s);
    }

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

  await loadDocs();
});
