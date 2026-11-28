/* ============================================================
   兵工廠人員分配系統 3.0 - 核心邏輯 (index.js)
   ============================================================ */

const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzAZhQTvjH1XqBRCIgYFaeJAz7arbC5GNsxXyxNAx0oYslzFn9zLJDm4r1gHvZG_Y_3/exec";

let currentUser = null;

let currentData = {
  totalPeople: 0,
  totalPower: 0,
  avgPower: 0,
  currentLang: "zht",
  copyLang: "zht",
  buildings: {
    b0: [], b1: [], b2: [], b3: [],
    b4: [], b5: [], b6: [], b7: []
  },
  manualGatherText: "",
  manualAmmoText: "",
  substituteList: [] // 替補成員（不參與分配，僅顯示在表格中）
};

let currentEditingRowIndex = null;
let currentEditingLegion = "LegionA";
let currentEditingTitle = "";
let currentEditingAuthor = "";
let historyRecordsList = [];
let isCurrentlyMaintenance = false;

let pendingExportDataUrl = "";
let pendingExportFilename = "";

// 1. 系統狀態檢查
async function checkSystemStatus() {
  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=getSystemConfig&t=${Date.now()}`);
    const data = await res.json();
    const status = data.systemStatus || data.status || "active";
    const annText = (data.announcement || "").trim();

    const overlay = document.getElementById("fullscreenOverlay");
    const title = document.getElementById("overlayTitle");
    const msg = document.getElementById("overlayMessage");
    const btnReload = document.getElementById("btnOverlayReload");

    if (status === "offline" || status === "maintenance") {
      isCurrentlyMaintenance = true;
      if (overlay) overlay.style.display = "flex";
      if (title) title.innerText = status === "offline" ? "⛔ 系統目前已關閉" : "🔧 系統維修中";
      if (msg) msg.innerText = status === "offline" ? "系統目前暫停對外開放，請聯繫管理員。" : "系統維護升級中，請稍後再試。";
      return false;
    } else {
      if (isCurrentlyMaintenance && btnReload) btnReload.style.display = "inline-block";
      else if (overlay) overlay.style.display = "none";
      isCurrentlyMaintenance = false;
    }

    if (annText && !sessionStorage.getItem("ann_shown")) {
      alert(`📢 系統公告：\n${annText}`);
      sessionStorage.setItem("ann_shown", "true");
    }
    return true;
  } catch (err) {
    isCurrentlyMaintenance = false;
    return true;
  }
}

// 2. 登入與登出
async function handleIndexLogin() {
  const p = (window.langPack && langPack[currentData.currentLang]) || {};
  const account = document.getElementById("loginAccount").value.trim();
  const passkey = document.getElementById("loginPasskey").value.trim();
  const errorEl = document.getElementById("loginErrorMsg");

  if (!account || !passkey) {
    errorEl.textContent = p.loginEmptyError || "請輸入帳號與密碼";
    return;
  }

  errorEl.textContent = p.loginValidating || "驗證中...";

  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", account, passkey }),
    });
    const result = await res.json();

    if (result.status === "success") {
      currentUser = result.user;
      sessionStorage.setItem("wos_admin_user", JSON.stringify(currentUser));
      unlockSystemUI();
    } else {
      errorEl.textContent = result.message || "帳號或密碼錯誤";
    }
  } catch (err) {
    errorEl.textContent = p.loginNetworkError || "連線失敗，請檢查網路";
  }
}

function handleIndexLogout() {
  sessionStorage.removeItem("wos_admin_user");
  currentUser = null;
  location.reload();
}

function unlockSystemUI() {
  document.getElementById("indexLoginOverlay").style.display = "none";
  document.getElementById("main-content").style.display = "block";
  updateUserBadge();

  const authorInput = document.getElementById("publishAuthorInput");
  if (authorInput && currentUser) {
    authorInput.value = currentUser.displayName;
  }
}

function updateUserBadge() {
  const badge = document.getElementById("userBadge");
  if (badge && currentUser) {
    badge.textContent = `👤 ${currentUser.displayName}`;
  }
}

window.addEventListener("load", async () => {
  const prefLang = localStorage.getItem("wos_pref_lang") || "zht";
  changeLanguage(prefLang);

  await checkSystemStatus();
  setInterval(checkSystemStatus, 60000);

  const savedUser = sessionStorage.getItem("wos_admin_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    unlockSystemUI();
  } else {
    document.getElementById("indexLoginOverlay").style.display = "flex";
  }
});

// 3. 全面多國語系切換
function changeLanguage(lang) {
  if (typeof langPack === "undefined" || !langPack[lang]) return;
  currentData.currentLang = lang;
  currentData.copyLang = lang;
  localStorage.setItem("wos_pref_lang", lang);
  const p = langPack[lang];
  const isZht = lang === "zht";

  const setActive = (id, active) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", active);
  };
  setActive("btnLangZht", isZht);
  setActive("btnLangEn", !isZht);
  setActive("btnLoginLangZht", isZht);
  setActive("btnLoginLangEn", !isZht);
  setActive("btnCopyLangZht", isZht);
  setActive("btnCopyLangEn", !isZht);

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el && txt !== undefined) el.innerText = txt;
  };
  const setPh = (id, ph) => {
    const el = document.getElementById(id);
    if (el && ph !== undefined) el.placeholder = ph;
  };

  setText("uiLoginTitle", p.loginTitle);
  setText("uiLoginSubtitle", p.loginSubtitle);
  setText("uiLoginAccountLabel", p.loginAccountLabel);
  setPh("loginAccount", p.loginAccountPlaceholder);
  setText("uiLoginPasskeyLabel", p.loginPasskeyLabel);
  setPh("loginPasskey", p.loginPasskeyPlaceholder);
  setText("uiBtnLogin", p.btnLogin);
  setText("btnLogoutTop", p.btnLogout);

  setText("uiMainTitle", p.mainTitle);
  setText("btnHistoryModal", p.btnHistoryModal);
  setText("btnViewSystem", p.btnViewSystem);
  setText("btnManageSystem", p.btnManageSystem);
  setText("btnCancelEdit", p.btnCancelEdit);

  setText("uiLeaderTitle", p.leaderTitle);
  setText("uiMemberTitle", p.memberTitle);
  setText("uiLabelMainList", p.labelMainList);
  setPh("memberInput", p.mainListPlaceholder);
  setText("uiLabelGatherList", p.labelGatherList);
  setText("uiLabelAmmoList", p.labelAmmoList);
  setPh("gatherInput", p.gatherPlaceholder);
  setPh("ammoInput", p.ammoPlaceholder);
  setText("btnDistribute", p.btnDistribute);
  setText("btnLoadTestData", p.btnLoadTestData);
  setText("uiQuickTitle", p.quickTitle);

  setText("uiViceAccordionTitle", p.viceAccordionTitle);
  setText("uiViceNoticeText", p.viceNoticeText);
  if (p.viceLabels) {
    for (let i = 0; i < 4; i++) {
      setText(`uiLabelVice${i}`, p.viceLabels[i]);
      setPh(`viceName${i}`, p.vicePlaceholderName);
      setPh(`vicePower${i}`, p.vicePlaceholderPower);
    }
  }
  if (p.labels) {
    for (let i = 0; i < 4; i++) {
      setText(`uiLabelG${i}`, p.labels[i]);
      setPh(`leaderName${i}`, p.placeholders?.name);
      setPh(`leaderPower${i}`, p.placeholders?.power);
    }
  }

  // 發布彈窗
  setText("publishModalHeaderTitle", p.publishHeader);
  setText("lblPublishLegion", p.lblPublishLegion);
  setText("optLegionA", p.optLegionA);
  setText("optLegionB", p.optLegionB);
  setText("lblPublishEventType", p.lblPublishEventType);
  setText("optEventFoundry", p.optEventFoundry);
  setText("optEventTundra", p.optEventTundra);
  setText("optEventTest", p.optEventTest);
  setText("lblPublishDate", p.lblPublishDate);
  setText("lblPublishTitle", p.lblPublishTitle);
  setText("lblPublishAuthor", p.lblPublishAuthor);
  setPh("publishAuthorInput", p.authorPlaceholder);
  setText("btnPublishCancel", p.btnPublishCancel);
  setText("btnConfirmPublish", p.btnConfirmPublish);

  // 歷史載入彈窗
  setText("uiLoadHistoryTitle", p.uiLoadHistoryTitle);
  setText("lblLoadHistory", p.lblLoadHistory);
  setText("lblLoadLegion", p.lblLoadLegion);
  setText("optLoadLegionA", p.optLegionA);
  setText("optLoadLegionB", p.optLegionB);
  setText("btnLoadCancel", p.btnLoadCancel);
  setText("btnConfirmLoad", p.btnConfirmLoad);

  // 匯出預覽彈窗
  setText("uiExportPreviewHint", p.exportPreviewHint);
  setText("btnExportCancel", p.btnExportCancel);
  setText("btnConfirmDownloadImg", p.btnConfirmDownloadImg);

  // 結果看板與複製區
  setText("btnPublish", p.btnPublish);
  setText("uiCopyTitle", p.copyTitle);
  setText("btnCopyLangZht", p.btnCopyLangZht);
  setText("btnCopyLangEn", p.btnCopyLangEn);
  setText("btnCopyText", p.btnCopyText);
  setText("uiTweakTitle", p.tweakTitle);
  setText("btnScreenshotText", p.btnScreenshotText);
  setText("btnMapScreenshotText", p.btnMapScreenshotText);

  if (document.getElementById("resultSection").style.display !== "none") {
    renderAll();
  }
}

function toggleCopyLanguage(lang) {
  currentData.copyLang = lang;
  document.getElementById("btnCopyLangZht").classList.toggle("active", lang === "zht");
  document.getElementById("btnCopyLangEn").classList.toggle("active", lang === "en");
  updateTextOutputOnly();
}

function toggleViceAccordion() {
  document.getElementById("viceAccordion")?.classList.toggle("closed");
}

function handlePowerEnter(event, currentIdx) {
  if (event.key === "Enter") {
    event.preventDefault();
    for (let i = 1; i <= 4; i++) {
      let checkIdx = (currentIdx + i) % 4;
      let field = document.getElementById(`leaderPower${checkIdx}`);
      if (field && field.value.trim() === "") {
        field.focus();
        return;
      }
    }
    document.getElementById("memberInput").focus();
  }
}

function quickAssignLeader(name) {
  const p = langPack[currentData.currentLang];
  for (let i = 0; i < 4; i++) {
    if (document.getElementById(`leaderName${i}`).value.trim() === name) {
      alert(`「${name}」${p.alertRepeat}`);
      return;
    }
  }
  for (let i = 0; i < 4; i++) {
    const field = document.getElementById(`leaderName${i}`);
    if (field.value.trim() === "") {
      field.value = name;
      document.getElementById(`leaderPower${i}`).focus();
      return;
    }
  }
  alert(p.alertFull);
}

// 4. 名單解析與平衡分配
function parseLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.lastIndexOf(" ");
      if (idx !== -1) {
        const name = line.substring(0, idx).trim();
        const power = parseInt(line.substring(idx).trim());
        if (!isNaN(power)) return { name, power };
      }
      return { name: line, power: 0 };
    });
}

function parseCurrentInputs() {
  const parsed = {
    leaders: [],
    viceLeaders: [],
    mainMembers: [],
    gatherMembers: [],
    ammoMembers: [],
    uniqueNames: new Set()
  };

  for (let i = 0; i < 4; i++) {
    const name = document.getElementById(`leaderName${i}`).value.trim();
    const power = parseInt(document.getElementById(`leaderPower${i}`).value);
    parsed.leaders.push({ name, power });
    if (name) parsed.uniqueNames.add(name);

    const vName = document.getElementById(`viceName${i}`).value.trim();
    const vPower = parseInt(document.getElementById(`vicePower${i}`).value) || 0;
    parsed.viceLeaders.push({ name: vName, power: vPower });
    if (vName) parsed.uniqueNames.add(vName);
  }

  parseLines(document.getElementById("memberInput").value).forEach((m) => {
    parsed.mainMembers.push(m);
    parsed.uniqueNames.add(m.name);
  });
  parseLines(document.getElementById("gatherInput").value).forEach((m) => {
    parsed.gatherMembers.push(m);
    parsed.uniqueNames.add(m.name);
  });
  parseLines(document.getElementById("ammoInput").value).forEach((m) => {
    parsed.ammoMembers.push(m);
    parsed.uniqueNames.add(m.name);
  });

  return parsed;
}

function showError(msg) {
  const errEl = document.getElementById("errorMessage");
  errEl.innerText = msg;
  errEl.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateInputs() {
  const isEn = currentData.currentLang === "en";
  const leaderSet = new Set();

  for (let i = 0; i < 4; i++) {
    const name = document.getElementById(`leaderName${i}`).value.trim();
    const power = parseInt(document.getElementById(`leaderPower${i}`).value);
    if (!name) {
      showError(isEn ? `Enter leader name for Group ${i + 1}` : `請填寫第 ${i + 1} 組隊長名字！`);
      return false;
    }
    if (isNaN(power) || power < 4000) {
      showError(isEn ? `Leader "${name}" power must be ≥ 4000` : `隊長「${name}」戰力需 ≥ 4000！`);
      return false;
    }
    leaderSet.add(name);
  }

  for (let i = 0; i < 4; i++) {
    const vName = document.getElementById(`viceName${i}`).value.trim();
    const vPower = parseInt(document.getElementById(`vicePower${i}`).value);
    if (vName) {
      if (leaderSet.has(vName)) {
        showError(`「${vName}」已是正隊長，無法重複設為副隊長！`);
        return false;
      }
      if (isNaN(vPower) || vPower <= 0) {
        showError(`請填寫副隊長「${vName}」的戰力！`);
        return false;
      }
      leaderSet.add(vName);
    }
  }

  const mainLines = parseLines(document.getElementById("memberInput").value);
  for (let m of mainLines) {
    if (leaderSet.has(m.name)) {
      showError(`「${m.name}」已是隊長/副隊長，請勿重複填寫在主平衡名單中！`);
      return false;
    }
  }
  return true;
}

function handleDirectAllocate() {
  document.getElementById("errorMessage").style.display = "none";
  if (!validateInputs()) return;

  const pool = parseCurrentInputs();
  if (pool.uniqueNames.size < 15) {
    showError(`目前參戰總人數為 ${pool.uniqueNames.size} 人，未達 15 人基本門檻！`);
    return;
  }

  distributeMembers(pool);
}

function distributeMembers(pool) {
  currentData.buildings = { b0: [], b1: [], b2: [], b3: [], b4: [], b5: [], b6: [], b7: [] };

  let groups = [];

  for (let i = 0; i < 4; i++) {
    const lData = pool.leaders[i];
    const vData = pool.viceLeaders[i];
    const leaderObj = { name: lData.name, power: lData.power, isLeader: true, isVice: false, isManualLeader: true, isManualVice: false };
    const viceObj = (vData.name && vData.power > 0)
      ? { name: vData.name, power: vData.power, isLeader: false, isVice: true, isManualLeader: false, isManualVice: true }
      : null;

    groups.push({
      index: i,
      leader: leaderObj,
      manualVice: viceObj,
      members: [],
      totalPower: lData.power + (viceObj ? viceObj.power : 0)
    });
  }

  const sortedMain = [...pool.mainMembers].sort((a, b) => b.power - a.power);
  for (let m of sortedMain) {
    groups.sort((a, b) => a.totalPower - b.totalPower);
    groups[0].members.push({ name: m.name, power: m.power, isLeader: false, isVice: false, isManualLeader: false, isManualVice: false });
    groups[0].totalPower += m.power;
  }
  groups.sort((a, b) => a.index - b.index);

  groups.forEach((g) => {
    const people = [g.leader];
    if (g.manualVice) people.push(g.manualVice);
    g.members.forEach((m) => people.push(m));

    const b1 = `b${g.index * 2}`;
    const b2 = `b${g.index * 2 + 1}`;
    people.forEach((person, idx) => {
      currentData.buildings[idx % 2 === 0 ? b1 : b2].push(person);
    });
  });

  currentData.manualGatherText = document.getElementById("gatherInput").value.trim();
  currentData.manualAmmoText = document.getElementById("ammoInput").value.trim();

  renderAll();
  const resSec = document.getElementById("resultSection");
  resSec.style.display = "block";
  resSec.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 5. 看板渲染與行內快速新增/刪除
function reorderCommanders() {
  buildingsConfig.forEach((b) => {
    const list = currentData.buildings[b.id];
    if (!list || list.length === 0) return;

    const lIdx = list.findIndex((p) => p.isManualLeader || p.isLeader);
    const leaderObj = lIdx !== -1 ? list.splice(lIdx, 1)[0] : null;

    const vIdx = list.findIndex((p) => p.isManualVice);
    const manualViceObj = vIdx !== -1 ? list.splice(vIdx, 1)[0] : null;

    list.forEach((p) => (p.isVice = false));
    list.sort((a, b) => b.power - a.power);

    if (manualViceObj) {
      manualViceObj.isVice = true;
      list.unshift(manualViceObj);
    } else if (b.needVice && list.length > 0) {
      list[0].isVice = true;
    }

    if (leaderObj) list.unshift(leaderObj);
  });
}

function calculateTotals() {
  let totalPower = 0;
  const names = new Set();

  buildingsConfig.forEach((b) => {
    (currentData.buildings[b.id] || []).forEach((p) => {
      totalPower += p.power || 0;
      if (p.name) names.add(p.name);
    });
  });

  // 兼職採集與子彈使用 Set 自動去重，不會重複計算總人數
  (currentData.manualGatherText ? currentData.manualGatherText.split("\n") : []).forEach((n) => {
    if (n.trim()) names.add(n.trim());
  });
  (currentData.manualAmmoText ? currentData.manualAmmoText.split("\n") : []).forEach((n) => {
    if (n.trim()) names.add(n.trim());
  });

  currentData.totalPeople = names.size;
  currentData.totalPower = totalPower;
  currentData.avgPower = Math.round(totalPower / 4);
}

function inlineAddPlayer(targetId) {
  const nameInput = document.getElementById(`inName_${targetId}`);
  const powerInput = document.getElementById(`inPower_${targetId}`);
  const name = nameInput ? nameInput.value.trim() : "";
  const power = powerInput ? parseInt(powerInput.value) || 0 : 0;

  if (!name) return;

  if (targetId === "gather") {
    const cur = document.getElementById("gatherInput").value.trim();
    document.getElementById("gatherInput").value = cur ? `${cur}\n${name}` : name;
    currentData.manualGatherText = document.getElementById("gatherInput").value;
  } else if (targetId === "ammo") {
    const cur = document.getElementById("ammoInput").value.trim();
    document.getElementById("ammoInput").value = cur ? `${cur}\n${name}` : name;
    currentData.manualAmmoText = document.getElementById("ammoInput").value;
  } else if (targetId === "subs") {
    currentData.substituteList.push({ name, power, note: "" });
  } else if (currentData.buildings[targetId]) {
    currentData.buildings[targetId].push({
      name,
      power,
      isLeader: false,
      isVice: false,
      isManualLeader: false,
      isManualVice: false
    });
  }

  renderAll();
}

function removePlayer(sourceId, idx, event) {
  if (event) event.stopPropagation();

  if (sourceId === "gather") {
    const arr = currentData.manualGatherText.split("\n");
    arr.splice(idx, 1);
    currentData.manualGatherText = arr.join("\n");
    document.getElementById("gatherInput").value = currentData.manualGatherText;
  } else if (sourceId === "ammo") {
    const arr = currentData.manualAmmoText.split("\n");
    arr.splice(idx, 1);
    currentData.manualAmmoText = arr.join("\n");
    document.getElementById("ammoInput").value = currentData.manualAmmoText;
  } else if (sourceId === "subs") {
    currentData.substituteList.splice(idx, 1);
  } else if (currentData.buildings[sourceId]) {
    currentData.buildings[sourceId].splice(idx, 1);
  }

  renderAll();
}

function renderAll() {
  reorderCommanders();
  calculateTotals();

  const p = langPack[currentData.currentLang];
  const isEn = currentData.currentLang === "en";

  const subCount = (currentData.substituteList || []).length;
  const subSummaryHtml = subCount > 0
    ? `<span>${isEn ? "Substitutes:" : "替補待命："} <strong>${subCount}</strong></span>`
    : "";

  document.getElementById("summaryBox").innerHTML = `
    <span>${p.summaryText[0]} <strong>${currentData.totalPeople}</strong></span>
    <span>${p.summaryText[1]} <strong>${currentData.totalPower.toLocaleString()}</strong></span>
    <span>${p.summaryText[2]} <strong>${currentData.avgPower.toLocaleString()}</strong></span>
    ${subSummaryHtml}
  `;

  const grid = document.getElementById("buildingGrid");
  grid.innerHTML = "";

  const createSpecCard = (type, title, label, textVal, badgeIcon) => {
    const card = document.createElement("div");
    card.className = "building-card b-group-spec";
    const arr = textVal ? textVal.split("\n").filter((n) => n.trim()) : [];
    const tagsHtml = arr.map((name, idx) => `
      <div class="player-tag" style="cursor:default;">
        <span>${badgeIcon} ${name.trim()}</span>
        <button class="btn-del-mini" onclick="removePlayer('${type}', ${idx}, event)" title="${p.removeTip}">✕</button>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="building-title">${title}</div>
      <div class="building-power">${label}</div>
      <div class="drop-zone">${tagsHtml}</div>
      <div class="inline-add-row">
        <input type="text" class="in-name" id="inName_${type}" placeholder="${p.inlineSpecPh}" onkeydown="if(event.key==='Enter') inlineAddPlayer('${type}')" />
        <button type="button" class="btn-inline-add" onclick="inlineAddPlayer('${type}')">+</button>
      </div>
    `;
    return card;
  };

  const gatherCard = createSpecCard("gather", p.specTitleGather, p.specLabelGather, currentData.manualGatherText, "⚡");
  const ammoCard = createSpecCard("ammo", p.specTitleAmmo, p.specLabelAmmo, currentData.manualAmmoText, "🎒");

  buildingsConfig.forEach((b, idx) => {
    const card = document.createElement("div");
    card.className = `building-card b-group-${b.gIdx}`;
    card.id = b.id;

    card.addEventListener("dragover", (e) => e.preventDefault());
    card.addEventListener("dragenter", function (e) { e.preventDefault(); this.classList.add("drag-over"); });
    card.addEventListener("dragleave", function () { this.classList.remove("drag-over"); });
    card.addEventListener("drop", handleDrop);

    const list = currentData.buildings[b.id] || [];
    const bPower = list.reduce((sum, item) => sum + (item.power || 0), 0);

    const tagsHtml = list.map((player, pIdx) => {
      let roleClass = "";
      let badge = "";
      if (player.isLeader) {
        roleClass = "is-leader";
        badge = `<span class="tag-badge tag-leader-label">${p.leaderTag}</span>`;
      } else if (player.isVice) {
        roleClass = "is-vice";
        badge = `<span class="tag-badge tag-vice-label">${p.viceTag}</span>`;
      }

      const isLocked = player.isManualLeader || player.isManualVice;
      const dragAttr = !isLocked ? `draggable="true" ondragstart="dragStart(event, '${b.id}', ${pIdx})"` : "";
      const delBtn = !isLocked ? `<button class="btn-del-mini" onclick="removePlayer('${b.id}', ${pIdx}, event)" title="${p.removeTip}">✕</button>` : "";

      return `
        <div class="player-tag ${roleClass}" ${dragAttr}>
          <span>${badge}${player.name}</span>
          <div class="player-right">
            <span class="player-power-val">${player.power || 0}</span>
            ${delBtn}
          </div>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div class="building-title">${isEn ? b.nameEn : b.nameZht}</div>
      <div class="building-power">${p.buildingPower}<strong>${bPower.toLocaleString()}</strong></div>
      <div class="drop-zone">${tagsHtml}</div>
      <div class="inline-add-row">
        <input type="text" class="in-name" id="inName_${b.id}" placeholder="${p.inlineNamePh}" onkeydown="if(event.key==='Enter') inlineAddPlayer('${b.id}')" />
        <input type="number" class="in-power" id="inPower_${b.id}" placeholder="${p.inlinePowerPh}" onkeydown="if(event.key==='Enter') inlineAddPlayer('${b.id}')" />
        <button type="button" class="btn-inline-add" onclick="inlineAddPlayer('${b.id}')">+</button>
      </div>
    `;

    grid.appendChild(card);

    if (idx === 3) {
      grid.appendChild(gatherCard);
      grid.appendChild(ammoCard);
    }
  });

  // 若有替補成員，獨立顯示在表格最後一格（不參與分配，僅顯示於表格中）
  if (currentData.substituteList && currentData.substituteList.length > 0) {
    const subCard = document.createElement("div");
    subCard.className = "building-card b-group-spec";
    subCard.style.borderColor = "#f59e0b";

    const subTagsHtml = currentData.substituteList.map((s, sIdx) => `
      <div class="player-tag" style="cursor:default;">
        <span>🔄 ${s.name}${s.note ? ` <small style="color:#94a3b8;">(${s.note})</small>` : ""}</span>
        <div class="player-right">
          <span class="player-power-val">${s.power || 0}</span>
          <button class="btn-del-mini" onclick="removePlayer('subs', ${sIdx}, event)" title="${p.removeTip}">✕</button>
        </div>
      </div>
    `).join("");

    subCard.innerHTML = `
      <div class="building-title" style="color:#fbbf24;">${isEn ? "🔄 Substitute Roster" : "🔄 替補待命名單"}</div>
      <div class="building-power">${isEn ? "Standby (Not Allocated)" : "不參與平衡分配・待命替補"}</div>
      <div class="drop-zone">${subTagsHtml}</div>
      <div class="inline-add-row">
        <input type="text" class="in-name" id="inName_subs" placeholder="${p.inlineNamePh}" onkeydown="if(event.key==='Enter') inlineAddPlayer('subs')" />
        <input type="number" class="in-power" id="inPower_subs" placeholder="${p.inlinePowerPh}" onkeydown="if(event.key==='Enter') inlineAddPlayer('subs')" />
        <button type="button" class="btn-inline-add" onclick="inlineAddPlayer('subs')">+</button>
      </div>
    `;
    grid.appendChild(subCard);
  }

  updateTextOutputOnly();
}

let dragFromId = null;
let dragIdx = null;

function dragStart(e, bId, pIdx) {
  dragFromId = bId;
  dragIdx = pIdx;
  e.dataTransfer.setData("text/plain", bId);
}

function handleDrop() {
  this.classList.remove("drag-over");
  const targetId = this.id;
  if (!targetId || dragFromId === targetId) return;

  const moving = currentData.buildings[dragFromId]?.splice(dragIdx, 1)[0];
  if (!moving) return;

  if (!moving.isManualLeader) moving.isVice = false;
  currentData.buildings[targetId].push(moving);
  renderAll();
}

// 6. 文字名單產生與複製
function getFormattedText(isEn) {
  let out = "";
  buildingsConfig.forEach((b) => {
    const bName = isEn ? b.nameEn : b.nameZht;
    const names = (currentData.buildings[b.id] || []).map((pl) => pl.name);
    out += `${bName}～ ${names.join(" & ")}\n`;
  });
  out += "========================\n";
  if (isEn) {
    out += `[Gathering Squad]:${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (None)"}\n`;
    out += `[Ammo Squad]:${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (None)"}`;
    if (currentData.substituteList && currentData.substituteList.length > 0) {
      out += `\n[Substitutes]: ${currentData.substituteList.map((s) => s.name).join(", ")}`;
    }
  } else {
    out += `【採集小隊】：${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (無)"}\n`;
    out += `【子彈小隊】：${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (無)"}`;
    if (currentData.substituteList && currentData.substituteList.length > 0) {
      out += `\n【替補名單】：${currentData.substituteList.map((s) => s.name).join("、")}`;
    }
  }
  return out.trim();
}

