/* ============================================================
   2647 WOS FOUNDRY - 多國語系字典檔 (118n.js)
   ============================================================ */
const buildingsConfig = [
  { id: "b0", gIdx: 0, nameZht: "1號武器試驗場 (6000)", nameEn: "Facility 1 (6000)", needVice: false },
  { id: "b1", gIdx: 0, nameZht: "1號武器維修站 (3000)", nameEn: "Repair 1 (3000)", needVice: true },
  { id: "b2", gIdx: 1, nameZht: "2號武器試驗場 (6000)", nameEn: "Facility 2 (6000)", needVice: false },
  { id: "b3", gIdx: 1, nameZht: "2號武器維修站 (3000)", nameEn: "Repair 2 (3000)", needVice: true },
  { id: "b4", gIdx: 2, nameZht: "3號武器維修站 (3000)", nameEn: "Repair 3 (3000)", needVice: false },
  { id: "b5", gIdx: 2, nameZht: "中轉站 (1200)", nameEn: "Relay (1200)", needVice: true },
  { id: "b6", gIdx: 3, nameZht: "4號武器維修站 (3000)", nameEn: "Repair 4 (3000)", needVice: false },
  { id: "b7", gIdx: 3, nameZht: "蒸氣鍋爐 (1700)", nameEn: "Boiler (1700)", needVice: true }
];

