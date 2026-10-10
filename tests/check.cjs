/* Verificação isolada da lógica. Adaptadores mínimos substituem as bibliotecas CDN e o DOM;
   isto não substitui a validação visual e de downloads reais em um navegador. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const C = require('../public/core.js');
const source = fs.readFileSync('vendas_hamburgueria.csv', 'utf8').trim();
const dataContext = { window: {} };
vm.runInNewContext(fs.readFileSync('public/data.js', 'utf8'), dataContext);
assert.equal(dataContext.window.DATASETS.original.csv.trim(), source, 'Cópia incorporada deve corresponder ao original byte a byte, exceto newline final');
function parse(csv) {
  // Leitor de fixture: bases fornecidas usam vírgulas e não contêm campos multilinha.
  const lines = csv.trim().split(/\r?\n/), fields = lines.shift().split(',');
  return { meta: { fields }, errors: [], data: lines.map(line => Object.fromEntries(line.split(',').map((v,i)=>[fields[i],v]))) };
}
const papa = { parse, unparse: value => JSON.stringify(value) };
const original = C.ingest(source,papa);
assert.equal(original.total,1367); assert.equal(original.issues.length,0);
const totals = C.stats(original.rows,original.keys);
assert.equal(totals.revenue,36506); assert.equal(totals.units,2060); assert.equal(totals.sales,1367);
assert.equal(original.fields.length,12);
const demo = C.ingest(dataContext.window.DATASETS.corporativo.csv,papa);
assert.equal(demo.total,1635); assert.equal(demo.issues.length,0);
assert.equal(C.numeric(''),null); assert.equal(C.numeric('0'),0); assert.equal(C.numeric('1.234,56'),1234.56);
assert.equal(C.validDate('2026-02-30'),false); assert.equal(C.validDate('2024-02-29'),true);
const fixture='id_venda,data,quantidade,preco_unitario,categoria,custo_unitario\n1,2026-01-01,2,10,A,4\n1,2026-01-01,1,20,A,8\n2,2026-03-01,0,5,B,2\n3,2026-02-30,1,4,B,1\n4,2026-03-01,,9,B,1';
const known=C.ingest(fixture,papa), expected=C.stats(known.rows,known.keys);
assert.equal(known.total,5); assert.equal(known.issues.length,2);
assert.equal(expected.revenue,40); assert.equal(expected.sales,2); assert.equal(expected.ticket,20);
assert.equal(expected.units,3); assert.equal(expected.margin,60);
assert.equal(C.monthly(known.rows)[1].revenue,0);
assert.throws(()=>C.ingest('foo,bar\na,b',papa),/Colunas obrigatórias/);

const elements = new Map(), listeners = {};
function element(id) {
  if(!elements.has(id)) elements.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,dataset:{},type:'password',checked:false,attrs:{},handlers:{},
    addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]||'';},
    focus(){},append(){},click(){},remove(){},querySelector(){return null;},showModal(){this.open=true;},close(){this.open=false;}});
  return elements.get(id);
}
const document={getElementById:element,querySelectorAll:()=>[],addEventListener:(event,fn)=>{(listeners[event]??=[]).push(fn);},dispatchEvent:e=>(listeners[e.type]||[]).forEach(fn=>fn()),createElement:()=>element('temp'),body:element('body')};
const memory={}; const storage={getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v,removeItem:k=>delete memory[k]};
const fakeXLSX={utils:{book_new:()=>({SheetNames:[],Sheets:{}}),aoa_to_sheet:matrix=>({matrix,'!ref':'A1:Z999'}),book_append_sheet:(book,sheet,name)=>{book.SheetNames.push(name);book.Sheets[name]=sheet;},encode_cell:({r,c})=>r+':'+c},writeFile:()=>{}};
const context={window:null,document,DataCore:C,DATASETS:dataContext.window.DATASETS,Papa:papa,XLSX:fakeXLSX,console,Intl,Date,Set,Map,Object,Number,String,Array,JSON,Event,localStorage:storage,sessionStorage:storage,location:{protocol:'file:'},setTimeout,clearTimeout};
context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync('public/login.js','utf8'),context);
vm.runInContext(fs.readFileSync('public/script.js','utf8'),context);
element('appView').hidden=true;element('reportScope').value='all';
document.dispatchEvent(new Event('DOMContentLoaded'));
assert.equal(context.APP_STATE.rows.length,1367);
assert.equal((element('salesTable').innerHTML.match(/<tr /g)||[]).length,50);
element('loginEmail').value='diretor@empresa.com.br';element('loginPassword').value='wrong';
element('loginForm').handlers.submit({preventDefault(){}});assert.equal(element('appView').hidden,true);
element('loginPassword').value='Demonstracao2026!';element('loginForm').handlers.submit({preventDefault(){}});
assert.equal(element('appView').hidden,false);assert.equal(context.PortalAuth.can('import'),true);
assert.equal(JSON.stringify(memory).includes('Demonstracao2026!'),false,'Não guardar senhas');
element('categoryFilter').value='Lanche';element('groupFilter').value='Delivery';element('startDate').value='2026-08-01';
context.PORTAL.apply();assert(context.APP_STATE.filtered.length>0);
assert(context.APP_STATE.filtered.every(r=>r.data.categoria==='Lanche'&&r.data.canal==='Delivery'&&r.date>='2026-08-01'));
const workbook=context.PORTAL.buildWorkbook();
assert.equal(workbook.Sheets['Dados do escopo'].matrix.length,1368);
assert.equal(workbook.Sheets.Resumo.matrix.find(r=>r[0]==='Faturamento')[1],36506);
element('reportScope').value='filtered';const filteredBook=context.PORTAL.buildWorkbook();
assert.equal(filteredBook.Sheets['Dados do escopo'].matrix.length,context.APP_STATE.filtered.length+1);
assert.equal(filteredBook.Sheets['Base original completa'].matrix.length,1368);
element('tableSearch').value='impossivel-na-base';context.PORTAL.apply();assert.equal(context.APP_STATE.filtered.length,0);assert.equal(element('emptyState').hidden,false);
element('clearFilters').handlers.click();assert.equal(context.APP_STATE.filtered.length,1367);
element('pageSize').handlers.change({target:{value:'all'}});assert.equal((element('salesTable').innerHTML.match(/<tr /g)||[]).length,1367);
context.PORTAL.loadCsv(dataContext.window.DATASETS.corporativo.csv,'Fictícia','corporativo');
assert.equal(context.APP_STATE.rows.length,1635);assert.equal((element('salesTable').innerHTML.match(/<tr /g)||[]).length,1635);
element('reportScope').value='all';assert.equal(context.PORTAL.preparePrint(),1635);
assert.equal((element('printReport').innerHTML.match(/<tr>/g)||[]).length,1636,'PDF sem truncamento');
context.PORTAL.loadCsv(fixture,'Validação','fixture');
assert.equal(context.PORTAL.exportMatrix(context.APP_STATE.rows).data.length,5,'Exportação preserva inválidos');
element('logoutButton').handlers.click();assert.equal(context.PortalAuth.can('export'),false);
element('loginEmail').value='auditor@empresa.com.br';element('loginPassword').value='Demonstracao2026!';element('loginForm').handlers.submit({preventDefault(){}});
assert.equal(context.PortalAuth.can('import'),false);assert.equal(element('importButton').disabled,true);assert.equal(context.PortalAuth.can('export'),true);
console.log('OK: original 1367/12 colunas; demonstração 1635; cálculos; validação; filtros; paginação; escopos; impressão integral; login/perfis. Adaptadores de teste: DOM, Papa e XLSX.');
const single = fs.readFileSync('public/index.html','utf8');
const inlineScripts=[...single.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1].trim());
const scriptFiles=['data.js','core.js','login.js','script.js'];
assert.equal(inlineScripts.length,scriptFiles.length);
inlineScripts.forEach((code,index)=>{
  new vm.Script(code);
  assert.equal(code,fs.readFileSync('public/'+scriptFiles[index],'utf8').trim().replace(/\r/g,''));
});
assert.equal(single.match(/<style>([\s\S]*?)<\/style>/)[1].trim(),fs.readFileSync('public/styles.css','utf8').trim().replace(/\r/g,''));
assert(!/<script[^>]+src="(data|core|login|script)\.js"/.test(single));
const ids=[...single.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'IDs HTML únicos');
console.log('OK: HTML único sincronizado, JavaScript incorporado válido e IDs únicos.');
