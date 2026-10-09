# Clino — déployer le site

Le site est publié sur **GitHub Pages** depuis le dépôt `leo50978/mimicleanig`. Le workflow `.github/workflows/pages.yml` se lance automatiquement après chaque push sur `main`. Ne pas déployer ce site sur GitLab Pages, Vercel ou Firebase Hosting.

## Préparer GitHub Pages (une seule fois)

Dans le dépôt GitHub, ouvrir **Settings → Pages** et choisir **GitHub Actions** comme source de publication. Le workflow du dépôt construit l’artefact statique et le publie. Les mises à jour Firebase/Cloud Functions ne sont pas déployées par ce workflow.

### Domaine personnalisé Clinofive

Le domaine public du site est `clinofive.com`. Le fichier `CNAME` à la racine conserve cette valeur dans le dépôt. Comme la publication utilise GitHub Actions, il faut aussi renseigner `clinofive.com` dans **Settings → Pages → Custom domain**; GitHub ignore le fichier `CNAME` pour ce mode de publication.

Chez le fournisseur DNS du domaine, configurer les enregistrements suivants :

| Type | Nom / hôte | Valeur |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `leo50978.github.io` |

Supprimer les anciens enregistrements `A` ou `CNAME` conflictuels pour `@` et `www`. GitHub indique que la propagation DNS peut prendre jusqu’à 24 heures. Une fois les enregistrements détectés, activer **Enforce HTTPS** dans **Settings → Pages**.

## Pour chaque mise à jour

1. Modifier les pages HTML, le CSS, le JavaScript ou les fichiers dans `assets/`. Pour le SEO, garder `sitemap.xml` à jour lorsqu’une page publique est ajoutée, et vérifier aussi ses URL canoniques. `service-worker.js` contient les pages gardées pour un premier usage hors ligne.
2. Vérifier le dépôt distant et la branche :

   ```sh
   git remote -v
   git status --short --branch
   ```

   Le dépôt attendu est `git@github.com:leo50978/mimicleanig.git` et la branche de production est `main`.

3. Commiter et pousser :

   ```sh
   git add -- \
     '*.html' '*.css' '*.js' '*.xml' '*.txt' '*.webmanifest' \
     CNAME assets README.md .github/workflows/pages.yml
   git commit -m "Update Clino website"
   git push origin main
   ```

   Ajouter tout autre fichier du site modifié. Ne jamais ajouter de clé privée, de mot de passe ou de fichier `.env`.

4. Ouvrir **Actions** dans GitHub et vérifier que le workflow **Deploy Clino site to GitHub Pages** a réussi. L’URL du site apparaît aussi dans **Settings → Pages**. Après le déploiement, actualiser le site.

## Dépannage rapide

- Si le workflow échoue, ouvrir son exécution dans **Actions** et lire le log de l’étape en erreur.
- Si Git refuse la connexion SSH, vérifier que la clé publique est enregistrée dans les paramètres SSH du compte GitHub, que la clé privée correspondante est chargée, et que `origin` utilise l’URL SSH ci-dessus.
- Vérifier les chemins relatifs des images, styles et scripts, ainsi que la présence de `index.html` à la racine.

## Fichiers de référencement et de disponibilité

- `sitemap.xml` liste les pages publiques canoniques. Mettre à jour la liste lorsqu’une page publique est créée ou retirée; exclure `admin.html`, `404.html` et `offline.html`.
- `robots.txt` déclare l’emplacement du sitemap sur `clinofive.com`.
- `llms.txt` résume les services et les pages utiles aux outils d’IA. Mettre ses liens à jour avec le sitemap. Les pages de service régional et de nettoyage kosher-friendly sont `west-palm-beach-broward-cleaning.html` et `kosher-friendly-cleaning.html`.
- La page de destination publicitaire est `cleaning-services/index.html` (`https://clinofive.com/cleaning-services/`). Elle utilise le formulaire Firestore existant et le Meta Pixel déjà installé; mettre à jour `sitemap.xml` et `llms.txt` si son chemin change. Les campagnes Meta se règlent dans Meta Ads Manager, pas dans ce dépôt.
- Le formulaire de demande doit garder le format Firestore existant (nom, email, date, heure, service, message et horodatage). Les règles actuelles exigent un email et une date/heure valides. Les coordonnées de téléphone et ville/ZIP sont incluses au début du message pour que les règles Firestore ne changent pas; ne pas rendre date/heure facultatives sans mettre à jour les règles Firestore au préalable.
- `404.html` fournit la page d’erreur GitHub Pages. `offline.html` est le secours de navigation quand la connexion tombe; `service-worker.js` garde en cache le noyau du site après la première visite et met en cache les autres pages consultées.
- Les icônes de navigateur sont dans `assets/`; `manifest.webmanifest` référence les icônes d’installation.
- Les nouvelles pages de service local doivent avoir un titre, une description, une URL canonique, des liens internes et un contenu utile propre à leur service et leur secteur. Ne pas inventer d’adresse, de tarif, de note ou de zone de couverture confirmée.
