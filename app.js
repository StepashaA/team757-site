'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Number(n)||0)+' ₽';
const icons={plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',play:'<svg viewBox="0 0 24 24"><path d="m8 4 12 8-12 8Z"/></svg>',pause:'<svg viewBox="0 0 24 24"><path d="M8 4v16M16 4v16"/></svg>'};
let catalog=[],catalogData,cart=[];try{cart=JSON.parse(localStorage.getItem('757-cart')||'[]');if(!Array.isArray(cart))cart=[]}catch{}let toastTimer;
const toast=text=>{const el=$('#toast');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3200)};
function openDialog(el){if(!el.open){el.showModal();document.documentElement.classList.add('modal-open')}}
$$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
$('#menu-open').setAttribute('aria-controls','menu-dialog');
$('#menu-open').onclick=()=>{$('#menu-open').setAttribute('aria-expanded','true');openDialog($('#menu-dialog'))};
$('#nav').addEventListener('click',e=>{if(e.target.closest('a'))$('#menu-dialog').close()});
$('#menu-account').onclick=()=>{$('#menu-dialog').close();$('#account-open').click()};
$('#menu-favorites').onclick=()=>{$('#menu-dialog').close();$('#favorites-open').click()};
$('#menu-booking').addEventListener('click',()=>$('#menu-dialog').close());
document.addEventListener('close',e=>{if(e.target.id==='menu-dialog')$('#menu-open').setAttribute('aria-expanded','false');if(!document.querySelector('dialog[open]'))document.documentElement.classList.remove('modal-open')},true);
const video=$('#hero-video');const formatTime=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
function syncVideo(){if(!motionQuery.matches&&!document.hidden&&!$('#home').hidden){video.autoplay=true;video.play().catch(()=>{})}else{video.autoplay=false;video.pause()}}
motionQuery.addEventListener('change',syncVideo);document.addEventListener('visibilitychange',syncVideo);syncVideo();
const hasStock=p=>p.variants?.length?p.variants.some(v=>v.quantity===''||Number(v.quantity)>0):(p.quantity===''||Number(p.quantity)>0);

// Catalog URLs carry filters; session storage keeps only the matching scroll position.
const catalogEntryParams = new URLSearchParams(location.search);
let catalogFiltersReady = false, catalogPositionRestored = false;
let catalogPositions = {};
try { catalogPositions = JSON.parse(sessionStorage.getItem('757-catalog-positions') || '{}') || {}; } catch {}
const catalogEntryPositions = {...catalogPositions};
function catalogQuery() {
  const q = new URLSearchParams({view:'shop'});
  if (catalogEntryParams.get('collection')) q.set('collection', catalogEntryParams.get('collection'));
  for (const [key,id] of [['q','search'],['category','category'],['sort','sort']]) {
    const value = $('#'+id).value;
    if (value && value !== 'original') q.set(key,value);
  }
  $$('[name=catalog-size]:checked').forEach(x=>q.append('size',x.value));
  q.set('available',$('#available').checked?'1':'0');
  return q.toString();
}
function restoreCatalogFilters() {
  const q = catalogEntryParams;
  if(q.has('q')) $('#search').value=q.get('q');
  if(q.has('category')) $('#category').value=q.get('category');
  if(q.has('sort')) $('#sort').value=['asc','desc','name'].includes(q.get('sort'))?q.get('sort'):'original';
  if(q.has('available')) $('#available').checked=q.get('available')!=='0';
  const sizes=q.getAll('size');
  $$('[name=catalog-size]').forEach(x=>x.checked=sizes.includes(x.value));
  $('#size-filter').value='';
  $('#size-filter-label').textContent=$$('[name=catalog-size]:checked').map(x=>x.value).join(', ')||'Все размеры';
}
function rememberCatalogPosition() {
  if (!catalogFiltersReady || $('#shop').hidden) return;
  const query=catalogQuery();
  const restore=catalogEntryParams.has('restore')?'&restore=1':'';
  history.replaceState(history.state,'','?'+query+restore);
  // Keep a few independent catalog visits, without persisting customer data.
  delete catalogPositions[query];
  catalogPositions[query]=Math.max(0,window.scrollY);
  catalogPositions=Object.fromEntries(Object.entries(catalogPositions).slice(-8));
  try { sessionStorage.setItem('757-catalog-positions',JSON.stringify(catalogPositions)); } catch {}
}
function restoreCatalogPosition() {
  if(catalogPositionRestored) return;
  catalogPositionRestored=true;
  const returning=catalogEntryParams.has('restore')||performance.getEntriesByType('navigation')[0]?.type==='back_forward';
  const y=catalogEntryPositions[catalogQuery()];
  if(!returning || !Number.isFinite(y)) return;
  history.scrollRestoration='manual';
  document.fonts.ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}))));
}
function catalogProductHref(id) {
  const q=new URLSearchParams({product:id});
  if(!$('#shop').hidden) q.set('catalog',catalogQuery());
  return '?'+q.toString();
}
function catalogBackHref() {
  const source=new URLSearchParams(catalogEntryParams.get('catalog')||'');
  if(source.get('view')!=='shop') return '?view=shop';
  const safe=new URLSearchParams({view:'shop'});
  for(const key of ['collection','q','category','sort','available','size']) {
    for(const value of source.getAll(key)) safe.append(key,value);
  }
  safe.set('restore','1');
  return '?'+safe.toString();
}
document.addEventListener('click',event=>{
  if(event.target.closest('a[href]')) rememberCatalogPosition();
},true);
window.addEventListener('pagehide',rememberCatalogPosition);
const sizeDisclosure=$('.filter-disclosure');
document.addEventListener('click',event=>{
  if(sizeDisclosure.open&&!sizeDisclosure.contains(event.target)) sizeDisclosure.open=false;
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&sizeDisclosure.open){sizeDisclosure.open=false;sizeDisclosure.querySelector('summary').focus();}
});

