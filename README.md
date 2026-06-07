# 💡 Sunu-Idées v2 — Cap sur le Cloud

Boîte à idées numérique, collaborative et anonyme pour la promo P9 de Simplon.

##  Lien déployé

https://sunuideeopenrouter.vercel.app/

##  Description
Application web SPA connectée au cloud. Les idées sont catégorisées 
automatiquement par l'IA d'OpenRouter puis stockées sur Supabase, 
accessibles par toute la promo en temps réel.

##  Fonctionnalités
- Catégorisation automatique par IA (OpenRouter / Mistral 7B)
- Stockage cloud en temps réel (Supabase)
- CRUD complet sans rechargement de page
- Validation et sanitisation des données
- Fallback automatique si l'IA est indisponible
- Indicateur de chargement pendant les appels API

##  Technologies
- HTML5, CSS3, JavaScript ES6+ (async/await)
- Supabase (base de données cloud)
- OpenRouter API / Mistral 7B (IA gratuite)
- Vercel (déploiement + proxy API)

## Architecture
sunu-idees/
├── api/
│   └── generate.js   (proxy Vercel → OpenRouter)
├── index.html
├── style.css
└── app.js