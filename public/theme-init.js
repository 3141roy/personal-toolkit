(function () {
  var stored = localStorage.getItem('bundle-theme');
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.dataset.theme = stored;
  }
})();
