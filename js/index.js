/* ============================================================
   兵工廠人員分配系統 - 核心業務邏輯 (index.js)
   依賴：需先載入 js/i18n.js
   ============================================================ */

const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwcO_cum0wC8lYbQZHVdexJ-qghfddEAdZTID-5CHOYUMGhrz9-rMZEzXBODp5KQtG7/exec";
const ANN_JSON_URL = "https://jeremytseng12.github.io/2647WOSFOUNDRY/ann";

let currentData = {
  totalPeople: 0,
  totalPower: 0,
  avgPower: 0,
  currentLang: "zht",
  copyLang: "zht",
  buildings: {
    b0: [],
    b1: [],
    b2: [],
    b3: [],
    b4: [],
    b5: [],
    b6: [],
    b7: [],
  },
  manualGatherText: "",
  manualAmmoText: "",
};

let currentEditingRowIndex = null;
let currentEditingLegion = "LegionA";
let currentEditingTitle = "";
let historyRecordsList = [];
let isCurrentlyMaintenance = false;

// 1. 讀取公告 JSON
async function fetchAnnouncementJson() {
  try {
    const res = await fetch(`${ANN_JSON_URL}?t=${new Date().getTime()}`);
    if (!res.ok) return;
    const data = await res.json();
    let annText = "";

    if (typeof data === "string") {
      annText = data.trim();
    } else if (data) {
      annText = (
        data.announcement ||
        data.message ||
        data.text ||
        ""
      ).trim();
    }

    if (annText) {
      alert(`📢 系統公告：\n${annText}`);
    }
  } catch (err) {
    console.error("讀取公告檔 ann.json 失敗或目前無公告：", err);
  }
}

// 2. 全螢幕維修狀態檢查
async function checkSystemStatus() {
  try {
    const res = await fetch(
      `${GAS_WEB_APP_URL}?action=getSystemStatus&t=${new Date().getTime()}`,
    );
    const data = await res.json();
    const status = data.status;

    const overlay = document.getElementById("fullscreenOverlay");
    const title = document.getElementById("overlayTitle");
    const msg = document.getElementById("overlayMessage");
    const btnReload = document.getElementById("btnOverlayReload");

    if (status === "offline" || status === "maintenance") {
      isCurrentlyMaintenance = true;
      overlay.style.display = "flex";

      if (status === "offline") {
        title.innerText = "⛔ 網站目前已關閉";
        msg.innerHTML = "系統目前暫停對外開放，請聯繫管理員！";
      } else {
        title.innerText = "🔧 系統維修中";
        msg.innerHTML =
          "系統目前正在進行維護升級，請稍後再試！<br><span style='font-size:0.85rem; color:#94a3b8;'>（系統每 60 秒會自動嘗試連線檢查）</span>";
      }
    } else if (status === "active") {
      if (isCurrentlyMaintenance) {
        title.innerText = "🟢 系統維護完成";
        msg.innerHTML =
          "系統已成功恢復運行，請點擊下方按鈕重新載入畫面！";
        btnReload.style.display = "inline-block";
      } else {
        overlay.style.display = "none";
      }
    }
  } catch (err) {
    console.error("狀態檢查失敗：", err);
  }
}

window.addEventListener("load", function () {
  checkSystemStatus();
  setInterval(checkSystemStatus, 60000);

  setTimeout(() => {
    const intro = document.getElementById("intro");
    const mainContent = document.getElementById("main-content");
    intro.style.display = "none";
    mainContent.style.display = "block";
    setTimeout(() => {
      mainContent.style.opacity = "1";
    }, 50);
    fetchAnnouncementJson();
  }, 2200);
});

function toggleViceAccordion() {
  const acc = document.getElementById("viceAccordion");
  if (acc) {
    acc.classList.toggle("closed");
  }
}

