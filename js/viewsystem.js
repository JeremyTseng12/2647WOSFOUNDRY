/* ============================================================
   兵工廠人員檢視系統 - 核心業務邏輯 v3.0 (viewsystem.js)
   依賴：需先載入 js/i18n.js
   ============================================================ */

const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbz-nozNOlqqn3EmBwjDNU_vPkpf6lPiM2RYWFpQ82pd8GCHv-p9Tov4UaWgkrCEleL6/exec";

let historyList = [];
let currentRecord = null;
let currentLegion = "LegionA";
let currentUIClassLang = "zht";
let currentCopyLang = "zht";
let pendingHistoryIndex = null;

// 1. 開場動畫與初始化啟動 (已移除系統狀態檢查與跑馬燈啟動)
window.addEventListener("load", function () {
  setTimeout(() => {
    const intro = document.getElementById("intro");
    const mainContent = document.getElementById("main-content");

    if (intro) intro.style.display = "none";
    if (mainContent) {
      mainContent.style.display = "block";
      setTimeout(() => {
        mainContent.style.opacity = "1";
      }, 50);
    }
  }, 2200);

  checkHashtagLegion();
  fetchHistoryList();
});

function checkHashtagLegion() {
  const hash = window.location.hash.toLowerCase();
  if (
    hash.includes("legion2") ||
    hash.includes("legionb") ||
    hash.includes("legion-2") ||
    hash === "#l2"
  ) {
    currentLegion = "LegionB";
  } else {
    currentLegion = "LegionA";
  }
}

function toggleAccordionGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) {
    group.classList.toggle("closed");
  }
}

window.addEventListener("hashchange", () => {
  checkHashtagLegion();
  if (currentRecord) {
    switchLegion(currentLegion);
  }
});

window.addEventListener("resize", () => {
  if (currentRecord) {
    renderViewer();
  }
});

