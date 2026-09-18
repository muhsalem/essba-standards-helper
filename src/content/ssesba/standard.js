
  // language toggle
  function setLang(lang){
    var target = lang === 'en' ? '/en' : '/';
    window.location.assign(target + window.location.hash);
  }

  function toggleStandardNav(button){
    var page = document.querySelector('.standard-page');
    if(!page) return;
    var open = page.classList.toggle('nav-open');
    if(button) button.setAttribute('aria-expanded', String(open));
  }

  function closeStandardNav(){
    var page = document.querySelector('.standard-page');
    if(page) page.classList.remove('nav-open');
    var button = document.querySelector('.navtoggle');
    if(button) button.setAttribute('aria-expanded', 'false');
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
  document.querySelectorAll('.standard-nav a').forEach(function(a){
    a.addEventListener('click', function(){ if(window.innerWidth <= 980){ closeStandardNav(); } });
  });
