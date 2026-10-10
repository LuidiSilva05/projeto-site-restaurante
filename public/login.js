/* Sessão e permissões de demonstração. Nenhuma senha é persistida. */
(function () {
  const ACCOUNTS = {
    admin: {email:'diretor@empresa.com.br',name:'Diretor Executivo',role:'CEO / Diretor',import:true},
    cliente: {email:'financeiro@empresa.com.br',name:'Gerente Financeiro',role:'Gerente Financeiro',import:true},
    auditor: {email:'auditor@empresa.com.br',name:'Auditor de Qualidade',role:'Auditor de Qualidade',import:false}
  };
  const KEY='gestao.demo.session.v2', PASSWORD='Demonstracao2026!';
  const $=id=>document.getElementById(id);
  let current=null, selected='admin';
  function storageCall(storage,method,...args) {try {return window[storage][method](...args);} catch {return null;}}
  function present(accountKey) {
    if (!ACCOUNTS[accountKey]) return false;
    current=accountKey; const account=ACCOUNTS[current];
    $('loginView').hidden=true; $('appView').hidden=false;
    $('userName').textContent=account.name; $('userRole').textContent=account.role; $('sessionRole').textContent=account.role;
    $('userInitials').textContent=account.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    $('importButton').disabled=!account.import; $('datasetSelect').disabled=!account.import;
    $('importButton').title=account.import?'Importar uma base local':'Auditor: consulta e exportação da base atual';
    document.dispatchEvent(new Event('portal:login')); $('dashboard').focus();
    return true;
  }
  function signIn(key) {
    const remember=$('rememberMe').checked;
    const session={key,expires:Date.now()+(remember?7*86400000:8*3600000)};
    storageCall('localStorage','removeItem',KEY); storageCall('sessionStorage','removeItem',KEY);
    storageCall(remember?'localStorage':'sessionStorage','setItem',KEY,JSON.stringify(session));
    $('loginPassword').value=''; present(key);
  }
  function select(key) {
    selected=key; $('loginEmail').value=ACCOUNTS[key].email; $('loginPassword').value=PASSWORD;
    document.querySelectorAll('[data-account]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.account===key)));
    $('loginStatus').textContent='Conta demonstrativa preenchida. Clique em Entrar no portal.';
  }
  window.PortalAuth={
    can:action=>Boolean(current)&&(action!=='import'||ACCOUNTS[current].import),
    name:()=>current?ACCOUNTS[current].name:'Visitante'
  };
  document.addEventListener('DOMContentLoaded',()=>{
    $('loginEmail').value=ACCOUNTS.admin.email;
    document.querySelectorAll('[data-account]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.account)));
    $('loginForm').addEventListener('submit',e=>{
      e.preventDefault();
      const email=$('loginEmail').value.trim().toLowerCase(), password=$('loginPassword').value;
      const key=Object.keys(ACCOUNTS).find(key=>ACCOUNTS[key].email===email);
      if (!key||password!==PASSWORD) {$('loginStatus').textContent='Credenciais inválidas. Selecione uma das contas demonstrativas abaixo.';return;}
      signIn(key);
    });
    $('logoutButton').addEventListener('click',()=>{
      storageCall('localStorage','removeItem',KEY);storageCall('sessionStorage','removeItem',KEY);current=null;
      $('appView').hidden=true;$('loginView').hidden=false;$('loginPassword').value='';$('loginStatus').textContent='Sessão encerrada.';$('loginEmail').focus();
    });
    $('togglePassword').addEventListener('click',()=>{
      const show=$('loginPassword').type==='password';$('loginPassword').type=show?'text':'password';
      $('togglePassword').setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
    });
    $('recoverPassword').addEventListener('click',()=>{$('recoveryDialog').showModal();});
    $('closeRecovery').addEventListener('click',()=>{$('recoveryDialog').close();$('recoverPassword').focus();});
    document.querySelectorAll('[data-sso]').forEach(button=>button.addEventListener('click',()=>{
      select(selected);$('loginStatus').textContent=button.dataset.sso+' simulado. Nenhuma conexão com provedor externo. Confirme em Entrar no portal.';
    }));
    $('securityStatus').textContent=location.protocol==='https:'?'Conexão HTTPS · autenticação simulada':'Sessão demonstrativa local · sem autenticação de servidor';
    const saved=storageCall('sessionStorage','getItem',KEY)||storageCall('localStorage','getItem',KEY);
    if(saved)try {const session=JSON.parse(saved);if(session.expires>Date.now())present(session.key);}catch{}
  });
})();

