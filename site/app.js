const seedCases = [
  {serial:'FT1001',asset_tag:'UF900001',device_type:'Switch',current_bin:'SSRB STOCK',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'mubtr02a-wp-sw-1',dns_bin:'MUB TR02A',network_state:'Active',physical_result:'Found',physical_bin:'MUB TR02A',physical_rack:'',physical_u:'',spare:'',myassets:'ACTIVE',receipt:'',decision:'PASS - UPDATE',action:'Update Flowtrac to physically verified location',target_bin:'MUB TR02A',target_rack:'',target_u:'',confidence:'High',reason:'PHYSICAL_VERIFIED_LOCATION',next:'Validate the physical audit record, then update Flowtrac.',gate_a:'PASS',gate_b:'PASS',gate_c:'CONFLICT',conflict:'Physical location conflicts with Flowtrac',evidence:'Flowtrac=SSRB STOCK | DNS→MUB TR02A | Network discovery=Active | Physical=Found at MUB TR02A'},
  {serial:'FT1002',asset_tag:'UF900002',device_type:'Switch',current_bin:'SSRB 130B',rack:'R01',u:'U10',flowtrac_status:'ACTIVE',dns:'ssrb130b-dc-sw-2',dns_bin:'SSRB 130B',network_state:'Active',physical_result:'Found',physical_bin:'SSRB 130B',physical_rack:'R02',physical_u:'U14',spare:'',myassets:'ACTIVE',receipt:'',decision:'PASS - UPDATE',action:'Update Flowtrac to physically verified location',target_bin:'SSRB 130B',target_rack:'R02',target_u:'U14',confidence:'High',reason:'PHYSICAL_VERIFIED_LOCATION',next:'Validate the physical audit record, then update Flowtrac.',gate_a:'PASS',gate_b:'PASS',gate_c:'CONFLICT',conflict:'Physical Rack/U conflicts with Flowtrac',evidence:'Flowtrac=SSRB 130B R01/U10 | DNS→SSRB 130B | Network discovery=Active | Physical=Found at SSRB 130B R02/U14'},
  {serial:'FT1003',asset_tag:'UF900003',device_type:'Server',current_bin:'SSRB 230B',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'ssrb230b-dc-svr-4',dns_bin:'SSRB 230B',network_state:'Active',physical_result:'Not Found',physical_bin:'SSRB 230B',physical_rack:'',physical_u:'',spare:'Yes — SSRB Stock',myassets:'ACTIVE',receipt:'',decision:'PASS - UPDATE',action:'Update Flowtrac to spare/stock location',target_bin:'SSRB STOCK',target_rack:'',target_u:'',confidence:'High',reason:'FOUND_IN_SPARE_STORAGE',next:'Update Bin to verified spare location and clear Rack/U.',gate_a:'PASS',gate_b:'PASS',gate_c:'CLEAR',conflict:'',evidence:'Flowtrac=SSRB 230B | DNS→SSRB 230B | Network discovery=Active | Physical=Not Found | Spare check=Found at SSRB Stock'},
  {serial:'FT1004',asset_tag:'UF900004',device_type:'Switch',current_bin:'SSRB STOCK',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'',dns_bin:'',network_state:'',physical_result:'Not Found',physical_bin:'SSRB STOCK',physical_rack:'',physical_u:'',spare:'No',myassets:'DISPOSED',receipt:'No',decision:'REVIEW',action:'Review likely Disposed status',target_bin:'Disposed',target_rack:'',target_u:'',confidence:'Medium',reason:'OFFICIAL_STATUS_RECEIPT_MISSING',next:'Confirm policy for updating without a receipt; preserve the missing-receipt note.',gate_a:'PASS',gate_b:'PASS',gate_c:'CONFLICT',conflict:'Official status conflicts with Flowtrac active state',evidence:'Flowtrac=SSRB STOCK | Physical=Not Found | Spare check=No | myAssets=Disposed | Receipt=No'},
  {serial:'FT1005',asset_tag:'UF900005',device_type:'Firewall',current_bin:'SSRB 130B',rack:'R03',u:'U20',flowtrac_status:'ACTIVE',dns:'ssrb130b-dc-fw-1',dns_bin:'SSRB 130B',network_state:'Active',physical_result:'Found',physical_bin:'SSRB 130B',physical_rack:'R03',physical_u:'U20',spare:'',myassets:'ACTIVE',receipt:'',decision:'PASS - NO CHANGE',action:'Confirm current Flowtrac location',target_bin:'SSRB 130B',target_rack:'R03',target_u:'U20',confidence:'High',reason:'PHYSICAL_LOCATION_MATCH',next:'Record verification date; no location change required.',gate_a:'PASS',gate_b:'PASS',gate_c:'CLEAR',conflict:'',evidence:'Flowtrac=SSRB 130B R03/U20 | DNS→SSRB 130B | Network discovery=Active | Physical=Found at SSRB 130B R03/U20'},
  {serial:'FT1006',asset_tag:'',device_type:'Switch',current_bin:'MUB TR02A',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'mubtr02a-wp-sw-3',dns_bin:'MUB TR02A',network_state:'Active',physical_result:'Found',physical_bin:'MUB TR02A',physical_rack:'',physical_u:'',spare:'',myassets:'',receipt:'',decision:'REVIEW',action:'Keep location; follow up on pending asset tag',target_bin:'MUB TR02A',target_rack:'',target_u:'',confidence:'Medium',reason:'INSTALLED_PENDING_ASSET_TAG',next:'Assign an owner and due date for asset-tag completion.',gate_a:'PASS',gate_b:'PASS',gate_c:'CLEAR',conflict:'',evidence:'Flowtrac=MUB TR02A | DNS→MUB TR02A | Network discovery=Active | Physical=Found at MUB TR02A | Asset tag=Pending'},
  {serial:'FT1007',asset_tag:'UF900007',device_type:'Switch',current_bin:'SSRB STOCK',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'b0038tr01a-dc-sw-7',dns_bin:'B0038 TR01A',network_state:'Active',physical_result:'Not Found',physical_bin:'B0038 TR01A',physical_rack:'',physical_u:'',spare:'No',myassets:'ACTIVE',receipt:'',decision:'REVIEW',action:'Verify DNS-derived deployed location',target_bin:'B0038 TR01A',target_rack:'',target_u:'',confidence:'Medium',reason:'STOCK_BUT_NETWORK_EVIDENCE_DEPLOYED',next:'Check the device at B0038 TR01A; update only after owner or physical confirmation.',gate_a:'NOT MET',gate_b:'PASS',gate_c:'CONFLICT',conflict:'DNS-derived location conflicts with Flowtrac',evidence:'Flowtrac=SSRB STOCK | DNS→B0038 TR01A | Network discovery=Active | Physical=Not Found | Spare check=No'},
  {serial:'FT1008',asset_tag:'UF900008',device_type:'Server',current_bin:'SSRB 130B',rack:'R09',u:'U04',flowtrac_status:'ACTIVE',dns:'ssrb230b-dc-svr-8',dns_bin:'SSRB 230B',network_state:'Active',physical_result:'Found',physical_bin:'SSRB 230B',physical_rack:'R11',physical_u:'U08',spare:'',myassets:'ACTIVE',receipt:'',decision:'PASS - UPDATE',action:'Update Flowtrac to physically verified location',target_bin:'SSRB 230B',target_rack:'R11',target_u:'U08',confidence:'High',reason:'PHYSICAL_VERIFIED_LOCATION',next:'Validate the physical audit record, then update Flowtrac.',gate_a:'PASS',gate_b:'PASS',gate_c:'CONFLICT',conflict:'Physical location conflicts with Flowtrac',evidence:'Flowtrac=SSRB 130B R09/U04 | DNS→SSRB 230B | Network discovery=Active | Physical=Found at SSRB 230B R11/U08'},
  {serial:'FT1009',asset_tag:'UF900009',device_type:'UPS',current_bin:'DISPOSED',rack:'',u:'',flowtrac_status:'DISPOSED',dns:'',dns_bin:'',network_state:'',physical_result:'Not Checked',physical_bin:'',physical_rack:'',physical_u:'',spare:'',myassets:'DISPOSED',receipt:'Yes — SR-2026-0509',decision:'PASS - NO CHANGE',action:'Confirm disposed record; no location update',target_bin:'DISPOSED',target_rack:'',target_u:'',confidence:'High',reason:'FLOWTRAC_ALREADY_DISPOSED',next:'Exclude from active Bin/Rack audit.',gate_a:'PASS',gate_b:'PASS',gate_c:'CLEAR',conflict:'',evidence:'Flowtrac=DISPOSED | myAssets=Disposed | Receipt=Yes'},
  {serial:'FT1010',asset_tag:'UF900010',device_type:'Server',current_bin:'SSRB 230B',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'',dns_bin:'',network_state:'',physical_result:'Not Found',physical_bin:'SSRB 230B',physical_rack:'',physical_u:'',spare:'No',myassets:'SURPLUS',receipt:'Yes — SR-2026-0625',decision:'PASS - UPDATE',action:'Update Flowtrac to Surplus',target_bin:'Surplus',target_rack:'',target_u:'',confidence:'High',reason:'OFFICIAL_STATUS_AND_RECEIPT_CONFIRMED',next:'Update status/location and reference the receipt ID.',gate_a:'PASS',gate_b:'PASS',gate_c:'CONFLICT',conflict:'Official status conflicts with Flowtrac active state',evidence:'Flowtrac=SSRB 230B | Physical=Not Found | Spare check=No | myAssets=Surplus | Receipt=Yes'},
  {serial:'FT1011',asset_tag:'UF900011',device_type:'Switch',current_bin:'HUB TR01A',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'mubtr02a-wp-sw-9',dns_bin:'MUB TR02A',network_state:'Active',physical_result:'Found',physical_bin:'MUB TR02A',physical_rack:'',physical_u:'',spare:'',myassets:'ACTIVE',receipt:'',decision:'PASS - UPDATE',action:'Update Flowtrac to physically verified location',target_bin:'MUB TR02A',target_rack:'',target_u:'',confidence:'High',reason:'PHYSICAL_VERIFIED_LOCATION',next:'Validate the physical audit record, then update Flowtrac.',gate_a:'PASS',gate_b:'PASS',gate_c:'CONFLICT',conflict:'Physical location conflicts with Flowtrac',evidence:'Flowtrac=HUB TR01A | DNS→MUB TR02A | Network discovery=Active | Physical=Found at MUB TR02A'},
  {serial:'FT1012',asset_tag:'UF900012',device_type:'Switch',current_bin:'SSRB STOCK',rack:'',u:'',flowtrac_status:'ACTIVE',dns:'ssrb130b-dc-sw-12',dns_bin:'SSRB 130B',network_state:'Active',physical_result:'Not Found',physical_bin:'SSRB 130B',physical_rack:'',physical_u:'',spare:'No',myassets:'ACTIVE',receipt:'',decision:'REVIEW',action:'Verify DNS-derived deployed location',target_bin:'SSRB 130B',target_rack:'',target_u:'',confidence:'Medium',reason:'STOCK_BUT_NETWORK_EVIDENCE_DEPLOYED',next:'Check the device at SSRB 130B; update only after physical confirmation.',gate_a:'NOT MET',gate_b:'PASS',gate_c:'CONFLICT',conflict:'DNS-derived location conflicts with Flowtrac',evidence:'Flowtrac=SSRB STOCK | DNS→SSRB 130B | Network discovery=Active | Physical=Not Found | Spare check=No'}
];

