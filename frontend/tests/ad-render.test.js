const { JSDOM } = require("jsdom");

describe("Ad rendering behavior", () => {
  let dom, document, fetchMock;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><div id="ad"></div>`, {
      url: "http://localhost:8080",
    });
    document = dom.window.document;
    global.window = dom.window;
    global.document = document;

    fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            image: "test.jpg",
            destination: "https://example.com",
            ad_id: "ad-001",
          }),
      })
    );

    global.fetch = fetchMock;

    global.trackClick = jest.fn();
    global.renderAd = (data) => {
      const adEl = document.getElementById("ad");
      if (document.getElementById("adImage")) return;
      adEl.innerHTML = `<img id="adImage" src="${data.image}" />`;
      const img = document.getElementById("adImage");
      img.onerror = () => {
        adEl.innerHTML = `<div>Ad Unavailable</div>`;
      };
      img.onclick = () => trackClick(data.ad_id);
    };

    global.fetchAd = async () => {
      if (document.getElementById("adImage")) return;
      const res = await fetch("http://localhost:3000/api/ad");
      const data = await res.json();
      renderAd(data);
    };
  });

  it("renders the ad only once", async () => {
    await fetchAd();
    await fetchAd();
    const images = document.querySelectorAll("#adImage");
    expect(images.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders fallback when image fails", async () => {
    await fetchAd();
    const img = document.getElementById("adImage");
    img.onerror();
    expect(document.body.textContent).toContain("Ad Unavailable");
  });

  it("tracks click when ad is clicked", async () => {
    await fetchAd();
    const img = document.getElementById("adImage");
    img.click();
    expect(trackClick).toHaveBeenCalledWith("ad-001");
  });
});
