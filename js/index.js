/* ============================================================
   兵工廠人員分配系統 3.0 - 核心邏輯 (index.js)
   ============================================================ */

const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbz-nozNOlqqn3EmBwjDNU_vPkpf6lPiM2RYWFpQ82pd8GCHv-p9Tov4UaWgkrCEleL6/exec";

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
  manualAmmoText: ""
};

let currentEditingRowIndex = null;
let currentEditingLegion = "LegionA";
let currentEditingTitle = "";
let currentEditingAuthor = "";
let historyRecordsList = [];
let isCurrentlyMaintenance = false;

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

// 初始化
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

// 3. 多國語言切換
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

  setText("publishModalHeaderTitle", p.publishHeader);
  setText("lblPublishLegion", p.lblPublishLegion);
  setText("lblPublishEventType", p.lblPublishEventType);
  setText("lblPublishTitle", p.lblPublishTitle);
  setText("lblPublishAuthor", p.lblPublishAuthor);
  setText("btnPublishCancel", p.btnPublishCancel);
  setText("btnConfirmPublish", p.btnConfirmPublish);

  setText("uiLoadHistoryTitle", p.uiLoadHistoryTitle);
  setText("lblLoadHistory", p.lblLoadHistory);
  setText("btnLoadCancel", p.btnLoadCancel);
  setText("btnConfirmLoad", p.btnConfirmLoad);

  if (document.getElementById("resultSection").style.display !== "none") {
    setText("btnPublish", p.btnPublish);
    setText("uiCopyTitle", p.copyTitle);
    setText("btnCopyText", p.btnCopyText);
    setText("uiTweakTitle", p.tweakTitle);
    setText("btnScreenshotText", p.btnScreenshotText);
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

// 4. 名單解析與直接平衡分配 (無多余彈窗)
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
  let totalLeadersPower = 0;

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
    totalLeadersPower += lData.power + (viceObj ? viceObj.power : 0);
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

  document.getElementById("summaryBox").innerHTML = `
    <span>${p.summaryText[0]} <strong>${currentData.totalPeople}</strong></span>
    <span>${p.summaryText[1]} <strong>${currentData.totalPower.toLocaleString()}</strong></span>
    <span>${p.summaryText[2]} <strong>${currentData.avgPower.toLocaleString()}</strong></span>
  `;

  const grid = document.getElementById("buildingGrid");
  grid.innerHTML = "";

  // 特殊小隊卡片
  const createSpecCard = (type, title, label, textVal, badgeIcon) => {
    const card = document.createElement("div");
    card.className = "building-card b-group-spec";
    const arr = textVal ? textVal.split("\n").filter((n) => n.trim()) : [];
    const tagsHtml = arr.map((name, idx) => `
      <div class="player-tag" style="cursor:default;">
        <span>${badgeIcon} ${name.trim()}</span>
        <button class="btn-del-mini" onclick="removePlayer('${type}', ${idx}, event)" title="移除">✕</button>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="building-title">${title}</div>
      <div class="building-power">${label}</div>
      <div class="drop-zone">${tagsHtml}</div>
      <div class="inline-add-row">
        <input type="text" class="in-name" id="inName_${type}" placeholder="${isEn ? "Add name..." : "輸入名字..."}" onkeydown="if(event.key==='Enter') inlineAddPlayer('${type}')" />
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
      const delBtn = !isLocked ? `<button class="btn-del-mini" onclick="removePlayer('${b.id}', ${pIdx}, event)" title="移除">✕</button>` : "";

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
        <input type="text" class="in-name" id="inName_${b.id}" placeholder="${isEn ? "Name" : "名字"}" onkeydown="if(event.key==='Enter') inlineAddPlayer('${b.id}')" />
        <input type="number" class="in-power" id="inPower_${b.id}" placeholder="${isEn ? "Power" : "戰力"}" onkeydown="if(event.key==='Enter') inlineAddPlayer('${b.id}')" />
        <button type="button" class="btn-inline-add" onclick="inlineAddPlayer('${b.id}')">+</button>
      </div>
    `;

    grid.appendChild(card);

    if (idx === 3) {
      grid.appendChild(gatherCard);
      grid.appendChild(ammoCard);
    }
  });

  updateTextOutputOnly();
}

