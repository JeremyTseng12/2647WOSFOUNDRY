/* ============================================================
   2647 WOS FOUNDRY 3.0 - 完整多國語系字典檔 (118n.js)
   相容：distribution.html (index.js) 與 viewsystem (viewsystem.js)
   ============================================================ */
const buildingsConfig = [
  { id: "b0", gIdx: 0, nameZht: "1號武器試驗場 (6000)", nameEn: "Prototype 1 (6000)", needVice: false },
  { id: "b1", gIdx: 0, nameZht: "1號武器維修站 (3000)", nameEn: "Repair 1 (3000)", needVice: true },
  { id: "b2", gIdx: 1, nameZht: "2號武器試驗場 (6000)", nameEn: "Prototype 2 (6000)", needVice: false },
  { id: "b3", gIdx: 1, nameZht: "2號武器維修站 (3000)", nameEn: "Repair 2 (3000)", needVice: true },
  { id: "b4", gIdx: 2, nameZht: "3號武器維修站 (3000)", nameEn: "Repair 3 (3000)", needVice: false },
  { id: "b5", gIdx: 2, nameZht: "中轉站 (1200)", nameEn: "Transit (1200)", needVice: true },
  { id: "b6", gIdx: 3, nameZht: "4號武器維修站 (3000)", nameEn: "Repair 4 (3000)", needVice: false },
  { id: "b7", gIdx: 3, nameZht: "蒸氣鍋爐 (1700)", nameEn: "Boiler (1700)", needVice: true }
];