function updateTextOutputOnly() {
  document.getElementById("copyTextarea").value = getFormattedText(currentData.copyLang === "en");
}

function copyTextOutput() {
  const ta = document.getElementById("copyTextarea");
  ta.select();
  navigator.clipboard.writeText(ta.value);
  alert(langPack[currentData.currentLang].alertSuccess);
}

// 7. 浮水印生成與圖片預覽確認視窗
function createSignatureWatermarkElement() {
  const p = langPack[currentData.currentLang];
  const allocatorName = currentUser
    ? `${currentUser.displayName}${currentUser.account ? ` (${currentUser.account})` : ""}`
    : (document.getElementById("publishAuthorInput")?.value.trim() || "指揮官");

  const sig = document.createElement("div");
  sig.className = "export-signature-badge";
  sig.innerHTML = `
    <div class="sig-line-1">SYSTEM MADE BY TSENG</div>
    <div class="sig-line-2">${p.allocatorPrefix}${allocatorName}</div>
  `;
  return sig;
}

function openExportPreviewModal(dataUrl, filename, modalTitle) {
  pendingExportDataUrl = dataUrl;
  pendingExportFilename = filename;
  document.getElementById("exportPreviewTitle").innerText = modalTitle;
  document.getElementById("exportPreviewImg").src = dataUrl;
  document.getElementById("exportPreviewModal").style.display = "flex";
}

