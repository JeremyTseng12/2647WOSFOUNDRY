const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzcQjFmRntKq1wHfQez9ixdVfo9HOMR89CfQKTZ67xEj78bpG14MjWVs7ILdkydX_8Q/exec";

let currentUser = null;
let historyCache = [];
let usersCache = [];

// 頁面初始化檢查登入狀態
document.addEventListener("DOMContentLoaded", () => {
  const savedUser = sessionStorage.getItem("wos_admin_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    initDashboard();
  }
});

// 登入處理
async function handleLogin() {
  const account = document.getElementById("loginAccount").value.trim();
  const passkey = document.getElementById("loginPasskey").value.trim();
  const errorEl = document.getElementById("loginError");

  if (!account || !passkey) {
    errorEl.textContent = "請輸入帳號與密碼";
    return;
  }

  errorEl.textContent = "驗證中...";

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", account, passkey }),
    });
    const result = await response.json();

    if (result.status === "success") {
      currentUser = result.user;
      sessionStorage.setItem("wos_admin_user", JSON.stringify(currentUser));
      initDashboard();
    } else {
      errorEl.textContent = result.message || "登入失敗";
    }
  } catch (err) {
    errorEl.textContent = "連線錯誤，請稍後再試";
  }
}

// 登出
function handleLogout() {
  sessionStorage.removeItem("wos_admin_user");
  currentUser = null;
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("loginOverlay").style.display = "flex";
}

// 初始化後台
async function initDashboard() {
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("mainApp").style.display = "block";

  document.getElementById("userNameDisplay").textContent =
    currentUser.displayName;
  document.getElementById("userRoleBadge").textContent =
    currentUser.role === "supreme" ? "最高管理員" : "管理員";

  if (currentUser.role !== "supreme") {
    document
      .querySelectorAll(".supreme-only")
      .forEach((el) => (el.style.display = "none"));
  }

  loadDashboardStats();
}

// 快速載入總覽統計
async function loadDashboardStats() {
  const elRecords = document.getElementById("statTotalRecords");
  const elUsers = document.getElementById("statTotalUsers");
  const elStatus = document.getElementById("statSystemStatus");

  elRecords.textContent = "載入中...";
  elUsers.textContent = "載入中...";
  elStatus.textContent = "載入中...";

  try {
    const res = await fetch(`${GAS_URL}?action=getDashboardSummary`);
    const data = await res.json();

    if (data.status === "success") {
      elRecords.textContent = data.totalRecords;
      elUsers.textContent = data.totalUsers;

      const statusMap = {
        active: "正常運行",
        maintenance: "系統維護中",
        offline: "伺服器離線",
      };
      elStatus.textContent = statusMap[data.systemStatus] || "正常運行";

      if (currentUser.role === "supreme") {
        const sel = document.getElementById("configSystemStatus");
        const ann = document.getElementById("configAnnouncement");
        if (sel) sel.value = data.systemStatus;
        if (ann) ann.value = data.announcement;
      }
    }
  } catch (err) {
    elRecords.textContent = "-";
    elUsers.textContent = "-";
    elStatus.textContent = "讀取失敗";
  }
}

// 切換頁籤
function switchTab(tabName) {
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  if (tabName === "dashboard") {
    document.getElementById("tabDashboard").classList.add("active");
    event.target.classList.add("active");
    loadDashboardStats();
  } else if (tabName === "history") {
    document.getElementById("tabHistory").classList.add("active");
    event.target.classList.add("active");
    loadHistoryData();
  } else if (tabName === "users") {
    document.getElementById("tabUsers").classList.add("active");
    event.target.classList.add("active");
    loadUsersData();
  } else if (tabName === "config") {
    document.getElementById("tabConfig").classList.add("active");
    event.target.classList.add("active");
  }
}