let cases = structuredClone(seedCases).map(item => ({...item, reviewer_decision:'Pending', reviewer_notes:''}));
const qs = selector => document.querySelector(selector);
const qsa = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function badge(value) {
  const text = value || '—';
  let kind = 'neutral';
  if (['High','PASS - UPDATE','PASS - NO CHANGE','PASS','CLEAR','Approve'].includes(text)) kind = 'good';
  if (['Medium','REVIEW','CONFLICT','Need More Evidence','Pending'].includes(text)) kind = 'warn';
  if (['Low','HALTED - INSUFFICIENT','Reject','NOT MET'].includes(text)) kind = 'danger';
  return `<span class="badge ${kind}">${escapeHtml(text)}</span>`;
}

function barList(container, entries) {
  const max = Math.max(...entries.map(([, count]) => count), 1);
  container.innerHTML = entries.map(([label, count]) => `<div class="bar-row"><div class="bar-label">${escapeHtml(label)}</div><div class="bar-track"><div class="bar-fill" style="width:${(count/max)*100}%"></div></div><div class="bar-count">${count}</div></div>`).join('');
}

function filteredCases() {
  const status = qs('#statusFilter').value;
  const confidence = qs('#confidenceFilter').value;
  const search = qs('#searchFilter').value.trim().toUpperCase();
  return cases.filter(c => (status === 'ALL' || c.decision === status) && (confidence === 'ALL' || c.confidence === confidence) && (!search || Object.values(c).join(' ').toUpperCase().includes(search)));
}

