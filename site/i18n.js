(() => {
  const translations = {
    'P2D · Local browser workbench': 'P2D · 本機瀏覽器工作台',
    'Asset Reconciliation': '資產資料核對',
    'Upload operational exports, map columns, reconcile Serial / Asset Tag / Bin / Rack / U / DNS, review exceptions, and export update-ready files.': '上傳作業系統匯出檔、對應欄位、核對序號／資產標籤／Bin／Rack／U／DNS、審查例外，並匯出可供更新的檔案。',
    'Language': '語言',
    'Files stay in your browser': '檔案只留在你的瀏覽器',
    'Practical workflow': '實際工作流程',
    'Flowtrac is the baseline.': 'Flowtrac 是基準資料。',
    'Network discovery, physical audit, official status, and spare-storage files are supporting evidence. No data is uploaded to a server and this tool does not write back to Flowtrac.': 'Network discovery、實體盤點、官方資產狀態與備品儲存資料都是佐證。資料不會上傳到伺服器，本工具也不會直接寫回 Flowtrac。',
    'Load mock example': '載入模擬範例',
    '1. Upload & Map': '1. 上傳與欄位對應',
    '2. Results': '2. 結果',
    '3. Review': '3. 審查',
    '4. Export': '4. 匯出',
    'Flowtrac baseline': 'Flowtrac 基準資料',
    'Required. CSV or XLSX export containing your current asset records.': '必要。上傳包含目前資產紀錄的 CSV 或 XLSX 匯出檔。',
    'Network discovery': '網路探索資料',
    'Optional. AP, Lansweeper, DNS/IP/MAC, or another active-device export.': '選填。AP、Lansweeper、DNS／IP／MAC 或其他啟用中設備的匯出檔。',
    'Physical audit': '實體盤點',
    'Optional. Verified Bin, Rack, U, found/not-found, and audit notes.': '選填。包含已確認的 Bin、Rack、U、找到／未找到及盤點備註。',
    'Official status': '官方資產狀態',
    'Optional. myAssets-style Asset Tag and active/surplus/disposed status.': '選填。類似 myAssets 的 Asset Tag，以及 Active／Surplus／Disposed 狀態。',
    'Spare storage': '備品儲存區',
    'Optional. Serial, found-in-spare result, and verified stock Bin.': '選填。序號、是否在備品區找到，以及已確認的庫存 Bin。',
    'Run reconciliation': '執行核對',
    'Auto-detect common column names, then adjust mappings below.': '自動偵測常見欄位名稱，再於下方調整對應。',
    'Clear workspace': '清除工作區',
    'Column mapper': '欄位對應',
    'Confirm detected fields': '確認偵測到的欄位',
    'Only Serial is required in Flowtrac. Blank mappings are allowed for fields not present in a source.': 'Flowtrac 只強制需要 Serial。來源檔沒有的欄位可以保留空白。',
    'Upload a file or load the mock example to create mappings.': '上傳檔案或載入模擬範例以建立欄位對應。',
    'Flowtrac records': 'Flowtrac 紀錄',
    'Update candidates': '更新候選',
    'Manual review': '人工審查',
    'Unmatched evidence': '未匹配佐證',
    'Exception queue': '例外佇列',
    'Reconciliation results': '核對結果',
    'Queue': '佇列',
    'All': '全部',
    'No change': '無需變更',
    'Search': '搜尋',
    'Serial, asset tag, Bin…': '序號、資產標籤、Bin…',
    'Human approval': '人工核准',
    'Review and annotate': '審查與註記',
    'Approve only after checking the source evidence. Notes are preserved in exports.': '確認來源佐證後再核准。備註會保留在匯出檔中。',
    'Approve physical high-confidence updates': '核准實體盤點的高信心更新',
    'Full decision trace': '完整決策軌跡',
    'Every Flowtrac record, joined evidence, conflicts, recommendation, and reviewer note.': '包含每筆 Flowtrac 紀錄、合併佐證、衝突、建議與審查備註。',
    'Approved updates': '已核准更新',
    'Only records explicitly approved by the reviewer.': '只包含審查者明確核准的紀錄。',
    'Manual review queue': '人工審查佇列',
    'Conflicts, missing identifiers, and insufficient-evidence cases.': '包含衝突、識別欄位缺失與佐證不足案例。',
    'Network, physical, or spare records whose normalized serial did not match Flowtrac.': '序號標準化後仍無法與 Flowtrac 匹配的網路、實體或備品紀錄。',
    'Download CSV': '下載 CSV',
    'P2D Asset Reconciliation Workbench · Local processing · No automatic production updates': 'P2D 資產資料核對工作台 · 本機處理 · 不會自動更新正式系統',
    'Pending': '待處理',
    'Approve': '核准',
    'Reject': '拒絕',
    'Need More Evidence': '需要更多佐證',
    'Current Bin': '目前 Bin',
    'Current Rack/U': '目前 Rack/U',
    'Recommended Action': '建議動作',
    'Target Bin': '目標 Bin',
    'Target Rack/U': '目標 Rack/U',
    'Confidence': '信心程度',
    'Reason Code': '原因代碼',
    'Reviewer Decision': '審查決定',
    'Reviewer Notes': '審查備註',
    'Serial': '序號',
    'Asset Tag': '資產標籤',
    'Status': '狀態',
    'DNS': 'DNS',
    'Notes': '備註'
  };

  const reverse = Object.fromEntries(Object.entries(translations).map(([en, zh]) => [zh, en]));
  const languageSelect = document.getElementById('languageSelect');
  let currentLanguage = localStorage.getItem('p2d-language') || 'en';
  let applying = false;

  function replaceTextNode(node, dictionary) {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    if (!dictionary[trimmed]) return;
    node.nodeValue = raw.replace(trimmed, dictionary[trimmed]);
  }

  function translateElement(root, dictionary) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => replaceTextNode(node, dictionary));

    root.querySelectorAll?.('[placeholder]').forEach(el => {
      const value = el.getAttribute('placeholder');
      if (dictionary[value]) el.setAttribute('placeholder', dictionary[value]);
    });
    root.querySelectorAll?.('[aria-label]').forEach(el => {
      const value = el.getAttribute('aria-label');
      if (dictionary[value]) el.setAttribute('aria-label', dictionary[value]);
    });
  }

  function applyLanguage(language) {
    applying = true;
    const dictionary = language === 'zh-TW' ? translations : reverse;
    translateElement(document.body, dictionary);
    document.documentElement.lang = language === 'zh-TW' ? 'zh-Hant' : 'en';
    document.title = language === 'zh-TW' ? 'P2D 資產資料核對工作台' : 'P2D Asset Reconciliation Workbench';
    languageSelect.value = language;
    currentLanguage = language;
    localStorage.setItem('p2d-language', language);
    applying = false;
  }

  languageSelect.addEventListener('change', event => applyLanguage(event.target.value));

  const observer = new MutationObserver(mutations => {
    if (applying || currentLanguage !== 'zh-TW') return;
    applying = true;
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) replaceTextNode(node, translations);
      if (node.nodeType === Node.ELEMENT_NODE) translateElement(node, translations);
    }));
    applying = false;
  });

  observer.observe(document.body, { childList: true, subtree: true });
  applyLanguage(currentLanguage);
})();
