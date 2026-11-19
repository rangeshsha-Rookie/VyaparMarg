// VyaparMarg Extension Popup Controller

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const tabContents = {
    guide: document.getElementById("guideTab"),
    docs: document.getElementById("docsTab"),
    autofill: document.getElementById("autofillTab"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      Object.entries(tabContents).forEach(([key, el]) => {
        if (key === target) el.classList.remove("hidden");
        else el.classList.add("hidden");
      });
    });
  });

  // Query active tab context
  chrome.runtime.sendMessage({ action: "GET_ACTIVE_PORTAL_CONTEXT" }, (response) => {
    const portalNameEl = document.getElementById("portalName");
    const stepsListEl = document.getElementById("stepsList");

    if (!response || response.portal === "unknown") {
      portalNameEl.innerText = "सरकारी पोर्टल शोधत आहे...";
      return;
    }

    if (response.portal === "aaple-sarkar") {
      portalNameEl.innerText = "आपले सरकार पोर्टल सक्रिय (Aaple Sarkar)";
      stepsListEl.innerHTML = `
        <li>आधार प्रमाणीकरण द्वारे लॉगिन करा.</li>
        <li>महसूल विभाग किंवा उद्योग विभाग निवडा.</li>
        <li>अधिवास/जात प्रमाणपत्र अर्ज भरा.</li>
        <li>कागदपत्रे अपलोड करा व ₹२३.६० नाममात्र शुल्क भरा.</li>
      `;
    } else if (response.portal === "mahadbt") {
      portalNameEl.innerText = "महाडीबीटी शेतकरी पोर्टल सक्रिय (MahaDBT)";
      stepsListEl.innerHTML = `
        <li>७/१२ व ८-अ डिजिटल उतारा जोडा.</li>
        <li>कृषी प्रक्रिया किंवा यांत्रिकीकरण योजना निवडा.</li>
        <li>लॉटरी निवडीनंतर पूर्वसंमती पत्र (Pre-Sanction) मिळवा.</li>
      `;
    } else if (response.portal === "udyam") {
      portalNameEl.innerText = "उद्यम नोंदणी पोर्टल सक्रिय (Udyam)";
      stepsListEl.innerHTML = `
        <li>आधार व पॅन प्रमाणीकरण करा.</li>
        <li>व्यवसाय युनिट पत्ता व NIC कोड निवडा.</li>
        <li>मोफत उद्यम प्रमाणपत्र तात्काळ डाउनलोड करा.</li>
      `;
    } else if (response.portal === "pmegp" || response.portal === "cmegp") {
      portalNameEl.innerText = "CMEGP / PMEGP अनुदान पोर्टल सक्रिय";
      stepsListEl.innerHTML = `
        <li>नवीन युनिट (New Unit) अर्ज निवडा.</li>
        <li>३५% मार्जिन मनी अनुदानासाठी प्रकल्प अहवाल (DPR) जोडा.</li>
        <li>जिल्हा उद्योग केंद्र (DIC) बँक मंजुरी प्रक्रिया ट्रॅक करा.</li>
      `;
    }
  });

  // Safe autofill trigger
  const autofillBtn = document.getElementById("autofillBtn");
  const autofillStatus = document.getElementById("autofillStatus");

  autofillBtn.addEventListener("click", () => {
    autofillStatus.innerText = "पृष्ठावरील फॉर्म तपासत आहे...";

    const sampleProfile = {
      business_name: "श्री स्वामी समर्थ ॲग्रो प्रॉडक्ट्स",
      district: "कोल्हापूर (Kolhapur)",
      annual_turnover: "2500000",
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (!activeTabId) {
        autofillStatus.innerText = "सक्रिय टॅब सापडला नाही.";
        return;
      }

      chrome.tabs.sendMessage(
        activeTabId,
        { action: "TRIGGER_SAFE_AUTOFILL", profile: sampleProfile },
        (res) => {
          if (chrome.runtime.lastError) {
            autofillStatus.innerText = "कृपया हे सरकारी पोर्टल पेज रीफ्रेश करा.";
            return;
          }
          if (res?.status === "autofilled") {
            autofillStatus.innerText = `यशस्वी! ${res.count} माहिती भरली गेली.`;
          } else if (res?.status === "cancelled_by_user") {
            autofillStatus.innerText = "वापरकर्त्याने ऑटो-फिल रद्द केले.";
          } else {
            autofillStatus.innerText = "या पानावर जुळणारे रिकामे इनपुट आढळले नाही.";
          }
        }
      );
    });
  });
});
