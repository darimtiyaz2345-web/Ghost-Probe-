'use strict';

/* ===============================
   SIMPLE LOCAL VERSION (NO LOGIN, NO PAYMENT)
=============================== */

let currentUser = { id: "local-user" };
let currentPlan = "advanced";

/* ===============================
   UI SIMPLIFICATION
=============================== */

function setLoggedIn() {}
function setLoggedOut() {}
function applyPlan() {}
function heroAction() { navTo('scanner'); }
function handlePlanClick() {}

/* ===============================
   REMOVE AUTH FUNCTIONS
=============================== */

function openModal() {}
function closeModal() {}
function switchTab() {}
async function doSignup() {}
async function doLogin() {}
async function doLogout() {}
async function doForgot() {}

/* ===============================
   REMOVE PAYMENT FUNCTIONS
=============================== */

function openPayModal() {}
function closePayModal() {}
function switchPayTab() {}
async function handlePaymentConfirm() {}

/* ===============================
   UTIL
=============================== */

function wait(ms){
  return new Promise(r => setTimeout(r, ms));
}

function log(out,type,msg){
  const div=document.createElement('div');
  div.className='ll l'+type;
  div.innerHTML=`<span class="lt">></span><span class="lmsg">${msg}</span>`;
  out.appendChild(div);
  out.scrollTop=out.scrollHeight;
}

function showToast(title,msg,type){
  console.log(`[${type}] ${title}: ${msg}`);
}

/* ===============================
   SCANNER (UNCHANGED CORE)
=============================== */

let lastScan=null,scanActive=false;

async function runScan(){
  if(scanActive)return;

  const raw=document.getElementById('tgt').value.trim();
  if(!raw){
    showToast('Error','Enter a URL or IP','err');
    return;
  }

  const host=raw.replace(/https?:\/\//i,'')
    .split('/')[0]
    .replace(/[<>"'&;`]/g,'')
    .toLowerCase()
    .trim();

  if(!host){
    showToast('Error','Invalid target','err');
    return;
  }

  const out=document.getElementById('tout');
  const bar=document.getElementById('tbar');
  const btn=document.getElementById('scanBtn');

  out.innerHTML='';
  bar.style.width='0%';
  btn.disabled=true;
  btn.textContent='Scanning...';
  scanActive=true;

  const now=new Date();

  lastScan={
    host,
    ip:'resolving...',
    date:now.toISOString(),
    lines:[],
    findings:{critical:[],high:[],medium:[],info:[]}
  };

  log(out,'inf',`[SCAN] Target: ${host}`);
  bar.style.width='10%';

  /* DNS */
  try{
    const dnsRes=await fetch(`https://dns.google/resolve?name=${host}&type=A`);
    const dnsJson=await dnsRes.json();

    if(dnsJson.Answer){
      const ips=dnsJson.Answer.map(r=>r.data);
      lastScan.ip=ips[0]||'N/A';
      log(out,'ok',`[DNS] ${ips.join(', ')}`);
    }else{
      log(out,'wrn','[DNS] No records found');
    }
  }catch(e){
    log(out,'wrn','[DNS] Failed');
  }

  bar.style.width='30%';

  /* SSL */
  try{
    const sslRes=await fetch(`https://ssl-checker.io/api/v1/check/${host}`);
    const ssl=await sslRes.json();

    if(ssl && ssl.cn){
      log(out,'ok',`[SSL] CN: ${ssl.cn}`);
    }
  }catch(e){
    log(out,'inf','[SSL] Skipped');
  }

  bar.style.width='55%';

  /* HEADERS */
  try{
    await fetch(`https://${host}`,{mode:'no-cors'});
    log(out,'ok','[HTTP] Reachable');
  }catch(e){
    log(out,'wrn','[HTTP] Not reachable');
  }

  bar.style.width='80%';

  /* WHOIS */
  try{
    const w=await fetch(`https://whoisjsonapi.com/v1/${host}`);
    const j=await w.json();

    if(j.domain_name){
      log(out,'ok',`[WHOIS] Domain: ${j.domain_name}`);
    }
  }catch(e){
    log(out,'inf','[WHOIS] Skipped');
  }

  bar.style.width='100%';

  log(out,'ok','[DONE] Scan complete');

  btn.disabled=false;
  btn.textContent='Start Scan';
  scanActive=false;
}