// 拖曳交換邏輯
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
  } else {
    out += `【採集小隊】：${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (無)"}\n`;
    out += `【子彈小隊】：${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (無)"}`;
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

// 7. 乾淨清爽一鍵匯出圖片
function captureBuildingGrid() {
  const btn = document.getElementById("btnScreenshot");
  const origHtml = btn.innerHTML;
  btn.innerText = "⏳ 匯出中...";
  btn.disabled = true;

  const exportWrap = document.createElement("div");
  exportWrap.className = "export-board-wrapper";

  const titleStr = currentEditingTitle || document.getElementById("publishTitleInput").value || "2647 RGN 兵工廠人員分配表";
  exportWrap.innerHTML = `
    <div class="export-header">
      <div class="export-title">${titleStr}</div>
      <div class="export-meta">總人數：${currentData.totalPeople} 人 ｜ 總戰力：${currentData.totalPower.toLocaleString()} ｜ 2647 RGN</div>
    </div>
  `;

  const clonedGrid = document.getElementById("buildingGrid").cloneNode(true);
  exportWrap.appendChild(clonedGrid);
  document.body.appendChild(exportWrap);

  html2canvas(exportWrap, {
    backgroundColor: "#0b0f19",
    scale: 2,
    useCORS: true,
    width: 1360
  }).then((canvas) => {
    const link = document.createElement("a");
    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    link.download = `兵工廠人員分配表_${ts}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    document.body.removeChild(exportWrap);
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }).catch(() => {
    document.body.removeChild(exportWrap);
    btn.innerHTML = origHtml;
    btn.disabled = false;
    alert("匯出圖片失敗，請稍後再試！");
  });
}

// 8. 編輯歷史紀錄（只顯示 [軍團] 標題，無時間戳記，一鍵直達）
function openLoadHistoryModal() {
  fetch(`${GAS_WEB_APP_URL}?action=getHistory&t=${Date.now()}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "empty" || !res.history || res.history.length === 0) {
        alert("雲端目前尚無歷史紀錄！");
        return;
      }
      historyRecordsList = res.history;
      const select = document.getElementById("loadHistorySelect");
      select.innerHTML = "";

      for (let i = historyRecordsList.length - 1; i >= 0; i--) {
        const item = historyRecordsList[i];
        const option = document.createElement("option");
        // 將列號與該筆紀錄的軍團一起綁定在 value 中
        const legionCode = item.activeLegion === "LegionB" ? "LegionB" : "LegionA";
        option.value = `${item.rowIndex}|${legionCode}`;

        let legionTag = "[軍團 1]";
        if (item.activeLegion === "LegionB") legionTag = "[軍團 2]";
        else if (item.activeLegion === "both") legionTag = "[軍團 1 & 2]";

        // 乾淨只顯示：[軍團] 標題 (發布者)，徹底拿掉時間戳記
        option.innerText = `${legionTag} ${item.title} (${item.author})`;
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
  const val = document.getElementById("loadHistorySelect").value;
  if (!val) return;
  const [rowIndexStr, autoLegion] = val.split("|");
  const rowIndex = parseInt(rowIndexStr);

  fetch(`${GAS_WEB_APP_URL}?action=getHistory&rowIndex=${rowIndex}&t=${Date.now()}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success" && res.payload) {
        const payload = res.payload;
        const selectedLegion = payload.activeLegion || autoLegion || "LegionA";
        const legionData = (payload.legions && payload.legions[selectedLegion]) ? payload.legions[selectedLegion] : payload;

        if (legionData.buildings) currentData.buildings = legionData.buildings;
        currentData.manualGatherText = legionData.manualGatherText || "";
        currentData.manualAmmoText = legionData.manualAmmoText || "";

        document.getElementById("gatherInput").value = currentData.manualGatherText;
        document.getElementById("ammoInput").value = currentData.manualAmmoText;

        currentEditingRowIndex = rowIndex;
        currentEditingLegion = selectedLegion;
        currentEditingTitle = res.title || "";
        currentEditingAuthor = res.author || (currentUser ? currentUser.displayName : "指揮官");

        document.getElementById("publishLegionSelect").value = selectedLegion;
        document.getElementById("publishTitleInput").value = currentEditingTitle;
        document.getElementById("publishAuthorInput").value = currentEditingAuthor;

        const legionLabel = selectedLegion === "LegionB" ? "軍團 2" : "軍團 1";
        document.getElementById("editingNoticeText").innerText = `✏️ 正在編輯：[${legionLabel}] ${res.title}（發布時將直接覆蓋更新）`;
        document.getElementById("editingNoticeBar").style.display = "flex";

        closeLoadHistoryModal();
        renderAll();
        const resSec = document.getElementById("resultSection");
        resSec.style.display = "block";
        resSec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    })
    .catch(() => alert("載入紀錄失敗"));
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
    .then(() => {
      btn.innerText = orig;
      btn.disabled = false;
      closePublishModal();
      alert(`✅ 發布成功！\n[${activeLegion === "LegionB" ? "軍團 2" : "軍團 1"}] ${title}`);
      exitEditMode();
    })
    .catch(() => {
      btn.innerText = orig;
      btn.disabled = false;
      closePublishModal();
      alert("✅ 已送出發布請求！");
    });
}

function InputTestData() {
  document.getElementById("leaderName0").value = "炙炎梵天";
  document.getElementById("leaderName1").value = "Classic 陀螺";
  document.getElementById("leaderName2").value = "AKB";
  document.getElementById("leaderName3").value = "SleepJay 胖虎";
  document.getElementById("leaderPower0").value = "40000";
  document.getElementById("leaderPower1").value = "50000";
  document.getElementById("leaderPower2").value = "35000";
  document.getElementById("leaderPower3").value = "38000";
  document.getElementById("memberInput").value =
    "TSENG 8888\nSophia 3089\nLiam 4732\nEmma 3540\nOliver 4891\nAva 3167\nLucas 4423\nMia 3805\nNoah 4158\nIsabella 3290\nJames 4612\nCharlotte 3945\nAlexander 4380\nAmelia 3418\nBenjamin 4073\nHarper 3629";
}