function closeExportPreviewModal() {
  document.getElementById("exportPreviewModal").style.display = "none";
  pendingExportDataUrl = "";
  pendingExportFilename = "";
}

function confirmDownloadExportedImage() {
  if (!pendingExportDataUrl) return;
  const link = document.createElement("a");
  link.download = pendingExportFilename;
  link.href = pendingExportDataUrl;
  link.click();
  closeExportPreviewModal();
}

// 匯出「表格版」分配圖（跳出預覽確認）
function captureBuildingGrid() {
  const btn = document.getElementById("btnScreenshot");
  const p = langPack[currentData.currentLang];
  const origHtml = btn.innerHTML;
  btn.innerText = "⏳ ...";
  btn.disabled = true;

  const exportWrap = document.createElement("div");
  exportWrap.className = "export-board-wrapper";

  const centerWm = document.createElement("div");
  centerWm.className = "export-center-watermark";
  centerWm.innerText = "2647 RGN";
  exportWrap.appendChild(centerWm);

  const legionTag = currentEditingLegion === "LegionB" ? "[軍團 2] " : "[軍團 1] ";
  const titleStr = currentEditingTitle
    ? `${legionTag}${currentEditingTitle}`
    : (document.getElementById("publishTitleInput").value || "2647 RGN 兵工廠人員分配表");

  const headerDiv = document.createElement("div");
  headerDiv.className = "export-header";
  headerDiv.innerHTML = `
    <div class="export-title">${titleStr}</div>
    <div class="export-meta">${p.summaryText[0]}${currentData.totalPeople} ｜ ${p.summaryText[1]}${currentData.totalPower.toLocaleString()}</div>
  `;
  exportWrap.appendChild(headerDiv);

  const clonedGrid = document.getElementById("buildingGrid").cloneNode(true);
  exportWrap.appendChild(clonedGrid);
  exportWrap.appendChild(createSignatureWatermarkElement());

  document.body.appendChild(exportWrap);

  html2canvas(exportWrap, {
    backgroundColor: "#0b0f19",
    scale: 2,
    useCORS: true,
    width: 1360
  })
    .then((canvas) => {
      const d = new Date();
      const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const dataUrl = canvas.toDataURL("image/png");

      document.body.removeChild(exportWrap);
      btn.innerHTML = origHtml;
      btn.disabled = false;

      openExportPreviewModal(dataUrl, `兵工廠人員分配表_${ts}.png`, p.exportPreviewTitleTable);
    })
    .catch(() => {
      if (document.body.contains(exportWrap)) document.body.removeChild(exportWrap);
      btn.innerHTML = origHtml;
      btn.disabled = false;
      alert("生成圖片失敗，請稍後再試！");
    });
}