function renderDashboard() {
  qs('#metricTotal').textContent = cases.length;
  qs('#metricUpdates').textContent = cases.filter(c => c.decision === 'PASS - UPDATE').length;
  qs('#metricReview').textContent = cases.filter(c => c.decision === 'REVIEW').length;
  qs('#metricInsufficient').textContent = cases.filter(c => c.decision === 'HALTED - INSUFFICIENT').length;
  const statuses = ['PASS - UPDATE','PASS - NO CHANGE','REVIEW','HALTED - INSUFFICIENT'];
  barList(qs('#statusBars'), statuses.map(s => [s, cases.filter(c => c.decision === s).length]));
  const confidences = ['High','Medium','Low'];
  barList(qs('#confidenceBars'), confidences.map(s => [s, cases.filter(c => c.confidence === s).length]));
  const rows = filteredCases();
  qs('#dashboardTable').innerHTML = `<thead><tr><th>Serial</th><th>Asset tag</th><th>Current Bin</th><th>DNS candidate</th><th>Physical evidence</th><th>Decision</th><th>Confidence</th><th>Reason code</th></tr></thead><tbody>${rows.map(c => `<tr><td class="code">${escapeHtml(c.serial)}</td><td class="code">${escapeHtml(c.asset_tag || 'Pending')}</td><td>${escapeHtml(c.current_bin)} ${escapeHtml([c.rack,c.u].filter(Boolean).join('/'))}</td><td>${escapeHtml(c.dns_bin || '—')}</td><td>${escapeHtml(c.physical_result)}${c.physical_bin ? ` · ${escapeHtml(c.physical_bin)}` : ''}</td><td>${badge(c.decision)}<div style="margin-top:7px">${escapeHtml(c.action)}</div></td><td>${badge(c.confidence)}</td><td class="code">${escapeHtml(c.reason)}</td></tr>`).join('')}</tbody>`;
}

