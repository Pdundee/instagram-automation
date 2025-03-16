const axios = require('axios');
const { parse } = require('node-html-parser');

// Configurazione
const config = {
  siteUrl: 'https://canieucori.it',
  articlesSelector: 'article.post',
  timeout: 5000, // Timeout per le richieste
  retries: 3, // Numero di tentativi in caso di errore
  proxyList: [
    'https://cors.bridged.cc/',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
  ], // Lista di proxy alternativi
};

// Funzione per pubblicare su Instagram
async function publishToInstagram(article) {
  try {
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
  } catch (error) {
    console.error('Errore nella pubblicazione su Instagram:', error.message);
    throw error;
  }
}

// Funzione per verificare la disponibilità del sito
async function checkSiteAvailability(url) {
  try {
    const response = await axios.head(url, { timeout: config.timeout });
    return response.status === 200;
  } catch (error) {
    console.error('Errore nella verifica della disponibilità del sito:', error.message);
    return false;
  }
}

// Funzione per recuperare gli articoli
async function fetchAllArticles() {
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    for (const proxyUrl of config.proxyList) {
      try {
        console.log(`Tentativo ${attempt}: uso del proxy ${proxyUrl}`);

        // Verifica la disponibilità del sito
        const isSiteAvailable = await checkSiteAvailability(config.siteUrl);
        if (!isSiteAvailable) {
          throw new Error('Il sito non è disponibile');
        }

        // Recupera gli articoli usando il proxy corrente
        const { data } = await axios.get(proxyUrl + encodeURIComponent(config.siteUrl), {
          timeout: config.timeout,
        });

        const root = parse(data);
        const articles = root.querySelectorAll(config.articlesSelector).map(article => ({
          id: article.querySelector('a').getAttribute('href'),
          title: article.querySelector('h2').text.trim(),
          excerpt: article.querySelector('p.excerpt')?.text.trim() || 'Scopri di più sul nostro sito!',
          imageUrl: article.querySelector('img')?.getAttribute('src') || '',
        }));

        return articles;
      } catch (error) {
        console.error(`Errore nel recupero degli articoli (proxy: ${proxyUrl}):`, error.message);
        if (attempt === config.retries) {
          throw error; // Rilancia l'errore dopo l'ultimo tentativo
        }
      }
    }
  }
  return []; // Restituisci un array vuoto se tutti i tentativi falliscono
}

// Funzione principale
async function main() {
  try {
    console.log('Avvio del processo...');

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