// 匯出「地圖版」分配圖（跳出預覽確認）
function captureMapWithAllocation() {
  const btn = document.getElementById("btnMapScreenshot");
  const p = langPack[currentData.currentLang];
  const origHtml = btn ? btn.innerHTML : "";

  if (btn) {
    btn.innerText = "⏳ ...";
    btn.disabled = true;
  }

  const mapContainer = document.createElement("div");
  mapContainer.id = "mapContainer";

  const centerWm = document.createElement("div");
  centerWm.className = "export-center-watermark";
  centerWm.style.color = "rgba(255, 255, 255, 0.14)";
  centerWm.style.zIndex = "2";
  centerWm.innerText = "2647 RGN";
  mapContainer.appendChild(centerWm);

  const legionTag = currentEditingLegion === "LegionB" ? "[軍團 2] " : "[軍團 1] ";
  const titleStr = currentEditingTitle
    ? `${legionTag}${currentEditingTitle}`
    : (document.getElementById("publishTitleInput").value || "2647 RGN 兵工廠人員分配圖");

  const banner = document.createElement("div");
  banner.className = "map-top-banner";
  banner.style.zIndex = "3";
  banner.innerHTML = `
    <div class="map-banner-title">${titleStr}</div>
    <div class="map-banner-meta">${p.summaryText[0]}${currentData.totalPeople} ｜ ${p.summaryText[1]}${currentData.totalPower.toLocaleString()}</div>
  `;
  mapContainer.appendChild(banner);

  const mapCoords = {
    b0: { top: "40%", left: "8%" },
    b1: { top: "55%", left: "6%" },
    b2: { top: "58%", left: "74%" },
    b3: { top: "42%", left: "78%" },
    b4: { top: "80%", left: "28%" },
    b5: { top: "80%", left: "62%" },
    b6: { top: "16%", left: "60%" },
    b7: { top: "16%", left: "24%" }
  };

  const isEn = currentData.currentLang === "en";
  buildingsConfig.forEach((b) => {
    const coord = mapCoords[b.id];
    if (!coord) return;

    const list = currentData.buildings[b.id] || [];
    const playersHtml = list
      .map((pl) => {
        const tag = pl.isLeader ? `[${p.leaderTag}] ` : pl.isVice ? `[${p.viceTag}] ` : "";
        return `<div>• ${tag}${pl.name} (${pl.power || 0})</div>`;
      })
      .join("");

    const nodeDiv = document.createElement("div");
    nodeDiv.className = "map-node-card";
    nodeDiv.style.top = coord.top;
    nodeDiv.style.left = coord.left;
    nodeDiv.style.zIndex = "3";
    nodeDiv.innerHTML = `
      <div class="map-node-title">${isEn ? b.nameEn : b.nameZht}</div>
      <div class="map-node-players">${playersHtml || "(無)"}</div>
    `;
    mapContainer.appendChild(nodeDiv);
  });

  mapContainer.appendChild(createSignatureWatermarkElement());
  document.body.appendChild(mapContainer);

  html2canvas(mapContainer, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    width: 1200,
    height: 1200
  })
    .then((canvas) => {
      const d = new Date();
      const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const dataUrl = canvas.toDataURL("image/png");

      document.body.removeChild(mapContainer);
      if (btn) {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }

      openExportPreviewModal(dataUrl, `兵工廠地圖分配圖_${ts}.png`, p.exportPreviewTitleMap);
    })
    .catch(() => {
      if (document.body.contains(mapContainer)) document.body.removeChild(mapContainer);
      if (btn) {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
      alert("地圖預覽生成失敗，請稍後再試！");
    });
}

