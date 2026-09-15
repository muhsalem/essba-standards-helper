
  // language toggle
  function setLang(lang){
    var toEN = lang === 'en';
    document.querySelectorAll('[data-en]').forEach(function(el){
      if(el.dataset.ar === undefined) el.dataset.ar = el.innerHTML;
      el.innerHTML = toEN ? el.dataset.en : el.dataset.ar;
    });
    var html = document.documentElement;
    html.lang = lang;
    html.dir = toEN ? 'ltr' : 'rtl';
    document.getElementById('btn-ar').classList.toggle('active', !toEN);
    document.getElementById('btn-en').classList.toggle('active', toEN);
  }

  // reveal spectrum
  window.addEventListener('load', function(){
    var bar = document.getElementById('specBar');
    setTimeout(function(){ if(bar) bar.classList.add('lit'); }, 350);
  });

  // animate axis bars in view
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.querySelectorAll('.fill').forEach(function(f){ f.style.width = f.getAttribute('data-w') + '%'; });
      io.unobserve(e.target);
    });
  }, {threshold:.4});
  var axes = document.getElementById('axesBlock');
  if(axes) io.observe(axes);

  // close mobile nav on link tap
  document.querySelectorAll('.nav a').forEach(function(a){
    a.addEventListener('click', function(){ if(window.innerWidth <= 820){ document.querySelector('.nav').style.display=''; } });
  });