const langPack = {
  zht: {
    // 登入介面
    loginTitle: "幹部身分認證",
    loginSubtitle: "請輸入指派之幹部帳號與通行密碼以存取分配系統",
    loginAccountLabel: "帳號",
    loginAccountPlaceholder: "請輸入帳號",
    loginPasskeyLabel: "通行密碼",
    loginPasskeyPlaceholder: "請輸入密碼",
    btnLogin: "驗證並進入系統",
    loginValidating: "驗證中...",
    loginEmptyError: "請輸入幹部帳號與通行密碼",
    loginNetworkError: "連線驗證失敗，請檢查網路後再試。",
    btnLogout: "登出",

    // 開場與導覽
    introText: "MADE BY TSENG",
    btnHistoryModal: "📂 編輯歷史分配紀錄",
    btnViewSystem: "📲 進入檢視系統",
    btnOldSystem: "📲 查看舊版本分配系統",
    btnManageSystem: "⚙️ 管理中心(ADMIN)",
    btnCancelEdit: "取消編輯 (恢復全新發布)",
    mainTitle: "兵工廠人員分配系統 3.0",
    infoTitle: "當前兵工廠建築清單：",
    infoItems: [
      "1號武器試驗場 (6000)", "2號武器試驗場 (6000)",
      "1號武器維修站 (3000)", "2號武器維修站 (3000)",
      "3號武器維修站 (3000)", "4號武器維修站 (3000)",
      "中繼站 (1200)", "蒸氣鍋爐 (1700)"
    ],

    // 隊長設定
    leaderTitle: "各組隊長設定 (戰力需 ≥ 4000)",
    labels: [
      "第一組隊長（1號武器試驗場 & 1號武器維修廠）",
      "第二組隊長（2號武器試驗場 & 2號武器維修廠）",
      "第三組隊長（3號武器維修廠 & 中轉站.）",
      "第四組隊長（4號武器維修廠 & 蒸氣鍋爐）"
    ],
    placeholders: { name: "輸入或點擊指派隊長名字", power: "輸入隊長戰力" },
    viceAccordionTitle: "⚙️ 進階設定：手動指定各組副隊長 (預設自動揀選)",
    viceNoticeText: "💡 提示：手動指定之副隊長會自動併入平衡分配，無需在主名單重複輸入。",
    viceLabels: [
      "第 1 組副隊長 (維修廠 I)", "第 2 組副隊長 (維修廠 II)",
      "第 3 組副隊長 (中轉站)", "第 4 組副隊長 (蒸氣鍋爐)"
    ],
    vicePlaceholderName: "副隊長名字",
    vicePlaceholderPower: "副隊長戰力",

    // 隊員輸入
    memberTitle: "參戰隊員分配區",
    labelMainList: "⚔️ 1. 主平衡分配名單 (一行為一筆：名字 戰力)",
    memberDesc: "填入此區的人員會自動依戰力<strong>平均拆分</strong>進入 8 大建築。",
    labelGatherList: "⚡ 2. 採集小隊名單 (手動填寫)",
    labelAmmoList: "🎒 3. 子彈小隊名單 (手動填寫)",
    gatherPlaceholder: "輸入負責採集的人名，一行為一人 (例：塔卡)",
    ammoPlaceholder: "輸入撿子彈的 8 人名單，一行為一人",
    btnDistribute: "開始戰力平衡分配",
    btnLoadTestData: "載入測試用資料",
    quickTitle: "⚡ 快速指派隊長（點擊填入左側空缺）",

    // 確認彈窗
    modalTitle: "🛡️ 戰前名單資料確認",
    modalDesc: "請確認以下輸入的作戰人員數據是否準確：",
    overviewTitle: "【名單數據總覽】",
    overviewCountText: "去重後參戰總人數：",
    overviewCountUnit: " 人",
    leaderPreviewTitle: "【各組指揮官配置】",
    leaderGText: "第 ", leaderGUnit: " 組：",
    mainPoolTitle: "【主平衡分配池】：共 ",
    gatherPoolTitle: "【採集小隊】：共 ",
    ammoPoolTitle: "【子彈小隊】：共 ",
    poolUnit: " 人",
    emptyText: "(未填寫)",
    modalCancel: "返回",
    modalConfirm: "確認無誤，開始分配",

    // 名單變更偵測彈窗 (補齊)
    reallocateTitle: "⚙️ 偵測到名單變更 / 選擇分配模式",
    reallocateDesc: "目前已有分配結果。系統偵測到有變更或新進人員，請選擇處理方式：",
    reallocateDetectPrefix: "偵測到新增 ",
    reallocateDetectSuffix: " 名成員：",
    reallocateNoNew: "⚠️ 目前主名單中未偵測到未分配的新成員。",
    btnAppendNew: "➕ 僅增補新進人員至暫存區 (保留現有分配)",
    btnFullReallocate: "🔄 重新完全分配 (覆蓋所有當前名單)",
    btnReallocateCancel: "取消",

    // 快速新增成員彈窗 (補齊)
    quickAddTitleDefault: "➕ 手動新增成員",
    quickAddTitlePrefix: "➕ 新增至 ",
    quickAddTitleGather: "⚡ 新增至採集小隊",
    quickAddTitleAmmo: "🎒 新增至子彈小隊",
    quickAddLabelName: "成員名稱：",
    quickAddPlaceholderName: "例：Tom",
    quickAddLabelPower: "戰力數值：",
    quickAddPlaceholderPower: "例：5200",
    btnQuickAddCancel: "取消",
    btnQuickAddConfirm: "確認新增",

    // 卡片內部按鈕與暫存池 (補齊)
    btnAddMemberCard: "➕ 新增人員",
    btnAddGatherMember: "➕ 新增採集人員",
    btnAddAmmoMember: "➕ 新增子彈人員",
    unassignedTitle: "🎒 待分配新進人員",
    unassignedDesc: "請直接拖曳以下人員至各建築分配",
    deleteBtnTitle: "直接移除此人",
    lockedLeaderTip: "隊長/手動副隊長固定無法移動",

    // 發布彈窗
    publishHeader: "☁️ 發布分配結果",
    lblPublishLegion: "1. 請選擇發布軍團 (Legion)：",
    lblPublishEventType: "2. 請選擇活動名稱：",
    lblPublishTitle: "3. 標題 / Title：(自動填入 / Auto fill in)：",
    lblPublishAuthor: "4. 分配員暱稱：",
    lblPublishPasscode: "5. 設定存取密碼 (停用中)：",
    btnPublishCancel: "取消",
    btnConfirmPublish: "確認並發布",

    // 歷史紀錄彈窗
    uiLoadHistoryTitle: "📂 編輯歷史分配紀錄",
    lblLoadHistory: "選擇要載入的分配紀錄：",
    lblLoadLegion: "選擇要載入的軍團：",
    lblLoadPasscode: "解鎖密碼 (若該紀錄受密碼保護需填寫)：",
    btnLoadCancel: "取消",
    btnConfirmLoad: "繼續",

    // 更新日誌
    changelogTitle: "💾 系統更新紀錄 / Changelog",
    changelogDesc: "本系統之歷史重構與優化明細項目：",
    btnCloseChangelog: "關閉視窗 / Close",

    // 結果看板
    btnPublish: "☁️ 發布最新分配結果 (公開給所有人檢視)",
    summaryTitle: "📊 數據總計",
    summaryText: ["總參戰人數：", "總戰力：", "每組平均戰力："],
    copyTitle: "📋 分配後的人員清單 (可直接複製)",
    btnCopyText: "點擊一鍵複製名單",
    tweakTitle: "⚡ 建築物人員微調區 (可直接滑鼠拖曳名字更換位置)",
    btnScreenshotText: "點擊截圖表格區並儲存",
    btnMapScreenshot: "🗺️ 下載「兵工廠地圖版」人員分配圖",
    mapProcessing: "⏳ 正在繪製地圖...",
    buildingPower: "建築戰力：",
    leaderTag: "隊長",
    viceTag: "副隊",
    specTitleGather: "⚡ 採集小隊",
    specLabelGather: "負責採集資源",
    specTitleAmmo: "🎒 子彈小隊",
    specLabelAmmo: "負責提供備用彈藥",
    groupTitles: ["第一組", "第二組", "第三組", "第四組", "特殊任務小隊"],
    alertSuccess: "名單已成功複製到剪貼簿！",
    alertRepeat: "已經指派過了！",
    alertFull: "隊長位置已滿！",

    // 檢視系統專用
    selectLabel: "📜 選擇分配紀錄：",
    metaAuthor: "分配人員：",
    metaTime: "發布時間："
  },

  en: {
    // Login Screen
    loginTitle: "Staff Authentication",
    loginSubtitle: "Please enter your staff account and passcode to access",
    loginAccountLabel: "Account",
    loginAccountPlaceholder: "Enter staff account",
    loginPasskeyLabel: "Passcode",
    loginPasskeyPlaceholder: "Enter passcode",
    btnLogin: "Verify & Enter",
    loginValidating: "Verifying...",
    loginEmptyError: "Please enter account and passcode.",
    loginNetworkError: "Connection failed. Please check your network.",
    btnLogout: "Logout",

    // Intro & Nav
    introText: "MADE BY TSENG",
    btnHistoryModal: "📂 Edit History Record",
    btnViewSystem: "📲 Public View System",
    btnOldSystem: "📲 Old Version System",
    btnManageSystem: "⚙️ Admin Center",
    btnCancelEdit: "Cancel Edit (New Publish)",
    mainTitle: "WOS FOUNDRY ALLOCATION 3.0",
    infoTitle: "Current Building List:",
    infoItems: [
      "Facility 1 (6000)", "Facility 2 (6000)",
      "Repair 1 (3000)", "Repair 2 (3000)",
      "Repair 3 (3000)", "Repair 4 (3000)",
      "Relay (1200)", "Boiler (1700)"
    ],

    // Leader Setup
    leaderTitle: "Squad Leader Settings (Power ≥ 4000)",
    labels: [
      "Group 1 Leader (Facility 1 & Repair 1)",
      "Group 2 Leader (Facility 2 & Repair 2)",
      "Group 3 Leader (Repair 3 & Relay)",
      "Group 4 Leader (Repair 4 & Boiler)"
    ],
    placeholders: { name: "Enter or assign leader name", power: "Leader power" },
    viceAccordionTitle: "⚙️ Advanced: Assign Vice-Leaders (Auto Pick Default)",
    viceNoticeText: "💡 Note: Vice-leaders will be auto balanced. Do not repeat in the main list.",
    viceLabels: [
      "Group 1 Vice-CDR (Repair I)", "Group 2 Vice-CDR (Repair II)",
      "Group 3 Vice-CDR (Relay)", "Group 4 Vice-CDR (Boiler)"
    ],
    vicePlaceholderName: "Vice-CDR Name",
    vicePlaceholderPower: "Vice-CDR Power",

    // Member Inputs
    memberTitle: "Troop Member Allocation",
    labelMainList: "⚔️ 1. Main Balancing Pool (One per line: Name Power)",
    memberDesc: "Members in this pool will be <strong>equally split</strong> into 8 buildings.",
    labelGatherList: "⚡ 2. Gathering Squad (Manual Input)",
    labelAmmoList: "🎒 3. Ammo Squad (Manual Input)",
    gatherPlaceholder: "Enter gathering members, one per line",
    ammoPlaceholder: "Enter 8 ammo members, one per line",
    btnDistribute: "Start Balanced Allocation",
    btnLoadTestData: "Load Test Data",
    quickTitle: "⚡ Quick Assign Leaders (Click to assign empty slot)",

    // Confirm Modal
    modalTitle: "🛡️ Pre-battle Data Confirmation",
    modalDesc: "Please verify the allocated roster figures below:",
    overviewTitle: "[Overview]",
    overviewCountText: "Total Unique Combatants: ",
    overviewCountUnit: " Players",
    leaderPreviewTitle: "[Commanders Setup]",
    leaderGText: "Group ", leaderGUnit: ": ",
    mainPoolTitle: "[Main Balance Pool]: Total ",
    gatherPoolTitle: "[Gathering Squad]: Total ",
    ammoPoolTitle: "[Ammo Squad]: Total ",
    poolUnit: " Players",
    emptyText: "(Empty)",
    modalCancel: "Back",
    modalConfirm: "Confirm & Start",

    // Roster Change Modal (Added)
    reallocateTitle: "⚙️ Roster Change Detected / Select Allocation Mode",
    reallocateDesc: "Allocation exists. Changes or new members detected. Please select an action:",
    reallocateDetectPrefix: "Detected ",
    reallocateDetectSuffix: " new member(s):",
    reallocateNoNew: "⚠️ No unassigned new members detected in the main list.",
    btnAppendNew: "➕ Add New Members to Pool Only (Keep Current)",
    btnFullReallocate: "🔄 Full Rebalance (Overwrite All Current)",
    btnReallocateCancel: "Cancel",

    // Quick Add Modal (Added)
    quickAddTitleDefault: "➕ Add Member Manually",
    quickAddTitlePrefix: "➕ Add to ",
    quickAddTitleGather: "⚡ Add to Gathering Squad",
    quickAddTitleAmmo: "🎒 Add to Ammo Squad",
    quickAddLabelName: "Member Name:",
    quickAddPlaceholderName: "e.g., Tom",
    quickAddLabelPower: "Power:",
    quickAddPlaceholderPower: "e.g., 5200",
    btnQuickAddCancel: "Cancel",
    btnQuickAddConfirm: "Confirm & Add",

    // Cards & Unassigned Pool (Added)
    btnAddMemberCard: "➕ Add Member",
    btnAddGatherMember: "➕ Add Gathering Member",
    btnAddAmmoMember: "➕ Add Ammo Member",
    unassignedTitle: "🎒 Unassigned Pool",
    unassignedDesc: "Drag members to assign them to buildings",
    deleteBtnTitle: "Remove member",
    lockedLeaderTip: "Leader/Vice locked and cannot be moved",

    // Publish Modal
    publishHeader: "☁️ Publish Allocation",
    lblPublishLegion: "1. Select Legion:",
    lblPublishEventType: "2. Event Type:",
    lblPublishTitle: "3. Title: (Auto fill in):",
    lblPublishAuthor: "4. Author Name:",
    lblPublishPasscode: "5. Passcode (Disabled):",
    btnPublishCancel: "Cancel",
    btnConfirmPublish: "Confirm & Publish",

    // History Modal
    uiLoadHistoryTitle: "📂 Edit History Record",
    lblLoadHistory: "Select Record to Load:",
    lblLoadLegion: "Select Legion:",
    lblLoadPasscode: "Unlock Passcode (If protected):",
    btnLoadCancel: "Cancel",
    btnConfirmLoad: "Proceed",

    // Changelog
    changelogTitle: "💾 System Changelog",
    changelogDesc: "Version updates and optimizations:",
    btnCloseChangelog: "Close",

    // Result & Board
    btnPublish: "☁️ Publish Latest Result (Public View)",
    summaryTitle: "📊 Total Overview",
    summaryText: ["Total Players: ", "Total Power: ", "Avg Group Power: "],
    copyTitle: "📋 Allocation Text List (One-click Copy)",
    btnCopyText: "Copy Text List",
    tweakTitle: "⚡ Drag & Drop Board (Drag names to swap)",
    btnScreenshotText: "Capture Board & Save Image",
    btnMapScreenshot: "🗺️ Download Map Allocation Chart",
    mapProcessing: "⏳ Generating Map...",
    buildingPower: "Total Power: ",
    leaderTag: "CDR",
    viceTag: "V-CDR",
    specTitleGather: "⚡ Gathering Squad",
    specLabelGather: "Resource Gathering",
    specTitleAmmo: "🎒 Ammo Squad",
    specLabelAmmo: "Ammo Support",
    groupTitles: ["Group 1", "Group 2", "Group 3", "Group 4", "Special Squad"],
    alertSuccess: "Roster copied to clipboard!",
    alertRepeat: "already assigned!",
    alertFull: "Leader slots are full!",

    // Viewer
    selectLabel: "📜 Select Record:",
    metaAuthor: "Author: ",
    metaTime: "Time: "
  }
};
