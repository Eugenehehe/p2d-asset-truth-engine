(() => {
  const ds={valid:[],unresolved:[],bins:[],binColumn:''};
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const clean=v=>String(v??'').trim(), upper=v=>clean(v).toUpperCase().replace(/\s+/g,' '), compact=v=>upper(v).replace(/[^A-Z0-9]/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const status=(text,type='info')=>{const el=q('#directRunStatus');if(el){el.textContent=text;el.dataset.type=type;}};
  const headersFor=source=>{const rows=state.sources[source]||[];return rows.length?Object.keys(rows[0]):[];};
  const selected=id=>q(id)?.value||'';

  function fillSelect(id,headers,preferred=[]){
    const el=q(id);if(!el)return;const old=el.value;
    el.innerHTML='<option value="">— select column —</option>'+headers.map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join('');
    if(headers.includes(old))el.value=old;
    else{
      const lower=headers.map(h=>clean(h).toLowerCase());
      for(const p of preferred){const exact=lower.indexOf(p);if(exact>=0){el.value=headers[exact];break;}}
      if(!el.value){for(let i=0;i<lower.length;i++){if(preferred.some(p=>lower[i].includes(p))){el.value=headers[i];break;}}}
    }
  }

  function refreshColumns(){
    const fh=headersFor('flow'),nh=headersFor('network');
    fillSelect('#directFlowSerial',fh,['serial number','serial','sn']);
    fillSelect('#directFlowBin',fh,['current bin','flowtrac bin','bin','location']);
    fillSelect('#directNetworkSerial',nh,['serial number','serial','sn']);
    fillSelect('#directNetworkDns',nh,['device name','dns name','dns','hostname','host name']);
    status(`Columns loaded. Flowtrac: ${fh.length}; Network: ${nh.length}. Select Device Name / DNS, then run.`);
  }

  function get(row,col){return col?clean(row[col]):'';}
  function serialVariants(v){const k=compact(v),s=new Set();if(!k)return s;s.add(k);k.startsWith('S')?s.add(k.slice(1)):s.add('S'+k);return s;}
  function networkIndex(rows,serialCol){const m=new Map();for(const r of rows)for(const k of serialVariants(get(r,serialCol)))if(!m.has(k))m.set(k,r);return m;}
  async function parseWorkbook(file){const buf=await file.arrayBuffer(),wb=XLSX.read(buf,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];return XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});}
  function guessBinColumn(headers){return headers.find(h=>['bin','bin name','location'].includes(clean(h).toLowerCase()))||headers.find(h=>clean(h).toLowerCase().includes('bin'))||'';}
  function parseExistingBin(v){const raw=clean(v),text=upper(raw);return {raw,number:(text.match(/^(\d{4})\s*\(/)||[])[1]||'',abbrev:(text.match(/\(([A-Z0-9]+)\s*-/)||[])[1]||'',suffix:compact((text.match(/\)-(.+)$/)||[])[1]||'')};}
  function parseDnsLocation(dns){
    const first=clean(dns).toLowerCase().split('.')[0].split('-')[0].replace(/[^a-z0-9]/g,'');
    if(!first)return null;
    let m=first.match(/^b(\d{4})(tr[a-z0-9]+|rm[a-z0-9]+|c[a-z0-9]+|\d{3,4}[a-z]?)/);
    if(m)return {buildingNumber:m[1],buildingAbbrev:'',location:compact(m[2]),derived:`${m[1]}-${upper(m[2])}`};
    m=first.match(/^([a-z]{2,10})(tr[a-z0-9]+|rm[a-z0-9]+|c[a-z0-9]+|\d{3,4}[a-z]?)/);
    return m?{buildingNumber:'',buildingAbbrev:upper(m[1]),location:compact(m[2]),derived:`${upper(m[1])} ${upper(m[2])}`}:null;
  }
  function alternatives(v){const s=compact(v),set=new Set([s]);let m=s.match(/^(\d{3})([A-Z]?)$/);if(m)set.add(`0${m[1]}${m[2]}`);m=s.match(/^0(\d{3})([A-Z]?)$/);if(m)set.add(`${m[1]}${m[2]}`);return set;}
  function matchBin(parsed){if(!parsed)return {status:'UNPARSEABLE DNS',matches:[]};const locs=alternatives(parsed.location),matches=ds.bins.filter(b=>(parsed.buildingNumber?b.number===parsed.buildingNumber:b.abbrev===parsed.buildingAbbrev)&&locs.has(b.suffix));return {status:matches.length===1?'MATCHED':matches.length===0?'BIN NOT FOUND':'AMBIGUOUS BIN',matches};}

  async function loadBins(file){
    status('Reading Bin master…');
    const rows=await parseWorkbook(file),headers=rows.length?Object.keys(rows[0]):[];
    ds.binColumn=guessBinColumn(headers);
    if(!ds.binColumn)throw new Error(`Could not detect Bin column. Headers: ${headers.join(', ')}`);
    ds.bins=rows.map(r=>parseExistingBin(r[ds.binColumn])).filter(x=>x.raw&&x.suffix&&(x.number||x.abbrev));
    q('#binsStatus').textContent=`${file.name} · ${ds.bins.length.toLocaleString()} usable bins · column: ${ds.binColumn}`;
    status('Bin master loaded. Select the four required columns and compare.','success');
  }

  function build(){
    try{
      const flow=state.sources.flow||[],network=state.sources.network||[];
      if(!flow.length)throw new Error('Flowtrac file is not loaded.');
      if(!network.length)throw new Error('Network Discovery file is not loaded.');
      if(!ds.bins.length)throw new Error('Existing Bin master is not loaded.');
      const fs=selected('#directFlowSerial'),fb=selected('#directFlowBin'),ns=selected('#directNetworkSerial'),nd=selected('#directNetworkDns');
      if(!fs||!fb||!ns||!nd)throw new Error('Select Flowtrac Serial, Flowtrac Bin, Network Serial, and Network Device Name / DNS.');
      status(`Running with Flow Serial=[${fs}], Flow Bin=[${fb}], Network Serial=[${ns}], Device Name / DNS=[${nd}]. Warehouse is fixed to UFIT.`);
      const net=networkIndex(network,ns);ds.valid=[];ds.unresolved=[];let matches=0,same=0;
      for(const r of flow){
        const serial=get(r,fs),current=get(r,fb);let nr;
        for(const k of serialVariants(serial)){nr=net.get(k);if(nr)break;}
        if(!nr)continue;
        matches++;
        const dns=get(nr,nd);
        if(!dns){ds.unresolved.push({serial,current_bin:current,dns:'',derived_location:'',reason:'DEVICE NAME / DNS MISSING',candidate_count:0,candidates:''});continue;}
        const parsed=parseDnsLocation(dns),result=matchBin(parsed);
        if(result.status==='MATCHED'){
          const full=result.matches[0].raw;
          if(compact(full)===compact(current)){same++;continue;}
          ds.valid.push({include:true,serial,current_bin:current,dns,derived_location:parsed.derived,to_bin:full});
        }else{
          ds.unresolved.push({serial,current_bin:current,dns,derived_location:parsed?.derived||'',reason:result.status,candidate_count:result.matches.length,candidates:result.matches.slice(0,10).map(x=>x.raw).join(' | ')});
        }
      }
      render();
      status(`Done. ${flow.length.toLocaleString()} Flowtrac rows, ${matches.toLocaleString()} serial matches, ${ds.valid.length.toLocaleString()} validated updates, ${ds.unresolved.length.toLocaleString()} unresolved, ${same.toLocaleString()} already matching.`,'success');
    }catch(err){console.error(err);status(err.message||String(err),'error');alert(err.message||String(err));}
  }

  function render(){
    q('#directCount').textContent=ds.valid.length;q('#unresolvedCount').textContent=ds.unresolved.length;
    q('#directTable').innerHTML=`<thead><tr><th><input id="directSelectAll" type="checkbox" checked></th><th>Serial</th><th>Flowtrac Bin</th><th>Device Name / DNS</th><th>Validated To Bin</th></tr></thead><tbody>${ds.valid.map((x,i)=>`<tr><td><input type="checkbox" data-direct-include="${i}" checked></td><td>${esc(x.serial)}</td><td>${esc(x.current_bin)}</td><td>${esc(x.dns)}</td><td>${esc(x.to_bin)}</td></tr>`).join('')}</tbody>`;
    q('#unresolvedTable').innerHTML=`<thead><tr><th>Serial</th><th>Flowtrac Bin</th><th>Device Name / DNS</th><th>Derived</th><th>Reason</th><th>Candidate Bins</th></tr></thead><tbody>${ds.unresolved.map(x=>`<tr><td>${esc(x.serial)}</td><td>${esc(x.current_bin)}</td><td>${esc(x.dns)}</td><td>${esc(x.derived_location)}</td><td>${esc(x.reason)}</td><td>${esc(x.candidates)}</td></tr>`).join('')}</tbody>`;
    qa('[data-direct-include]').forEach(e=>e.onchange=()=>ds.valid[+e.dataset.directInclude].include=e.checked);
    const all=q('#directSelectAll');if(all)all.onchange=()=>{ds.valid.forEach(x=>x.include=all.checked);render();};
  }

  function exportWorkbook(){
    const selectedRows=ds.valid.filter(x=>x.include);
    if(!selectedRows.length&&!ds.unresolved.length){alert('Run comparison first.');return;}
    const template=[['Line',' Serial',' To Warehouse',' To Bin'],['','Required. Must be an existing serial.','Required. Must be an existing warehouse.','Required. Must be an existing bin within selected warehouse.']];
    selectedRows.forEach(x=>template.push(['',x.serial,'UFIT',x.to_bin]));
    const unresolved=[['Serial','Current Flowtrac Bin','Device Name / DNS','Derived Location','Reason','Candidate Count','Candidate Bins']];
    ds.unresolved.forEach(x=>unresolved.push([x.serial,x.current_bin,x.dns,x.derived_location,x.reason,x.candidate_count,x.candidates]));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(template),'Bin Update');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(unresolved),'Unmatched DNS Bins');
    XLSX.writeFile(wb,'ImportSerialBinTransfer_Validated.xlsx');
  }

  q('#binsFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{await loadBins(f);}catch(err){status(err.message,'error');}};
  q('#refreshDirectColumns').onclick=refreshColumns;
  q('#runDirectCompare').onclick=build;
  q('#exportFlowtracTemplate').onclick=exportWorkbook;
  q('#flowFile').addEventListener('change',()=>setTimeout(refreshColumns,300));
  q('#networkFile').addEventListener('change',()=>setTimeout(refreshColumns,300));
  setTimeout(refreshColumns,500);
})();