function productCard(p){const available=hasStock(p);return `<article class="product-card"><button class="favorite-toggle" data-favorite="${p.id}" aria-pressed="false" aria-label="Добавить в избранное"><svg viewBox="0 0 24 24"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg></button><a class="product-image" href="${esc(catalogProductHref(p.id))}" aria-label="${esc(p.name)}"><img class="primary-photo" src="${esc(p.images[0]||'assets/product-2.webp')}" alt="${esc(p.name)}" loading="lazy" width="400" height="400">${p.images.length>1?`<img class="secondary-photo" src="${esc(p.images[1])}" alt="" aria-hidden="true" loading="lazy" width="400" height="400">`:""}</a><div class="product-info"><a href="${esc(catalogProductHref(p.id))}"><h3>${esc(p.name)}</h3><span class="price">${money(p.price)}</span></a><a class="add-button" href="${esc(catalogProductHref(p.id))}" aria-label="Выбрать размер: ${esc(p.name)}">${icons.plus}</a></div>${$('#shop').hidden?'':`<span class="stock">${available?'В наличии':'Нет в наличии'}</span>`}</article>`}
function saveCart(){localStorage.setItem('757-cart',JSON.stringify(cart));document.dispatchEvent(new Event('757:cart'));$('#cart-count').textContent=cart.reduce((n,x)=>n+x.quantity,0)}saveCart();
function renderCart(){const box=$('#cart-items');cart=cart.filter(x=>catalog.some(p=>p.id===x.id));saveCart();if(!cart.length){box.innerHTML='<div class="empty"><h3>Пока пусто</h3><p>Здесь будут ваши вещи.</p><a class="button dark" href="?view=shop" style="margin-top:20px">Смотреть одежду ↗</a></div>';$('#cart-checkout').innerHTML='';return}let total=0;box.innerHTML=cart.map((x,i)=>{const p=catalog.find(p=>p.id===x.id);total+=x.price*x.quantity;return `<div class="cart-row"><img src="${esc(x.image||p.images[0])}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="muted">${esc(Object.entries(x.options).map(([k,v])=>k+': '+v).join(' · '))}</p><div class="quantity"><button data-qty="${i}" data-delta="-1" aria-label="Уменьшить количество">−</button><span>${x.quantity}</span><button data-qty="${i}" data-delta="1" aria-label="Увеличить количество">+</button></div></div><div><span class="price">${money(x.price*x.quantity)}</span><br><button class="remove" data-remove="${i}">Удалить</button></div></div>`}).join('');
$('#cart-checkout').innerHTML=`<div class="cart-total"><span>Итого</span><span>${money(total)}</span></div><p class="cart-login">Уже покупали? <button class="text-button" data-cart-login>Войти в аккаунт</button></p><button class="button dark" id="checkout-open">Оформить заказ ↗</button>`;$('#checkout-open').onclick=()=>window.open757Checkout();
box.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);renderCart()});box.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>{const x=cart[+b.dataset.qty],p=catalog.find(p=>p.id===x.id);const variant=p.variants.find(v=>String(v.uid)===x.variant);const stock=variant?.quantity??p.quantity;const limit=stock===''?99:Number(stock);if(+b.dataset.delta>0&&x.quantity>=limit){toast('Больше нет в наличии');return}x.quantity+=Number(b.dataset.delta);if(x.quantity<=0)cart.splice(+b.dataset.qty,1);renderCart()});}
$('#cart-open').onclick=()=>{renderCart();openDialog($('#cart-dialog'))};
function renderShop(){setTimeout(()=>document.dispatchEvent(new Event('757:products')),0);let list=window.active757Collection?catalog.filter(p=>window.active757Collection.includes(p.id)):catalog;const totalInScope=list.length;const term=$('#search').value.trim().toLocaleLowerCase(),cat=$('#category').value,size=$('#size-filter').value;if(term)list=list.filter(p=>(p.name+' '+p.parts.join(' ')).toLocaleLowerCase().includes(term));if(cat)list=list.filter(p=>p.parts.includes(cat));const selectedSizes=$$('[name=catalog-size]:checked').map(x=>x.value);if(!selectedSizes.length&&size)selectedSizes.push(size);if(selectedSizes.length)list=list.filter(p=>p.options.some(o=>o.title==='Размер'&&o.values.some(s=>selectedSizes.includes(s))));if($('#available').checked)list=list.filter(hasStock);list=[...list];if($('#sort').value==='asc')list.sort((a,b)=>a.price-b.price);if($('#sort').value==='desc')list.sort((a,b)=>b.price-a.price);if($('#sort').value==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'ru'));$('#catalog-count').textContent=`Показано ${list.length} из ${totalInScope} товаров`;$('#catalog-grid').innerHTML=list.length?list.map(productCard).join(''):'<p class="empty">По этим фильтрам вещей нет. Попробуйте другой размер или категорию.</p>';rememberCatalogPosition()}
function renderProduct(p){setTimeout(()=>document.dispatchEvent(new Event('757:products')),0);if(!p){$('#product-page').innerHTML='<h1>Товар не найден</h1><a class="button dark" href="?view=shop">В каталог</a>';return}document.title=p.name+' — 757 TEAM';let selected={};let currentVariant;
const options=p.options.filter(o=>o.values?.length);let sections=p.sections||[];
const sizeSection=sections.some(s=>/размер/i.test(s.title));
$('#product-page').innerHTML=`<a class="back" href="${esc(catalogBackHref())}">← Весь каталог</a><div class="product-layout"><div><img class="main-product-image" id="main-product-image" src="${esc(p.images[0])}" alt="${esc(p.name)}"><div class="thumbs">${p.images.map((src,i)=>`<button data-img="${esc(src)}" aria-label="Фото ${i+1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div></div><div class="product-copy"><h1>${esc(p.name)}</h1><p class="price" id="product-price">${money(p.price)}</p><p class="muted" id="variant-stock"></p>${options.map((o,i)=>`<fieldset class="option-group"><legend>${esc(o.title)}</legend><div class="option-buttons">${o.values.map(v=>`<button class="option-button" data-option="${i}" data-value="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}</div></fieldset>`).join('')}<p id="product-error" class="form-error" role="alert"></p><button class="product-favorite-action" data-favorite="${p.id}" aria-pressed="false" aria-label="Добавить в избранное"><svg viewBox="0 0 24 24"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg>В избранное</button><button class="button dark" id="product-add">Выберите ${options.length?'вариант':'товар'}</button>${sections.map(s=>`<details ${/описание/i.test(s.title)?'open':''}><summary>${esc(s.title)}</summary><div>${s.html}</div></details>`).join('')}${!sections.some(s=>/описание/i.test(s.title))?`<details open><summary>Описание</summary><div class="product-description">${esc(p.description||p.details.filter(t=>!t.includes('headphones')).join('\n')||'Подробности об изделии уточняйте у команды 757 TEAM.')}</div></details>`:''}${!sizeSection&&options.some(o=>o.title==='Размер')?`<details><summary>Размерная сетка</summary><div>${p.sizeCharts?.length?p.sizeCharts.map(src=>`<img src="${esc(src)}" alt="Размерная сетка ${esc(p.name)}">`).join(''):'<p>Выберите один из размеров, указанных для этого товара. Для подбора посадки уточните замеры у команды 757 TEAM.</p>'}<a class="text-button" href="?view=contacts">Уточнить замеры у команды ↗</a></div></details>`:''}</div></div>`;
const matchVariant=()=>p.variants.find(v=>options.every(o=>String(v[o.title])===String(selected[o.title])));
function update(){const complete=options.every(o=>selected[o.title]);currentVariant=complete?matchVariant():undefined;let available=hasStock(p);if(complete&&p.variants.length)available=!!currentVariant&&(currentVariant.quantity===''||Number(currentVariant.quantity)>0);$('#product-add').disabled=!complete||!available;$('#product-add').textContent=!complete?'Выберите '+options.filter(o=>!selected[o.title]).map(o=>o.title.toLowerCase()).join(' и '):available?'Добавить в корзину':'Нет в наличии';$('#variant-stock').textContent=complete?(available?'В наличии':'Этот вариант закончился'):'Выберите вариант, чтобы проверить наличие';$('#product-price').textContent=money(currentVariant?Number(String(currentVariant.price).replace(/\s/g,'').replace(',','.')):p.price);
$$('.option-button').forEach(b=>{const o=options[+b.dataset.option];b.setAttribute('aria-pressed',String(selected[o.title]===b.dataset.value));const possible={...selected,[o.title]:b.dataset.value};b.disabled=p.variants.length>0&&!p.variants.some(v=>(v.quantity===''||Number(v.quantity)>0)&&options.every(t=>!possible[t.title]||v[t.title]===possible[t.title]));});}
$$('.option-button').forEach(b=>b.onclick=()=>{const o=options[+b.dataset.option];selected[o.title]=b.dataset.value;update()});$$('[data-img]').forEach(b=>b.onclick=()=>$('#main-product-image').src=b.dataset.img);
if(options.length===0)selected={};update();$('#product-add').onclick=()=>{if($('#product-add').disabled)return;const variant=String(currentVariant?.uid||p.id),key=p.id+':'+variant;const existing=cart.find(x=>x.key===key),stock=currentVariant?.quantity??p.quantity;const limit=stock===''?99:Number(stock);if(existing&&existing.quantity>=limit){toast('В корзине уже всё доступное количество');return}if(existing)existing.quantity++;else cart.push({key,id:p.id,variant,options:{...selected},quantity:1,price:currentVariant?Number(String(currentVariant.price).replace(/\s/g,'').replace(',','.')):p.price,image:p.images[0]});saveCart();toast('Добавлено в корзину')};}
const services=['Аквабластинг / гидроабразивная мойка','Порошковая покраска','Сварка аргоном','Настройка двухтактных скутеров','Обслуживание двухтактных скутеров','Тюнинг двухтактных скутеров','Сборка двухтактных скутеров с нуля','Подвеска','Техническое обслуживание','Тормозная система','Колёса','Диагностика','Сборка мототехники с коробки','Выездной ремонт'];
const params=new URLSearchParams(location.search);const isShop=params.get('view')==='shop',productId=params.get('product');if(isShop||productId){$('#home').hidden=true;video.pause();if(isShop)$('#shop').hidden=false;else $('#product-page').hidden=false}
fetch('assets/catalog.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{catalogData=data;catalog=data.products;document.dispatchEvent(new Event('757:products'));if(isShop){document.title='Одежда — 757 TEAM';data.categories.forEach(c=>$('#category').insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));const sizes=[...new Set(catalog.flatMap(p=>p.options.filter(o=>o.title==='Размер').flatMap(o=>o.values)))];['XS','S','M','L','XL','XXL','39-42','43-46','one size'].filter(s=>sizes.includes(s)).forEach(s=>$('#size-filter').insertAdjacentHTML('beforeend',`<option>${esc(s)}</option>`));for(const id of ['search','category','size-filter','sort','available'])$('#'+id).addEventListener(id==='search'?'input':'change',renderShop);$('#reset-filters').onclick=()=>{$('#search').value='';$('#category').value='';$('#size-filter').value='';$('#sort').value='original';$('#available').checked=true;$$('[name=catalog-size]').forEach(x=>x.checked=false);$('#size-filter-label').textContent='Все размеры';sizeDisclosure.open=false;renderShop()};renderShop()}if(productId)renderProduct(catalog.find(p=>p.id===productId));document.dispatchEvent(new Event('757:catalog-ready'));}).catch(()=>{if(isShop)$('#catalog-error').hidden=false;if(productId)$('#product-page').innerHTML='<p>Не удалось загрузить товар. Обновите страницу.</p>';$('#featured-products').innerHTML='<p>Не удалось загрузить коллекцию. <a href="?view=shop">Открыть каталог ↗</a></p>'});

