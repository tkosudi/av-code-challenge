const API_BASE = "http://localhost:3000/api";
let adData = window.adData || null;

async function fetchAd() {
  if (document.getElementById("adImage")) return;
  if (adData) return renderAd(adData);

  try {
    const res = await fetch(`${API_BASE}/ad`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    adData = await res.json();
    window.adData = adData;

    renderAd(adData);
  } catch (err) {
    console.error("Error loading ad:", err);
    document.getElementById("ad").innerHTML =
      '<p style="color:red">Error loading ad</p>';
  }
}

function renderAd(data) {
  const adEl = document.getElementById("ad");

  if (document.getElementById("adImage")) return;

  adEl.innerHTML = `<img id="adImage" src="${data.image}" width="300" height="250" alt="ad" style="cursor:pointer;" />`;

  const img = document.getElementById("adImage");

  img.onerror = () => {
    adEl.innerHTML = `<div style="width:300px;height:250px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center">Ad</div>`;
  };

  img.onclick = async () => {
    await trackClick(data.ad_id);
    if (data.destination) window.open(data.destination, "_blank");
  };
}

async function trackClick(adId) {
  try {
    await fetch(`${API_BASE}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        ad_id: adId,
        user_agent: navigator.userAgent,
        ip_address: null,
      }),
    });
  } catch (err) {
    console.error("Error tracking click:", err);
  }
}

document.addEventListener("DOMContentLoaded", fetchAd);
