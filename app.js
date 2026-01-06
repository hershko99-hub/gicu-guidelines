document.addEventListener("DOMContentLoaded", () => {
  const categories = [
    "Infection Prevention",
    "Airway Management",
    "Burn Management",
    "Antibiotics",
    "Blood Products in ICU",
    "TBI Management",
    "ARDS Management",
    "Sepsis Management"
  ];

  const docs = [
    {
      title: "Burns protocol (English) 12.2023",
      category: "Burn Management",
      tags: ["burns", "fluid", "resuscitation"],
      url: "https://drive.google.com/file/d/1BNXXV3rl-A5yPDQrbUcj7PnvtcRsCq0g/preview"
    },
    {
      title: "Altered Airway Guidance for Adults (March 2025)",
      category: "Airway Management",
      tags: ["airway", "intubation", "difficult airway"],
      url: "https://drive.google.com/file/d/1kFwpGov_dFIKxVVCyWrNDk_QsabSIlic/preview"
    },
    {
      title: "Vancomycin dosing and monitoring – MRSA (2025)",
      category: "Antibiotics",
      tags: ["vancomycin", "mrsa", "antibiotics"],
      url: "https://drive.google.com/file/d/1FRszP8C78MY04fuV41KbWMsIBqzlnMmI/preview"
    }
  ];

  let selectedCategory = "All";
  let searchQuery = "";

  document.body.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
  document.body.style.maxWidth = "980px";
  document.body.style.margin = "0 auto";
  document.body.style.padding = "16px";

  document.body.innerHTML = `
    <header style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
      <div>
        <h1 style="margin:0">Hadassah GICU Guidelines</h1>
        <div style="opacity:.7; font-size:13px; margin-top:4px;">Drive-hosted PDFs • MVP</div>
      </div>
    </header>

    <div style="margin-top:16px;">
      <input id="search" placeholder="Search title or tags…" 
        style="width:100%; padding:10px; border:1px solid #ddd; border-radius:10px; font-size:16px;" />
    </div>

    <div id="pills" style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;"></div>

    <div id="list" style="margin-top:18px;"></div>
  `;

  const pillsEl = document.getElementById("pills");
  const listEl = document.getElementById("list");
  const searchEl = document.getElementById("search");

  function makePill(text) {
    const span = document.createElement("span");
    const active = selectedCategory === text;
    span.textContent = text;
    span.style.padding = "6px 10px";
    span.style.borderRadius = "999px";
    span.style.border = active ? "2px solid #111" : "1px solid #ddd";
    span.style.cursor = "pointer";
    span.style.userSelect = "none";
    span.onclick = () => {
      selectedCategory = text;
      render();
    };
    return span;
  }

  function matches(doc) {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const inTitle = doc.title.toLowerCase().includes(q);
    const inTags = (doc.tags || []).some(t => t.toLowerCase().includes(q));
    return inTitle || inTags;
  }

  function render() {
    // pills
    pillsEl.innerHTML = "";
    pillsEl.appendChild(makePill("All"));
    categories.forEach(c => pillsEl.appendChild(makePill(c)));

    // list
    listEl.innerHTML = "";

    const filtered = docs
      .filter(d => selectedCategory === "All" || d.category === selectedCategory)
      .filter(matches);

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.style.opacity = "0.7";
      empty.textContent = "No documents found.";
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach(d => {
      const card = document.createElement("div");
      card.style.border = "1px solid #e5e5e5";
      card.style.borderRadius = "12px";
      card.style.padding = "12px";
      card.style.marginTop = "10px";
      card.style.cursor = "pointer";
      card.style.background = "white";
      card.onclick = () => window.open(d.url, "_blank");

      const title = document.createElement("div");
      title.innerHTML = `📄 <strong>${d.title}</strong>`;
      card.appendChild(title);

      const meta = document.createElement("div");
      meta.style.opacity = "0.75";
      meta.style.fontSize = "12px";
      meta.style.marginTop = "6px";
      meta.textContent = `${d.category} • ${(d.tags || []).map(t => "#" + t).join(" ")}`;
      card.appendChild(meta);

      listEl.appendChild(card);
    });
  }

  searchEl.addEventListener("input", () => {
    searchQuery = searchEl.value;
    render();
  });

  render();
});
