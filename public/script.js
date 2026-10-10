/* Interface do portal. Paginação nunca limita os registros exportados. */
(function () {
  const C=window.DataCore, $=id=>document.getElementById(id);
  const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const number=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
  const palette=['#c5a880','#3b82f6','#10b981','#94a3b8','#a78bfa','#f59e0b'];
  const labels={id_venda:'ID da venda',data:'Data',produto:'Produto',categoria:'Categoria',regiao:'Região',canal:'Canal',setor:'Setor',quantidade:'Quantidade',preco_unitario:'Preço unitário',forma_pagamento:'Pagamento',dia_semana:'Dia da semana',periodo:'Período',tempo_espera_min:'Espera (min)',avaliacao:'Avaliação',empresa_parceira:'Empresa parceira',status:'Status',id_contrato:'Contrato',tempo_atendimento_min:'Atendimento (min)',conversao_b2b:'Conversão B2B',custo_unitario:'Custo unitário',__revenue:'Faturamento calculado',__validation:'Validação'};
  const S=window.APP_STATE={rows:[],filtered:[],fields:[],keys:{},issues:[],name:'',key:'original',page:1,size:50,sort:'data',direction:1,hidden:new Set(),charts:{}};
  const filterIds=['startDate','endDate','categoryFilter','groupFilter','statusFilter','companyFilter','minValue','maxValue','tableSearch'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const can=action=>window.PortalAuth?.can(action);
  const get=(row,key)=>C.value(row,key,S.keys);
  const fields=()=>[...S.fields,'__revenue','__validation'];
  const sourceLabel=key=>labels[C.fold(key)]||key.replaceAll('_',' ');
  function message(text){$('appStatus').textContent=text;}
  function icons(){window.lucide?.createIcons();}
  function reportRows(){return $('reportScope').value==='filtered'?S.filtered:S.rows;}
  function value(row,key) {
    if(key==='__revenue')return row.valid?row.revenue:null;
    if(key==='__validation')return row.valid?'Válido':row.reasons.join('; ');
    return row.data[key]??'';
  }
  function display(row,key) {
    const v=value(row,key);
    if(v===null||v===undefined||v==='')return '—';
    if(key==='__revenue')return money.format(v);
    if(C.fold(key)==='data'&&C.validDate(v))return v.split('-').reverse().join('/');
    return String(v);
  }
  function loadCsv(csv,name,key) {
    const result=C.ingest(csv,window.Papa);
    Object.assign(S,result,{name,key,filtered:result.rows,page:1,sort:result.keys.data,direction:1,hidden:new Set()});
    S.groupKey=S.keys.regiao?'regiao':S.keys.canal?'canal':S.keys.setor?'setor':'categoria';
    filterIds.forEach(id=>$(id).value='');
    fillFilters(); fillColumnChoices();
    $('navCount').textContent=number.format(S.total);
    $('sourceSummary').textContent=number.format(S.total)+' registros carregados · '+S.fields.length+' colunas de origem';
    $('auditSummary').textContent=number.format(S.total)+' registros preservados. '+number.format(S.rows.filter(r=>r.valid).length)+' aptos aos cálculos; '+S.issues.length+' com pendências, visíveis na tabela e nas exportações.';
    $('auditDetails').innerHTML=S.issues.length?'<ul>'+S.issues.map(i=>'<li>Registro '+i.registro+' — '+esc(i.motivo)+'</li>').join('')+'</ul>':'<p>Nenhuma ocorrência. IDs repetidos são preservados; vendas são contadas por ID único.</p>';
    $('groupLabel').textContent=sourceLabel(S.groupKey);
    $('groupChartTitle').textContent='Receita por '+sourceLabel(S.groupKey).toLowerCase();
    message(name+' · Base completa disponível para consulta e exportação.');
    apply();
  }
  function selectOptions(id,key,label) {
    const available=Boolean(S.keys[key]);
    const values=[...new Set(S.rows.map(r=>C.clean(get(r,key))).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    $(id).innerHTML='<option value="">'+(available?label:'Coluna ausente na base')+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');
    $(id).disabled=!available;
  }
  function fillFilters(){
    selectOptions('categoryFilter','categoria','Todas as categorias');
    selectOptions('groupFilter',S.groupKey,'Todos');
    selectOptions('statusFilter','status','Todos os status');
    selectOptions('companyFilter','empresa_parceira','Todas as empresas');
  }
  function fillColumnChoices(){
    $('columnChoices').innerHTML=fields().map((key,index)=>'<label><input type="checkbox" checked data-column="'+index+'"> '+esc(sourceLabel(key))+'</label>').join('');
  }
  function apply(){
    const f=Object.fromEntries(filterIds.map(id=>[id,$(id).value]));
    const query=C.fold(f.tableSearch);
    S.filtered=S.rows.filter(r=>{
      if(f.startDate&&r.date<f.startDate||f.endDate&&r.date>f.endDate)return false;
      if(f.categoryFilter&&C.clean(get(r,'categoria'))!==f.categoryFilter)return false;
      if(f.groupFilter&&C.clean(get(r,S.groupKey))!==f.groupFilter)return false;
      if(f.statusFilter&&C.clean(get(r,'status'))!==f.statusFilter)return false;
      if(f.companyFilter&&C.clean(get(r,'empresa_parceira'))!==f.companyFilter)return false;
      if(f.minValue!==''&&(!r.valid||r.revenue<Number(f.minValue)))return false;
      if(f.maxValue!==''&&(!r.valid||r.revenue>Number(f.maxValue)))return false;
      return !query||r.search.includes(query)||C.fold(r.valid?r.revenue:r.reasons.join(' ')).includes(query);
    });
    S.page=1;render();
  }
  function sortedRows(){
    return [...S.filtered].sort((a,b)=>{
      const av=value(a,S.sort),bv=value(b,S.sort);
      if(av===''||av===null)return bv===''||bv===null?0:1;
      if(bv===''||bv===null)return -1;
      const an=C.numeric(av),bn=C.numeric(bv);
      return S.direction*(an!==null&&bn!==null?an-bn:String(av).localeCompare(String(bv),'pt-BR',{numeric:true}));
    });
  }
  function renderTable(){
    const visible=fields().filter(key=>!S.hidden.has(key));
    $('tableHead').innerHTML='<tr>'+visible.map(key=>'<th scope="col" aria-sort="'+(key===S.sort?(S.direction===1?'ascending':'descending'):'none')+'"><button type="button" data-sort="'+esc(key)+'">'+esc(sourceLabel(key))+(S.sort===key?(S.direction===1?' ↑':' ↓'):'')+'</button></th>').join('')+'</tr>';
    const size=S.size==='all'?Math.max(1,S.filtered.length):S.size, pages=Math.max(1,Math.ceil(S.filtered.length/size));
    S.page=Math.min(S.page,pages);
    const start=(S.page-1)*size, rows=sortedRows().slice(start,start+size);
    $('salesTable').innerHTML=rows.map(row=>'<tr class="'+(row.valid?'':'invalid-row')+'">'+visible.map(key=>'<td>'+esc(display(row,key))+'</td>').join('')+'</tr>').join('');
    $('pageSummary').textContent=S.filtered.length?'Exibindo '+(start+1)+'–'+Math.min(start+size,S.filtered.length)+' de '+number.format(S.filtered.length)+' registros':'Nenhum registro no recorte';
    $('pageNumber').textContent=S.page+' / '+pages;
    $('prevPage').disabled=S.page===1;$('nextPage').disabled=S.page===pages;
    $('recordCount').textContent=number.format(S.rows.length)+' carregados · '+number.format(S.filtered.length)+' filtrados · '+S.fields.length+' colunas originais';
    $('emptyState').hidden=S.filtered.length>0;
  }
  function summary(rows){
    const s=C.stats(rows,S.keys),cats=C.group(rows,'categoria',S.keys),months=C.monthly(rows),groups=C.group(rows,S.groupKey,S.keys);
    if(!s.valid)return ['Não há registros válidos no escopo selecionado.'];
    const notes=[number.format(s.sales)+' vendas únicas, '+number.format(s.units)+' unidades e '+money.format(s.revenue)+' de receita. Ticket médio: '+money.format(s.ticket)+'.'];
    if(cats.length)notes.push('Maior receita por categoria: '+cats[0].name+' ('+money.format(cats[0].revenue)+'). Menor receita: '+cats.at(-1).name+' ('+money.format(cats.at(-1).revenue)+'). Isso não mede rentabilidade.');
    if(months.length>1){
      const current=months.at(-1),previous=months.at(-2);
      notes.push('Último mês disponível ('+current.name+'): '+money.format(current.revenue)+'. '+(previous.revenue?'Variação de '+number.format((current.revenue/previous.revenue-1)*100)+'% ante '+previous.name+'.':'Mês anterior sem receita para calcular variação percentual.')+' Os períodos podem estar incompletos.');
    }
    notes.push(s.margin===null?'Margem não calculável: informe custo_unitario em todas as vendas. Sem custos, demanda e concorrência, esta base não sustenta uma recomendação de reajuste.':'Margem bruta do recorte: '+number.format(s.margin)+'%, baseada nos custos informados.');
    if(groups.length)notes.push('Maior receita por '+sourceLabel(S.groupKey).toLowerCase()+': '+groups[0].name+'. '+(S.groupKey==='regiao'?'Antes de expandir, avalie custos logísticos e demanda por região.':'A base não possui região; não é possível concluir onde expandir geograficamente.'));
    return notes;
  }
  function renderMetrics(){
    const s=C.stats(S.filtered,S.keys);
    $('totalRevenue').textContent=money.format(s.revenue);$('salesCount').textContent=number.format(s.sales);
    $('unitsCount').textContent=number.format(s.units);$('averageTicket').textContent=money.format(s.ticket);
    $('grossMargin').textContent=s.margin===null?'Não disponível':number.format(s.margin)+'%';
    $('averageWait').textContent=s.wait===null?'Não disponível':number.format(s.wait)+' min';
    const valid=S.filtered.filter(r=>r.valid);
    $('activeContracts').textContent=S.keys.id_contrato&&S.keys.status?number.format(new Set(valid.filter(r=>C.fold(get(r,'status'))==='ativo').map(r=>C.clean(get(r,'id_contrato'))).filter(Boolean)).size):'Não disponível';
    const conversions=valid.map(r=>C.fold(get(r,'conversao_b2b'))).filter(v=>['sim','nao'].includes(v));
    $('conversion').textContent=conversions.length?number.format(conversions.filter(v=>v==='sim').length/conversions.length*100)+'%':'Não disponível';
    $('executiveSummary').textContent=summary(S.filtered).slice(0,2).join(' ');
    $('analysisCount').textContent=number.format(s.valid)+' registros válidos no recorte';
    $('filterNotice').textContent=(S.groupKey==='regiao'?'Comparação regional disponível.':'Sem coluna de região: comparação adaptada para '+sourceLabel(S.groupKey).toLowerCase()+'.')+' '+(s.total-s.valid)+' registro(s) inválido(s) excluído(s) apenas dos cálculos.';
  }
  function draw(id,type,chartLabels,datasets,options={}){
    if(!window.Chart)return;
    const chartOptions={responsive:true,maintainAspectRatio:false,animation:false,plugins:{
      legend:{display:type==='doughnut'||type==='scatter',position:'bottom',labels:{color:'#b7c4d8',boxWidth:10,font:{family:'Inter',size:11}}},
      tooltip:{callbacks:{label:ctx=>type==='scatter'?ctx.dataset.label+': '+number.format(ctx.parsed.x)+' unidades · '+money.format(ctx.parsed.y):String(ctx.label)+': '+money.format(type==='doughnut'?ctx.parsed:ctx.parsed.y)}}
    },...options};
    if(type!=='doughnut')chartOptions.scales={x:{ticks:{color:'#99abc2'},grid:{color:'#33415544'},title:{display:type==='scatter',text:'Unidades',color:'#99abc2'}},y:{beginAtZero:true,ticks:{color:'#99abc2',callback:v=>money.format(v)},grid:{color:'#33415566'}}};
    if(S.charts[id]){S.charts[id].data={labels:chartLabels,datasets};S.charts[id].options=chartOptions;S.charts[id].update('none');}
    else S.charts[id]=new Chart($(id),{type,data:{labels:chartLabels,datasets},options:chartOptions});
  }
  function renderCharts(rows=S.filtered){
    const months=C.monthly(rows),cats=C.group(rows,'categoria',S.keys),groups=C.group(rows,S.groupKey,S.keys);
    draw('monthlyChart','line',months.map(m=>m.name.split('-').reverse().join('/')),[{label:'Receita',data:months.map(m=>m.revenue),borderColor:'#c5a880',backgroundColor:'#c5a88018',fill:true,tension:0,pointRadius:3,borderWidth:2}]);
    draw('categoryChart','bar',cats.map(c=>c.name),[{label:'Receita',data:cats.map(c=>c.revenue),backgroundColor:palette,borderRadius:4}]);
    draw('groupChart','doughnut',groups.map(g=>g.name),[{label:'Receita',data:groups.map(g=>g.revenue),backgroundColor:palette,borderColor:'#1e293b',borderWidth:3}],{cutout:'65%'});
    draw('mixChart','scatter',[],cats.map((cat,index)=>({label:cat.name,data:[{x:cat.units,y:cat.revenue}],backgroundColor:palette[index%palette.length],pointRadius:8})));
  }
  function render(){
    renderTable();renderMetrics();if(!document.getElementById('appView').hidden)renderCharts();
    if(!$('copilotOutput').dataset.initial){$('copilotOutput').textContent='Escolha “Analisar tendências” para gerar a leitura do recorte atual.';}
    else $('copilotOutput').innerHTML='<ol>'+summary(S.filtered).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>';
  }
  function auditRows(){return S.issues.map(issue=>Object.fromEntries(Object.entries(issue).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):v])));}
  function exportMatrix(rows){
    return {headers:[...S.fields,'faturamento_calculado','validacao'],data:rows.map(row=>[...S.fields.map(key=>row.data[key]??''),row.valid?row.revenue:'',row.valid?'Válido':row.reasons.join('; ')])};
  }
  function download(content,name,type){
    const url=URL.createObjectURL(new Blob([content],{type}));
    const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function exportCSV(){
    if(!can('export'))return;
    const rows=reportRows(),matrix=exportMatrix(rows);
    download('\uFEFF'+Papa.unparse({fields:matrix.headers,data:matrix.data},{escapeFormulae:true}),'gestao-'+$('reportScope').value+'.csv','text/csv;charset=utf-8');
    $('exportStatus').textContent=number.format(rows.length)+' registros exportados, incluindo ocorrências e todas as colunas.';
  }
  function buildWorkbook(){
    const rows=reportRows(),s=C.stats(rows,S.keys),book=XLSX.utils.book_new();
    function add(name,matrix){
      const sheet=XLSX.utils.aoa_to_sheet(matrix);
      sheet['!cols']=(matrix[0]||[]).map(()=>({wch:24}));
      if(matrix.length>1)sheet['!autofilter']={ref:sheet['!ref']};
      XLSX.utils.book_append_sheet(book,sheet,name);return sheet;
    }
    add('Resumo',[['Indicador','Valor'],['Base',S.name],['Escopo',$('reportScope').value==='all'?'Base completa':'Recorte filtrado'],['Registros preservados',rows.length],['Registros válidos',s.valid],['Faturamento',s.revenue],['Vendas únicas',s.sales],['Unidades',s.units],['Ticket médio',s.ticket],['Margem bruta (%)',s.margin??'Não disponível'],['Gerado em',new Date().toLocaleString('pt-BR')],...summary(rows).map((note,i)=>['Análise '+(i+1),note])]);
    [['Dados do escopo',rows],['Base original completa',S.rows],['Recorte filtrado',S.filtered]].forEach(([name,data])=>{
      const matrix=exportMatrix(data),sheet=add(name,[matrix.headers,...matrix.data]);
      const revenueCol=matrix.headers.length-2;
      data.forEach((row,i)=>{const cell=sheet[XLSX.utils.encode_cell({r:i+1,c:revenueCol})];if(cell&&cell.t==='n')cell.z='"R$" #,##0.00';});
    });
    const cats=C.group(rows,'categoria',S.keys);
    add('Categorias',[['Categoria','Faturamento','Unidades','IDs únicos'],...cats.map(c=>[c.name,c.revenue,c.units,c.sales])]);
    add('Mensal',[['Mês','Faturamento'],...C.monthly(rows).map(m=>[m.name,m.revenue])]);
    add('Validação',[['Registro','ID','Motivo'],...S.issues.map(i=>[i.registro,i.id,i.motivo])]);
    return book;
  }
  function exportExcel(){
    if(!can('export'))return;
    if(!window.XLSX){$('exportStatus').textContent='Excel não carregou. Verifique a conexão à internet ou exporte CSV.';return;}
    XLSX.writeFile(buildWorkbook(),'gestao-relatorio.xlsx');
    $('exportStatus').textContent='Excel gerado: '+number.format(reportRows().length)+' registros no escopo. A aba Base original completa contém todas as linhas.';
  }
  function preparePrint(){
    if(!can('export'))return;
    const rows=reportRows(),s=C.stats(rows,S.keys),matrix=exportMatrix(rows);
    renderCharts(rows);
    const pictures=Object.entries(S.charts).map(([id,chart])=>'<figure><img src="'+chart.toBase64Image()+'" alt="'+esc($(id).getAttribute('aria-label'))+'"></figure>').join('');
    $('printReport').innerHTML='<div class="print-sheet"><header><span>GESTÃO / RELATÓRIO EXECUTIVO</span><h1>Resultados e perspectivas</h1><p>'+esc(S.name)+'</p><p>'+new Date().toLocaleString('pt-BR')+' · '+esc(PortalAuth.name())+'</p><p>Escopo: '+($('reportScope').value==='all'?'base completa':'recorte filtrado')+' · '+rows.length+' registros preservados</p></header><h2>Sumário executivo</h2><p>Faturamento: '+money.format(s.revenue)+' · Vendas: '+s.sales+' · Unidades: '+s.units+' · Ticket: '+money.format(s.ticket)+'</p><ol>'+summary(rows).map(note=>'<li>'+esc(note)+'</li>').join('')+'</ol><div class="print-charts">'+pictures+'</div><h2>Dados completos do escopo</h2><table><thead><tr>'+matrix.headers.map(key=>'<th>'+esc(key)+'</th>').join('')+'</tr></thead><tbody>'+matrix.data.map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    renderCharts();
    return rows.length;
  }
  function persistence(csv,name){
    try {localStorage.setItem('gestao.import.v2',JSON.stringify({csv,name}));}
    catch {message('Base carregada integralmente nesta sessão. Armazenamento local indisponível ou cheio.');}
  }
  function importedOption(name){
    let option=$('datasetSelect').querySelector('[value="importado"]');
    if(!option){option=document.createElement('option');option.value='importado';$('datasetSelect').append(option);}
    option.textContent=name;$('datasetSelect').value='importado';
  }
  function initialize(){
    icons();
    if(!window.Papa){message('Papa Parse não carregou. Conecte-se à internet e recarregue.');return;}
    loadCsv(DATASETS.original.csv,DATASETS.original.name,'original');
    try {const saved=JSON.parse(localStorage.getItem('gestao.import.v2')||'null');if(saved?.csv){DATASETS.importado=saved;importedOption(saved.name);loadCsv(saved.csv,saved.name,'importado');}}catch{}
    if(!window.Chart)message('Dados carregados. Gráficos indisponíveis: Chart.js não carregou da CDN.');
    $('datasetSelect').addEventListener('change',e=>{
      if(!can('import'))return;
      try{const source=DATASETS[e.target.value];loadCsv(source.csv,source.name,e.target.value);}catch(error){message(error.message);}
    });
    $('importButton').addEventListener('click',()=>{if(can('import'))$('csvInput').click();});
    $('csvInput').addEventListener('change',async e=>{
      if(!can('import'))return;
      const file=e.target.files[0];if(!file)return;
      try{const csv=await file.text();loadCsv(csv,file.name,'importado');DATASETS.importado={csv,name:file.name};importedOption(file.name);persistence(csv,file.name);}
      catch(error){message('Importação não aplicada: '+error.message+' A base anterior foi mantida.');}
      finally{e.target.value='';}
    });
    filterIds.forEach(id=>$(id).addEventListener('input',apply));
    $('clearFilters').addEventListener('click',()=>{filterIds.forEach(id=>$(id).value='');apply();});
    $('tableHead').addEventListener('click',e=>{const button=e.target.closest('[data-sort]');if(!button)return;S.direction=S.sort===button.dataset.sort?-S.direction:1;S.sort=button.dataset.sort;renderTable();});
    $('prevPage').addEventListener('click',()=>{S.page--;renderTable();});$('nextPage').addEventListener('click',()=>{S.page++;renderTable();});
    $('pageSize').addEventListener('change',e=>{S.size=e.target.value==='all'?'all':Number(e.target.value);S.page=1;renderTable();});
    $('columnChoices').addEventListener('change',e=>{const index=Number(e.target.dataset.column),key=fields()[index];if(!key)return;if(e.target.checked)S.hidden.delete(key);else S.hidden.add(key);if(S.hidden.size===fields().length){S.hidden.delete(key);e.target.checked=true;}renderTable();});
    $('exportCsv').addEventListener('click',exportCSV);$('exportExcel').addEventListener('click',exportExcel);
    $('exportPdf').addEventListener('click',()=>{if(preparePrint()!==undefined)window.print();});
    $('exportAudit').addEventListener('click',()=>{if(!can('export'))return;download('\uFEFF'+Papa.unparse(auditRows().length?auditRows():[{motivo:'Nenhuma ocorrência'}],{escapeFormulae:true}),'validacao.csv','text/csv;charset=utf-8');});
    $('analyzeButton').addEventListener('click',()=>{$('copilotOutput').dataset.initial='1';$('copilotOutput').innerHTML='<ol>'+summary(S.filtered).map(note=>'<li>'+esc(note)+'</li>').join('')+'</ol>';});
    $('copilotForm').addEventListener('submit',e=>{
      e.preventDefault();const query=C.fold($('copilotInput').value),notes=summary(S.filtered);
      const matches=notes.filter(note=>query.includes('margem')||query.includes('preco')?C.fold(note).includes('margem'):query.includes('regiao')||query.includes('expans')?C.fold(note).includes('regiao'):query.includes('categor')?C.fold(note).includes('categoria'):true);
      $('copilotOutput').dataset.initial='1';$('copilotOutput').innerHTML='<p class="small muted">Resposta calculada localmente</p>'+matches.map(note=>'<p>'+esc(note)+'</p>').join('');
    });
    document.querySelectorAll('.sidebar nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a===link));}));
    if(can('export'))renderCharts();
  }
  document.addEventListener('portal:login',()=>{if(S.rows.length){renderCharts();Object.values(S.charts).forEach(chart=>chart.resize());}});
  window.PORTAL={loadCsv,apply,buildWorkbook,preparePrint,summary,reportRows,exportMatrix,render};
  document.addEventListener('DOMContentLoaded',initialize);
})();

