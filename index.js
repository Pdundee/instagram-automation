const axios = require('axios');
const { parse } = require('node-html-parser');

// Configurazione
const config = {
  siteUrl: 'https://canieucori.it',
  articlesSelector: 'article.post',
};

// Funzione per pubblicare su Instagram
async function publishToInstagram(article) {
  const caption = `${article.title}\n\n${article.excerpt}\n\nVieni a scoprire di più! 🐾💖\n\n#cani #cuori #animali`;
  const imageUrl = article.imageUrl;

  // Usa l'API di Instagram
  const response = await axios.post(
    `https://graph.instagram.com/me/media?access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`,
    {
      caption,
      image_url: imageUrl,
    }
  );

  console.log('Pubblicato su Instagram:', response.data);
  return response.data;
}

// Funzione per recuperare gli articoli
async function fetchAllArticles() {
  try {
    // Usa un proxy diverso
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const { data } = await axios.get(proxyUrl + config.siteUrl, { timeout: 5000 });

    const root = parse(data);
    const articles = root.querySelectorAll(config.articlesSelector).map(article => ({
      id: article.querySelector('a').getAttribute('href'),
      title: article.querySelector('h2').text.trim(),
      excerpt: article.querySelector('p.excerpt')?.text.trim() || 'Scopri di più sul nostro sito!',
      imageUrl: article.querySelector('img')?.getAttribute('src') || '',
    }));

    return articles;
  } catch (error) {
    console.error('Errore nel recupero degli articoli:', error.message);
    return [];
  }
}

// Funzione principale
async function main() {
  try {
    // Recupera gli articoli
    const articles = await fetchAllArticles();
    if (articles.length === 0) {
      throw new Error('Nessun articolo trovato');
    }

    // Seleziona un articolo casuale
    const randomArticle = articles[Math.floor(Math.random() * articles.length)];
    randomArticle.link = randomArticle.id.startsWith('http') ? randomArticle.id : `${config.siteUrl}${randomArticle.id}`;
    randomArticle.imageUrl = randomArticle.imageUrl.startsWith('http') ? randomArticle.imageUrl : `${config.siteUrl}${randomArticle.imageUrl}`;

    console.log('Articolo selezionato:', randomArticle.title);

    // Pubblica su Instagram
    const result = await publishToInstagram(randomArticle);
    console.log('Pubblicazione completata:', result);
  } catch (error) {
    console.error('Errore durante l\'esecuzione:', error.message);
  }
}

// Esegui la funzione principale
main();