// 2. 抓取雲端歷史紀錄選單 (自動過濾軟刪除)
function fetchHistoryList() {
  if (!GAS_WEB_APP_URL) {
    alert("請在腳本中設定 GAS_WEB_APP_URL！");
    return;
  }

  fetch(`${GAS_WEB_APP_URL}?action=getHistory&t=${new Date().getTime()}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "empty" || !res.history || res.history.length === 0) {
        document.getElementById("loadingScreen").style.display = "none";
        alert("目前試算表中尚無發布的紀錄！");
        return;
      }

      const mergedHistoryMap = {};

      res.history.forEach((item) => {
        const titleKey = (item.title || "未命名分配結果").trim();
        if (!mergedHistoryMap[titleKey]) {
          mergedHistoryMap[titleKey] = {
            title: item.title,
            author: item.author,
            updateTime: item.updateTime,
            hasPasscode: item.hasPasscode,
            rowIndices: [item.rowIndex],
            authors: [item.author],
          };
        } else {
          mergedHistoryMap[titleKey].rowIndices.push(item.rowIndex);
          if (item.author) mergedHistoryMap[titleKey].authors.push(item.author);
          if (item.hasPasscode) mergedHistoryMap[titleKey].hasPasscode = true;
        }
      });

      historyList = Object.values(mergedHistoryMap);

      const select = document.getElementById("historySelect");
      select.innerHTML = "";
      for (let i = historyList.length - 1; i >= 0; i--) {
        const item = historyList[i];
        const option = document.createElement("option");
        option.value = i;
        const lockIcon = item.hasPasscode ? "🔒 " : "";
        const legionCountText = item.rowIndices.length > 1 ? " [雙軍團]" : "";
        const displayAuthors = [...new Set(item.authors)].join(" & ");
        option.innerText = `${lockIcon} ${item.title}${legionCountText} (By ${displayAuthors})`;
        select.appendChild(option);
      }

      const latestIndex = historyList.length - 1;
      select.value = latestIndex;
      loadDetailDataByIndex(latestIndex);
    })
    .catch((err) => {
      console.error("讀取選單失敗：", err);
      document.getElementById("loadingScreen").style.display = "none";
      alert("讀取失敗，請確認 GAS URL 是否設定正確。");
    });
}

function onSelectHistoryChange() {
  const select = document.getElementById("historySelect");
  const selectedIndex = parseInt(select.value);
  loadDetailDataByIndex(selectedIndex);
}

// 3. 讀取指定紀錄內容
function loadDetailDataByIndex(historyIndex, passcode = "") {
  const targetGroup = historyList[historyIndex];
  if (!targetGroup) return;

  pendingHistoryIndex = historyIndex;

  const fetchPromises = targetGroup.rowIndices.map((rIndex) => {
    let url = `${GAS_WEB_APP_URL}?action=getHistory&rowIndex=${rIndex}&t=${new Date().getTime()}`;
    if (passcode) url += `&passcode=${encodeURIComponent(passcode)}`;
    return fetch(url).then((res) => res.json());
  });

  Promise.all(fetchPromises)
    .then((results) => {
      const isLocked = results.some((res) => res.status === "locked");
      if (isLocked) {
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("passcodeModal").style.display = "flex";
        document.getElementById("inputPasscode").value = "";
        document.getElementById("inputPasscode").focus();
        return;
      }

      closePasscodeModal();

      const combinedRecord = {
        title: targetGroup.title,
        author: targetGroup.author,
        updateTime: targetGroup.updateTime,
        rowIndex: targetGroup.rowIndices[0],
        payload: {
          reactions: { heart: 0, angry: 0 },
          legionAuthors: {
            LegionA: targetGroup.author,
            LegionB: targetGroup.author,
          },
          legions: {
            LegionA: {},
            LegionB: {},
          },
        },
      };

      results.forEach((res) => {
        if (res.status === "success" && res.payload) {
          const p = res.payload;

          if (p.reactions) {
            combinedRecord.payload.reactions.heart += p.reactions.heart || 0;
            combinedRecord.payload.reactions.angry += p.reactions.angry || 0;
          }

          if (p.legions) {
            if (
              p.legions.LegionA &&
              Object.keys(p.legions.LegionA).length > 0
            ) {
              combinedRecord.payload.legions.LegionA = p.legions.LegionA;
              if (res.author)
                combinedRecord.payload.legionAuthors.LegionA = res.author;
            }
            if (
              p.legions.LegionB &&
              Object.keys(p.legions.LegionB).length > 0
            ) {
              combinedRecord.payload.legions.LegionB = p.legions.LegionB;
              if (res.author)
                combinedRecord.payload.legionAuthors.LegionB = res.author;
            }
          } else {
            combinedRecord.payload.legions.LegionA = p;
            if (res.author)
              combinedRecord.payload.legionAuthors.LegionA = res.author;
          }
        }
      });

      currentRecord = combinedRecord;

      document.getElementById("loadingScreen").style.display = "none";
      document.getElementById("contentSection").style.display = "block";

      switchLegion(currentLegion);
    })
    .catch((err) => {
      console.error("載入詳細資料失敗：", err);
      document.getElementById("loadingScreen").style.display = "none";
      alert("讀取資料失敗，請重新整理頁面！");
    });
}

function verifyAndLoadData() {
  const pwd = document.getElementById("inputPasscode").value.trim();
  if (!pwd) {
    alert("請輸入密碼！");
    return;
  }
  loadDetailDataByIndex(pendingHistoryIndex, pwd);
}

function closePasscodeModal() {
  document.getElementById("passcodeModal").style.display = "none";
}

function switchLegion(legionKey) {
  currentLegion = legionKey;
  if (legionKey === "LegionA") {
    document.getElementById("btnLegionA").classList.add("active");
    document.getElementById("btnLegionB").classList.remove("active");
  } else {
    document.getElementById("btnLegionB").classList.add("active");
    document.getElementById("btnLegionA").classList.remove("active");
  }
  renderViewer();
}

function changeLanguage(lang) {
  currentUIClassLang = lang;
  const p = langPack[lang];

  if (lang === "zht") {
    document.getElementById("btnLangZht").classList.add("active");
    document.getElementById("btnLangEn").classList.remove("active");
    document.body.classList.remove("lang-en");
  } else {
    document.getElementById("btnLangEn").classList.add("active");
    document.getElementById("btnLangZht").classList.remove("active");
    document.body.classList.add("lang-en");
  }

  document.getElementById("introText").innerText = p.introText;
  renderViewer();
}

// 4. 表情回覆 (LocalStorage 快取)
function getSafeLocalReaction(title) {
  try {
    return localStorage.getItem(`reacted_${title}`);
  } catch (e) {
    return null;
  }
}

function setSafeLocalReaction(title, type) {
  try {
    localStorage.setItem(`reacted_${title}`, type);
  } catch (e) {
    console.warn("localStorage 存取受限（無痕模式）：", e);
  }
}

function sendReaction(type) {
  if (!currentRecord || !currentRecord.rowIndex || !currentRecord.title) return;

  const title = currentRecord.title;
  const previousReaction = getSafeLocalReaction(title);

  if (previousReaction) {
    const typeEmoji = previousReaction === "heart" ? "❤️" : "😡";
    alert(`您已經對「${title}」給過 ${typeEmoji} 的回覆囉！`);
    return;
  }

  setSafeLocalReaction(title, type);

  if (!currentRecord.payload) currentRecord.payload = {};
  if (!currentRecord.payload.reactions) {
    currentRecord.payload.reactions = { heart: 0, angry: 0 };
  }

  if (type === "heart") {
    currentRecord.payload.reactions.heart =
      (currentRecord.payload.reactions.heart || 0) + 1;
  } else if (type === "angry") {
    currentRecord.payload.reactions.angry =
      (currentRecord.payload.reactions.angry || 0) + 1;
  }

  updateReactionsUI(currentRecord.payload.reactions);

  const payload = {
    action: "reaction",
    rowIndex: currentRecord.rowIndex,
    reactionType: type,
  };

  fetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success" && data.reactions) {
        currentRecord.payload.reactions = data.reactions;
        updateReactionsUI(data.reactions);
      }
    })
    .catch((err) => {
      console.error("背景同步表情失敗：", err);
      try {
        localStorage.removeItem(`reacted_${title}`);
      } catch (e) {}
      if (type === "heart") currentRecord.payload.reactions.heart--;
      if (type === "angry") currentRecord.payload.reactions.angry--;
      updateReactionsUI(currentRecord.payload.reactions);
      alert("網路連線失敗，點讚未能同步至雲端。");
    });
}

function updateReactionsUI(reactions) {
  const heartCount = reactions ? reactions.heart || 0 : 0;
  const angryCount = reactions ? reactions.angry || 0 : 0;

  const elHeart = document.getElementById("countHeart");
  const elAngry = document.getElementById("countAngry");
  if (elHeart) elHeart.innerText = heartCount;
  if (elAngry) elAngry.innerText = angryCount;

  const btnHeart = document.getElementById("btnHeart");
  const btnAngry = document.getElementById("btnAngry");

  if (btnHeart) btnHeart.classList.remove("reacted");
  if (btnAngry) btnAngry.classList.remove("reacted");

  if (currentRecord && currentRecord.title) {
    const userReaction = getSafeLocalReaction(currentRecord.title);
    if (userReaction === "heart" && btnHeart) {
      btnHeart.classList.add("reacted");
    } else if (userReaction === "angry" && btnAngry) {
      btnAngry.classList.add("reacted");
    }
  }
}

// 5. 渲染看板卡片與主畫面
function createViewerBuildingCard(b, lang, p) {
  const card = document.createElement("div");
  card.className = `building-card b-group-${b.gIdx}`;

  let bPower = 0;
  let pTagsHtml = "";
  const list = p.buildings ? p.buildings[b.id] || [] : [];

  list.forEach((player) => {
    bPower += player.power || 0;
    let roleClass = "";
    let roleLabel = "";
    if (player.isLeader) {
      roleClass = "is-leader";
      roleLabel = `<span class="tag-leader-label">${lang.leaderTag}</span>`;
    } else if (player.isVice) {
      roleClass = "is-vice";
      roleLabel = `<span class="tag-vice-label">${lang.viceTag}</span>`;
    }

    pTagsHtml += `
      <div class="player-tag ${roleClass}">
        <span>${roleLabel}${player.name}</span>
        <strong style="color:var(--text-neon); font-family: 'Share Tech Mono';">${player.power || ""}</strong>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="building-title">${currentUIClassLang === "en" ? b.nameEn : b.nameZht}</div>
    <div class="building-power">${lang.buildingPower}<strong>${bPower.toLocaleString()}</strong></div>
    <div class="drop-zone">${pTagsHtml}</div>
  `;
  return card;
}

function renderViewer() {
  if (!currentRecord) return;

  const record = currentRecord;
  const payload = record.payload || {};
  const lang = langPack[currentUIClassLang];

  document.getElementById("uiSelectLabel").innerText = lang.selectLabel;
  document.getElementById("uiMetaAuthorLabel").innerText = lang.metaAuthor;
  document.getElementById("uiMetaTimeLabel").innerText = lang.metaTime;
  document.getElementById("uiCopyTitle").innerText = lang.copyTitle;
  document.getElementById("btnCopyText").innerText = lang.btnCopyText;
  document.getElementById("uiTweakTitle").innerText = lang.tweakTitle;

  document.getElementById("viewTitle").innerText =
    record.title || "兵工廠人員分配";

  let currentAuthor = record.author || "指揮官";
  if (payload.legionAuthors && payload.legionAuthors[currentLegion]) {
    currentAuthor = payload.legionAuthors[currentLegion];
  }
  document.getElementById("viewAuthor").innerText = currentAuthor;
  document.getElementById("viewTime").innerText = record.updateTime || "";

  let p = payload;
  if (payload.legions && payload.legions[currentLegion]) {
    p = payload.legions[currentLegion];
  }

  document.getElementById("summaryBox").innerHTML = `
    <p>${lang.summaryText[0]} <strong>${p.summary ? p.summary.totalPeople : 0}</strong></p>
    <p>${lang.summaryText[1]} <strong>${p.summary ? p.summary.totalPower.toLocaleString() : 0}</strong></p>
    <p>${lang.summaryText[2]} <strong>${p.summary ? p.summary.avgPower.toLocaleString() : 0}</strong></p>
    <div>
      <p style="margin:0 0 6px 0; font-size:0.85rem; color:#94a3b8; font-weight:700;">表情回覆</p>
      <div class="reaction-group">
        <button id="btnHeart" class="btn-reaction" onclick="sendReaction('heart')">
          <span class="emoji">❤️</span>
          <span id="countHeart" class="reaction-count">0</span>
        </button>
        <button id="btnAngry" class="btn-reaction" onclick="sendReaction('angry')">
          <span class="emoji">😡</span>
          <span id="countAngry" class="reaction-count">0</span>
        </button>
      </div>
    </div>
  `;

  updateReactionsUI(payload.reactions);

  const grid = document.getElementById("buildingGrid");
  grid.innerHTML = "";

  const isMobileView = window.innerWidth <= 1200;

  const gatherCard = document.createElement("div");
  gatherCard.className = "building-card b-group-spec";
  let gatherArr = p.manualGatherText ? p.manualGatherText.split("\n") : [];
  let gatherTags = gatherArr
    .map((name) =>
      name.trim()
        ? `<div class="player-tag"><span>⚡ ${name.trim()}</span></div>`
        : "",
    )
    .join("");
  gatherCard.innerHTML = `
    <div class="building-title">${lang.specTitleGather}</div>
    <div class="building-power">${currentUIClassLang === "en" ? lang.specPowerLabel : lang.specLabelGather}</div>
    <div class="drop-zone">${gatherTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentUIClassLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
  `;

  const ammoCard = document.createElement("div");
  ammoCard.className = "building-card b-group-spec";
  let ammoArr = p.manualAmmoText ? p.manualAmmoText.split("\n") : [];
  let ammoTags = ammoArr
    .map((name) =>
      name.trim()
        ? `<div class="player-tag" style="border-color:#ff3838;"><span>🎒 ${name.trim()}</span></div>`
        : "",
    )
    .join("");
  ammoCard.innerHTML = `
    <div class="building-title">${lang.specTitleAmmo}</div>
    <div class="building-power">${currentUIClassLang === "en" ? lang.specPowerLabelAmmo : lang.specLabelAmmo}</div>
    <div class="drop-zone">${ammoTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentUIClassLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
  `;

  if (isMobileView) {
    for (let g = 0; g < 4; g++) {
      const groupWrap = document.createElement("div");
      groupWrap.className = "accordion-group";
      groupWrap.id = `viewAccGroup_${g}`;

      const header = document.createElement("div");
      header.className = "accordion-header";
      header.onclick = () => toggleAccordionGroup(`viewAccGroup_${g}`);
      header.innerHTML = `
        <span>▼ ${lang.groupTitles[g]}</span>
        <span class="accordion-icon">▲</span>
      `;

      const body = document.createElement("div");
      body.className = "accordion-body";

      const b1 = buildingsConfig[g * 2];
      const b2 = buildingsConfig[g * 2 + 1];

      body.appendChild(createViewerBuildingCard(b1, lang, p));
      body.appendChild(createViewerBuildingCard(b2, lang, p));

      groupWrap.appendChild(header);
      groupWrap.appendChild(body);
      grid.appendChild(groupWrap);
    }

    const specWrap = document.createElement("div");
    specWrap.className = "accordion-group";
    specWrap.id = "viewAccGroup_spec";

    const specHeader = document.createElement("div");
    specHeader.className = "accordion-header";
    specHeader.onclick = () => toggleAccordionGroup("viewAccGroup_spec");
    specHeader.innerHTML = `
      <span>▼ ${lang.groupTitles[4]}</span>
      <span class="accordion-icon">▲</span>
    `;

    const specBody = document.createElement("div");
    specBody.className = "accordion-body";
    specBody.appendChild(gatherCard);
    specBody.appendChild(ammoCard);

    specWrap.appendChild(specHeader);
    specWrap.appendChild(specBody);
    grid.appendChild(specWrap);
  } else {
    buildingsConfig.forEach((b, idx) => {
      const card = createViewerBuildingCard(b, lang, p);
      grid.appendChild(card);

      if (idx === 3) {
        grid.appendChild(gatherCard);
        grid.appendChild(ammoCard);
      }
    });
  }

  switchCopyLang(currentCopyLang);
}

function switchCopyLang(lang) {
  currentCopyLang = lang;
  if (!currentRecord) return;

  let p = currentRecord.payload || {};
  if (p.legions && p.legions[currentLegion]) {
    p = p.legions[currentLegion];
  }

  if (lang === "zht") {
    document.getElementById("btnCopyLangZht").classList.add("active");
    document.getElementById("btnCopyLangEn").classList.remove("active");
    document.getElementById("copyTextarea").value = p.copyTextZht || "";
  } else {
    document.getElementById("btnCopyLangEn").classList.add("active");
    document.getElementById("btnCopyLangZht").classList.remove("active");
    document.getElementById("copyTextarea").value = p.copyTextEn || "";
  }
}

function copyText() {
  const textarea = document.getElementById("copyTextarea");
  textarea.select();
  navigator.clipboard.writeText(textarea.value);
  alert(langPack[currentUIClassLang].alertSuccess);
}

// 6. 分享網址彈窗
const BASE_SHARE_URL =
  "https://jeremytseng12.github.io/2647WOSFOUNDRY/viewsystem";

function openShareModal() {
  document.getElementById("shareModal").style.display = "flex";

  const shareSelect = document.getElementById("shareLegionSelect");
  if (shareSelect) {
    shareSelect.value = currentLegion || "LegionA";
  }

  updateShareUrlInput();
}

function closeShareModal() {
  document.getElementById("shareModal").style.display = "none";
}

function updateShareUrlInput() {
  const selectedLegion = document.getElementById("shareLegionSelect").value;
  const urlInput = document.getElementById("shareUrlInput");

  if (selectedLegion === "LegionB") {
    urlInput.value = `${BASE_SHARE_URL}#legion2`;
  } else {
    urlInput.value = BASE_SHARE_URL;
  }
}

function copyShareUrl() {
  const urlInput = document.getElementById("shareUrlInput");
  urlInput.select();
  navigator.clipboard.writeText(urlInput.value);
  alert("🔗 分享連結已成功複製到剪貼簿！\n" + urlInput.value);
  closeShareModal();
}