// 8. 編輯歷史紀錄（支援跨列自動合併軍團 1 與軍團 2）
function openLoadHistoryModal() {
  fetch(`${GAS_WEB_APP_URL}?action=getHistory&t=${Date.now()}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "empty" || !res.history || res.history.length === 0) {
        alert("雲端目前尚無歷史紀錄！");
        return;
      }

      const mergedMap = {};
      res.history.forEach((item) => {
        const titleKey = (item.title || "未命名分配結果").trim();
        if (!mergedMap[titleKey]) {
          mergedMap[titleKey] = {
            title: titleKey,
            authors: [item.author],
            rowIndices: [item.rowIndex]
          };
        } else {
          mergedMap[titleKey].rowIndices.push(item.rowIndex);
          if (item.author && !mergedMap[titleKey].authors.includes(item.author)) {
            mergedMap[titleKey].authors.push(item.author);
          }
        }
      });

      historyRecordsList = Object.values(mergedMap);
      const select = document.getElementById("loadHistorySelect");
      select.innerHTML = "";

      for (let i = historyRecordsList.length - 1; i >= 0; i--) {
        const group = historyRecordsList[i];
        const option = document.createElement("option");
        option.value = i;
        option.innerText = `${group.title} (${group.authors.join(" & ")})`;
        select.appendChild(option);
      }

      document.getElementById("loadHistoryModal").style.display = "flex";
    })
    .catch(() => alert("無法連線至雲端讀取歷史紀錄。"));
}

function closeLoadHistoryModal() {
  document.getElementById("loadHistoryModal").style.display = "none";
}

function fetchAndRestoreGridData() {
  const groupIdx = parseInt(document.getElementById("loadHistorySelect").value);
  const selectedLegion = document.getElementById("loadLegionSelect").value;
  const targetGroup = historyRecordsList[groupIdx];
  if (!targetGroup) return;

  const btnConfirm = document.getElementById("btnConfirmLoad");
  const origBtnText = btnConfirm.innerText;
  btnConfirm.innerText = "載入中...";
  btnConfirm.disabled = true;

  const fetchPromises = targetGroup.rowIndices.map((rIdx) =>
    fetch(`${GAS_WEB_APP_URL}?action=getHistory&rowIndex=${rIdx}&t=${Date.now()}`).then((r) => r.json())
  );

  Promise.all(fetchPromises)
    .then((results) => {
      btnConfirm.innerText = origBtnText;
      btnConfirm.disabled = false;

      let foundLegionData = null;
      let matchedRowIndex = targetGroup.rowIndices[targetGroup.rowIndices.length - 1];
      let matchedAuthor = targetGroup.authors[0] || (currentUser ? currentUser.displayName : "指揮官");

      results.forEach((res, idx) => {
        if (res.status === "success" && res.payload) {
          const p = res.payload;
          const rIdx = targetGroup.rowIndices[idx];

          if (p.legions && p.legions[selectedLegion] && Object.keys(p.legions[selectedLegion]).length > 0) {
            foundLegionData = p.legions[selectedLegion];
            matchedRowIndex = rIdx;
            if (res.author) matchedAuthor = res.author;
          } else if (!p.legions && p.buildings && selectedLegion === "LegionA") {
            foundLegionData = p;
            matchedRowIndex = rIdx;
            if (res.author) matchedAuthor = res.author;
          }
        }
      });

      const legionLabel = selectedLegion === "LegionB" ? "軍團 2" : "軍團 1";

      if (foundLegionData && foundLegionData.buildings) {
        const defaultB = { b0: [], b1: [], b2: [], b3: [], b4: [], b5: [], b6: [], b7: [] };
        currentData.buildings = Object.assign(defaultB, foundLegionData.buildings);
        currentData.manualGatherText = foundLegionData.manualGatherText || "";
        currentData.manualAmmoText = foundLegionData.manualAmmoText || "";
        currentData.substituteList = foundLegionData.substituteList || [];
      } else {
        currentData.buildings = { b0: [], b1: [], b2: [], b3: [], b4: [], b5: [], b6: [], b7: [] };
        currentData.manualGatherText = "";
        currentData.manualAmmoText = "";
        currentData.substituteList = [];
        alert(`ℹ️ 此場次目前尚未建立「${legionLabel}」的分配資料。\n\n您現在可以直接輸入名單進行分配，發布時將會自動合併至此場次！`);
      }

      document.getElementById("gatherInput").value = currentData.manualGatherText;
      document.getElementById("ammoInput").value = currentData.manualAmmoText;

      currentEditingRowIndex = matchedRowIndex;
      currentEditingLegion = selectedLegion;
      currentEditingTitle = targetGroup.title;
      currentEditingAuthor = matchedAuthor;

      document.getElementById("publishLegionSelect").value = selectedLegion;
      document.getElementById("publishTitleInput").value = currentEditingTitle;
      document.getElementById("publishAuthorInput").value = currentEditingAuthor;

      document.getElementById("editingNoticeText").innerText = `✏️ 正在編輯：[${legionLabel}] ${targetGroup.title}（發布時將自動覆蓋更新）`;
      document.getElementById("editingNoticeBar").style.display = "flex";

      closeLoadHistoryModal();
      renderAll();
      const resSec = document.getElementById("resultSection");
      resSec.style.display = "block";
      resSec.scrollIntoView({ behavior: "smooth", block: "start" });
    })
    .catch((err) => {
      btnConfirm.innerText = origBtnText;
      btnConfirm.disabled = false;
      console.error("載入紀錄失敗：", err);
      alert("載入紀錄失敗，請稍後再試！");
    });
}

function exitEditMode() {
  currentEditingRowIndex = null;
  currentEditingTitle = "";
  document.getElementById("editingNoticeBar").style.display = "none";
}

// 9. 發布至雲端
function getNextSundayDateString() {
  const now = new Date();
  const diff = (7 - now.getDay()) % 7;
  const sun = new Date(now);
  sun.setDate(now.getDate() + diff);
  return `${sun.getFullYear()}/${String(sun.getMonth() + 1).padStart(2, "0")}/${String(sun.getDate()).padStart(2, "0")}`;
}

function onPublishEventTypeChange() {
  const type = document.getElementById("publishEventTypeSelect").value;
  const tundraGroup = document.getElementById("tundraDatePickerGroup");
  const titleInput = document.getElementById("publishTitleInput");

  if (type === "foundry") {
    tundraGroup.style.display = "none";
    titleInput.value = `${getNextSundayDateString()} 兵工廠爭奪戰`;
  } else if (type === "tundra") {
    tundraGroup.style.display = "block";
    const picker = document.getElementById("tundraDatePicker");
    titleInput.value = picker.value ? `${picker.value.replace(/-/g, "/")} 雪域兵器聯賽` : "雪域兵器聯賽";
  } else {
    tundraGroup.style.display = "none";
    const d = new Date();
    titleInput.value = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} 測試`;
  }
}

