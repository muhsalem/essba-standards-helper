
  // language toggle
  function setLang(lang){
    var target = lang === 'en' ? '/en' : '/';
    window.location.assign(target + window.location.hash);
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
