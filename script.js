// ======================= RODYTI 1 AUKŠTĄ START'E =======================
document.addEventListener("DOMContentLoaded", () => {
    // Rodyti pirmą aukštą
    document.querySelector(".pirmas-aukstas").style.display = "block";

    const mygtukai = document.querySelectorAll(".aukstas-btn");
    const aukstai = document.querySelectorAll(".pirmas-aukstas, .antras-aukstas, .trecias-aukstas");

    // nustatom ACTIVE pirmam mygtukui
    if (mygtukai[0]) mygtukai[0].classList.add("active");

    mygtukai.forEach(btn => {
        btn.addEventListener("click", () => {
            const aukstas = btn.dataset.aukstas;
            aukstai.forEach(a => a.style.display = "none");
            document.querySelector("." + aukstas).style.display = "block";

            mygtukai.forEach(m => m.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // ======================= FETCH CONFIG =======================
    let people = [];
    let lastKabId = null;

    fetch("config.json")
      .then(res => res.json())
      .then(cfg => {

        cfg.kabinetai.forEach(k => {
            let el = document.getElementById(k.id);
            if (el) { el.textContent = k.kabinetas; return; }

            el = document.querySelector(".kabinetas" + k.id);
            if (el) {
                const span = el.querySelector("span[id]");
                if (span) span.textContent = k.kabinetas;
            }
        });

        // -------- 2) Paspaudus ant kabineto plane --------
        document.querySelectorAll(".kabinetas").forEach(kab => {
            kab.addEventListener("click", () => {
                let id = kab.dataset.id || kab.id || kab.querySelector("span")?.dataset.id;
                if (!id) return;

                const info = cfg.info.find(i => String(i.id) === String(id));
                const kabPavad = kab.textContent.trim();

                document.getElementById("infoKabinetas").textContent = kabPavad || " ";
                document.getElementById("infoPareigos").textContent = info?.pareigos || " ";
                document.getElementById("infoVardas").textContent = info?.vardas_pavarde || " ";
                document.getElementById("infoDelKo").textContent = info?.del_ko_kreiptis?.join("\n") || " ";

                document.getElementById("info").style.display = "block";

                highlightKabinetas(id);
            });
        });

        // ====================== 3) SEARCH SISTEMA ======================
        const search = document.getElementById("search");
        const searchList = document.getElementById("search-list");

        people = cfg.info.map(i => ({
            id: i.id,
            vardas_pavarde: i.vardas_pavarde,
            pareigos: i.pareigos,
            del_ko_kreiptis: i.del_ko_kreiptis || []
        })).sort((a, b) => (a.vardas_pavarde || "").localeCompare(b.vardas_pavarde || ""));

        function renderFullList() {
            searchList.innerHTML = "";
            people.forEach(p => {
                const div = document.createElement("div");
                div.className = "search-item";
                div.innerHTML = `<div class="pareigos">${p.pareigos}</div><div class="vardas">${p.vardas_pavarde}</div>`;
                div.onclick = () => {
                    pickPerson(p.id);
                    search.value = p.vardas_pavarde;
                };
                searchList.appendChild(div);
            });
        }

        renderFullList();

search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    let filtered = people.filter(p =>
        (p.vardas_pavarde?.toLowerCase().includes(q)) ||
        (p.pareigos?.toLowerCase().includes(q))
    );

    // Pirmiausia tie, kurie turi vardą ir pareigas
    filtered.sort((a, b) => {
        const aComplete = a.vardas_pavarde && a.pareigos ? 1 : 0;
        const bComplete = b.vardas_pavarde && b.pareigos ? 1 : 0;
        return bComplete - aComplete; // didesnis pirmiau
    });

    searchList.innerHTML = "";
    filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "search-item";
        div.innerHTML = `<div class="pareigos">${p.pareigos}</div><div class="vardas">${p.vardas_pavarde}</div>`;
        div.onclick = () => {
            pickPerson(p.id);
            search.value = p.vardas_pavarde;
        };
        searchList.appendChild(div);
    });
});


        // ======================= 4) Pasirinkus žmogų =======================
        function pickPerson(id) {
            const kab = cfg.kabinetai.find(k => String(k.id) === String(id));
            const info = cfg.info.find(i => String(i.id) === String(id));

            if (!info) { alert("Tokio žmogaus informacijos nėra."); return; }
            if (!kab) { alert("Šiam žmogui nepriskirtas kabinetas."); return; }

            document.getElementById("infoKabinetas").textContent = kab.kabinetas;
            document.getElementById("infoPareigos").textContent = info.pareigos;
            document.getElementById("infoVardas").textContent = info.vardas_pavarde;
            document.getElementById("infoDelKo").textContent = info.del_ko_kreiptis.join("\n");
            document.getElementById("info").style.display = "block";

            highlightKabinetas(kab.id);
        }

        // ======================= 5) Highlight kabinetą + aukštą =======================
        function highlightKabinetas(id) {
            lastKabId = id;
            document.querySelectorAll(".kabinetas").forEach(k => k.classList.remove("active-kabinetas"));
            const el = document.querySelector(".kabinetas" + id);
            if (!el) return;
            el.classList.add("active-kabinetas");

            let aukstas =
                el.closest(".pirmas-aukstas") ? "pirmas-aukstas" :
                el.closest(".antras-aukstas") ? "antras-aukstas" :
                "trecias-aukstas";

            aukstai.forEach(a => a.style.display = "none");
            document.querySelector("." + aukstas).style.display = "block";
        }

        // ======================= 6) Garsai =======================
        document.querySelector(".speaker").addEventListener("click", () => {
            if (!lastKabId) { alert("Pirmiausia pasirink kabinetą plane arba iš sąrašo."); return; }
            const audio = document.getElementById("audioPlayer");
            const newSrc = `audio/${lastKabId}.m4a`;
            if (audio.src.includes(newSrc)) {
                audio.paused ? audio.play() : audio.pause();
                return;
            }
            audio.src = newSrc;
            audio.play().catch(() => { alert("Šiam kabinetui garsas nepridėtas."); });
        });

        // ======================= 7) Automatinis planų scaling =======================
        const planas = document.querySelector(".mokyklos-planas");

        function scalePlanas() {
            if (!planas) return;
            const screenWidth = window.innerWidth;
            const originalWidth = 730.3; // tavo plano width
            let scale = Math.min(screenWidth / originalWidth, 1); // max 1
            planas.style.transform = `scale(${scale})`;
        }

        window.addEventListener("resize", () => {
            scalePlanas();
            syncHeightToWidth();
        });

        scalePlanas();
        syncHeightToWidth();

    }); // fetch end
}); // DOMContentLoaded end

// ================= MOBILE MENU TOGGLE =================
const mobileBtn = document.getElementById("mobileMenuBtn");
const sarasas = document.querySelector(".saraso-container");

if (mobileBtn && sarasas) {
  mobileBtn.addEventListener("click", () => {
    sarasas.classList.toggle("active");
    mobileBtn.classList.toggle("active"); // pajudina mygtuką 50% į dešinę
  });
}

// ================= SYNC SEARCH HEIGHT =================
function syncHeightToWidth() {
  const planas = document.querySelector(".mokyklos-planas");
  const sarasas = document.querySelector(".saraso-container");

  if (planas && sarasas) {
    // gauname realų matomą width po transform
    const planRect = planas.getBoundingClientRect();
    const realWidth = planRect.width;
    const realHeight = planRect.height;

    // padarome saraso container tokio pat height kaip plano height
    sarasas.style.height = realHeight + "px";
  }
}

window.addEventListener("load", syncHeightToWidth);
window.addEventListener("resize", () => {
  scalePlanas();     // tavo scaling funkcija
  syncHeightToWidth();
});

function syncHeightToPlanas() {
  const planas = document.querySelector(".mokyklos-planas");
  const sarasas = document.querySelector(".saraso-container");

  if (planas && sarasas) {
    const rect = planas.getBoundingClientRect();
    sarasas.style.height = rect.height + "px";
  }
}

// Iškviečiame po plano scaling
window.addEventListener("resize", () => {
  scalePlanas();
  syncHeightToPlanas();
});
window.addEventListener("load", () => {
  scalePlanas();
  syncHeightToPlanas();
});


let currentScale = 1;
const minScale = 0.5;
const maxScale = 2;
const planas = document.querySelector(".mokyklos-planas");

// Mobilioji scaling funkcija
function scalePlanasMobile(delta = 0) {
    currentScale += delta;
    currentScale = Math.min(Math.max(currentScale, minScale), maxScale);
    planas.style.transform = `scale(${currentScale})`;
    syncHeightToPlanas();
}

// Prisitaikymas prie lango
function initMobileScale() {
    if (window.innerWidth <= 768) {
        // +/- mygtukai
        const plusBtn = document.getElementById("zoomIn");
        const minusBtn = document.getElementById("zoomOut");

        plusBtn?.addEventListener("click", () => scalePlanasMobile(0.1));
        minusBtn?.addEventListener("click", () => scalePlanasMobile(-0.1));

        // Touch events – pinch gesture
        let initialDistance = null;
        planas.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialDistance = Math.hypot(dx, dy);
            }
        });

        planas.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && initialDistance) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const newDistance = Math.hypot(dx, dy);
                const scaleChange = (newDistance - initialDistance) / 300; // jautrumas
                scalePlanasMobile(scaleChange);
                initialDistance = newDistance;
                e.preventDefault();
            }
        });
    }
}

window.addEventListener("load", initMobileScale);
window.addEventListener("resize", initMobileScale);

const plusBtn = document.getElementById("zoomIn");
const minusBtn = document.getElementById("zoomOut");

plusBtn?.addEventListener("click", () => scalePlanasMobile(0.1));
minusBtn?.addEventListener("click", () => scalePlanasMobile(-0.1));




