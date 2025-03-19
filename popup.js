document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyze');
  const totalLinksElement = document.getElementById('totalLinks');
  const dofollowElement = document.getElementById('dofollow');
  const nofollowElement = document.getElementById('nofollow');
  const linkList = document.getElementById('linkList');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('searchLinks');
  const categoriesList = document.getElementById('categoriesList');
  const categoriesStats = document.getElementById('categoriesStats');

  let allLinks = [];
  let activeCategory = null;

  analyzeButton.addEventListener('click', async () => {
    loading.classList.add('active');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Injecter le script de contenu si nécessaire
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Envoyer un message au script de contenu
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'analyze' });
      
      if (results && Array.isArray(results)) {
        allLinks = results;
        updateUI(allLinks);
      } else {
        showError('Aucun lien trouvé sur la page');
      }
    } catch (error) {
      console.error('Error analyzing page:', error);
      showError('Une erreur est survenue lors de l\'analyse de la page');
    } finally {
      loading.classList.remove('active');
    }
  });

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredLinks = allLinks.filter(link => 
      link.url.toLowerCase().includes(searchTerm) || 
      link.text.toLowerCase().includes(searchTerm)
    );
    updateLinksList(filteredLinks);
  });

  function updateUI(links) {
    const dofollow = links.filter(link => !link.nofollow).length;
    const nofollow = links.filter(link => link.nofollow).length;

    // Update stats with animation
    animateNumber(totalLinksElement, 0, links.length);
    animateNumber(dofollowElement, 0, dofollow);
    animateNumber(nofollowElement, 0, nofollow);

    // Update categories
    const categories = getCategoriesStats(links);
    updateCategories(categories);

    // Update links list
    updateLinksList(links);
  }

  function animateNumber(element, start, end) {
    const duration = 1000;
    const steps = 60;
    const increment = (end - start) / steps;
    let current = start;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        clearInterval(timer);
        element.textContent = end;
      } else {
        element.textContent = Math.round(current);
      }
    }, stepTime);
  }

  function getCategoriesStats(links) {
    const categories = {};
    links.forEach(link => {
      if (!categories[link.category]) {
        categories[link.category] = 0;
      }
      categories[link.category]++;
    });
    return categories;
  }

  function updateCategories(categories) {
    categoriesList.innerHTML = '';
    categoriesStats.innerHTML = `${Object.keys(categories).length} catégories`;

    Object.entries(categories).forEach(([category, count]) => {
      const categoryElement = document.createElement('div');
      categoryElement.className = `category-item ${category === activeCategory ? 'active' : ''}`;
      categoryElement.textContent = `${category} (${count})`;
      
      categoryElement.addEventListener('click', () => {
        if (activeCategory === category) {
          activeCategory = null;
          updateLinksList(allLinks);
          document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
        } else {
          activeCategory = category;
          const filteredLinks = allLinks.filter(link => link.category === category);
          updateLinksList(filteredLinks);
          document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
          categoryElement.classList.add('active');
        }
      });

      categoriesList.appendChild(categoryElement);
    });
  }

  function updateLinksList(links) {
    linkList.innerHTML = '';
    
    if (links.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'Aucun lien trouvé';
      linkList.appendChild(emptyMessage);
      return;
    }

    links.forEach(link => {
      const linkElement = document.createElement('div');
      linkElement.className = 'link-item';
      
      const urlElement = document.createElement('a');
      urlElement.href = link.url;
      urlElement.className = 'url';
      urlElement.target = '_blank';
      urlElement.textContent = link.text || link.url;
      
      const typeElement = document.createElement('span');
      typeElement.className = `type ${link.nofollow ? 'type-nofollow' : 'type-dofollow'}`;
      typeElement.textContent = link.nofollow ? 'nofollow' : 'dofollow';

      const locationElement = document.createElement('span');
      locationElement.className = 'location';
      locationElement.textContent = link.location;

      linkElement.appendChild(urlElement);
      linkElement.appendChild(typeElement);
      linkElement.appendChild(locationElement);
      linkList.appendChild(linkElement);
    });
  }

  function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    linkList.innerHTML = '';
    linkList.appendChild(errorElement);
  }
});