/* Réglages généraux de Kardia. Tu peux changer le nom de la monnaie ici. */
window.K = window.K || {};
K.config = {
  appName: 'Kardia',
  version: '1.8.0',
  cardsPath: 'cartes/',
  /* Dépôt GitHub (détecté tout seul sur github.io ; à remplir seulement en cas de besoin, ex. 'luchau27/Kardia'). */
  githubRepo: null,
  /* Textes du dos des cartes (l'anecdote de chaque carte est dans cards.js, champ « fact »). */
  back: { top: 'Le corps en collection', logo: 'Kardia', know: { C: 'Le conseil', R: 'Le saviez-vous ?', 'É': 'Étonnant !', L: 'Incroyable mais vrai' } },
  /* Hauteur du chemin dans l'image visuels/decor.png (0.18 = 18 % depuis le bas de l'écran). */
  decorGround: 0.18,
  currency: { name: 'Pulsations', one: 'Pulsation' },
  rewards: { rdv: 300, admin: 150, auto: 80, earlyBonus: 60 },
  packs: {
    gratuit:   { name: 'Pack du jour',   size: 3, price: 0,   odds: { C: .74, R: .21, 'É': .045, L: .005 } },
    standard:  { name: 'Pack Standard',  size: 5, price: 300, odds: { C: .70, R: .22, 'É': .07, L: .01 } },
    categorie: { name: 'Pack Catégorie', size: 5, price: 400, odds: { C: .70, R: .22, 'É': .07, L: .01 }, pickCat: true },
    premium:   { name: 'Pack Premium',   size: 5, price: 900, odds: { C: .52, R: .32, 'É': .13, L: .03 }, guarantee: 'É' },
    boss:      { name: 'Pack Boss',      size: 5, price: null, odds: { C: .45, R: .33, 'É': .14, L: .08 }, guarantee: 'É' },
    cadeau:    { name: 'Pack Cadeau',    size: 4, price: null, odds: { C: 1 } }
  },
  recycle: { C: 10, R: 30, 'É': 100, L: 400 },
  craft: { C: 80, R: 240, 'É': 800, L: 3000 }
};
