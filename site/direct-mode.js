(() => {
  const ds={rows:[]};
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const clean=v=>String(v??'').trim();
  const upper=v=>clean(v).toUpperCase().replace(/\s+/g,' ');
  const serialKey=v=>upper(v).replace(/[^A-Z0-9]/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  if(!sourceDefs.network.fields.includes('bin')) sourceDefs.network.fields.splice(1,0,'bin');

  function getVal(source,row,field){const col=state.mappings[source]?.[field];return col?clean(row[col]):'';}
  function networkIndex(){const m=new Map();for(const r of state.sources.network||[]){const k=serialKey(getVal('network',r,'serial'));if(k)m.set(k,r);}return m;}
  function build(){
    if(!state.sources.flow?.length){alert('Upload the Flowtrac baseline first.');return;}
    if(!state.sources.network?.length){alert('Upload Network Discovery first.');return;}
    if(!state.mappings.flow?.serial||!state.mappings.flow?.bin||!state.mappings.network?.serial){alert('Map Flowtrac Serial/Bin and Network Serial first.');return;}
    if(!state.mappings.network?.bin&&!state.mappings.network?.dns){alert('Map either Network Bin or Network DNS.');return;}
    const net=networkIndex();
    ds.rows=(state.sources.flow||[]).map((r,i)=>{
      const serial=getVal('flow',r,'serial'), current=upper(getVal('flow',r,'bin')), nr=net.get(serialKey(serial));
      const dns=nr?getVal('network',nr,'dns'):'';
      const mappedBin=nr?upper(getVal('network',nr,'bin')):'';
      const candidate=mappedBin||parseDns(dns);
      return {include:!!candidate&&candidate!==current,line:'',serial,current_bin:current,dns,network_bin:candidate,to_warehouse:q('#directWarehouse').value||'UFIT',to_bin:candidate,row:i+2,source:mappedBin?'Network Bin column':'DNS parsed'};
    }).filter(x=>x.network_bin&&x.network_bin!==x.current_bin);
    render();activate('direct');
  }
  function render(){
    q('#directCount').textContent=ds.rows.length;
    q('#directTable').innerHTML=`<thead><tr><th><input id="directSelectAll" type="checkbox" checked></th><th>Serial</th><th>Flowtrac Bin</th><th>Network source</th><th>DNS</th><th>Network Bin</th><th>To Warehouse</th><th>To Bin</th></tr></thead><tbody>${ds.rows.map((x,i)=>`<tr><td><input type="checkbox" data-direct-include="${i}" ${x.include?'checked':''}></td><td class="code">${esc(x.serial)}</td><td>${esc(x.current_bin)}</td><td>${esc(x.source)}</td><td class="code">${esc(x.dns)}</td><td>${esc(x.network_bin)}</td><td><input data-direct-wh="${i}" value="${esc(x.to_warehouse)}"></td><td><input data-direct-bin="${i}" value="${esc(x.to_bin)}"></td></tr>`).join('')}</tbody>`;
    qa('[data-direct-include]').forEach(e=>e.onchange=()=>ds.rows[+e.dataset.directInclude].include=e.checked);
    qa('[data-direct-wh]').forEach(e=>e.oninput=()=>ds.rows[+e.dataset.directWh].to_warehouse=e.value);
    qa('[data-direct-bin]').forEach(e=>e.oninput=()=>ds.rows[+e.dataset.directBin].to_bin=e.value);
    const all=q('#directSelectAll');if(all)all.onchange=()=>{ds.rows.forEach(x=>x.include=all.checked);render();};
  }
  function templateCsv(){
    const qv=v=>`"${String(v??'').replaceAll('"','""')}"`;
    const out=[['Line',' Serial',' To Warehouse',' To Bin'],['','Required. Must be an existing serial.','Required. Must be an existing warehouse.','Required. Must be an existing bin within selected warehouse.']];
    ds.rows.filter(x=>x.include).forEach(x=>out.push(['',x.serial,x.to_warehouse,x.to_bin]));
    return out.map(r=>r.map(qv).join(',')).join('\r\n');
  }
  function exportTemplate(){
    if(!ds.rows.some(x=>x.include)){alert('No rows selected.');return;}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+templateCsv()],{type:'text/csv;charset=utf-8'}));a.download='ImportSerialBinTransfer.csv';a.click();URL.revokeObjectURL(a.href);
  }
  q('#runDirectCompare').onclick=build;
  q('#exportFlowtracTemplate').onclick=exportTemplate;
  q('#directWarehouse').oninput=()=>{ds.rows.forEach(x=>x.to_warehouse=q('#directWarehouse').value);render();};
})();