function onTundraDateChange() {
  const val = document.getElementById("tundraDatePicker").value;
  if (val) document.getElementById("publishTitleInput").value = `${val.replace(/-/g, "/")} 雪域兵器聯賽`;
}

function openPublishModal() {
  const eventGroup = document.getElementById("eventTypeGroup");
  const titleInput = document.getElementById("publishTitleInput");
  const authorInput = document.getElementById("publishAuthorInput");

  if (currentEditingRowIndex) {
    eventGroup.style.display = "none";
    document.getElementById("tundraDatePickerGroup").style.display = "none";
    titleInput.value = currentEditingTitle;
    authorInput.value = currentEditingAuthor;
  } else {
    eventGroup.style.display = "block";
    document.getElementById("publishEventTypeSelect").value = "foundry";
    onPublishEventTypeChange();
    if (currentUser) authorInput.value = currentUser.displayName;
  }

  document.getElementById("publishModal").style.display = "flex";
}

function closePublishModal() {
  document.getElementById("publishModal").style.display = "none";
}

function submitToGoogleSheet() {
  const title = document.getElementById("publishTitleInput").value.trim();
  const author = document.getElementById("publishAuthorInput").value.trim() || "指揮官";
  const activeLegion = document.getElementById("publishLegionSelect").value;

  if (!title) {
    alert("請輸入紀錄標題！");
    return;
  }

  const btn = document.getElementById("btnConfirmPublish");
  const orig = btn.innerText;
  btn.innerText = "發布中...";
  btn.disabled = true;

  const legionData = {
    summary: {
      totalPeople: currentData.totalPeople,
      totalPower: currentData.totalPower,
      avgPower: currentData.avgPower
    },
    buildings: currentData.buildings,
    manualGatherText: currentData.manualGatherText,
    manualAmmoText: currentData.manualAmmoText,
    substituteList: currentData.substituteList || [],
    copyTextZht: getFormattedText(false),
    copyTextEn: getFormattedText(true)
  };

  const payload = {
    action: "publish",
    title,
    author,
    passcode: "",
    activeLegion,
    legions: { [activeLegion]: legionData }
  };

  if (currentEditingRowIndex) payload.rowIndex = currentEditingRowIndex;

  fetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then((res) => res.json())
    .then((res) => {
      btn.innerText = orig;
      btn.disabled = false;
      closePublishModal();
      const actionMsg = res.merged ? "已合併更新至同場次紀錄！" : "發布成功！";
      alert(`✅ ${actionMsg}\n[${activeLegion === "LegionB" ? "軍團 2" : "軍團 1"}] ${title}`);
      exitEditMode();
    })
    .catch(() => {
      btn.innerText = orig;
      btn.disabled = false;
      closePublishModal();
      alert("✅ 已送出發布請求！");
    });
}

