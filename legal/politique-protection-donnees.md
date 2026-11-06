# Politique de protection des données personnelles

*Dernière mise à jour : 01/11/2026*

## Responsable du traitement

Le responsable du traitement est **John Teuira**, connu sous le pseudonyme **Melide**.

- Contact : [john.teuira@melide.music](mailto:john.teuira@melide.music)
- Site : [www.melide.music](https://www.melide.music)

Cette politique décrit les traitements liés au site public, aux comptes Cloudflare Access, à l'accès auteur et aux commandes de la boutique.

## Données traitées et finalités

### Navigation et fonctionnement du site

GitHub Pages et Cloudflare peuvent traiter des données techniques de connexion (par exemple l'adresse IP, les informations du navigateur et les requêtes) pour fournir le site, assurer sa sécurité et diagnostiquer les dysfonctionnements. Les journaux et leur durée de conservation dépendent des paramètres et politiques de ces prestataires.

Le navigateur peut conserver :

- le panier dans le stockage local (`localStorage`), avec les identifiants des variantes et les quantités, pour retrouver le panier ;
- des données temporaires de contenu dans le stockage de session (`sessionStorage`).

Le site n'intègre pas de mesure d'audience ou de publicité. Il charge Google Fonts et Font Awesome depuis leurs services externes ; le navigateur contacte ces fournisseurs pour récupérer les polices et icônes. Les liens vers des services externes, tels que YouTube, Instagram ou Google Drive, sont soumis aux pratiques de ces services lorsque vous les consultez.

### Connexion et accès auteur

La connexion utilise Cloudflare Access avec Google comme fournisseur d'identité. Cloudflare Access traite les données nécessaires à l'authentification et peut utiliser des cookies techniques pour maintenir la session.

Lorsqu'une personne connectée utilise les fonctionnalités du site, le Worker peut créer un compte dans la base D1 de Cloudflare et traiter :

- l'adresse e-mail et, si fourni par le fournisseur d'identité, le nom ;
- un identifiant interne, la date de création et les états d'activation/approbation du compte ;
- l'association du compte à un ou plusieurs profils d'auteur.

Ces données servent à authentifier l'utilisateur, appliquer les autorisations du compte, afficher les projets associés à un auteur et protéger les commandes. Pour associer un auteur, le Worker compare l'adresse de l'identité authentifiée par Cloudflare Access à l'adresse enregistrée dans le profil auteur. L'adresse e-mail saisie par le visiteur n'est pas utilisée pour établir cette association.

Les informations d'e-mail des profils auteurs sont accessibles dans l'interface d'administration authentifiée et ne sont pas incluses dans la réponse publique des auteurs.

### Curriculum vitae des auteurs

L'espace CV est réservé aux comptes connectés associés à un profil auteur. Il traite le nom légal, le ou les métiers, les expériences professionnelles, les compétences, les qualités personnelles, l'état de publication et les dates de mise à jour du CV. Une photo propre au CV peut aussi être envoyée ; elle ne remplace pas la photo du profil auteur et est recadrée au format carré puis convertie en WebP. Les fichiers d'origine de l'envoi ne sont pas conservés après conversion.

Les CV en brouillon ne sont retournés qu'à l'auteur authentifié et autorisé. Lorsque l'auteur publie son CV, les informations choisies et sa photo deviennent accessibles par le lien public du CV. L'auteur peut désactiver la publication depuis l'éditeur. Le responsable du traitement ne vérifie pas les informations du CV et ne garantit pas leur exactitude ou leur actualité. Des copies précédemment téléchargées ou conservées par des tiers peuvent subsister après dépublication.

Ces données sont conservées dans la base D1 et, pour les photos converties, le stockage d'images R2 de Cloudflare. Elles sont conservées tant que le CV est utilisé ou jusqu'à une demande de suppression, sous réserve d'une obligation légale. L'accès à l'éditeur nécessite l'acceptation des conditions spécifiques du CV ; la version et la date de cet accord sont enregistrées. Pour accéder à vos données, les rectifier ou demander leur suppression, contactez [john.teuira@melide.music](mailto:john.teuira@melide.music).

### Panier et commandes

Le panier est conservé dans le navigateur sous la forme d'identifiants de variantes et de quantités. Lors de la validation, le Worker vérifie les articles et leurs prix à partir de la base de données ; les prix ou informations de paiement fournis par le navigateur ne font pas autorité.

Pour créer et suivre une commande, le site traite notamment l'identifiant du compte, l'adresse e-mail, les articles, les quantités, le montant, la devise, le statut et les dates de commande. Pour une commande payante, le formulaire demande les informations nécessaires à la livraison : nom, adresse, ville, code postal, pays et, facultativement, complément d'adresse, région et téléphone. Ces informations sont enregistrées dans la base de commandes.

Les paiements payants sont effectués sur la page de paiement hébergée par **Stripe**. Le site transmet à Stripe les données nécessaires à la session de paiement, dont l'adresse e-mail, les articles, le montant et la référence de commande. Les données de carte sont saisies auprès de Stripe et ne sont pas enregistrées dans la base du site. Stripe traite ces données selon sa [politique de confidentialité](https://stripe.com/privacy).

**Resend** envoie les confirmations de certaines commandes gratuites. Les données nécessaires à l'envoi peuvent inclure l'adresse e-mail, les articles, le montant, la référence ou le lien de commande et, si une adresse est présente, les informations de livraison. Les commandes payantes n'ont pas actuellement de flux de confirmation par e-mail connecté dans le Worker.

La boutique ne transmet pas actuellement les commandes à Printful ou à un autre prestataire de fulfillment. La livraison et l'exécution des commandes payantes ne sont donc pas automatisées par cette intégration.

## Cookies et stockage dans le navigateur

Le site n'utilise pas de cookies publicitaires ni de cookies de mesure d'audience. Cloudflare Access peut toutefois utiliser des cookies techniques nécessaires à la connexion et au maintien de la session sur l'API. Le panier et le cache de contenu utilisent les stockages locaux du navigateur décrits ci-dessus ; ils ne sont pas des cookies.

## Bases et durées de conservation

Lorsque le RGPD s'applique, les traitements sont fondés selon le cas sur l'exécution des fonctionnalités demandées (connexion, accès auteur et commande), les obligations légales applicables aux commandes, ou l'intérêt légitime à sécuriser et maintenir le site.

Les données de compte et d'association sont conservées tant que le compte et les fonctionnalités associées sont nécessaires. Les informations de commande peuvent être conservées pour le suivi des achats, la gestion des demandes et le respect des obligations légales applicables. Les données techniques de connexion suivent les durées définies par les fournisseurs d'hébergement et d'infrastructure. Le site ne dispose pas actuellement d'une durée automatique unique de purge applicable à tous ces éléments.

Vous pouvez demander l'accès, la rectification ou la suppression des données vous concernant en écrivant à [john.teuira@melide.music](mailto:john.teuira@melide.music). Une suppression peut être limitée lorsque certaines informations doivent être conservées pour satisfaire une obligation légale ou traiter une commande.

## Prestataires et transferts

Les données peuvent être traitées par les prestataires nécessaires aux fonctionnalités décrites : GitHub (hébergement statique), Cloudflare (DNS, sécurité, authentification, Worker et base D1), Google (fournisseur d'identité et polices), Stripe (paiement), Resend (e-mails de confirmation), ainsi que Zoho pour les échanges par e-mail. Ces prestataires peuvent traiter certaines données depuis des pays autres que la Polynésie française. Leurs politiques et mécanismes applicables sont consultables sur leurs sites respectifs.

- [Confidentialité de Cloudflare](https://www.cloudflare.com/privacypolicy/)
- [Déclaration de confidentialité de GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [Confidentialité de Google](https://policies.google.com/privacy)
- [Confidentialité de Stripe](https://stripe.com/privacy)
- [Confidentialité de Zoho](https://www.zoho.com/privacy.html)

## Utilisation de l'intelligence artificielle (IA)

GitHub Copilot est utilisé par l'éditeur comme assistant de développement dans son flux de travail de programmation. L'éditeur décrit une tâche, Copilot peut examiner le contexte du dépôt et proposer ou modifier du code, expliquer des erreurs et suggérer des vérifications. L'éditeur examine les propositions, vérifie les changements et décide ce qui est intégré et publié ; les résultats de Copilot ne sont pas publiés automatiquement.

L'utilisation de Copilot intervient dans la maintenance et la création du site, et non dans une fonctionnalité d'IA proposée aux visiteurs. Le site n'envoie pas les données des comptes ou des commandes à Copilot dans son fonctionnement normal. Les prompts, le contexte du dépôt et les extraits de code fournis à Copilot peuvent être traités par GitHub et ses fournisseurs selon le produit, le compte, ses paramètres et les conditions applicables. L'éditeur évite d'inclure des données personnelles de visiteurs dans ces prompts. Pour en savoir plus, consultez la [présentation de GitHub Copilot](https://docs.github.com/en/copilot/get-started/about-github-copilot) et la [déclaration de confidentialité de GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## Vos droits

Lorsque le RGPD ou les règles locales applicables vous accordent des droits sur vos données, vous pouvez demander l'accès, la rectification, l'effacement, la limitation du traitement, vous opposer à certains traitements ou demander la portabilité lorsque celle-ci s'applique. Pour exercer vos droits, contactez [john.teuira@melide.music](mailto:john.teuira@melide.music). Une vérification raisonnable de votre identité peut être nécessaire pour protéger vos données.

Vous pouvez également saisir l'autorité de contrôle compétente, notamment la CNIL lorsque celle-ci est compétente ([www.cnil.fr](https://www.cnil.fr)).

## Sécurité

Des mesures raisonnables sont mises en œuvre pour protéger les données, notamment l'authentification des routes utilisateur et des contrôles côté serveur sur les opérations liées aux comptes et aux commandes. Aucun système ne peut toutefois garantir une sécurité absolue.

## Modifications et contact

Cette politique peut évoluer avec les fonctionnalités du site ou les règles applicables. La date de mise à jour figure en haut du document.

Pour toute question relative à cette politique ou à vos données personnelles : [john.teuira@melide.music](mailto:john.teuira@melide.music).