function handlePowerEnter(event, currentIdx) {
  if (event.key === "Enter") {
    event.preventDefault();
    let nextFocusField = null;
    for (let i = 1; i <= 4; i++) {
      let checkIdx = (currentIdx + i) % 4;
      let val = document
        .getElementById(`leaderPower${checkIdx}`)
        .value.trim();
      if (val === "") {
        nextFocusField = document.getElementById(
          `leaderPower${checkIdx}`,
        );
        break;
      }
    }
    if (nextFocusField) {
      nextFocusField.focus();
    } else {
      document.getElementById("memberInput").focus();
    }
  }
}

function changeLanguage(lang) {
  currentData.currentLang = lang;
  currentData.copyLang = lang;
  const p = langPack[lang];

  if (lang === "zht") {
    document.getElementById("btnLangZht").classList.add("active");
    document.getElementById("btnLangEn").classList.remove("active");
    document.getElementById("btnCopyLangZht").classList.add("active");
    document.getElementById("btnCopyLangEn").classList.remove("active");
    document.body.classList.remove("lang-en");
  } else {
    document.getElementById("btnLangEn").classList.add("active");
    document.getElementById("btnLangZht").classList.remove("active");
    document.getElementById("btnCopyLangEn").classList.add("active");
    document.getElementById("btnCopyLangZht").classList.remove("active");
    document.body.classList.add("lang-en");
  }
  document.getElementById("btnMapScreenshot").innerText =
    p.btnMapScreenshot;
  document.getElementById("introText").innerText = p.introText;
  document.getElementById("btnHistoryModal").innerText =
    p.btnHistoryModal;
  document.getElementById("btnViewSystem").innerText = p.btnViewSystem;
  document.getElementById("btnOldSystem").innerText = p.btnOldSystem;
  document.getElementById("btnCancelEdit").innerText = p.btnCancelEdit;
  document.getElementById("uiMainTitle").innerText = p.mainTitle;
  document.getElementById("uiInfoTitle").innerText = p.infoTitle;
  document.getElementById("uiLeaderTitle").innerText = p.leaderTitle;
  document.getElementById("uiMemberTitle").innerText = p.memberTitle;
  document.getElementById("uiLabelMainList").innerText = p.labelMainList;
  document.getElementById("uiMemberDesc").innerHTML = p.memberDesc;
  document.getElementById("uiLabelGatherList").innerText =
    p.labelGatherList;
  document.getElementById("uiLabelAmmoList").innerText = p.labelAmmoList;
  document.getElementById("gatherInput").placeholder =
    p.gatherPlaceholder;
  document.getElementById("ammoInput").placeholder = p.ammoPlaceholder;
  document.getElementById("btnDistribute").innerText = p.btnDistribute;
  document.getElementById("btnLoadTestData").innerText =
    p.btnLoadTestData;
  document.getElementById("uiQuickTitle").innerText = p.quickTitle;

  document.getElementById("uiViceAccordionTitle").innerText =
    p.viceAccordionTitle;
  document.getElementById("uiViceNoticeText").innerText =
    p.viceNoticeText;
  for (let i = 0; i < 4; i++) {
    document.getElementById(`uiLabelVice${i}`).innerText =
      p.viceLabels[i];
    document.getElementById(`viceName${i}`).placeholder =
      p.vicePlaceholderName;
    document.getElementById(`vicePower${i}`).placeholder =
      p.vicePlaceholderPower;
  }

  document.getElementById("modalTitle").innerText = p.modalTitle;
  document.getElementById("modalDesc").innerText = p.modalDesc;
  document.getElementById("btnModalCancel").innerText = p.modalCancel;
  document.getElementById("btnModalConfirm").innerText = p.modalConfirm;
  document.getElementById("uiChangelogTitle").innerText =
    p.changelogTitle;
  document.getElementById("uiChangelogDesc").innerText = p.changelogDesc;
  document.getElementById("btnCloseChangelog").innerText =
    p.btnCloseChangelog;

  document.getElementById("publishModalHeaderTitle").innerText =
    p.publishHeader;
  document.getElementById("lblPublishLegion").innerText =
    p.lblPublishLegion;
  document.getElementById("lblPublishEventType").innerText =
    p.lblPublishEventType;
  document.getElementById("lblPublishTitle").innerText =
    p.lblPublishTitle;
  document.getElementById("lblPublishAuthor").innerText =
    p.lblPublishAuthor;
  document.getElementById("lblPublishPasscode").innerText =
    p.lblPublishPasscode;
  document.getElementById("btnPublishCancel").innerText =
    p.btnPublishCancel;
  document.getElementById("btnConfirmPublish").innerText =
    p.btnConfirmPublish;

  document.getElementById("uiLoadHistoryTitle").innerText =
    p.uiLoadHistoryTitle;
  document.getElementById("lblLoadHistory").innerText = p.lblLoadHistory;
  document.getElementById("lblLoadLegion").innerText = p.lblLoadLegion;
  document.getElementById("lblLoadPasscode").innerText =
    p.lblLoadPasscode;
  document.getElementById("btnLoadCancel").innerText = p.btnLoadCancel;
  document.getElementById("btnConfirmLoad").innerText = p.btnConfirmLoad;

  const infoList = document.getElementById("uiInfoList");
  infoList.innerHTML = "";
  p.infoItems.forEach((item) => {
    const li = document.createElement("li");
    li.innerText = item;
    infoList.appendChild(li);
  });

  for (let i = 0; i < 4; i++) {
    document.getElementById(`uiLabelG${i}`).innerText = p.labels[i];
    document.getElementById(`leaderName${i}`).placeholder =
      p.placeholders.name;
    document.getElementById(`leaderPower${i}`).placeholder =
      p.placeholders.power;
  }

  if (document.getElementById("resultSection").style.display !== "none") {
    document.getElementById("btnPublish").innerText = p.btnPublish;
    document.getElementById("uiSummaryTitle").innerText = p.summaryTitle;
    document.getElementById("uiCopyTitle").innerText = p.copyTitle;
    document.getElementById("btnCopyText").innerText = p.btnCopyText;
    document.getElementById("uiTweakTitle").innerText = p.tweakTitle;
    document.getElementById("btnScreenshotText").innerText =
      p.btnScreenshotText;
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
      alert(
        currentData.currentLang === "zht"
          ? `「${name}」${p.alertRepeat}`
          : `"${name}"${p.alertRepeat}`,
      );
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
    uniqueNames: new Set(),
  };

  for (let i = 0; i < 4; i++) {
    const name = document.getElementById(`leaderName${i}`).value.trim();
    const power = parseInt(
      document.getElementById(`leaderPower${i}`).value,
    );
    parsed.leaders.push({ name, power });
    if (name) parsed.uniqueNames.add(name);

    const vName = document.getElementById(`viceName${i}`).value.trim();
    const vPower =
      parseInt(document.getElementById(`vicePower${i}`).value) || 0;
    parsed.viceLeaders.push({ name: vName, power: vPower });
    if (vName) parsed.uniqueNames.add(vName);
  }

  parseLines(document.getElementById("memberInput").value).forEach(
    (p) => {
      parsed.mainMembers.push(p);
      parsed.uniqueNames.add(p.name);
    },
  );
  parseLines(document.getElementById("gatherInput").value).forEach(
    (p) => {
      parsed.gatherMembers.push(p);
      parsed.uniqueNames.add(p.name);
    },
  );
  parseLines(document.getElementById("ammoInput").value).forEach((p) => {
    parsed.ammoMembers.push(p);
    parsed.uniqueNames.add(p.name);
  });

  return parsed;
}

