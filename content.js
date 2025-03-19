// Fonction pour analyser les liens de la page
function analyzePage() {
  const links = Array.from(document.querySelectorAll('a'));
  const currentDomain = window.location.hostname;

  return links
    .filter(link => {
      try {
        const url = new URL(link.href);
        return url.hostname === currentDomain;
      } catch {
        return false;
      }
    })
    .map(link => {
      const path = new URL(link.href).pathname;
      const category = getCategoryFromPath(path);
      const depth = getPathDepth(path);
      const location = getLinkLocation(link);

      return {
        url: link.href,
        text: link.textContent.trim(),
        nofollow: link.rel.includes('nofollow'),
        category,
        depth,
        location
      };
    });
}

function getCategoryFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Accueil';
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

function getPathDepth(pathname) {
  return pathname.split('/').filter(Boolean).length;
}

function getLinkLocation(link) {
  const rect = link.getBoundingClientRect();
  if (rect.top < window.innerHeight / 3) return 'Header';
  if (rect.top > window.innerHeight * 2/3) return 'Footer';
  return 'Content';
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    const results = analyzePage();
    sendResponse(results);
  }
  return true;
});