const langPack = {
  zht: {
    // 登入介面
    loginTitle: "幹部身分認證",
    loginSubtitle: "請輸入幹部帳號與通行密碼以存取分配系統",
    loginAccountLabel: "帳號",
    loginAccountPlaceholder: "請輸入帳號",
    loginPasskeyLabel: "通行密碼",
    loginPasskeyPlaceholder: "請輸入密碼",
    btnLogin: "驗證並進入系統",
    loginValidating: "驗證中...",
    loginEmptyError: "請輸入幹部帳號與通行密碼",
    loginNetworkError: "連線驗證失敗，請檢查網路後再試。",
    btnLogout: "登出",

    // 頂部導覽與橫幅
    introText: "MADE BY TSENG",
    mainTitle: "兵工廠人員分配系統 3.0",
    btnHistoryModal: "📂 編輯歷史紀錄",
    btnViewSystem: "📲 公開檢視頁",
    btnManageSystem: "⚙️ 管理後台",
    btnCancelEdit: "取消編輯（改為新發布）",

    // 隊長設定
    leaderTitle: "1. 各組隊長設定（戰力需 ≥ 4000）",
    labels: [
      "第一組（1號試驗場 & 1號維修廠）",
      "第二組（2號試驗場 & 2號維修廠）",
      "第三組（3號維修廠 & 中轉站）",
      "第四組（4號維修廠 & 蒸氣鍋爐）"
    ],
    placeholders: { name: "隊長名字", power: "戰力" },
    quickTitle: "⚡ 快速填入空缺隊長：",
    viceAccordionTitle: "⚙️ 進階：手動指定副隊長（預設自動依戰力指派）",
    viceNoticeText: "手動指定的副隊長會自動併入平衡，無需重複填在右側主名單。",
    viceLabels: [
      "第 1 組副隊長",
      "第 2 組副隊長",
      "第 3 組副隊長",
      "第 4 組副隊長"
    ],
    vicePlaceholderName: "名字",
    vicePlaceholderPower: "戰力",

    // 參戰隊員名單
    memberTitle: "2. 參戰隊員名單",
    btnLoadTestData: "填入測試資料",
    labelMainList: "主平衡分配名單（格式：名字 戰力，一行一人）",
    mainListPlaceholder: "名字A 3500\n名字B 2800",
    labelGatherList: "⚡ 採集小隊（一行一人）",
    gatherPlaceholder: "例：塔卡",
    labelAmmoList: "🎒 子彈小隊（一行一人）",
    ammoPlaceholder: "輸入撿子彈名單",
    btnDistribute: "⚡ 立即平衡分配",

    // 結果看板與微調區
    summaryText: ["總參戰人數：", "總戰力：", "每組平均戰力："],
    btnScreenshotText: "匯出表格圖",
    btnMapScreenshotText: "匯出地圖版",
    btnPublish: "☁️ 發布結果",
    tweakTitle: "建築人員微調區（可直接拖曳更換位置，或在卡片底部直接新增）",
    buildingPower: "建築戰力：",
    leaderTag: "隊長",
    viceTag: "副隊",
    specTitleGather: "⚡ 採集小隊",
    specLabelGather: "負責採集資源",
    specPowerLabel: "負責採集資源",
    specTitleAmmo: "🎒 子彈小隊",
    specLabelAmmo: "負責提供備用彈藥",
    specPowerLabelAmmo: "負責提供備用彈藥",
    inlineNamePh: "名字",
    inlinePowerPh: "戰力",
    inlineSpecPh: "輸入名字...",
    removeTip: "移除",

    // 手機版手風琴分組標題 (viewsystem 專用)
    groupTitles: [
      "第一組（1號試驗場 & 1號維修站）",
      "第二組（2號試驗場 & 2號維修站）",
      "第三組（3號維修站 & 中轉站）",
      "第四組（4號維修站 & 蒸氣鍋爐）",
      "特殊小隊（採集 & 子彈）"
    ],

    // 文字複製區
    copyTitle: "📋 文字公告名單（可直接複製貼上至遊戲頻道）",
    btnCopyLangZht: "繁中名單",
    btnCopyLangEn: "英文名單",
    btnCopyText: "複製名單",
    alertSuccess: "名單已成功複製到剪貼簿！",
    alertRepeat: "已經指派過了！",
    alertFull: "隊長位置已滿！",

    // 發布視窗
    publishHeader: "☁️ 發布分配結果",
    lblPublishLegion: "發布軍團",
    optLegionA: "🛡️ 軍團 1 (Legion 1)",
    optLegionB: "⚔️ 軍團 2 (Legion 2)",
    lblPublishEventType: "活動類型",
    optEventFoundry: "兵工廠爭奪戰 (Foundry Battle)",
    optEventTundra: "雪域兵器聯賽 (Tundra Arms League)",
    optEventTest: "測試紀錄 (TEST)",
    lblPublishDate: "活動日期",
    lblPublishTitle: "紀錄標題",
    lblPublishAuthor: "分配員暱稱",
    authorPlaceholder: "輸入暱稱",
    btnPublishCancel: "取消",
    btnConfirmPublish: "確認發布",

    // 歷史紀錄載入視窗
    uiLoadHistoryTitle: "📂 編輯歷史分配紀錄",
    lblLoadHistory: "1. 選擇場次標題：",
    lblLoadLegion: "2. 選擇軍團：",
    btnLoadCancel: "取消",
    btnConfirmLoad: "載入編輯",

    // 匯出預覽確認視窗
    exportPreviewTitleTable: "🖼️ 確認匯出表格版分配圖",
    exportPreviewTitleMap: "🗺️ 確認匯出地圖版分配圖",
    exportPreviewHint: "請確認以下圖片內容與浮水印是否正確，確認後點擊下方按鈕下載：",
    btnExportCancel: "取消 / 返回修改",
    btnConfirmDownloadImg: "✅ 確認無誤，下載圖片",
    allocatorPrefix: "分配人員：",

    // 檢視系統共用
    selectLabel: "📜 選擇分配紀錄：",
    metaAuthor: "分配人員：",
    metaTime: "發布時間："
  },

  en: {
    // Login Screen
    loginTitle: "Staff Authentication",
    loginSubtitle: "Enter staff account and passcode to access the system",
    loginAccountLabel: "Account",
    loginAccountPlaceholder: "Enter account",
    loginPasskeyLabel: "Passcode",
    loginPasskeyPlaceholder: "Enter passcode",
    btnLogin: "Verify & Enter",
    loginValidating: "Verifying...",
    loginEmptyError: "Please enter account and passcode.",
    loginNetworkError: "Connection failed. Please check your network.",
    btnLogout: "Logout",

    // Topbar & Banner
    introText: "MADE BY TSENG",
    mainTitle: "WOS FOUNDRY ALLOCATION 3.0",
    btnHistoryModal: "📂 Edit History",
    btnViewSystem: "📲 Public View",
    btnManageSystem: "⚙️ Admin Panel",
    btnCancelEdit: "Cancel Edit (New Publish)",

    // Leader Setup
    leaderTitle: "1. Squad Leader Settings (Power ≥ 4000)",
    labels: [
      "Group 1 (Prototype 1 & Repair 1)",
      "Group 2 (Prototype 2 & Repair 2)",
      "Group 3 (Repair 3 & Transit)",
      "Group 4 (Repair 4 & Boiler)"
    ],
    placeholders: { name: "Leader Name", power: "Power" },
    quickTitle: "⚡ Quick Assign Empty Leader Slot:",
    viceAccordionTitle: "⚙️ Advanced: Assign Vice-Leaders (Auto Pick Default)",
    viceNoticeText: "Manual vice-leaders are auto-balanced. Do not repeat in the main list.",
    viceLabels: [
      "Group 1 Vice-CDR",
      "Group 2 Vice-CDR",
      "Group 3 Vice-CDR",
      "Group 4 Vice-CDR"
    ],
    vicePlaceholderName: "Name",
    vicePlaceholderPower: "Power",

    // Member Inputs
    memberTitle: "2. Combatant Roster",
    btnLoadTestData: "Load Test Data",
    labelMainList: "Main Balancing Pool (Format: Name Power, one per line)",
    mainListPlaceholder: "PlayerA 3500\nPlayerB 2800",
    labelGatherList: "⚡ Gathering Squad (One per line)",
    gatherPlaceholder: "Enter gathering names",
    labelAmmoList: "🎒 Ammo Squad (One per line)",
    ammoPlaceholder: "Enter ammo names",
    btnDistribute: "⚡ Balance & Allocate Now",

    // Result Board & Tweak
    summaryText: ["Total Players: ", "Total Power: ", "Avg Group Power: "],
    btnScreenshotText: "Export Table Image",
    btnMapScreenshotText: "Export Map Image",
    btnPublish: "☁️ Publish Result",
    tweakTitle: "Tactical Board (Drag to swap positions, or add directly at card bottom)",
    buildingPower: "Power: ",
    leaderTag: "CDR",
    viceTag: "V-CDR",
    specTitleGather: "⚡ Gathering Squad",
    specLabelGather: "Resource Gathering",
    specPowerLabel: "Resource Gathering",
    specTitleAmmo: "🎒 Ammo Squad",
    specLabelAmmo: "Ammo Support",
    specPowerLabelAmmo: "Ammo Support",
    inlineNamePh: "Name",
    inlinePowerPh: "Power",
    inlineSpecPh: "Add name...",
    removeTip: "Remove",

    // Mobile Accordion Titles (for viewsystem)
    groupTitles: [
      "Group 1 (Prototype 1 & Repair 1)",
      "Group 2 (Prototype 2 & Repair 2)",
      "Group 3 (Repair 3 & Transit)",
      "Group 4 (Repair 4 & Boiler)",
      "Special Squads (Gathering & Ammo)"
    ],

    // Text Copy Panel
    copyTitle: "📋 Text Roster (One-click Copy for In-game Chat)",
    btnCopyLangZht: "ZH-TW Text",
    btnCopyLangEn: "EN-US Text",
    btnCopyText: "Copy Roster",
    alertSuccess: "Roster copied to clipboard!",
    alertRepeat: "is already assigned!",
    alertFull: "All leader slots are full!",

    // Publish Modal
    publishHeader: "☁️ Publish Allocation",
    lblPublishLegion: "Select Legion",
    optLegionA: "🛡️ Legion 1",
    optLegionB: "⚔️ Legion 2",
    lblPublishEventType: "Event Type",
    optEventFoundry: "Foundry Battle",
    optEventTundra: "Tundra Arms League",
    optEventTest: "TEST Record",
    lblPublishDate: "Event Date",
    lblPublishTitle: "Record Title",
    lblPublishAuthor: "Allocator Name",
    authorPlaceholder: "Enter nickname",
    btnPublishCancel: "Cancel",
    btnConfirmPublish: "Confirm & Publish",

    // Load History Modal
    uiLoadHistoryTitle: "📂 Edit History Record",
    lblLoadHistory: "1. Select Event Title:",
    lblLoadLegion: "2. Select Legion:",
    btnLoadCancel: "Cancel",
    btnConfirmLoad: "Load & Edit",

    // Export Preview Modal
    exportPreviewTitleTable: "🖼️ Confirm Table Allocation Image",
    exportPreviewTitleMap: "🗺️ Confirm Map Allocation Image",
    exportPreviewHint: "Please verify the image layout and watermark below before downloading:",
    btnExportCancel: "Cancel / Back",
    btnConfirmDownloadImg: "✅ Confirm & Download Image",
    allocatorPrefix: "Allocator: ",

    // Viewer Shared
    selectLabel: "📜 Select Record:",
    metaAuthor: "Author: ",
    metaTime: "Time: "
  }
};
