# Kardia : mise en ligne, mises à jour et classement

## Mettre à jour l'appli
1. Décompresse le zip reçu.
2. Dans ton dépôt GitHub : **Add file → Upload files**, glisse **tous les fichiers**, puis **Commit changes**.
3. Attends 1 à 2 minutes. Sur le téléphone, ferme complètement l'appli puis rouvre-la deux fois. Sur ordinateur : Cmd + Maj + R.
Les données de jeu restent sur chaque téléphone.

⚠️ Une fois le classement activé, ne remplace plus jamais **firebase-config.js** (il contient ta configuration). Les prochaines mises à jour ne le contiendront pas.

## Images des cartes (dossier « cartes »)
Création du dossier, une seule fois : **Add file → Create new file**, nom `cartes/lisez-moi.txt`, écris n'importe quoi, **Commit**.
Ajout d'images : ouvre le dossier **cartes** → **Add file → Upload files** → glisse les images → **Commit**.

Noms à respecter (tous en .png) :
- Recto : `org-01-coeur.png` (même image pour toutes les raretés, l'appli ajoute le cadre)
- Full Art : `org-01-coeur-fullart.png`
- Édition limitée : `org-01-coeur-limitee.png`
- Dos avec l'anecdote : `org-01-coeur-dos.png` (un seul par carte, quelle que soit la rareté)
- Option : un dos commun sans texte nommé `dos.png`. L'appli écrit alors l'anecdote par-dessus pour les cartes qui n'ont pas leur propre dos.

## Activer le classement en ligne (Firebase, gratuit, environ 15 minutes)
1. Va sur https://console.firebase.google.com avec un compte Google → **Créer un projet** → nom `kardia` → désactive Google Analytics → **Créer**.
2. Menu de gauche **Créer → Authentication** → **Commencer** → onglet **Sign-in method** → **Anonyme** → **Activer** → **Enregistrer**.
3. Toujours dans Authentication → onglet **Paramètres** → **Domaines autorisés** → **Ajouter un domaine** → `luchau27.github.io`.
4. Menu **Créer → Firestore Database** → **Créer une base de données** → emplacement en Europe (par exemple `eur3` ou `europe-west1`) → **mode production** → **Créer**.
5. Dans Firestore, onglet **Règles** : efface tout, colle le bloc ci-dessous, puis **Publier**.
6. Clique sur la roue dentée → **Paramètres du projet** → en bas, **Vos applications** → icône **</>** (Web) → surnom `kardia` → **Enregistrer l'application**. Firebase affiche un bloc `const firebaseConfig = { ... };` : copie uniquement ce qui est entre les accolades, accolades comprises.
7. Sur GitHub, ouvre **firebase-config.js** → crayon ✏️ (Edit) → remplace `null` dans la dernière ligne par ce que tu as copié, pour obtenir `K.firebaseConfig = { apiKey: "...", ... };` → **Commit changes**.
8. Attends 1 à 2 minutes, recharge l'appli, ouvre **Classement** → **Participer**.

Règles Firestore à coller :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{uid} {
      allow read: if true;
      allow delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['pseudo', 'score', 'region', 'updatedAt'])
        && request.resource.data.pseudo is string && request.resource.data.pseudo.size() <= 20
        && request.resource.data.score is int && request.resource.data.score >= 0 && request.resource.data.score < 1000000
        && request.resource.data.region is string && request.resource.data.region.size() <= 40;
    }
  }
}
```

La clé `apiKey` de Firebase n'est pas un secret : elle peut être publique sur GitHub. Ce sont les règles ci-dessus qui protègent les données. Seuls le pseudo, la région et le score sont publiés.

## Installer sur le téléphone
- **iPhone** : Safari → **Partager** → **Sur l'écran d'accueil**.
- **Android** : Chrome → menu **⋮** → **Installer l'application**.
