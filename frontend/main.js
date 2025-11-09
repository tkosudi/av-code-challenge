// main.js - Contains intentional bug: duplicate request issue that candidate should fix
let adLoaded = false;
let adData = null;

// Make adData globally accessible to allow duplicate scripts to access it
if (!window.adData) {
  window.adData = null;
}

async function fetchAd() {
  if (window.adData) {
    // Ad already loaded by another script instance - still add click listener (duplicate)
    const existingImg = document.getElementById('adImage');
    if (existingImg) {
      existingImg.addEventListener('click', async () => {
        await trackClick(window.adData.ad_id);
        if (window.adData.destination) {
          window.open(window.adData.destination, '_blank');
        }
      });
    }
    return;
  }
  
  try {
    const res = await fetch('http://localhost:3000/api/ad');
    adData = await res.json();
    window.adData = adData; // Store globally for duplicate scripts
    const adElement = document.getElementById('ad');
    adElement.innerHTML = `<img id="adImage" src="${adData.image}" width="300" height="250" alt="ad" style="cursor:pointer;" />`;
    
    // Register click event on ad image
    document.getElementById('adImage').addEventListener('click', async () => {
      await trackClick(adData.ad_id);
      if (adData.destination) {
        window.open(adData.destination, '_blank');
      }
    });
  } catch (err) {
    console.error('Error loading ad:', err);
    document.getElementById('ad').innerHTML = '<p style="color:red">Error loading ad</p>';
  }
}

async function trackClick(adId) {
  try {
    await fetch('http://localhost:3000/api/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ad_id: adId,
        user_agent: navigator.userAgent,
        ip_address: null // Browser can't get real IP, but API will use request IP
      })
    });
  } catch (err) {
    console.error('Error tracking click:', err);
  }
}

function redirectToDestination(destination) {
  window.location.href = destination;
}

document.addEventListener('DOMContentLoaded', () => {
  
  document.getElementById('loadAd').addEventListener('click', redirectToDestination);
});
window.onload = fetchAd; // Intentionally duplicating call - candidate should fix
