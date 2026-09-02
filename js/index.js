/* ============================================================
   兵工廠人員分配系統 - 核心業務邏輯 v3.0 (index.js)
   依賴：需先載入 js/118n.js
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
  unassignedPool: [],
  manualGatherText: "",
  manualAmmoText: ""
};

let currentEditingRowIndex = null;
let currentEditingLegion = "LegionA";
let currentEditingTitle = "";
let currentEditingAuthor = "";
let historyRecordsList = [];
let isCurrentlyMaintenance = false;
let quickAddTarget = null;

// 1. 全域系統狀態與公告檢查
async function checkSystemStatus() {
  try {
    const res = await fetch(
      `${GAS_WEB_APP_URL}?action=getSystemConfig&t=${new Date().getTime()}`,
    );
    const data = await res.json();
    const status = data.systemStatus || data.system_status || data.status || "active";
    const annText = (data.announcement || "").trim();

    const overlay = document.getElementById("fullscreenOverlay");
    const title = document.getElementById("overlayTitle");
    const msg = document.getElementById("overlayMessage");
    const btnReload = document.getElementById("btnOverlayReload");

    if (status === "offline" || status === "maintenance") {
      isCurrentlyMaintenance = true;
      if (overlay) overlay.style.display = "flex";

      if (status === "offline") {
        if (title) title.innerText = "⛔ 系統目前已關閉";
        if (msg) msg.innerHTML = "系統目前暫停對外開放，請聯繫最高管理員！";
      } else {
        if (title) title.innerText = "🔧 系統維修中";
        if (msg)
          msg.innerHTML =
            "系統目前正在進行維護升級，請稍後再試！<br><span style='font-size:0.85rem; color:#94a3b8;'>（系統每 60 秒會自動嘗試連線檢查）</span>";
      }
      return false;
    } else {
      if (isCurrentlyMaintenance) {
        if (title) title.innerText = "🟢 系統維護完成";
        if (msg) msg.innerHTML = "系統已成功恢復運行，請點擊下方按鈕重新載入畫面！";
        if (btnReload) btnReload.style.display = "inline-block";
      } else {
        if (overlay) overlay.style.display = "none";
      }
      isCurrentlyMaintenance = false;
    }

    if (annText && !sessionStorage.getItem("ann_shown")) {
      alert(`📢 系統公告：\n${annText}`);
      sessionStorage.setItem("ann_shown", "true");
    }
    return true;
  } catch (err) {
    console.warn("狀態檢查連線異常，保持預設開放：", err);
    isCurrentlyMaintenance = false;
    return true;
  }
}

// 2. 身分驗證邏輯
async function handleIndexLogin() {
  const p = (window.langPack && langPack[currentData.currentLang]) || {};
  const account = document.getElementById("loginAccount").value.trim();
  const passkey = document.getElementById("loginPasskey").value.trim();
  const errorEl = document.getElementById("loginErrorMsg");

  if (!account || !passkey) {
    errorEl.textContent = p.loginEmptyError || "請輸入幹部帳號與通行密碼";
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
      errorEl.textContent = result.message || "帳號或密碼錯誤！";
    }
  } catch (err) {
    errorEl.textContent = p.loginNetworkError || "連線驗證失敗，請檢查網路後再試。";
  }
}

function handleIndexLogout() {
  sessionStorage.removeItem("wos_admin_user");
  currentUser = null;
  location.reload();
}

function unlockSystemUI() {
  const loginOverlay = document.getElementById("indexLoginOverlay");
  if (loginOverlay) loginOverlay.style.display = "none";

  const intro = document.getElementById("intro");
  const mainContent = document.getElementById("main-content");
  if (intro) intro.style.display = "flex";

  setTimeout(() => {
    if (intro) intro.style.display = "none";
    if (mainContent) {
      mainContent.style.display = "block";
      setTimeout(() => {
        mainContent.style.opacity = "1";
      }, 50);
    }
  }, 1000);

  updateUserBadge();

  const authorInput = document.getElementById("publishAuthorInput");
  if (authorInput && currentUser) {
    authorInput.value = currentUser.displayName;
  }
}

function updateUserBadge() {
  const badge = document.getElementById("userBadge");
  if (badge && currentUser) {
    const isEn = currentData.currentLang === "en";
    const roleText = currentUser.role === "supreme" 
      ? (isEn ? "Supreme Admin" : "最高管理員") 
      : (isEn ? "Admin" : "管理員");
    badge.textContent = `👤 ${currentUser.displayName} [${roleText}]`;
  }
}

// 3. 系統初始化 (載入偏好語言、狀態檢查與登入檢查)
window.addEventListener("load", async function () {
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

function toggleViceAccordion() {
  const acc = document.getElementById("viceAccordion");
  if (acc) acc.classList.toggle("closed");
}

function handlePowerEnter(event, currentIdx) {
  if (event.key === "Enter") {
    event.preventDefault();
    let nextFocusField = null;
    for (let i = 1; i <= 4; i++) {
      let checkIdx = (currentIdx + i) % 4;
      let val = document.getElementById(`leaderPower${checkIdx}`).value.trim();
      if (val === "") {
        nextFocusField = document.getElementById(`leaderPower${checkIdx}`);
        break;
      }
    }
    if (nextFocusField) nextFocusField.focus();
    else document.getElementById("memberInput").focus();
  }
}

// 4. 多國語系切換 (全面支援各彈窗與動態按鈕)
function changeLanguage(lang) {
  if (typeof langPack === "undefined" || !langPack[lang]) {
    console.warn("字典檔尚未載入完成或缺少語系：", lang);
    return;
  }

  currentData.currentLang = lang;
  currentData.copyLang = lang;
  localStorage.setItem("wos_pref_lang", lang);
  const p = langPack[lang];
  const isZht = (lang === "zht");

  // 同步切換所有語言按鈕狀態
  const toggleActive = (id, condition) => {
    const el = document.getElementById(id);
    if (el) {
      if (condition) el.classList.add("active");
      else el.classList.remove("active");
    }
  };

  toggleActive("btnLangZht", isZht);
  toggleActive("btnLangEn", !isZht);
  toggleActive("btnLoginLangZht", isZht);
  toggleActive("btnLoginLangEn", !isZht);
  toggleActive("btnCopyLangZht", isZht);
  toggleActive("btnCopyLangEn", !isZht);

  if (isZht) document.body.classList.remove("lang-en");
  else document.body.classList.add("lang-en");

  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.innerText = text;
  };
  const setElPlaceholder = (id, ph) => {
    const el = document.getElementById(id);
    if (el && ph !== undefined) el.placeholder = ph;
  };

  // 登入介面
  setElText("uiLoginTitle", p.loginTitle);
  setElText("uiLoginSubtitle", p.loginSubtitle);
  setElText("uiLoginAccountLabel", p.loginAccountLabel);
  setElPlaceholder("loginAccount", p.loginAccountPlaceholder);
  setElText("uiLoginPasskeyLabel", p.loginPasskeyLabel);
  setElPlaceholder("loginPasskey", p.loginPasskeyPlaceholder);
  setElText("uiBtnLogin", p.btnLogin);
  setElText("btnLogoutTop", p.btnLogout);

  // 主頁面導航與標題
  setElText("btnMapScreenshot", p.btnMapScreenshot);
  setElText("introText", p.introText);
  setElText("btnHistoryModal", p.btnHistoryModal);
  setElText("btnViewSystem", p.btnViewSystem);
  setElText("btnOldSystem", p.btnOldSystem);
  setElText("btnManageSystem", p.btnManageSystem);
  setElText("btnCancelEdit", p.btnCancelEdit);
  setElText("uiMainTitle", p.mainTitle);
  setElText("uiInfoTitle", p.infoTitle);
  setElText("uiLeaderTitle", p.leaderTitle);
  setElText("uiMemberTitle", p.memberTitle);
  setElText("uiLabelMainList", p.labelMainList);

  const memberDesc = document.getElementById("uiMemberDesc");
  if (memberDesc && p.memberDesc) memberDesc.innerHTML = p.memberDesc;

  setElText("uiLabelGatherList", p.labelGatherList);
  setElText("uiLabelAmmoList", p.labelAmmoList);
  setElPlaceholder("gatherInput", p.gatherPlaceholder);
  setElPlaceholder("ammoInput", p.ammoPlaceholder);
  setElText("btnDistribute", p.btnDistribute);
  setElText("btnLoadTestData", p.btnLoadTestData);
  setElText("uiQuickTitle", p.quickTitle);

  setElText("uiViceAccordionTitle", p.viceAccordionTitle);
  setElText("uiViceNoticeText", p.viceNoticeText);
  if (p.viceLabels) {
    for (let i = 0; i < 4; i++) {
      setElText(`uiLabelVice${i}`, p.viceLabels[i]);
      setElPlaceholder(`viceName${i}`, p.vicePlaceholderName);
      setElPlaceholder(`vicePower${i}`, p.vicePlaceholderPower);
    }
  }
  if (p.labels) {
    for (let i = 0; i < 4; i++) {
      setElText(`uiLabelG${i}`, p.labels[i]);
      setElPlaceholder(`leaderName${i}`, p.placeholders ? p.placeholders.name : "");
      setElPlaceholder(`leaderPower${i}`, p.placeholders ? p.placeholders.power : "");
    }
  }

  // 建築物清單
  const infoList = document.getElementById("uiInfoList");
  if (infoList && p.infoItems) {
    infoList.innerHTML = "";
    p.infoItems.forEach((item) => {
      const li = document.createElement("li");
      li.innerText = item;
      infoList.appendChild(li);
    });
  }

  // 彈窗與設定
  setElText("modalTitle", p.modalTitle);
  setElText("modalDesc", p.modalDesc);
  setElText("btnModalCancel", p.modalCancel);
  setElText("btnModalConfirm", p.modalConfirm);
  setElText("uiChangelogTitle", p.changelogTitle);
  setElText("uiChangelogDesc", p.changelogDesc);
  setElText("btnCloseChangelog", p.btnCloseChangelog);

  setElText("publishModalHeaderTitle", p.publishHeader);
  setElText("lblPublishLegion", p.lblPublishLegion);
  setElText("lblPublishEventType", p.lblPublishEventType);
  setElText("lblPublishTitle", p.lblPublishTitle);
  setElText("lblPublishAuthor", p.lblPublishAuthor);
  setElText("lblPublishPasscode", p.lblPublishPasscode);
  setElText("btnPublishCancel", p.btnPublishCancel);
  setElText("btnConfirmPublish", p.btnConfirmPublish);

  setElText("uiLoadHistoryTitle", p.uiLoadHistoryTitle);
  setElText("lblLoadHistory", p.lblLoadHistory);
  setElText("lblLoadLegion", p.lblLoadLegion);
  setElText("lblLoadPasscode", p.lblLoadPasscode);
  setElText("btnLoadCancel", p.btnLoadCancel);
  setElText("btnConfirmLoad", p.btnConfirmLoad);

  // 變更偵測彈窗 (補齊多語系)
  setElText("uiReallocateTitle", p.reallocateTitle);
  setElText("uiReallocateDesc", p.reallocateDesc);
  setElText("btnAppendNewMembers", p.btnAppendNew);
  setElText("btnTriggerFullReallocate", p.btnFullReallocate);
  setElText("btnReallocateCancel", p.btnReallocateCancel);

  // 快速新增成員彈窗 (補齊多語系)
  setElText("uiAddMemberTitle", p.quickAddTitleDefault);
  setElText("uiQuickAddNameLabel", p.quickAddLabelName);
  setElPlaceholder("quickAddName", p.quickAddPlaceholderName);
  setElText("uiQuickAddPowerLabel", p.quickAddLabelPower);
  setElPlaceholder("quickAddPower", p.quickAddPlaceholderPower);
  setElText("btnQuickAddCancel", p.btnQuickAddCancel);
  setElText("btnQuickAddConfirm", p.btnQuickAddConfirm);

  updateUserBadge();

  // 若結果看板已顯示，重新渲染卡片
  const resultSec = document.getElementById("resultSection");
  if (resultSec && resultSec.style.display !== "none") {
    setElText("btnPublish", p.btnPublish);
    setElText("uiSummaryTitle", p.summaryTitle);
    setElText("uiCopyTitle", p.copyTitle);
    setElText("btnCopyText", p.btnCopyText);
    setElText("uiTweakTitle", p.tweakTitle);
    setElText("btnScreenshotText", p.btnScreenshotText);
    renderAll();
  }
}

function toggleCopyLanguage(lang) {
  currentData.copyLang = lang;
  if (lang === "zht") {
    document.getElementById("btnCopyLangZht").classList.add("active");
    document.getElementById("btnCopyLangEn").classList.remove("active");
  } else {
    document.getElementById("btnCopyLangEn").classList.add("active");
    document.getElementById("btnCopyLangZht").classList.remove("active");
  }
  updateTextOutputOnly();
}

function quickAssignLeader(name) {
  const p = langPack[currentData.currentLang];
  for (let i = 0; i < 4; i++) {
    if (document.getElementById(`leaderName${i}`).value.trim() === name) {
      alert(currentData.currentLang === "zht" ? `「${name}」${p.alertRepeat}` : `"${name}" ${p.alertRepeat}`);
      return;
    }
  }
  for (let i = 0; i < 4; i++) {
    const inputField = document.getElementById(`leaderName${i}`);
    if (inputField.value.trim() === "") {
      inputField.value = name;
      document.getElementById(`leaderPower${i}`).focus();
      return;
    }
  }
  alert(p.alertFull);
}

function parseLines(text) {
  let results = [];
  const lines = text.split("\n");
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const lastSpaceIdx = line.lastIndexOf(" ");
    if (lastSpaceIdx !== -1) {
      const name = line.substring(0, lastSpaceIdx).trim();
      const power = parseInt(line.substring(lastSpaceIdx).trim());
      if (!isNaN(power)) {
        results.push({ name, power });
        continue;
      }
    }
    results.push({ name: line, power: 0 });
  }
  return results;
}

function parseCurrentInputs() {
  let parsed = {
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

  parseLines(document.getElementById("memberInput").value).forEach((p) => {
    parsed.mainMembers.push(p);
    parsed.uniqueNames.add(p.name);
  });
  parseLines(document.getElementById("gatherInput").value).forEach((p) => {
    parsed.gatherMembers.push(p);
    parsed.uniqueNames.add(p.name);
  });
  parseLines(document.getElementById("ammoInput").value).forEach((p) => {
    parsed.ammoMembers.push(p);
    parsed.uniqueNames.add(p.name);
  });

  return parsed;
}

function getAllCurrentAssignedNames() {
  const names = new Set();
  buildingsConfig.forEach((b) => {
    (currentData.buildings[b.id] || []).forEach((p) => names.add(p.name));
  });
  (currentData.unassignedPool || []).forEach((p) => names.add(p.name));
  return names;
}

function openConfirmationModal() {
  document.getElementById("errorMessage").style.display = "none";
  if (!validateInputs()) return;

  const p = langPack[currentData.currentLang];
  const resultVisible = document.getElementById("resultSection").style.display !== "none";

  if (resultVisible) {
    const pool = parseCurrentInputs();
    const assignedNames = getAllCurrentAssignedNames();
    const newMembers = pool.mainMembers.filter((m) => !assignedNames.has(m.name));

    const previewBox = document.getElementById("newMembersListPreview");
    if (newMembers.length > 0) {
      previewBox.innerHTML =
        `<strong>${p.reallocateDetectPrefix}${newMembers.length}${p.reallocateDetectSuffix}</strong><br>` +
        newMembers.map((m) => `${m.name} (${m.power})`).join("、");
    } else {
      previewBox.innerHTML = p.reallocateNoNew;
    }
    document.getElementById("reallocateModal").style.display = "flex";
    return;
  }

  const data = parseCurrentInputs();
  const totalCount = data.uniqueNames.size;

  if (totalCount < 15) {
    showError(
      currentData.currentLang === "zht"
        ? `錯誤：目前去重後總報名人數為 ${totalCount} 人，未達參戰基本門檻（15人以上）！`
        : `Error: Total unique players is ${totalCount}, which is below the required 15 players!`,
    );
    return;
  }

  const dataBox = document.getElementById("modalDataContent");
  let html = `<strong>${p.overviewTitle}</strong><br>${p.overviewCountText}${totalCount}${p.overviewCountUnit}<br><br>`;
  html += `<strong>${p.leaderPreviewTitle}</strong><br>`;
  data.leaders.forEach((l, idx) => {
    const vObj = data.viceLeaders[idx];
    const viceText = vObj.name ? ` [副: ${vObj.name} (${vObj.power})]` : "";
    html += `${p.leaderGText}${idx + 1}${p.leaderGUnit}${l.name || p.emptyText} (${l.power || 0})${viceText}<br>`;
  });
  html += `<br><strong>${p.mainPoolTitle}${data.mainMembers.length}${p.poolUnit}</strong><br>`;
  html += data.mainMembers.map((m) => m.name).join("、") || p.emptyText;
  html += `<br><br><strong style="color:#ffb300;">${p.gatherPoolTitle}${data.gatherMembers.length}${p.poolUnit}</strong><br>`;
  html += data.gatherMembers.map((m) => m.name).join("、") || p.emptyText;
  html += `<br><br><strong style="color:#ff3838;">${p.ammoPoolTitle}${data.ammoMembers.length}${p.poolUnit}</strong><br>`;
  html += data.ammoMembers.map((m) => m.name).join("、") || p.emptyText;

  dataBox.innerHTML = html;
  document.getElementById("confirmModal").style.display = "flex";
}

function closeConfirmationModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function closeReallocateModal() {
  document.getElementById("reallocateModal").style.display = "none";
}

function openChangelogModal() {
  document.getElementById("changelogModal").style.display = "flex";
}
function closeChangelogModal() {
  document.getElementById("changelogModal").style.display = "none";
}

function confirmAndAllocate() {
  closeConfirmationModal();
  triggerAllocation();
}

function triggerFullReallocate() {
  closeReallocateModal();
  currentData.unassignedPool = [];
  triggerAllocation();
}

function appendNewMembersOnly() {
  closeReallocateModal();
  const pool = parseCurrentInputs();
  const assignedNames = getAllCurrentAssignedNames();

  const newMembers = pool.mainMembers.filter((m) => !assignedNames.has(m.name));

  if (newMembers.length === 0) {
    alert("⚠️ 沒有偵測到新的待分配人員！");
    return;
  }

  newMembers.forEach((m) => {
    currentData.unassignedPool.push({
      name: m.name,
      power: m.power,
      isLeader: false,
      isVice: false,
      isManualLeader: false,
      isManualVice: false,
    });
  });

  currentData.manualGatherText = document.getElementById("gatherInput").value.trim();
  currentData.manualAmmoText = document.getElementById("ammoInput").value.trim();

  renderAll();
  alert(`✅ 已將 ${newMembers.length} 位新成員加入表格下方的「待分配新進人員」暫存區，請直接拖曳進行指派！`);
}

function triggerAllocation() {
  document.getElementById("resultSection").style.display = "none";
  const shimmer = document.getElementById("shimmerLoader");
  shimmer.innerHTML = "";

  const container = document.createElement("div");
  container.style.cssText = "display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0;";

  const preloadImage = document.getElementById("preloadGif");
  if (preloadImage) {
    const activeGif = preloadImage.cloneNode(true);
    activeGif.style.cssText = "width: 250px; height: auto; border-radius: 4px;";
    container.appendChild(activeGif);
  } else {
    container.innerHTML = `<img src="https://jeremytseng12.github.io/2647WOSFOUNDRY/media/loading.gif" style="width: 250px; height: auto; border-radius: 4px;" />`;
  }

  shimmer.appendChild(container);
  shimmer.style.display = "block";
  shimmer.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    shimmer.style.display = "none";
    distributeMembers();
  }, 2000);
}

function validateInputs() {
  const isEn = currentData.currentLang === "en";
  const leaderNamesSet = new Set();

  for (let i = 0; i < 4; i++) {
    const name = document.getElementById(`leaderName${i}`).value.trim();
    const power = parseInt(document.getElementById(`leaderPower${i}`).value);

    if (!name) {
      showError(isEn ? `Please enter the leader name for Group ${i + 1}!` : `請填寫第 ${i + 1} 組的隊長名字！`);
      return false;
    }
    if (isNaN(power)) {
      showError(isEn ? `Please enter the power for leader "${name}"!` : `請填寫隊長「${name}」的戰力數值！`);
      return false;
    }
    if (power < 4000) {
      showError(isEn ? `Error: Leader "${name}" power is below 4000!` : `錯誤：隊長「${name}」戰力低於 4000！`);
      return false;
    }
    leaderNamesSet.add(name);
  }

  for (let i = 0; i < 4; i++) {
    const vName = document.getElementById(`viceName${i}`).value.trim();
    const vPower = parseInt(document.getElementById(`vicePower${i}`).value);

    if (vName) {
      if (leaderNamesSet.has(vName)) {
        showError(isEn ? `Error: Vice-CDR "${vName}" is already assigned as a CDR!` : `防呆警告：「${vName}」已被指派為正隊長，無法重複設為副隊長！`);
        return false;
      }
      if (isNaN(vPower) || vPower <= 0) {
        showError(isEn ? `Please enter power for Vice-CDR "${vName}"!` : `請填寫副隊長「${vName}」的戰力數值！`);
        return false;
      }
      leaderNamesSet.add(vName);
    }
  }

  const mainLines = parseLines(document.getElementById("memberInput").value);
  for (let m of mainLines) {
    if (leaderNamesSet.has(m.name)) {
      showError(isEn ? `Error: CDR/V-CDR "${m.name}" appears in the main balancing list!` : `防呆警告：隊長/副隊長「${m.name}」重複出現在「1. 主平衡分配名單」！系統已自動包含隊長，請自主名單中移除。`);
      return false;
    }
  }

  const gatherLines = parseLines(document.getElementById("gatherInput").value);
  for (let g of gatherLines) {
    if (leaderNamesSet.has(g.name)) {
      showError(isEn ? `Error: CDR/V-CDR "${g.name}" appears in the Gathering Squad list!` : `防呆警告：隊長/副隊長「${g.name}」重複出現在「2. 採集小隊名單」！`);
      return false;
    }
  }

  const ammoLines = parseLines(document.getElementById("ammoInput").value);
  for (let a of ammoLines) {
    if (leaderNamesSet.has(a.name)) {
      showError(isEn ? `Error: CDR/V-CDR "${a.name}" appears in the Ammo Squad list!` : `防呆警告：隊長/副隊長「${a.name}」重複出現在「3. 子彈小隊名單」！`);
      return false;
    }
  }

  return true;
}

function distributeMembers() {
  currentData.copyLang = currentData.currentLang;
  currentData.buildings = { b0: [], b1: [], b2: [], b3: [], b4: [], b5: [], b6: [], b7: [] };
  currentData.unassignedPool = [];

  let groups = [];
  let totalLeadersPower = 0;
  let pool = parseCurrentInputs();

  for (let i = 0; i < 4; i++) {
    let lData = pool.leaders[i];
    let leaderObj = {
      name: lData.name,
      power: lData.power,
      isLeader: true,
      isVice: false,
      isManualLeader: true,
      isManualVice: false,
    };

    let manualViceObj = null;
    let vData = pool.viceLeaders[i];
    if (vData.name && vData.power > 0) {
      manualViceObj = {
        name: vData.name,
        power: vData.power,
        isLeader: false,
        isVice: true,
        isManualLeader: false,
        isManualVice: true,
      };
      totalLeadersPower += vData.power;
    }

    groups.push({
      index: i,
      leader: leaderObj,
      manualVice: manualViceObj,
      members: [],
      totalPower: lData.power + (manualViceObj ? manualViceObj.power : 0),
    });
    totalLeadersPower += lData.power;
  }

  let totalMembersPower = 0;
  pool.mainMembers.forEach((m) => {
    totalMembersPower += m.power;
  });

  currentData.totalPeople = pool.uniqueNames.size;
  currentData.totalPower = totalLeadersPower + totalMembersPower;
  currentData.avgPower = Math.round(currentData.totalPower / 4);

  let sortedMain = [...pool.mainMembers].sort((a, b) => b.power - a.power);
  for (let member of sortedMain) {
    groups.sort((a, b) => a.totalPower - b.totalPower);
    groups[0].members.push({
      name: member.name,
      power: member.power,
      isLeader: false,
      isVice: false,
      isManualLeader: false,
      isManualVice: false,
    });
    groups[0].totalPower += member.power;
  }
  groups.sort((a, b) => a.index - b.index);

  groups.forEach((g) => {
    let allPeopleInGroup = [g.leader];
    if (g.manualVice) allPeopleInGroup.push(g.manualVice);
    g.members.forEach((m) => allPeopleInGroup.push(m));

    const bId1 = `b${g.index * 2}`;
    const bId2 = `b${g.index * 2 + 1}`;
    allPeopleInGroup.forEach((person, idx) => {
      if (idx % 2 === 0) currentData.buildings[bId1].push(person);
      else currentData.buildings[bId2].push(person);
    });
  });

  currentData.manualGatherText = document.getElementById("gatherInput").value.trim();
  currentData.manualAmmoText = document.getElementById("ammoInput").value.trim();

  renderAll();
  const resSec = document.getElementById("resultSection");
  resSec.style.display = "block";
  resSec.classList.add("fade-in-view");
  resSec.scrollIntoView({ behavior: "smooth", block: "start" });
  if (currentData.currentLang === "en") changeLanguage("en");
}

function getFormattedText(isEn) {
  let textOutput = "";
  buildingsConfig.forEach((b) => {
    const bName = isEn ? b.nameEn : b.nameZht;
    let formattedNames = (currentData.buildings[b.id] || []).map((player) => player.name);
    textOutput += `${bName}～ ${formattedNames.join(" & ")}\n`;
  });

  textOutput += "========================\n";

  if (isEn) {
    textOutput += `[Gathering Squad]:${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (None)"}\n`;
    textOutput += `[Ammo Squad]:${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (None)"}`;
  } else {
    textOutput += `【採集小隊】：${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (無)"}\n`;
    textOutput += `【子彈小隊】：${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (無)"}`;
  }
  return textOutput.trim();
}

function updateTextOutputOnly() {
  let textOutput = "";
  const isEn = currentData.copyLang === "en";

  buildingsConfig.forEach((b) => {
    const bName = isEn ? b.nameEn : b.nameZht;
    let formattedNames = (currentData.buildings[b.id] || []).map((player) => player.name);
    textOutput += `${bName}～ ${formattedNames.join(" & ")}\n`;
  });

  textOutput += "========================\n";

  if (isEn) {
    textOutput += `[Gathering Squad]:${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (None)"}\n`;
    textOutput += `[Ammo Squad]:${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (None)"}`;
  } else {
    textOutput += `【採集小隊】：${currentData.manualGatherText ? "\n" + currentData.manualGatherText : " (無)"}\n`;
    textOutput += `【子彈小隊】：${currentData.manualAmmoText ? "\n" + currentData.manualAmmoText : " (無)"}`;
  }

  document.getElementById("copyTextarea").value = textOutput.trim();
}

function reorderCommanders() {
  buildingsConfig.forEach((b) => {
    let list = currentData.buildings[b.id];
    if (!list || list.length === 0) return;

    let leaderIdx = list.findIndex((p) => p.isManualLeader || p.isLeader);
    let leaderObj = leaderIdx !== -1 ? list.splice(leaderIdx, 1)[0] : null;

    let manualViceIdx = list.findIndex((p) => p.isManualVice);
    let manualViceObj = manualViceIdx !== -1 ? list.splice(manualViceIdx, 1)[0] : null;

    list.forEach((p) => { p.isVice = false; });
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

function calculateCurrentGridTotals() {
  let totalPower = 0;
  let uniqueNames = new Set();

  buildingsConfig.forEach((b) => {
    (currentData.buildings[b.id] || []).forEach((p) => {
      totalPower += p.power || 0;
      if (p.name) uniqueNames.add(p.name);
    });
  });

  (currentData.unassignedPool || []).forEach((p) => {
    totalPower += p.power || 0;
    if (p.name) uniqueNames.add(p.name);
  });

  let gatherArr = currentData.manualGatherText ? currentData.manualGatherText.split("\n") : [];
  gatherArr.forEach((n) => { if (n.trim()) uniqueNames.add(n.trim()); });

  let ammoArr = currentData.manualAmmoText ? currentData.manualAmmoText.split("\n") : [];
  ammoArr.forEach((n) => { if (n.trim()) uniqueNames.add(n.trim()); });

  currentData.totalPeople = uniqueNames.size;
  currentData.totalPower = totalPower;
  currentData.avgPower = Math.round(totalPower / 4);
}

function toggleAccordionGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle("closed");
}

function removePlayer(sourceId, pIdx, event) {
  if (event) event.stopPropagation();

  if (sourceId === "unassignedPool") {
    currentData.unassignedPool.splice(pIdx, 1);
  } else if (sourceId === "gather") {
    let arr = currentData.manualGatherText ? currentData.manualGatherText.split("\n") : [];
    arr.splice(pIdx, 1);
    currentData.manualGatherText = arr.join("\n");
    document.getElementById("gatherInput").value = currentData.manualGatherText;
  } else if (sourceId === "ammo") {
    let arr = currentData.manualAmmoText ? currentData.manualAmmoText.split("\n") : [];
    arr.splice(pIdx, 1);
    currentData.manualAmmoText = arr.join("\n");
    document.getElementById("ammoInput").value = currentData.manualAmmoText;
  } else if (currentData.buildings[sourceId]) {
    currentData.buildings[sourceId].splice(pIdx, 1);
  }

  renderAll();
}

function openQuickAddModal(targetId) {
  quickAddTarget = targetId;
  const p = langPack[currentData.currentLang];
  const isSpec = targetId === "gather" || targetId === "ammo";
  document.getElementById("quickAddName").value = "";
  document.getElementById("quickAddPower").value = "";
  document.getElementById("quickAddPowerGroup").style.display = isSpec ? "none" : "block";

  let title = p.quickAddTitleDefault;
  if (targetId === "gather") title = p.quickAddTitleGather;
  else if (targetId === "ammo") title = p.quickAddTitleAmmo;
  else {
    const b = buildingsConfig.find((item) => item.id === targetId);
    if (b) {
      const bName = currentData.currentLang === "en" ? b.nameEn : b.nameZht;
      title = `${p.quickAddTitlePrefix}${bName}`;
    }
  }

  document.getElementById("uiAddMemberTitle").innerText = title;
  document.getElementById("uiQuickAddNameLabel").innerText = p.quickAddLabelName;
  document.getElementById("quickAddName").placeholder = p.quickAddPlaceholderName;
  document.getElementById("uiQuickAddPowerLabel").innerText = p.quickAddLabelPower;
  document.getElementById("quickAddPower").placeholder = p.quickAddPlaceholderPower;
  document.getElementById("btnQuickAddCancel").innerText = p.btnQuickAddCancel;
  document.getElementById("btnQuickAddConfirm").innerText = p.btnQuickAddConfirm;

  document.getElementById("addMemberQuickModal").style.display = "flex";
  document.getElementById("quickAddName").focus();
}

function closeQuickAddModal() {
  document.getElementById("addMemberQuickModal").style.display = "none";
}

function confirmQuickAdd() {
  const name = document.getElementById("quickAddName").value.trim();
  const power = parseInt(document.getElementById("quickAddPower").value) || 0;

  if (!name) {
    alert("請輸入成員名稱！");
    return;
  }

  if (quickAddTarget === "gather") {
    let cur = document.getElementById("gatherInput").value.trim();
    document.getElementById("gatherInput").value = cur ? `${cur}\n${name}` : name;
    currentData.manualGatherText = document.getElementById("gatherInput").value;
  } else if (quickAddTarget === "ammo") {
    let cur = document.getElementById("ammoInput").value.trim();
    document.getElementById("ammoInput").value = cur ? `${cur}\n${name}` : name;
    currentData.manualAmmoText = document.getElementById("ammoInput").value;
  } else if (currentData.buildings[quickAddTarget]) {
    currentData.buildings[quickAddTarget].push({
      name: name,
      power: power,
      isLeader: false,
      isVice: false,
      isManualLeader: false,
      isManualVice: false,
    });
  }

  closeQuickAddModal();
  renderAll();
}

function createBuildingCardElement(b, p) {
  const card = document.createElement("div");
  card.className = `building-card b-group-${b.gIdx}`;
  card.id = b.id;

  card.addEventListener("dragover", dragOver);
  card.addEventListener("dragenter", dragEnter);
  card.addEventListener("dragleave", dragLeave);
  card.addEventListener("drop", dragDrop);

  let bPower = 0;
  (currentData.buildings[b.id] || []).forEach((pObj) => (bPower += pObj.power));

  let pTagsHtml = "";
  (currentData.buildings[b.id] || []).forEach((player, pIdx) => {
    let roleClass = "";
    let roleLabel = "";
    if (player.isLeader) {
      roleClass = "is-leader";
      roleLabel = `<span class="tag-leader-label">${p.leaderTag}</span>`;
    } else if (player.isVice) {
      roleClass = "is-vice";
      roleLabel = `<span class="tag-vice-label">${p.viceTag}</span>`;
    }

    const isLocked = player.isManualLeader || player.isManualVice;
    const canDrag = !isLocked;
    const dragAttr = canDrag
      ? `draggable="true" ondragstart="dragStart(event, '${b.id}', ${pIdx})"`
      : `draggable="false" style="cursor:not-allowed;" title="${p.lockedLeaderTip}"`;

    const rightHtml = isLocked
      ? `<span class="player-power-val">${player.power || 0}</span>`
      : `
          <span class="player-power-val">${player.power || 0}</span>
          <button class="btn-player-delete" onclick="removePlayer('${b.id}', ${pIdx}, event)" title="${p.deleteBtnTitle}">🗑️</button>
        `;

    pTagsHtml += `
      <div class="player-tag ${roleClass} ${isLocked ? "is-locked" : ""}" ${dragAttr}>
          <span>${roleLabel}${player.name}</span>
          ${rightHtml}
      </div>
    `;
  });

  card.innerHTML = `
    <div class="building-title">${currentData.currentLang === "en" ? b.nameEn : b.nameZht}</div>
    <div class="building-power">${p.buildingPower}<strong>${bPower.toLocaleString()}</strong></div>
    <div class="drop-zone">${pTagsHtml}</div>
    <button class="btn-card-add" onclick="openQuickAddModal('${b.id}')">${p.btnAddMemberCard}</button>
  `;
  return card;
}

function createUnassignedPoolCard(p) {
  const card = document.createElement("div");
  card.className = "building-card b-group-unassigned";
  card.id = "unassignedPool";

  card.addEventListener("dragover", dragOver);
  card.addEventListener("dragenter", dragEnter);
  card.addEventListener("dragleave", dragLeave);
  card.addEventListener("drop", dragDrop);

  let poolTagsHtml = "";
  currentData.unassignedPool.forEach((player, pIdx) => {
    poolTagsHtml += `
      <div class="player-tag" draggable="true" ondragstart="dragStart(event, 'unassignedPool', ${pIdx})">
          <span>🎒 ${player.name}</span>
          <span class="player-power-val">${player.power || 0}</span>
          <button class="btn-player-delete" onclick="removePlayer('unassignedPool', ${pIdx}, event)" title="${p.deleteBtnTitle}">🗑️</button>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="building-title" style="color:#ff66ff;">${p.unassignedTitle} (${currentData.unassignedPool.length}${currentData.currentLang === "en" ? "" : "人"})</div>
    <div class="building-power" style="color:#f0abfc;">${p.unassignedDesc}</div>
    <div class="drop-zone">${poolTagsHtml}</div>
  `;
  return card;
}

function renderAll() {
  reorderCommanders();
  calculateCurrentGridTotals();

  const p = langPack[currentData.currentLang];

  document.getElementById("summaryBox").innerHTML = `
      <p>${p.summaryText[0]} <strong>${currentData.totalPeople}</strong></p>
      <p>${p.summaryText[1]} <strong>${currentData.totalPower.toLocaleString()}</strong></p>
      <p>${p.summaryText[2]} <strong>${currentData.avgPower.toLocaleString()}</strong></p>
  `;

  const grid = document.getElementById("buildingGrid");
  grid.innerHTML = "";

  const isMobileView = window.innerWidth <= 1200;

  const gatherCard = document.createElement("div");
  gatherCard.className = "building-card b-group-spec";
  let gatherArr = currentData.manualGatherText ? currentData.manualGatherText.split("\n") : [];
  let gatherTags = gatherArr
    .map((name, idx) =>
      name.trim()
        ? `
    <div class="player-tag" style="cursor:default;">
      <span>⚡ ${name.trim()}</span>
      <span class="player-power-val"></span>
      <button class="btn-player-delete" onclick="removePlayer('gather', ${idx}, event)" title="${p.deleteBtnTitle}">🗑️</button>
    </div>`
        : "",
    )
    .join("");
  gatherCard.innerHTML = `
    <div class="building-title">${p.specTitleGather}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabel : p.specLabelGather}</div>
    <div class="drop-zone">${gatherTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
    <button class="btn-card-add" onclick="openQuickAddModal('gather')">${p.btnAddGatherMember}</button>
  `;

  const ammoCard = document.createElement("div");
  ammoCard.className = "building-card b-group-spec";
  let ammoArr = currentData.manualAmmoText ? currentData.manualAmmoText.split("\n") : [];
  let ammoTags = ammoArr
    .map((name, idx) =>
      name.trim()
        ? `
    <div class="player-tag" style="cursor:default; border-color:#ff3838;">
      <span>🎒 ${name.trim()}</span>
      <span class="player-power-val"></span>
      <button class="btn-player-delete" onclick="removePlayer('ammo', ${idx}, event)" title="${p.deleteBtnTitle}">🗑️</button>
    </div>`
        : "",
    )
    .join("");
  ammoCard.innerHTML = `
    <div class="building-title">${p.specTitleAmmo}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabelAmmo : p.specLabelAmmo}</div>
    <div class="drop-zone">${ammoTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
    <button class="btn-card-add" onclick="openQuickAddModal('ammo')">${p.btnAddAmmoMember}</button>
  `;

  if (isMobileView) {
    for (let g = 0; g < 4; g++) {
      const groupWrap = document.createElement("div");
      groupWrap.className = "accordion-group";
      groupWrap.id = `accGroup_${g}`;

      const header = document.createElement("div");
      header.className = "accordion-header";
      header.onclick = () => toggleAccordionGroup(`accGroup_${g}`);
      header.innerHTML = `
        <span>▼ ${p.groupTitles[g]}</span>
        <span class="accordion-icon">▲</span>
      `;

      const body = document.createElement("div");
      body.className = "accordion-body";

      const b1 = buildingsConfig[g * 2];
      const b2 = buildingsConfig[g * 2 + 1];

      body.appendChild(createBuildingCardElement(b1, p));
      body.appendChild(createBuildingCardElement(b2, p));

      groupWrap.appendChild(header);
      groupWrap.appendChild(body);
      grid.appendChild(groupWrap);
    }

    const specWrap = document.createElement("div");
    specWrap.className = "accordion-group";
    specWrap.id = "accGroup_spec";

    const specHeader = document.createElement("div");
    specHeader.className = "accordion-header";
    specHeader.onclick = () => toggleAccordionGroup("accGroup_spec");
    specHeader.innerHTML = `
      <span>▼ ${p.groupTitles[4]}</span>
      <span class="accordion-icon">▲</span>
    `;

    const specBody = document.createElement("div");
    specBody.className = "accordion-body";
    specBody.appendChild(gatherCard);
    specBody.appendChild(ammoCard);

    specWrap.appendChild(specHeader);
    specWrap.appendChild(specBody);
    grid.appendChild(specWrap);

    if (currentData.unassignedPool && currentData.unassignedPool.length > 0) {
      grid.appendChild(createUnassignedPoolCard(p));
    }
  } else {
    buildingsConfig.forEach((b, idx) => {
      const card = createBuildingCardElement(b, p);
      grid.appendChild(card);

      if (idx === 3) {
        grid.appendChild(gatherCard);
        grid.appendChild(ammoCard);
      }
    });

    if (currentData.unassignedPool && currentData.unassignedPool.length > 0) {
      const poolCard = createUnassignedPoolCard(p);
      poolCard.style.gridColumn = "span 6";
      grid.appendChild(poolCard);
    }
  }

  updateTextOutputOnly();
}

window.addEventListener("resize", () => {
  if (document.getElementById("resultSection").style.display !== "none") {
    renderAll();
  }
});

let draggedFromBuildingId = null;
let draggedPlayerIdx = null;

function dragStart(e, bId, pIdx) {
  draggedFromBuildingId = bId;
  draggedPlayerIdx = pIdx;
  e.dataTransfer.setData("text/plain", bId);
}
function dragOver(e) { e.preventDefault(); }
function dragEnter(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}
function dragLeave() { this.classList.remove("drag-over"); }

function dragDrop() {
  this.classList.remove("drag-over");
  const targetBuildingId = this.id;

  if (targetBuildingId === "") return;
  if (draggedFromBuildingId === targetBuildingId) return;

  let movingPlayer = null;
  if (draggedFromBuildingId === "unassignedPool") {
    movingPlayer = currentData.unassignedPool.splice(draggedPlayerIdx, 1)[0];
  } else if (currentData.buildings[draggedFromBuildingId]) {
    movingPlayer = currentData.buildings[draggedFromBuildingId].splice(draggedPlayerIdx, 1)[0];
  }

  if (!movingPlayer) return;

  if (!movingPlayer.isManualLeader) {
    movingPlayer.isVice = false;
  }

  if (targetBuildingId === "unassignedPool") {
    currentData.unassignedPool.push(movingPlayer);
  } else if (currentData.buildings[targetBuildingId]) {
    currentData.buildings[targetBuildingId].push(movingPlayer);
  }

  renderAll();
}

function copyTextOutput() {
  const copyTextarea = document.getElementById("copyTextarea");
  copyTextarea.select();
  copyTextarea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(copyTextarea.value);
  alert(langPack[currentData.currentLang].alertSuccess);
}

function showError(msg) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.innerText = msg;
  errorDiv.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function captureBuildingGrid() {
  const btn = document.getElementById("btnScreenshot");
  const originalText = btn.innerText;

  btn.innerText = "⏳ Processing...";
  btn.disabled = true;

  const p = langPack[currentData.currentLang];

  const tempContainer = document.createElement("div");
  tempContainer.className = "capture-grid-forced";

  const watermark = document.createElement("div");
  watermark.className = "capture-watermark";
  watermark.innerText = "2647 RGN";
  tempContainer.appendChild(watermark);

  const smallWatermark = document.createElement("div");
  smallWatermark.className = "capture-bottom-right-watermark";
  smallWatermark.innerText = "TSENG";
  tempContainer.appendChild(smallWatermark);

  const gatherCard = document.createElement("div");
  gatherCard.className = "building-card b-group-spec";
  let gatherArr = currentData.manualGatherText ? currentData.manualGatherText.split("\n") : [];
  let gatherTags = gatherArr
    .map((name) => name.trim() ? `<div class="player-tag" style="cursor:default;"><span>⚡ ${name.trim()}</span></div>` : "")
    .join("");
  gatherCard.innerHTML = `
    <div class="building-title">${p.specTitleGather}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabel : p.specLabelGather}</div>
    <div class="drop-zone">${gatherTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
  `;

  const ammoCard = document.createElement("div");
  ammoCard.className = "building-card b-group-spec";
  let ammoArr = currentData.manualAmmoText ? currentData.manualAmmoText.split("\n") : [];
  let ammoTags = ammoArr
    .map((name) => name.trim() ? `<div class="player-tag" style="border-color:#ff3838;"><span>🎒 ${name.trim()}</span></div>` : "")
    .join("");
  ammoCard.innerHTML = `
    <div class="building-title">${p.specTitleAmmo}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabelAmmo : p.specLabelAmmo}</div>
    <div class="drop-zone">${ammoTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
  `;

  buildingsConfig.forEach((b, idx) => {
    const card = createBuildingCardElement(b, p);
    tempContainer.appendChild(card);

    if (idx === 3) {
      tempContainer.appendChild(gatherCard);
      tempContainer.appendChild(ammoCard);
    }
  });

  // 截圖前自動移除「新增按鈕」與「刪除垃圾桶」
  tempContainer.querySelectorAll(".btn-card-add, .btn-player-delete").forEach((el) => el.remove());

  document.body.appendChild(tempContainer);

  html2canvas(tempContainer, {
    backgroundColor: "#0f1524",
    scale: 2,
    useCORS: true,
    width: 1400,
  })
    .then((canvas) => {
      const link = document.createElement("a");
      const now = new Date();
      const timestamp = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}_${now.getHours()}${now.getMinutes()}`;
      link.download = `兵工廠人員分配表_${timestamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      document.body.removeChild(tempContainer);
      btn.innerText = originalText;
      btn.disabled = false;
    })
    .catch((err) => {
      console.error("截圖失敗：", err);
      alert("截圖失敗，請稍後再試！");
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      btn.innerText = originalText;
      btn.disabled = false;
    });
}

function openLoadHistoryModal() {
  if (!GAS_WEB_APP_URL) {
    alert("請先設定 GAS_WEB_APP_URL！");
    return;
  }

  fetch(`${GAS_WEB_APP_URL}?action=getHistory&t=${new Date().getTime()}`)
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
        option.value = item.rowIndex;
        const lockIcon = item.hasPasscode ? "🔒 " : "";
        option.innerText = `${lockIcon}[${item.updateTime}] ${item.title} (${item.author})`;
        select.appendChild(option);
      }

      document.getElementById("loadPasscodeInput").value = "";
      document.getElementById("loadHistoryModal").style.display = "flex";
    })
    .catch((err) => {
      console.error("無法取得歷史紀錄：", err);
      alert("無法連線至雲端讀取歷史紀錄。");
    });
}

function closeLoadHistoryModal() {
  document.getElementById("loadHistoryModal").style.display = "none";
}

function fetchAndRestoreGridData() {
  const rowIndex = parseInt(document.getElementById("loadHistorySelect").value);
  const selectedLegion = document.getElementById("loadLegionSelect").value;
  const passcode = document.getElementById("loadPasscodeInput").value.trim();

  let url = `${GAS_WEB_APP_URL}?action=getHistory&rowIndex=${rowIndex}&t=${new Date().getTime()}`;
  if (passcode) {
    url += `&passcode=${encodeURIComponent(passcode)}`;
  }

  fetch(url)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "locked") {
        alert("密碼驗證失敗！該紀錄受密碼保護，請輸入正確密碼。");
        return;
      }

      if (res.status === "success" && res.payload) {
        const payload = res.payload;
        let legionData = payload;

        if (payload.legions && payload.legions[selectedLegion]) {
          legionData = payload.legions[selectedLegion];
        }

        if (legionData.buildings) {
          currentData.buildings = legionData.buildings;
        }
        currentData.unassignedPool = [];
        currentData.manualGatherText = legionData.manualGatherText || "";
        currentData.manualAmmoText = legionData.manualAmmoText || "";

        currentEditingRowIndex = rowIndex;
        currentEditingLegion = selectedLegion;
        currentEditingTitle = res.title || "";
        currentEditingAuthor =
          res.author || (currentUser ? currentUser.displayName : "指揮官");

        document.getElementById("publishLegionSelect").value = selectedLegion;
        document.getElementById("publishTitleInput").value = currentEditingTitle;
        document.getElementById("publishAuthorInput").value = currentEditingAuthor;

        document.getElementById("editingNoticeText").innerText =
          `✏️ 目前正在編輯歷史紀錄「${res.title}」(${selectedLegion === "LegionA" ? "軍團1" : "軍團2"}) - 發布時將覆蓋原資料`;
        document.getElementById("editingNoticeBar").style.display = "flex";

        closeLoadHistoryModal();

        renderAll();
        const resSec = document.getElementById("resultSection");
        resSec.style.display = "block";
        resSec.classList.add("fade-in-view");
        resSec.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        alert("讀取失敗，資料格式有誤。");
      }
    })
    .catch((err) => {
      console.error("載入舊紀錄失敗：", err);
      alert("載入舊紀錄時發生錯誤。");
    });
}

function exitEditMode() {
  currentEditingRowIndex = null;
  currentEditingTitle = "";
  currentEditingAuthor = "";
  document.getElementById("editingNoticeBar").style.display = "none";
  alert("已退出編輯模式，接下來發布將建立「全新紀錄」。");
}

function resetToInitialState() {
  currentEditingRowIndex = null;
  currentEditingTitle = "";
  currentEditingAuthor = "";
  document.getElementById("editingNoticeBar").style.display = "none";

  for (let i = 0; i < 4; i++) {
    document.getElementById(`leaderName${i}`).value = "";
    document.getElementById(`leaderPower${i}`).value = "";
    document.getElementById(`viceName${i}`).value = "";
    document.getElementById(`vicePower${i}`).value = "";
  }

  document.getElementById("memberInput").value = "";
  document.getElementById("gatherInput").value = "";
  document.getElementById("ammoInput").value = "";

  currentData.buildings = {
    b0: [], b1: [], b2: [], b3: [],
    b4: [], b5: [], b6: [], b7: []
  };
  currentData.unassignedPool = [];
  currentData.manualGatherText = "";
  currentData.manualAmmoText = "";
  currentData.totalPeople = 0;
  currentData.totalPower = 0;
  currentData.avgPower = 0;

  document.getElementById("resultSection").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getNextSundayDateString() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToSunday = (7 - dayOfWeek) % 7;
  const sundayDate = new Date(now);
  sundayDate.setDate(now.getDate() + distanceToSunday);

  const year = sundayDate.getFullYear();
  const month = String(sundayDate.getMonth() + 1).padStart(2, "0");
  const day = String(sundayDate.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
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
    if (picker.value) onTundraDateChange();
    else titleInput.value = `雪域兵器聯賽`;
  } else if (type === "test") {
    tundraGroup.style.display = "none";
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    titleInput.value = `${year}/${month}/${day} 測試`;
  }
}

function onTundraDateChange() {
  const pickerVal = document.getElementById("tundraDatePicker").value;
  const titleInput = document.getElementById("publishTitleInput");
  if (pickerVal) {
    const formattedDate = pickerVal.replace(/-/g, "/");
    titleInput.value = `${formattedDate} 雪域兵器聯賽`;
  }
}

function openPublishModal() {
  const eventGroup = document.getElementById("eventTypeGroup");
  const tundraGroup = document.getElementById("tundraDatePickerGroup");
  const titleInput = document.getElementById("publishTitleInput");
  const titleLabel = document.getElementById("lblPublishTitle");
  const authorInput = document.getElementById("publishAuthorInput");

  if (currentEditingRowIndex) {
    eventGroup.style.display = "none";
    tundraGroup.style.display = "none";
    titleLabel.innerText = "3. 發布紀錄標題 (沿用原紀錄)：";
    titleInput.disabled = true;
    titleInput.style.backgroundColor = "#060a12";
    titleInput.value = currentEditingTitle;
    authorInput.value = currentEditingAuthor;
  } else {
    eventGroup.style.display = "block";
    titleLabel.innerText = "3. 標題 / Title：(自動填入 / Auto fill in)：";
    titleInput.disabled = true;
    titleInput.style.backgroundColor = "#060a12";
    document.getElementById("publishEventTypeSelect").value = "foundry";
    onPublishEventTypeChange();

    if (currentUser) {
      authorInput.value = currentUser.displayName;
    }
  }

  const headerTitle = document.getElementById("publishModalHeaderTitle");
  const confirmBtn = document.getElementById("btnConfirmPublish");

  if (currentEditingRowIndex) {
    headerTitle.innerText = `💾 發布更新「${currentEditingTitle}」`;
    confirmBtn.innerText = "確認並發布最新版";
  } else {
    headerTitle.innerText = langPack[currentData.currentLang].publishHeader;
    confirmBtn.innerText = langPack[currentData.currentLang].btnConfirmPublish;
  }

  document.getElementById("publishModal").style.display = "flex";
}

function closePublishModal() {
  document.getElementById("publishModal").style.display = "none";
}

function submitToGoogleSheet() {
  const title = document.getElementById("publishTitleInput").value.trim();
  const author =
    document.getElementById("publishAuthorInput").value.trim() ||
    (currentUser ? currentUser.displayName : "指揮官");
  const passcode = document.getElementById("publishPasscodeInput").value.trim();
  const activeLegion = document.getElementById("publishLegionSelect").value;

  if (!title) {
    alert("請輸入標題！");
    return;
  }

  if (!GAS_WEB_APP_URL) {
    alert("錯誤：尚未設定 GAS_WEB_APP_URL！");
    return;
  }

  const btn = document.getElementById("btnConfirmPublish");
  const originalBtnText = btn.innerText;
  btn.innerText = "Processing...";
  btn.disabled = true;

  const isEditingOldRecord = currentEditingRowIndex !== null;

  const legionData = {
    summary: {
      totalPeople: currentData.totalPeople,
      totalPower: currentData.totalPower,
      avgPower: currentData.avgPower,
    },
    buildings: currentData.buildings,
    manualGatherText: currentData.manualGatherText,
    manualAmmoText: currentData.manualAmmoText,
    copyTextZht: getFormattedText(false),
    copyTextEn: getFormattedText(true),
  };

  const legionsObj = {};
  legionsObj[activeLegion] = legionData;

  const payload = {
    action: "publish",
    title: title,
    author: author,
    passcode: passcode,
    activeLegion: activeLegion,
    legions: legionsObj,
  };

  if (currentEditingRowIndex) {
    payload.rowIndex = currentEditingRowIndex;
  }

  fetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      btn.innerText = originalBtnText;
      btn.disabled = false;
      closePublishModal();

      if (data.status === "error") {
        alert("作業失敗：" + data.message);
      } else {
        if (isEditingOldRecord) {
          alert(`💾 成功覆寫更新歷史分配紀錄！\n標題：${title}\n分配員：${author}\n軍團：${activeLegion === "LegionA" ? "軍團1" : "軍團2"}\n\n檢視系統已自動同步至最新版本！`);
        } else {
          alert(`🎉 成功發布全新分配紀錄！\n標題：${title}\n分配員：${author}\n軍團：${activeLegion === "LegionA" ? "軍團1" : "軍團2"}`);
        }
        resetToInitialState();
      }
    })
    .catch((err) => {
      btn.innerText = originalBtnText;
      btn.disabled = false;
      console.error("發布完成：", err);
      if (isEditingOldRecord) {
        alert(`💾 成功覆寫更新歷史分配紀錄！\n標題：${title}\n分配員：${author}\n\n檢視系統已自動同步至最新版本！`);
      } else {
        alert(`🎉 成功發布全新分配紀錄！\n標題：${title}\n分配員：${author}`);
      }
      closePublishModal();
      resetToInitialState();
    });
}

function InputTestData() {
  const now = new Date();
  const TestTitle = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} 測試`;
  document.getElementById("publishTitleInput").value = TestTitle;
  document.getElementById("leaderName0").value = "炙炎梵天";
  document.getElementById("leaderName1").value = "Classic 陀螺";
  document.getElementById("leaderName2").value = "AKB";
  document.getElementById("leaderName3").value = "SleepJay 胖虎";
  document.getElementById("leaderPower0").value = "40000";
  document.getElementById("leaderPower1").value = "50000";
  document.getElementById("leaderPower2").value = "35000";
  document.getElementById("leaderPower3").value = "38000";
  document.getElementById("memberInput").value =
    "TSENG 8888 \nSophia 3089 \nLiam 4732 \nEmma 3540 \nOliver 4891 \nAva 3167\nLucas 4423 \nMia 3805 \nNoah 4158 \nIsabella 3290 \nJames 4612 \nCharlotte 3945 \nAlexander 4380 \nAmelia 3418 \nBenjamin 4073 \nHarper 3629";
}

function captureMapWithAllocation() {
  const btn = document.getElementById("btnMapScreenshot");
  const p = langPack[currentData.currentLang];
  const originalText = btn ? btn.innerText : "";

  if (btn) {
    btn.innerText = p.mapProcessing;
    btn.disabled = true;
  }

  const mapContainer = document.createElement("div");
  mapContainer.id = "mapContainer";

  const centerWatermark = document.createElement("div");
  centerWatermark.className = "map-center-watermark";
  centerWatermark.innerText = "2647 RGN 兵工廠人員分配";
  mapContainer.appendChild(centerWatermark);

  const mapCoords = {
    b0: { top: "42%", left: "12%" },
    b1: { top: "52%", left: "10%" },
    b2: { top: "60%", left: "75%" },
    b3: { top: "45%", left: "82%" },
    b4: { top: "82%", left: "32%" },
    b5: { top: "82%", left: "65%" },
    b6: { top: "15%", left: "62%" },
    b7: { top: "15%", left: "28%" },
  };

  buildingsConfig.forEach((b) => {
    const coord = mapCoords[b.id];
    if (!coord) return;

    let playersHtml = (currentData.buildings[b.id] || [])
      .map((pl) => `<div>• ${pl.name} (${pl.power})</div>`)
      .join("");

    const nodeDiv = document.createElement("div");
    nodeDiv.className = "map-node-card";
    nodeDiv.style.top = coord.top;
    nodeDiv.style.left = coord.left;
    nodeDiv.style.zIndex = "2";
    nodeDiv.innerHTML = `
      <div class="map-node-title">${b.nameZht}</div>
      <div class="map-node-players">${playersHtml || "(無)"}</div>
    `;
    mapContainer.appendChild(nodeDiv);
  });

  const smallWatermark = document.createElement("div");
  smallWatermark.className = "map-bottom-right-watermark";
  smallWatermark.innerText = "TSENG";
  smallWatermark.style.zIndex = "2";
  mapContainer.appendChild(smallWatermark);

  document.body.appendChild(mapContainer);

  html2canvas(mapContainer, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    width: 1200,
    height: 1200,
  })
    .then((canvas) => {
      const link = document.createElement("a");
      const now = new Date();
      const timestamp = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}_${now.getHours()}${now.getMinutes()}`;
      link.download = `兵工廠地圖分配圖_${timestamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      document.body.removeChild(mapContainer);
      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    })
    .catch((err) => {
      console.error("地圖截圖合成失敗：", err);
      alert("地圖合成失敗，請稍後再試！");
      if (document.body.contains(mapContainer)) {
        document.body.removeChild(mapContainer);
      }
      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
}