function openConfirmationModal() {
  document.getElementById("errorMessage").style.display = "none";
  if (!validateInputs()) return;

  const data = parseCurrentInputs();
  const totalCount = data.uniqueNames.size;
  const p = langPack[currentData.currentLang];

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
    const viceText = vObj.name
      ? ` [副: ${vObj.name} (${vObj.power})]`
      : "";
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

function triggerAllocation() {
  document.getElementById("resultSection").style.display = "none";
  const shimmer = document.getElementById("shimmerLoader");
  shimmer.innerHTML = "";

  const container = document.createElement("div");
  container.style.cssText =
    "display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0;";

  const preloadImage = document.getElementById("preloadGif");
  if (preloadImage) {
    const activeGif = preloadImage.cloneNode(true);
    activeGif.style.cssText =
      "width: 250px; height: auto; border-radius: 4px;";
    container.appendChild(activeGif);
  } else {
    container.innerHTML = `<img src="https://jeremytseng12.github.io/2647WOSFOUNDRY/3.gif" style="width: 250px; height: auto; border-radius: 4px;" />`;
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
    const power = parseInt(
      document.getElementById(`leaderPower${i}`).value,
    );

    if (!name) {
      showError(
        isEn
          ? `Please enter the leader name for Group ${i + 1}!`
          : `請填寫第 ${i + 1} 組的隊長名字！`,
      );
      return false;
    }
    if (isNaN(power)) {
      showError(
        isEn
          ? `Please enter the power for leader "${name}"!`
          : `請填寫隊長「${name}」的戰力數值！`,
      );
      return false;
    }
    if (power < 4000) {
      showError(
        isEn
          ? `Error: Leader "${name}" power is below 4000!`
          : `錯誤：隊長「${name}」戰力低於 4000！`,
      );
      return false;
    }
    leaderNamesSet.add(name);
  }

  for (let i = 0; i < 4; i++) {
    const vName = document.getElementById(`viceName${i}`).value.trim();
    const vPower = parseInt(
      document.getElementById(`vicePower${i}`).value,
    );

    if (vName) {
      if (leaderNamesSet.has(vName)) {
        showError(
          isEn
            ? `Error: Vice-CDR "${vName}" is already assigned as a CDR!`
            : `防呆警告：「${vName}」已被指派為正隊長，無法重複設為副隊長！`,
        );
        return false;
      }
      if (isNaN(vPower) || vPower <= 0) {
        showError(
          isEn
            ? `Please enter power for Vice-CDR "${vName}"!`
            : `請填寫副隊長「${vName}」的戰力數值！`,
        );
        return false;
      }
      leaderNamesSet.add(vName);
    }
  }

  const mainLines = parseLines(
    document.getElementById("memberInput").value,
  );
  for (let m of mainLines) {
    if (leaderNamesSet.has(m.name)) {
      showError(
        isEn
          ? `Error: CDR/V-CDR "${m.name}" appears in the main balancing list! Do not re-enter CDRs in the main list.`
          : `防呆警告：隊長/副隊長「${m.name}」重複出現在「1. 主平衡分配名單」！系統已自動包含隊長，請自主名單中移除。`,
      );
      return false;
    }
  }

  const gatherLines = parseLines(
    document.getElementById("gatherInput").value,
  );
  for (let g of gatherLines) {
    if (leaderNamesSet.has(g.name)) {
      showError(
        isEn
          ? `Error: CDR/V-CDR "${g.name}" appears in the Gathering Squad list!`
          : `防呆警告：隊長/副隊長「${g.name}」重複出現在「2. 採集小隊名單」！`,
      );
      return false;
    }
  }

  const ammoLines = parseLines(
    document.getElementById("ammoInput").value,
  );
  for (let a of ammoLines) {
    if (leaderNamesSet.has(a.name)) {
      showError(
        isEn
          ? `Error: CDR/V-CDR "${a.name}" appears in the Ammo Squad list!`
          : `防呆警告：隊長/副隊長「${a.name}」重複出現在「3. 子彈小隊名單」！`,
      );
      return false;
    }
  }

  return true;
}

function distributeMembers() {
  currentData.copyLang = currentData.currentLang;

  currentData.buildings = {
    b0: [],
    b1: [],
    b2: [],
    b3: [],
    b4: [],
    b5: [],
    b6: [],
    b7: [],
  };

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
    };

    let manualViceObj = null;
    let vData = pool.viceLeaders[i];
    if (vData.name && vData.power > 0) {
      manualViceObj = {
        name: vData.name,
        power: vData.power,
        isLeader: false,
        isVice: true,
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

  let sortedMain = [...pool.mainMembers].sort(
    (a, b) => b.power - a.power,
  );
  for (let member of sortedMain) {
    groups.sort((a, b) => a.totalPower - b.totalPower);
    groups[0].members.push({
      name: member.name,
      power: member.power,
      isLeader: false,
      isVice: false,
    });
    groups[0].totalPower += member.power;
  }
  groups.sort((a, b) => a.index - b.index);

  groups.forEach((g) => {
    let allPeopleInGroup = [g.leader];
    if (g.manualVice) {
      allPeopleInGroup.push(g.manualVice);
    }
    g.members.forEach((m) => allPeopleInGroup.push(m));

    const bId1 = `b${g.index * 2}`;
    const bId2 = `b${g.index * 2 + 1}`;
    allPeopleInGroup.forEach((person, idx) => {
      if (idx % 2 === 0) currentData.buildings[bId1].push(person);
      else currentData.buildings[bId2].push(person);
    });
  });

  currentData.manualGatherText = document
    .getElementById("gatherInput")
    .value.trim();
  currentData.manualAmmoText = document
    .getElementById("ammoInput")
    .value.trim();

  renderAll();
  const resSec = document.getElementById("resultSection");
  resSec.style.display = "block";
  resSec.classList.add("fade-in-view");
  resSec.scrollIntoView({ behavior: "smooth", block: "start" });
  if (currentData.currentLang === "en") {
    changeLanguage("en");
  }
}

function getFormattedText(isEn) {
  let textOutput = "";
  buildingsConfig.forEach((b) => {
    const bName = isEn ? b.nameEn : b.nameZht;
    let formattedNames = currentData.buildings[b.id].map((player) => {
      if (player.isLeader) return `${player.name}`;
      if (player.isVice) return `${player.name}`;
      return player.name;
    });
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
    let formattedNames = currentData.buildings[b.id].map((player) => {
      if (player.isLeader) return `${player.name}`;
      if (player.isVice) return `${player.name}`;
      return player.name;
    });
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

// 🎯 重排建築內人員 (副隊長動態評估)
function reorderCommanders() {
  buildingsConfig.forEach((b) => {
    let list = currentData.buildings[b.id];
    if (!list || list.length === 0) return;

    // 1. 抽出正隊長，其餘人員先重設副隊長標籤
    let leaderIdx = list.findIndex((p) => p.isLeader);
    let leaderObj = leaderIdx !== -1 ? list.splice(leaderIdx, 1)[0] : null;

    list.forEach((p) => {
      p.isVice = false;
    });

    // 2. 剩餘人員依戰力由高到低排序
    list.sort((a, b) => b.power - a.power);

    if (leaderObj) {
      // 有正隊長：若該建築需要副隊長，由扣除隊長後的戰力第一名擔任
      if (b.needVice && list.length > 0) {
        list[0].isVice = true;
      }
      // 正隊長放回首位
      list.unshift(leaderObj);
    } else {
      // 無正隊長：若該建築需要副隊長，由全體戰力第一名擔任
      if (b.needVice && list.length > 0) {
        list[0].isVice = true;
      }
    }
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

  let gatherArr = currentData.manualGatherText
    ? currentData.manualGatherText.split("\n")
    : [];
  gatherArr.forEach((n) => {
    if (n.trim()) uniqueNames.add(n.trim());
  });

  let ammoArr = currentData.manualAmmoText
    ? currentData.manualAmmoText.split("\n")
    : [];
  ammoArr.forEach((n) => {
    if (n.trim()) uniqueNames.add(n.trim());
  });

  currentData.totalPeople = uniqueNames.size;
  currentData.totalPower = totalPower;
  currentData.avgPower = Math.round(totalPower / 4);
}

function toggleAccordionGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) {
    group.classList.toggle("closed");
  }
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
  (currentData.buildings[b.id] || []).forEach(
    (pObj) => (bPower += pObj.power),
  );

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

    pTagsHtml += `
      <div class="player-tag ${roleClass}" draggable="true" ondragstart="dragStart(event, '${b.id}', ${pIdx})">
          <span>${roleLabel}${player.name}</span>
          <inherit-strong>${player.power || 0}</inherit-strong>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="building-title">${currentData.currentLang === "en" ? b.nameEn : b.nameZht}</div>
    <div class="building-power">${p.buildingPower}<strong>${bPower.toLocaleString()}</strong></div>
    <div class="drop-zone">${pTagsHtml}</div>
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
  let gatherArr = currentData.manualGatherText
    ? currentData.manualGatherText.split("\n")
    : [];
  let gatherTags = gatherArr
    .map((name) =>
      name.trim()
        ? `
    <div class="player-tag" style="cursor:default;">
      <span>⚡ ${name.trim()}</span><inherit-strong></inherit-strong>
    </div>`
        : "",
    )
    .join("");
  gatherCard.innerHTML = `
    <div class="building-title">${p.specTitleGather}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabel : p.specLabelGather}</div>
    <div class="drop-zone">${gatherTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
  `;

  const ammoCard = document.createElement("div");
  ammoCard.className = "building-card b-group-spec";
  let ammoArr = currentData.manualAmmoText
    ? currentData.manualAmmoText.split("\n")
    : [];
  let ammoTags = ammoArr
    .map((name) =>
      name.trim()
        ? `
    <div class="player-tag" style="cursor:default; border-color:#ff3838;">
      <span>🎒 ${name.trim()}</span><inherit-strong></inherit-strong>
    </div>`
        : "",
    )
    .join("");
  ammoCard.innerHTML = `
    <div class="building-title">${p.specTitleAmmo}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabelAmmo : p.specLabelAmmo}</div>
    <div class="drop-zone">${ammoTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
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
  } else {
    buildingsConfig.forEach((b, idx) => {
      const card = createBuildingCardElement(b, p);
      grid.appendChild(card);

      if (idx === 3) {
        grid.appendChild(gatherCard);
        grid.appendChild(ammoCard);
      }
    });
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
function dragOver(e) {
  e.preventDefault();
}
function dragEnter(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}
function dragLeave() {
  this.classList.remove("drag-over");
}

// 🎯 拖曳放置 (移出時解除副隊長標籤)
function dragDrop() {
  this.classList.remove("drag-over");
  const targetBuildingId = this.id;

  if (targetBuildingId === "" || !currentData.buildings[targetBuildingId])
    return;
  if (draggedFromBuildingId === targetBuildingId) return;

  const movingPlayer = currentData.buildings[
    draggedFromBuildingId
  ].splice(draggedPlayerIdx, 1)[0];

  // 移出原建築時，若不是正隊長，解除副隊長標籤（由目標建築與原建築重新評估）
  if (!movingPlayer.isLeader) {
    movingPlayer.isVice = false;
  }

  currentData.buildings[targetBuildingId].push(movingPlayer);

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
  let gatherArr = currentData.manualGatherText
    ? currentData.manualGatherText.split("\n")
    : [];
  let gatherTags = gatherArr
    .map((name) =>
      name.trim()
        ? `<div class="player-tag" style="cursor:default;"><span>⚡ ${name.trim()}</span></div>`
        : "",
    )
    .join("");
  gatherCard.innerHTML = `
    <div class="building-title">${p.specTitleGather}</div>
    <div class="building-power">${currentData.currentLang === "en" ? p.specPowerLabel : p.specLabelGather}</div>
    <div class="drop-zone">${gatherTags || `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${currentData.currentLang === "en" ? "(None)" : "(未指派人員)"}</div>`}</div>
  `;

  const ammoCard = document.createElement("div");
  ammoCard.className = "building-card b-group-spec";
  let ammoArr = currentData.manualAmmoText
    ? currentData.manualAmmoText.split("\n")
    : [];
  let ammoTags = ammoArr
    .map((name) =>
      name.trim()
        ? `<div class="player-tag" style="cursor:default; border-color:#ff3838;"><span>🎒 ${name.trim()}</span></div>`
        : "",
    )
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

  fetch(GAS_WEB_APP_URL)
    .then((res) => res.json())
    .then((res) => {
      if (
        res.status === "empty" ||
        !res.history ||
        res.history.length === 0
      ) {
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
  const rowIndex = parseInt(
    document.getElementById("loadHistorySelect").value,
  );
  const selectedLegion =
    document.getElementById("loadLegionSelect").value;
  const passcode = document
    .getElementById("loadPasscodeInput")
    .value.trim();

  let url = `${GAS_WEB_APP_URL}?rowIndex=${rowIndex}`;
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
        currentData.manualGatherText = legionData.manualGatherText || "";
        currentData.manualAmmoText = legionData.manualAmmoText || "";

        currentEditingRowIndex = rowIndex;
        currentEditingLegion = selectedLegion;
        currentEditingTitle = res.title || "";

        document.getElementById("publishLegionSelect").value =
          selectedLegion;
        document.getElementById("publishTitleInput").value =
          currentEditingTitle;
        document.getElementById("publishAuthorInput").value =
          res.author || "";

        document.getElementById("editingNoticeText").innerText =
          `✏️ 目前正在編輯：第 ${rowIndex} 筆紀錄「${res.title}」(${selectedLegion === "LegionA" ? "軍團1" : "軍團2"})`;
        document.getElementById("editingNoticeBar").style.display =
          "flex";

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
  document.getElementById("editingNoticeBar").style.display = "none";
  alert("已退出微調模式，接下來發布將建立「全新紀錄」。");
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
    if (picker.value) {
      onTundraDateChange();
    } else {
      titleInput.value = `雪域兵器聯賽`;
    }
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

  if (currentEditingRowIndex) {
    eventGroup.style.display = "none";
    tundraGroup.style.display = "none";
    titleLabel.innerText = "3. 修改之分配紀錄標題：";
    titleInput.disabled = false;
    titleInput.style.backgroundColor = "#121929";
    titleInput.value = currentEditingTitle;
  } else {
    eventGroup.style.display = "block";
    titleLabel.innerText = "3. 標題 / Title：(自動填入 / Auto fill in)：";
    titleInput.disabled = true;
    titleInput.style.backgroundColor = "#060a12";
    document.getElementById("publishEventTypeSelect").value = "foundry";
    onPublishEventTypeChange();
  }

  const savedAuthor = localStorage.getItem("lastAuthorName") || "";
  if (!document.getElementById("publishAuthorInput").value) {
    document.getElementById("publishAuthorInput").value = savedAuthor;
  }

  const headerTitle = document.getElementById("publishModalHeaderTitle");
  const confirmBtn = document.getElementById("btnConfirmPublish");

  if (currentEditingRowIndex) {
    headerTitle.innerText = `💾 覆寫更新雲端紀錄 (列號: ${currentEditingRowIndex})`;
    confirmBtn.innerText = "確認並覆寫更新";
  } else {
    headerTitle.innerText =
      langPack[currentData.currentLang].publishHeader;
    confirmBtn.innerText =
      langPack[currentData.currentLang].btnConfirmPublish;
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
    "指揮官";
  const passcode = document
    .getElementById("publishPasscodeInput")
    .value.trim();
  const activeLegion = document.getElementById(
    "publishLegionSelect",
  ).value;

  if (!title) {
    alert("請輸入標題！");
    return;
  }

  if (!GAS_WEB_APP_URL) {
    alert("錯誤：尚未設定 GAS_WEB_APP_URL！");
    return;
  }

  localStorage.setItem("lastAuthorName", author);

  const btn = document.getElementById("btnConfirmPublish");
  const originalBtnText = btn.innerText;
  btn.innerText = "Processing...";
  btn.disabled = true;

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
        const actionText = currentEditingRowIndex ? "覆寫更新" : "發布";
        alert(
          `🎉 成功${actionText}紀錄！\n標題：${title}\n分配員：${author}\n軍團：${activeLegion === "LegionA" ? "軍團1" : "軍團2"}`,
        );
        if (currentEditingRowIndex) {
          exitEditMode();
        }
      }
    })
    .catch((err) => {
      btn.innerText = originalBtnText;
      btn.disabled = false;
      console.error("發布完成：", err);
      const actionText = currentEditingRowIndex ? "覆寫更新" : "發布";
      alert(
        `🎉 成功${actionText}紀錄！\n標題：${title}\n分配員：${author}`,
      );
      closePublishModal();
      if (currentEditingRowIndex) {
        exitEditMode();
      }
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