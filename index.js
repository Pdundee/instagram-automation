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

// Funzione principale
async function main() {
  try {
    // Recupera gli articoli
    const { data } = await axios.get(config.siteUrl);
    const root = parse(data);
    const articles = root.querySelectorAll(config.articlesSelector).map(article => ({
      id: article.querySelector('a').getAttribute('href'),
      title: article.querySelector('h2').text.trim(),
      excerpt: article.querySelector('p.excerpt')?.text.trim() || 'Scopri di più sul nostro sito!',
      imageUrl: article.querySelector('img')?.getAttribute('src') || '',
    }));

    // Seleziona un articolo casuale
    const randomArticle = articles[Math.floor(Math.random() * articles.length)];
    randomArticle.link = randomArticle.id.startsWith('http') ? randomArticle.id : `${config.siteUrl}${randomArticle.id}`;
    randomArticle.imageUrl = randomArticle.imageUrl.startsWith('http') ? randomArticle.imageUrl : `${config.siteUrl}${randomArticle.imageUrl}`;

    console.log('Articolo selezionato:', randomArticle.title);

    // Pubblica su Instagram
    const result = await publishToInstagram(randomArticle);
    console.log('Pubblicazione completata:', result);
  } catch (error) {
    console.error('Errore:', error);
  }
}

// Esegui la funzione principale
main();