// 10. 測試用資料（右側補滿 26 位參戰人員）
function InputTestData() {
  document.getElementById("leaderName0").value = "炙炎梵天";
  document.getElementById("leaderName1").value = "Classic 陀螺";
  document.getElementById("leaderName2").value = "AKB";
  document.getElementById("leaderName3").value = "SleepJay 胖虎";
  document.getElementById("leaderPower0").value = "40000";
  document.getElementById("leaderPower1").value = "50000";
  document.getElementById("leaderPower2").value = "35000";
  document.getElementById("leaderPower3").value = "38000";
  document.getElementById("memberInput").value = [
    "TSENG 18888",
    "Oliver 14891",
    "Liam 14732",
    "James 14612",
    "Lucas 14423",
    "Alexander 14380",
    "Noah 14158",
    "Benjamin 14073",
    "Charlotte 13945",
    "Mia 13805",
    "Harper 13629",
    "Emma 13540",
    "Amelia 13418",
    "Isabella 13290",
    "Ava 13167",
    "Sophia 13089",
    "Ethan 12850",
    "Mason 12610",
    "Logan 12340",
    "Elijah 11980",
    "Aiden 11650",
    "Jackson 11320",
    "Evelyn 10890",
    "Abigail 10450",
    "Emily 9980",
    "Madison 9620"
  ].join("\n");
}

