// VyaparMarg Page-Aware Content Script for Government Portals

(function () {
  console.log("🌾 VyaparMarg Portal Assistant active on:", window.location.hostname);

  // Field guidance dictionaries for portal inputs
  const FIELD_GUIDES = {
    turnover: {
      labels: ["turnover", "उलाढाल", "टर्नओवर", "annual turnover", "gross sales"],
      tip_mr: "💡 व्यापारमार्ग टीप: मागील आर्थिक वर्षातील एकूण वार्षिक उलाढाल (GST किंवा ITR नुसार) भरा.",
      tip_en: "💡 VyaparMarg Tip: Enter annual gross turnover as per your ITR or GST returns.",
    },
    category: {
      labels: ["category", "प्रवर्ग", "जात", "caste", "social category"],
      tip_mr: "💡 व्यापारमार्ग टीप: ३५% अनुदानासाठी जात प्रमाणपत्र (Caste Certificate) आवश्यक आहे.",
      tip_en: "💡 VyaparMarg Tip: Select your category. SC/ST/OBC categories receive higher subsidy (up to 35%).",
    },
    udyam: {
      labels: ["udyam", "उद्यम", "registration no", "msme no"],
      tip_mr: "💡 व्यापारमार्ग टीप: UDYAM-MH-XX-XXXXXXX हा १२ अंकी नंबर भरा. हा उद्यम प्रमाणपत्राच्या शीर्षस्थानी असतो.",
      tip_en: "💡 VyaparMarg Tip: Enter 12-digit Udyam number found at top of your Udyam certificate.",
    },
    district: {
      labels: ["district", "जिल्हा", "district name"],
      tip_mr: "💡 व्यापारमार्ग टीप: उद्योग ज्या जिल्ह्यात स्थित आहे तो जिल्हा निवडा.",
      tip_en: "💡 VyaparMarg Tip: Select the district where your manufacturing/retail unit is physically located.",
    },
  };

  function highlightAndAttachTips() {
    const inputs = document.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      // Never touch sensitive fields
      if (
        input.type === "password" ||
        input.name?.toLowerCase().includes("otp") ||
        input.id?.toLowerCase().includes("captcha")
      ) {
        return;
      }

      const inputName = (input.name || input.id || input.placeholder || "").toLowerCase();
      const parentText = input.parentElement ? input.parentElement.innerText.toLowerCase() : "";

      for (const [key, guide] of Object.entries(FIELD_GUIDES)) {
        const matches = guide.labels.some((l) => inputName.includes(l) || parentText.includes(l));
        if (matches && !input.dataset.vyaparmargAttached) {
          input.dataset.vyaparmargAttached = "true";
          input.style.borderColor = "#10b981";
          input.style.borderWidth = "2px";

          // Add inline badge
          const badge = document.createElement("div");
          badge.className = "vyaparmarg-field-badge";
          badge.style.fontSize = "11px";
          badge.style.color = "#047857";
          badge.style.backgroundColor = "#ecfdf5";
          badge.style.padding = "3px 6px";
          badge.style.borderRadius = "4px";
          badge.style.marginTop = "3px";
          badge.style.display = "inline-block";
          badge.innerText = guide.tip_mr;

          input.parentElement?.appendChild(badge);
          break;
        }
      }
    });
  }

  // Safe user-confirmed autofill
  function handleSafeAutofill(profile, sendResponse) {
    const candidateFields = [];

    const inputs = document.querySelectorAll("input, select");
    inputs.forEach((input) => {
      if (
        input.type === "password" ||
        input.name?.toLowerCase().includes("otp") ||
        input.id?.toLowerCase().includes("captcha")
      ) {
        return;
      }

      const name = (input.name || input.id || "").toLowerCase();
      let matchedValue = null;
      let fieldLabel = "";

      if (name.includes("business") || name.includes("enterprise") || name.includes("unit_name")) {
        matchedValue = profile.business_name;
        fieldLabel = "Business Name";
      } else if (name.includes("district") || name.includes("jilha")) {
        matchedValue = profile.district;
        fieldLabel = "District";
      } else if (name.includes("turnover") || name.includes("sales")) {
        matchedValue = profile.annual_turnover;
        fieldLabel = "Annual Turnover";
      }

      if (matchedValue && !input.value) {
        candidateFields.push({ input, label: fieldLabel, value: matchedValue });
      }
    });

    if (candidateFields.length === 0) {
      sendResponse({ status: "no_matching_empty_fields" });
      return;
    }

    // Show floating confirmation modal
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.bottom = "20px";
    modal.style.right = "20px";
    modal.style.width = "320px";
    modal.style.backgroundColor = "#ffffff";
    modal.style.border = "2px solid #10b981";
    modal.style.borderRadius = "8px";
    modal.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
    modal.style.padding = "16px";
    modal.style.zIndex = "9999999";
    modal.style.fontFamily = "system-ui, sans-serif";

    modal.innerHTML = `
      <div style="font-weight: bold; color: #065f46; margin-bottom: 8px;">🌾 व्यापारमार्ग सुरक्षित ऑटो-फिल</div>
      <div style="font-size: 13px; color: #374151; margin-bottom: 12px;">
        खालील ${candidateFields.length} माहिती आपल्या सुरक्षित प्रोफाईलमधून भरू इच्छिता?
        <ul style="margin: 6px 0; padding-left: 20px;">
          ${candidateFields.map((f) => `<li><b>${f.label}:</b> ${f.value}</li>`).join("")}
        </ul>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="vyapar-cancel-btn" style="padding: 6px 12px; font-size: 12px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">रद्द करा</button>
        <button id="vyapar-confirm-btn" style="padding: 6px 12px; font-size: 12px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">होय, भरा</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("vyapar-confirm-btn").onclick = () => {
      candidateFields.forEach((item) => {
        item.input.value = item.value;
        item.input.dispatchEvent(new Event("input", { bubbles: true }));
        item.input.dispatchEvent(new Event("change", { bubbles: true }));
        item.input.style.backgroundColor = "#dcfce7";
      });
      modal.remove();
      sendResponse({ status: "autofilled", count: candidateFields.length });
    };

    document.getElementById("vyapar-cancel-btn").onclick = () => {
      modal.remove();
      sendResponse({ status: "cancelled_by_user" });
    };
  }

  // Listen for extension messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "TRIGGER_SAFE_AUTOFILL") {
      handleSafeAutofill(msg.profile || {}, sendResponse);
      return true;
    }
  });

  // Run on page load
  window.addEventListener("load", () => {
    setTimeout(highlightAndAttachTips, 1000);
  });
})();