// 載入歷史紀錄 (包含軍團 1 / 2 欄位與 7 欄配置)
async function loadHistoryData() {
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">資料載入中...</td></tr>`;

  try {
    const response = await fetch(
      `${GAS_URL}?action=getHistory&includeDeleted=true`,
    );
    const result = await response.json();

    if (result.status === "success" || result.history) {
      historyCache = result.history || [];
      document.getElementById("statTotalRecords").textContent =
        historyCache.filter((h) => h.status !== "deleted").length;

      if (historyCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">目前無任何紀錄</td></tr>`;
        return;
      }

      tbody.innerHTML = historyCache
        .map((item) => {
          let legionBadge = "";
          const legionKey = item.activeLegion || item.legion;

          if (legionKey === "LegionA") {
            legionBadge =
              '<span class="status-badge" style="background:rgba(0,170,255,0.15); border:1px solid #00aaff; color:#00aaff;">🛡️ 軍團 1</span>';
          } else if (legionKey === "LegionB") {
            legionBadge =
              '<span class="status-badge" style="background:rgba(255,85,0,0.15); border:1px solid #ff5500; color:#ff5500;">⚔️ 軍團 2</span>';
          } else if (item.legions) {
            const hasA = !!item.legions.LegionA;
            const hasB = !!item.legions.LegionB;
            if (hasA && hasB) {
              legionBadge =
                '<span class="status-badge" style="background:rgba(0,170,255,0.15); border:1px solid #00aaff; color:#00aaff; margin-right:4px;">🛡️ 軍團 1</span>' +
                '<span class="status-badge" style="background:rgba(255,85,0,0.15); border:1px solid #ff5500; color:#ff5500;">⚔️ 軍團 2</span>';
            } else if (hasA) {
              legionBadge =
                '<span class="status-badge" style="background:rgba(0,170,255,0.15); border:1px solid #00aaff; color:#00aaff;">🛡️ 軍團 1</span>';
            } else if (hasB) {
              legionBadge =
                '<span class="status-badge" style="background:rgba(255,85,0,0.15); border:1px solid #ff5500; color:#ff5500;">⚔️ 軍團 2</span>';
            }
          }

          if (!legionBadge) {
            legionBadge =
              '<span class="status-badge" style="background:rgba(0,170,255,0.15); border:1px solid #00aaff; color:#00aaff;">🛡️ 軍團 1</span>';
          }

          return `
            <tr>
              <td>${item.rowIndex}</td>
              <td>${item.updateTime || "-"}</td>
              <td>${item.title || "無標題"}</td>
              <td>${legionBadge}</td>
              <td>${item.author || "指揮官"}</td>
              <td>
                <span class="status-badge ${item.status === "deleted" ? "status-deleted" : "status-active"}">
                  ${item.status === "deleted" ? "停用" : "正常"}
                </span>
              </td>
              <td>
                ${
                  item.status === "deleted"
                    ? `<button class="btn-secondary" onclick="changeRecordStatus(${item.rowIndex}, 'restoreRecord')">還原</button>`
                    : `<button class="btn-danger" onclick="changeRecordStatus(${item.rowIndex}, 'deleteRecord')">停用</button>`
                }
              </td>
            </tr>
          `;
        })
        .join("");
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">讀取失敗</td></tr>`;
  }
}

// 變更紀錄狀態 (軟刪除 / 還原)
async function changeRecordStatus(rowIndex, actionType) {
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({
        action: actionType,
        rowIndex: rowIndex,
        operatorRole: currentUser.role,
      }),
    });
    const result = await response.json();
    if (result.status === "success") {
      loadHistoryData();
    } else {
      alert(result.message || "操作失敗");
    }
  } catch (err) {
    alert("連線錯誤");
  }
}

// 載入使用者名冊
async function loadUsersData() {
  const tbody = document.getElementById("usersTableBody");
  try {
    const response = await fetch(
      `${GAS_URL}?action=getUsers&role=${currentUser.role}`,
    );
    const result = await response.json();

    if (result.status === "success") {
      usersCache = result.users || [];
      document.getElementById("statTotalUsers").textContent = usersCache.length;

      tbody.innerHTML = usersCache
        .map(
          (u) => `
            <tr>
              <td>${u.rowIndex}</td>
              <td>${u.account}</td>
              <td>${u.passkey}</td>
              <td>${u.displayName}</td>
              <td>${u.role === "supreme" ? "最高管理員" : "管理員"}</td>
              <td><span class="status-badge ${u.status === "disabled" ? "status-deleted" : "status-active"}">${u.status === "disabled" ? "停用" : "啟用"}</span></td>
              <td>${new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                ${u.account !== currentUser.account ? `<button class="btn-danger" onclick="deleteUser(${u.rowIndex})">刪除</button>` : "-"}
              </td>
            </tr>
          `,
        )
        .join("");
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">讀取失敗</td></tr>`;
  }
}

// 新增使用者互動
function openUserModal() {
  document.getElementById("userModal").style.display = "flex";
}
function closeUserModal() {
  document.getElementById("userModal").style.display = "none";
}

async function submitNewUser() {
  const account = document.getElementById("newAccount").value.trim();
  const passkey = document.getElementById("newPasskey").value.trim();
  const displayName = document.getElementById("newDisplayName").value.trim();
  const role = document.getElementById("newRole").value;

  if (!account || !passkey || !displayName) {
    alert("所有欄位皆為必填");
    return;
  }

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addUser",
        operatorRole: currentUser.role,
        account,
        passkey,
        displayName,
        role,
      }),
    });
    const result = await response.json();
    if (result.status === "success") {
      closeUserModal();
      loadUsersData();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("連線錯誤");
  }
}

async function deleteUser(rowIndex) {
  if (!confirm("確定要刪除此帳號嗎？")) return;
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteUser",
        operatorRole: currentUser.role,
        rowIndex: rowIndex,
      }),
    });
    const result = await response.json();
    if (result.status === "success") {
      loadUsersData();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("連線錯誤");
  }
}

// 載入與儲存系統設定
async function loadSystemConfig() {
  try {
    const response = await fetch(`${GAS_URL}?action=getSystemConfig`);
    const result = await response.json();
    if (result.status === "success" || result.systemStatus) {
      document.getElementById("configSystemStatus").value =
        result.systemStatus || "active";
      document.getElementById("configAnnouncement").value =
        result.announcement || "";

      const statusMap = {
        active: "正常運行",
        maintenance: "系統維護中",
        offline: "伺服器離線",
      };
      document.getElementById("statSystemStatus").textContent =
        statusMap[result.systemStatus] || "正常運行";
    }
  } catch (err) {}
}

async function saveSystemConfig() {
  const systemStatus = document.getElementById("configSystemStatus").value;
  const announcement = document.getElementById("configAnnouncement").value;

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "setSystemConfig",
        operatorRole: currentUser.role,
        systemStatus,
        announcement,
      }),
    });
    const result = await response.json();
    if (result.status === "success") {
      alert("系統設定已儲存");
      loadSystemConfig();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("連線錯誤");
  }
}
