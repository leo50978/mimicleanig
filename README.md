# Clino — déployer le site

Le site est publié sur **GitHub Pages** depuis le dépôt `leo50978/mimicleanig`. Le workflow `.github/workflows/pages.yml` se lance automatiquement après chaque push sur `main`. Ne pas déployer ce site sur GitLab Pages, Vercel ou Firebase Hosting.

## Préparer GitHub Pages (une seule fois)

Dans le dépôt GitHub, ouvrir **Settings → Pages** et choisir **GitHub Actions** comme source de publication. Le workflow du dépôt construit l’artefact statique et le publie. Les mises à jour Firebase/Cloud Functions ne sont pas déployées par ce workflow.

## Pour chaque mise à jour

1. Modifier le HTML, le CSS, le JavaScript ou les fichiers dans `assets/`.
2. Vérifier le dépôt distant et la branche :

   ```sh
   git remote -v
   git status --short --branch
   ```

   Le dépôt attendu est `git@github.com:leo50978/mimicleanig.git` et la branche de production est `main`.

3. Commiter et pousser :

   ```sh
   git add index.html about.html services.html testimonials.html blog.html admin.html \
     *.css *.js assets README.md .github/workflows/pages.yml
   git commit -m "Update Clino website"
   git push origin main
   ```

   Ajouter tout autre fichier du site modifié. Ne jamais ajouter de clé privée, de mot de passe ou de fichier `.env`.

4. Ouvrir **Actions** dans GitHub et vérifier que le workflow **Deploy Clino site to GitHub Pages** a réussi. L’URL du site apparaît aussi dans **Settings → Pages**. Après le déploiement, actualiser le site.

## Dépannage rapide

- Si le workflow échoue, ouvrir son exécution dans **Actions** et lire le log de l’étape en erreur.
- Si Git refuse la connexion SSH, vérifier que la clé publique est enregistrée dans les paramètres SSH du compte GitHub, que la clé privée correspondante est chargée, et que `origin` utilise l’URL SSH ci-dessus.
- Vérifier les chemins relatifs des images, styles et scripts, ainsi que la présence de `index.html` à la racine.
