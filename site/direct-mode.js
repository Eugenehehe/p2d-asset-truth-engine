(() => {
  const ds={valid:[],unresolved:[],bins:[],binColumn:'',stats:{}};
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const clean=v=>String(v??'').trim();
  const upper=v=>clean(v).toUpperCase().replace(/\s+/g,' ');
  const compact=v=>upper(v).replace(/[^A-Z0-9]/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const status=(text,type='info')=>{const el=q('#directRunStatus');if(el){el.textContent=text;el.dataset.type=type;}};

  function headersFor(source){const rows=state.sources[source]||[];return rows.length?Object.keys(rows[0]):[];}
  function autoColumn(source,candidates){const headers=headersFor(source);const lowered=headers.map(h=>clean(h).toLowerCase());for(const c of candidates){const i=lowered.indexOf(c.toLowerCase());if(i>=0)return headers[i];}for(let i=0;i<lowered.length;i++){if(candidates.some(c=>lowered[i].includes(c.toLowerCase())))return headers[i];}return '';}
  function resolvedColumn(source,field){const mapped=state.mappings[source]?.[field];if(mapped)return mapped;const c={serial:['serial','serial number','serial_number','sn'],bin:['bin','current bin','flowtrac bin','location'],dns:['dns','hostname','device name','name']}[field]||[field];return autoColumn(source,c);}
  function getVal(source,row,field){const col=resolvedColumn(source,field);return col?clean(row[col]):'';}
  function serialVariants(value){const k=compact(value),set=new Set();if(!k)return set;set.add(k);if(k.startsWith('S')&&k.length>1)set.add(k.slice(1));else set.add('S'+k);return set;}
  function networkIndex(){const m=new Map();for(const r of state.sources.network||[]){for(const k of serialVariants(getVal('network',r,'serial')))if(!m.has(k))m.set(k,r);}return m;}
  async function parseWorkbook(file){const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});}
  function guessBinColumn(headers){return headers.find(h=>['bin','bin name','location'].includes(clean(h).toLowerCase()))||headers.find(h=>clean(h).toLowerCase().includes('bin'))||'';}
  function parseExistingBin(value){const raw=clean(value),text=upper(raw);return {raw,number:(text.match(/^(\d{4})\s*\(/)||[])[1]||'',abbrev:(text.match(/\(([A-Z0-9]+)\s*-/)||[])[1]||'',suffix:compact((text.match(/\)-(.+)$/)||[])[1]||'')};}
  function parseDnsLocation(dns){
    const first=clean(dns).toLowerCase().split('.')[0].split('-')[0].replace(/[^a-z0-9]/g,'');
    if(!first)return null;
    let m=first.match(/^b(\d{4})(tr[a-z0-9]+|rm[a-z0-9]+|c[a-z0-9]+|\d{3,4}[a-z]?)/);
    if(m)return {buildingNumber:m[1],buildingAbbrev:'',location:compact(m[2]),derived:`${m[1]}-${upper(m[2])}`};
    m=first.match(/^([a-z]{2,10})(tr[a-z0-9]+|rm[a-z0-9]+|c[a-z0-9]+)/);
    if(m)return {buildingNumber:'',buildingAbbrev:upper(m[1]),location:compact(m[2]),derived:`${upper(m[1])} ${upper(m[2])}`};
    m=first.match(/^([a-z]{2,10})(\d{3,4}[a-z]?)/);
    if(m)return {buildingNumber:'',buildingAbbrev:upper(m[1]),location:compact(m[2]),derived:`${upper(m[1])} ${upper(m[2])}`};
    return null;
  }
  function alternatives(location){const s=compact(location),set=new Set([s]);let m=s.match(/^(\d{3})([A-Z]?)$/);if(m)set.add(`0${m[1]}${m[2]}`);m=s.match(/^0(\d{3})([A-Z]?)$/);if(m)set.add(`${m[1]}${m[2]}`);return set;}
  function matchBin(parsed){if(!parsed)return {status:'UNPARSEABLE DNS',matches:[]};const locs=alternatives(parsed.location);const matches=ds.bins.filter(b=>(parsed.buildingNumber?b.number===parsed.buildingNumber:b.abbrev===parsed.buildingAbbrev)&&locs.has(b.suffix));return {status:matches.length===1?'MATCHED':matches.length===0?'BIN NOT FOUND':'AMBIGUOUS BIN',matches};}

  async function loadBins(file){status('Reading Bin master…');const rows=await parseWorkbook(file),headers=rows.length?Object.keys(rows[0]):[];ds.binColumn=guessBinColumn(headers);if(!ds.binColumn)throw new Error(`Could not detect the Bin column. Headers found: ${headers.join(', ')}`);ds.bins=rows.map(r=>parseExistingBin(r[ds.binColumn])).filter(x=>x.raw&&x.suffix&&(x.number||x.abbrev));q('#binsStatus').textContent=`${file.name} · ${ds.bins.length.toLocaleString()} usable bins · column: ${ds.binColumn}`;status('Bin master loaded. Upload Flowtrac and Network Discovery, then click Compare and validate.','success');}

  function build(){
    try{
      status('Comparing Flowtrac and Network Discovery…');
      const flowRows=state.sources.flow||[],networkRows=state.sources.network||[];
      if(!flowRows.length)throw new Error('Flowtrac baseline is not loaded. Upload it in 1. Upload & Map.');
      if(!networkRows.length)throw new Error('Network Discovery is not loaded. Upload it in 1. Upload & Map.');
      if(!ds.bins.length)throw new Error('Existing Flowtrac Bin master is not loaded in this tab.');
      const flowSerial=resolvedColumn('flow','serial'),flowBin=resolvedColumn('flow','bin'),netSerial=resolvedColumn('network','serial'),netDns=resolvedColumn('network','dns');
      if(!flowSerial||!flowBin||!netSerial||!netDns)throw new Error(`Missing required columns. Flowtrac Serial=${flowSerial||'NOT FOUND'}, Flowtrac Bin=${flowBin||'NOT FOUND'}, Network Serial=${netSerial||'NOT FOUND'}, Network DNS=${netDns||'NOT FOUND'}.`);
      const net=networkIndex();ds.valid=[];ds.unresolved=[];let serialMatches=0,dnsRows=0,sameBin=0;
      for(const [i,r] of flowRows.entries()){
        const serial=getVal('flow',r,'serial'),current=clean(getVal('flow',r,'bin'));let nr=null;
        for(const k of serialVariants(serial)){nr=net.get(k);if(nr)break;}
        if(!nr)continue;serialMatches++;
        const dns=getVal('network',nr,'dns');if(!dns){ds.unresolved.push({serial,current_bin:current,dns:'',derived_location:'',building_number:'',building_abbrev:'',location_token:'',reason:'DNS MISSING',candidate_count:0,candidates:''});continue;}dnsRows++;
        const parsed=parseDnsLocation(dns),result=matchBin(parsed);
        if(result.status==='MATCHED'){
          const fullBin=result.matches[0].raw;
          if(compact(fullBin)===compact(current)){sameBin++;continue;}
          ds.valid.push({include:true,serial,current_bin:current,dns,derived_location:parsed.derived,to_warehouse:q('#directWarehouse').value||'UFIT',to_bin:fullBin,row:i+2});
        }else ds.unresolved.push({serial,current_bin:current,dns,derived_location:parsed?.derived||'',building_number:parsed?.buildingNumber||'',building_abbrev:parsed?.buildingAbbrev||'',location_token:parsed?.location||'',reason:result.status,candidate_count:result.matches.length,candidates:result.matches.slice(0,10).map(x=>x.raw).join(' | ')});
      }
      ds.stats={flowRows:flowRows.length,networkRows:networkRows.length,serialMatches,dnsRows,sameBin};render();activate('direct');status(`Done. ${flowRows.length.toLocaleString()} Flowtrac rows, ${serialMatches.toLocaleString()} serial matches, ${ds.valid.length.toLocaleString()} validated updates, ${ds.unresolved.length.toLocaleString()} unresolved, ${sameBin.toLocaleString()} already matching.`,'success');
    }catch(err){console.error(err);status(err.message||String(err),'error');alert(err.message||String(err));}
  }

  function render(){q('#directCount').textContent=ds.valid.length;q('#unresolvedCount').textContent=ds.unresolved.length;q('#directTable').innerHTML=`<thead><tr><th><input id="directSelectAll" type="checkbox" checked></th><th>Serial</th><th>Flowtrac Bin</th><th>DNS</th><th>Validated To Bin</th></tr></thead><tbody>${ds.valid.map((x,i)=>`<tr><td><input type="checkbox" data-direct-include="${i}" ${x.include?'checked':''}></td><td class="code">${esc(x.serial)}</td><td>${esc(x.current_bin)}</td><td class="code">${esc(x.dns)}</td><td>${esc(x.to_bin)}</td></tr>`).join('')}</tbody>`;q('#unresolvedTable').innerHTML=`<thead><tr><th>Serial</th><th>Flowtrac Bin</th><th>DNS</th><th>Derived</th><th>Reason</th><th>Candidate Bins</th></tr></thead><tbody>${ds.unresolved.map(x=>`<tr><td class="code">${esc(x.serial)}</td><td>${esc(x.current_bin)}</td><td class="code">${esc(x.dns)}</td><td>${esc(x.derived_location)}</td><td>${esc(x.reason)}</td><td>${esc(x.candidates)}</td></tr>`).join('')}</tbody>`;qa('[data-direct-include]').forEach(e=>e.onchange=()=>ds.valid[+e.dataset.directInclude].include=e.checked);const all=q('#directSelectAll');if(all)all.onchange=()=>{ds.valid.forEach(x=>x.include=all.checked);render();};}
  function exportWorkbook(){try{const selected=ds.valid.filter(x=>x.include);if(!selected.length&&!ds.unresolved.length)throw new Error('No comparison results to export. Run Compare and validate first.');const template=[['Line',' Serial',' To Warehouse',' To Bin'],['','Required. Must be an existing serial.','Required. Must be an existing warehouse.','Required. Must be an existing bin within selected warehouse.']];selected.forEach(x=>template.push(['',x.serial,x.to_warehouse,x.to_bin]));const unresolved=[['Serial','Current Flowtrac Bin','DNS','Derived Location','Building Number','Building Abbreviation','Location Token','Reason','Candidate Count','Candidate Bins']];ds.unresolved.forEach(x=>unresolved.push([x.serial,x.current_bin,x.dns,x.derived_location,x.building_number,x.building_abbrev,x.location_token,x.reason,x.candidate_count,x.candidates]));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(template),'Bin Update');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(unresolved),'Unmatched DNS Bins');XLSX.writeFile(wb,'ImportSerialBinTransfer_Validated.xlsx');}catch(err){status(err.message||String(err),'error');alert(err.message||String(err));}}

  const binsFile=q('#binsFile'),run=q('#runDirectCompare'),exportBtn=q('#exportFlowtracTemplate'),warehouse=q('#directWarehouse');
  if(!binsFile||!run||!exportBtn){console.error('Direct mode UI elements are missing.');return;}
  binsFile.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{await loadBins(f);}catch(err){console.error(err);q('#binsStatus').textContent='Could not read bin master: '+err.message;status(err.message||String(err),'error');}};
  run.onclick=build;exportBtn.onclick=exportWorkbook;if(warehouse)warehouse.oninput=()=>ds.valid.forEach(x=>x.to_warehouse=warehouse.value||'UFIT');
})();