function renderReview() {
  qs('#reviewTable').innerHTML = `<thead><tr><th>Serial</th><th>Current</th><th>Recommended target</th><th>Confidence</th><th>Reason</th><th>Reviewer decision</th><th>Notes</th></tr></thead><tbody>${cases.map((c, index) => `<tr><td class="code">${escapeHtml(c.serial)}</td><td>${escapeHtml(c.current_bin)} ${escapeHtml([c.rack,c.u].filter(Boolean).join('/'))}</td><td>${escapeHtml(c.target_bin || '—')} ${escapeHtml([c.target_rack,c.target_u].filter(Boolean).join('/'))}<br><span class="muted">${escapeHtml(c.action)}</span></td><td>${badge(c.confidence)}</td><td class="code">${escapeHtml(c.reason)}</td><td><select class="review-select" data-review-index="${index}">${['Pending','Approve','Reject','Need More Evidence'].map(v => `<option ${c.reviewer_decision===v?'selected':''}>${v}</option>`).join('')}</select></td><td><textarea class="review-note" rows="2" data-note-index="${index}" placeholder="Reviewer notes">${escapeHtml(c.reviewer_notes)}</textarea></td></tr>`).join('')}</tbody>`;
  qsa('[data-review-index]').forEach(el => el.addEventListener('change', e => { cases[Number(e.target.dataset.reviewIndex)].reviewer_decision = e.target.value; }));
  qsa('[data-note-index]').forEach(el => el.addEventListener('input', e => { cases[Number(e.target.dataset.noteIndex)].reviewer_notes = e.target.value; }));
}