// 11. 戰前報名系統一鍵匯入與兼職戰力分流
let cachedImportResponses = [];

async function openImportSignupModal() {
  document.getElementById("importSignupModal").style.display = "flex";
  document.getElementById("importPreviewBox").innerText = "⏳ 正在讀取雲端報名資料...";
  await onImportFormChange(true);
}

async function onImportFormChange(isInit = false) {
  const selectEl = document.getElementById("importFormSelect");
  const formId = isInit ? "" : selectEl.value;

  try {
    const res = await fetch(
      `${GAS_WEB_APP_URL}?action=getSignupData&formId=${encodeURIComponent(formId)}&t=${Date.now()}`
    );
    const data = await res.json();

    if (isInit && data.forms) {
      selectEl.innerHTML = "";
      for (let i = data.forms.length - 1; i >= 0; i--) {
        const f = data.forms[i];
        const opt = document.createElement("option");
        opt.value = f.formId;
        opt.innerText = f.title;
        selectEl.appendChild(opt);
      }
      if (data.activeForm) selectEl.value = data.activeForm.formId;
    }

    cachedImportResponses = data.responses || [];
    previewImportedSignups();
  } catch (err) {
    document.getElementById("importPreviewBox").innerText = "讀取失敗，請檢查網路連線";
  }
}

function classifySignupsByPower(legion) {
  // 取得左側已設定的正/副隊長名單，避免重複排入
  const leaders = new Set();
  for (let i = 0; i < 4; i++) {
    const l = document.getElementById(`leaderName${i}`).value.trim();
    const v = document.getElementById(`viceName${i}`).value.trim();
    if (l) leaders.add(l);
    if (v) leaders.add(v);
  }

  const allInLegion = cachedImportResponses.filter((r) => r.legion === legion);
  const subs = allInLegion
    .filter((r) => r.attendance === "sub")
    .sort((a, b) => b.power - a.power);

  // 所有非替補且非正/副隊長的正選成員，全數進入主平衡名單（建築分配）
  const mainPool = allInLegion
    .filter((r) => r.attendance !== "sub" && !leaders.has(r.playerName))
    .sort((a, b) => b.power - a.power);

  // 兼職指派：戰力 7500 ~ 11000 由高到低挑前 8 人兼任採集
  const gatherPool = mainPool
    .filter((r) => r.power >= 7500 && r.power <= 11000)
    .slice(0, 8);

  // 兼職指派：戰力 < 7500 由高到低挑前 15 人兼任子彈
  const ammoPool = mainPool
    .filter((r) => r.power < 7500)
    .slice(0, 15);

  return { mainPool, gatherPool, ammoPool, subs, allInLegion };
}

function previewImportedSignups() {
  const legion = document.getElementById("importLegionSelect").value;
  const { mainPool, gatherPool, ammoPool, subs, allInLegion } = classifySignupsByPower(legion);

  if (allInLegion.length === 0) {
    document.getElementById("importPreviewBox").innerHTML = "此軍團目前尚無人報名。";
    return;
  }

  const notes = allInLegion
    .filter((r) => r.note || r.attendance === "partial")
    .map((r) => {
      const tag = r.attendance === "partial" ? "[遲到/早退] " : r.attendance === "sub" ? "[替補] " : "";
      const mic = r.voice === "yes" ? "🎙️" : "🔇";
      return `• ${mic} ${r.playerName} (${r.power})：${tag}${r.note}`;
    });

  let html = `
    <strong>共 ${allInLegion.length} 人報名（採集與子彈為兼職指派）：</strong><br>
    🔥 主平衡名單（全員進建築）：<strong>${mainPool.length}</strong> 人<br>
    ⚡ 兼任採集（7,500～11,000 前 8 名）：<strong>${gatherPool.length}</strong> 人<br>
    🎒 兼任子彈（&lt; 7,500 前 15 名）：<strong>${ammoPool.length}</strong> 人<br>
    🔄 替補待命（不分配、顯示於表格）：<strong>${subs.length}</strong> 人
  `;

  if (notes.length > 0) {
    html += `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #243049; color:#fbbf24;"><strong>特別提醒與備註：</strong><br>${notes.join("<br>")}</div>`;
  }

  document.getElementById("importPreviewBox").innerHTML = html;
}

function applyImportedSignups() {
  const legion = document.getElementById("importLegionSelect").value;
  const { mainPool, gatherPool, ammoPool, subs, allInLegion } = classifySignupsByPower(legion);

  if (allInLegion.length === 0) {
    alert("此軍團目前尚無人報名！");
    return;
  }

  document.getElementById("memberInput").value = mainPool
    .map((r) => `${r.playerName} ${r.power}`)
    .join("\n");
  document.getElementById("gatherInput").value = gatherPool
    .map((r) => r.playerName)
    .join("\n");
  document.getElementById("ammoInput").value = ammoPool
    .map((r) => r.playerName)
    .join("\n");

  // 存入替補名單（不參與分配，僅顯示在結果表格與文字公告中）
  currentData.substituteList = subs.map((s) => ({
    name: s.playerName,
    power: s.power,
    note: s.note || ""
  }));

  document.getElementById("publishLegionSelect").value = legion;
  document.getElementById("importSignupModal").style.display = "none";

  alert(
    `✅ 匯入完成！\n\n` +
      `🔥 主平衡名單（全員進建築）：${mainPool.length} 人\n` +
      `⚡ 兼任採集小隊：${gatherPool.length} 人\n` +
      `🎒 兼任子彈小隊：${ammoPool.length} 人\n` +
      `🔄 替補待命：${subs.length} 人（已排入表格顯示，不參與分配）\n\n` +
      `確認左側 4 位隊長後，按下「⚡ 立即平衡分配」即可！`
  );
}
