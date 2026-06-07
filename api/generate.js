export default async function handler(req, res) {

  // ----- 1. Vérifier que c'est bien une requête POST -----
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    // ----- 2. Récupérer les données envoyées par le formulaire -----
    const { titre, description } = req.body || {};

    if (!titre || !description) {
      return res.status(400).json({ error: 'Titre et description sont requis' });
    }

    // ----- 3. Vérifier que la clé API est bien présente -----
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY manquante');
      return res.status(500).json({ error: 'Clé API OpenRouter manquante sur le serveur' });
    }

    // ----- 4. Construire le prompt envoyé à l'IA -----
    const prompt = `Tu es un assistant de catégorisation. 
Tu dois classer une idée parmi exactement l'une de ces 4 catégories :
- Pedagogie
- Evenement
- Vie de campus
- Amelioration technique

Titre de l'idée : ${titre}
Description : ${description}

Réponds UNIQUEMENT avec le nom exact de la catégorie, sans explication, sans ponctuation, sans guillemets.`;

    // ----- 5. Appel à l'API OpenRouter -----
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sunu-idees.vercel.app',
        'X-Title': 'Sunu-Idees'
      },
      body: JSON.stringify({
        model: 'poolside/laguna-m.1:free',
        stream: false,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    // ----- 6. Gérer les erreurs retournées par OpenRouter -----
    if (!response.ok) {
      console.error('Erreur OpenRouter :', response.status, data);
      return res.status(response.status).json({ error: data.error || data });
    }

    // ----- 7. Retourner la réponse au client -----
    return res.status(200).json({ data });

  } catch (err) {
    console.error('Erreur serveur generate.js :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}