function dlRows(entries) { return entries.map(([key,value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value || '—')}</dd>`).join(''); }
function renderCase() {
  const serial = qs('#caseSelect').value || cases[0].serial;
  const c = cases.find(item => item.serial === serial) || cases[0];
  qs('#caseDecision').innerHTML = badge(c.decision);
  qs('#caseConfidence').innerHTML = badge(c.confidence);
  qs('#caseReason').textContent = c.reason;
  qs('#caseEvidence').textContent = c.evidence;
  qs('#currentRecord').innerHTML = dlRows([['Flowtrac Bin', c.current_bin],['Rack / U', [c.rack,c.u].filter(Boolean).join(' / ')],['Status', c.flowtrac_status],['DNS', c.dns],['DNS candidate', c.dns_bin],['Network state', c.network_state],['myAssets', c.myassets],['Receipt', c.receipt]]);
  qs('#recommendedRecord').innerHTML = dlRows([['Action', c.action],['Target Bin', c.target_bin],['Target Rack / U', [c.target_rack,c.target_u].filter(Boolean).join(' / ')],['Next action', c.next],['Conflict', c.conflict],['Reviewer decision', c.reviewer_decision],['Reviewer notes', c.reviewer_notes]]);
  qs('#gateGrid').innerHTML = [['Gate A — objective evidence', c.gate_a],['Gate B — operational evidence', c.gate_b],['Gate C — conflict check', c.gate_c]].map(([label,value]) => `<div class="gate"><span>${escapeHtml(label)}</span><strong>${badge(value)}</strong></div>`).join('');
}

function renderAll() { renderDashboard(); renderReview(); renderCase(); }
function toCsv(rows) {
  if (!rows.length) return '';
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const quote = value => `"${String(value ?? '').replaceAll('"','""')}"`;
  return [columns.map(quote).join(','), ...rows.map(row => columns.map(col => quote(row[col])).join(','))].join('\n');
}
function downloadCsv(filename, rows) {
  const blob = new Blob(['\ufeff' + toCsv(rows)], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  URL.revokeObjectURL(url);
}

qsa('.tab').forEach(button => button.addEventListener('click', () => {
  qsa('.tab').forEach(t => t.classList.remove('active'));
  qsa('.tab-panel').forEach(p => p.classList.remove('active'));
  button.classList.add('active');
  qs(`#${button.dataset.tab}`).classList.add('active');
  if (button.dataset.tab === 'case') renderCase();
}));
['#statusFilter','#confidenceFilter'].forEach(sel => qs(sel).addEventListener('change', renderDashboard));
qs('#searchFilter').addEventListener('input', renderDashboard);
qs('#caseSelect').addEventListener('change', renderCase);
qs('#approveHighButton').addEventListener('click', () => { cases.forEach(c => { if (c.decision === 'PASS - UPDATE' && c.confidence === 'High') c.reviewer_decision = 'Approve'; }); renderReview(); renderCase(); });
qs('#resetButton').addEventListener('click', () => { cases = structuredClone(seedCases).map(item => ({...item, reviewer_decision:'Pending', reviewer_notes:''})); renderAll(); });
qsa('[data-export]').forEach(button => button.addEventListener('click', () => {
  const kind = button.dataset.export;
  if (kind === 'all') downloadCsv('P2D_Decision_Trace_All.csv', cases);
  if (kind === 'updates') downloadCsv('P2D_High_Confidence_Update_Candidates.csv', cases.filter(c => c.decision === 'PASS - UPDATE' && c.confidence === 'High'));
  if (kind === 'review') downloadCsv('P2D_Manual_Review_Queue.csv', cases.filter(c => ['REVIEW','HALTED - INSUFFICIENT'].includes(c.decision)));
  if (kind === 'reviewers') downloadCsv('P2D_Reviewer_Decisions.csv', cases.map(c => ({serial:c.serial,asset_tag:c.asset_tag,decision_status:c.decision,recommended_action:c.action,reviewer_decision:c.reviewer_decision,reviewer_notes:c.reviewer_notes})));
}));

qs('#caseSelect').innerHTML = cases.map(c => `<option>${c.serial}</option>`).join('');
renderAll();
