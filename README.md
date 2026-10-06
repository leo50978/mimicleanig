# Clino — déployer le site

Le site est publié sur **GitHub Pages** depuis le dépôt `leo50978/mimicleanig`. Le workflow `.github/workflows/pages.yml` se lance automatiquement après chaque push sur `main`. Ne pas déployer ce site sur GitLab Pages, Vercel ou Firebase Hosting.

## Préparer GitHub Pages (une seule fois)

Dans le dépôt GitHub, ouvrir **Settings → Pages** et choisir **GitHub Actions** comme source de publication. Le workflow du dépôt construit l’artefact statique et le publie. Les mises à jour Firebase/Cloud Functions ne sont pas déployées par ce workflow.

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
     assets README.md .github/workflows/pages.yml
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
- `robots.txt` déclare l’emplacement du sitemap. Le site est un GitHub Pages de projet (`leo50978.github.io/mimicleanig/`), donc les robots des moteurs cherchent normalement `robots.txt` à la racine du domaine (`leo50978.github.io/robots.txt`). Le fichier dans ce dépôt ne contrôle pas cette racine partagée; un domaine personnalisé ou une configuration au niveau du dépôt utilisateur est nécessaire pour publier une règle robots à la racine du domaine.
- `llms.txt` résume les services et les pages utiles aux outils d’IA. Mettre ses liens à jour avec le sitemap.
- `404.html` fournit la page d’erreur GitHub Pages. `offline.html` est le secours de navigation quand la connexion tombe; `service-worker.js` garde en cache le noyau du site après la première visite et met en cache les autres pages consultées.
- Les icônes de navigateur sont dans `assets/`; `manifest.webmanifest` référence les icônes d’installation.
- Les nouvelles pages de service local doivent avoir un titre, une description, une URL canonique, des liens internes et un contenu utile propre à leur service et leur secteur. Ne pas inventer d’adresse, de tarif, de note ou de zone de couverture confirmée.
