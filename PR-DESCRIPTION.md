# Description de Pull Request — à coller dans GitHub

> **Titre de la PR :** `Séance 4 — Sécurisation et tests du module Réservation — Landry Tagne`
> **Branche :** `feature/reservation-securite-landry-tagne` → **`main`**
> *(Remplace la ligne `CAPTURE` ci-dessous par une vraie capture : copie la fin de la sortie `sh mvnw test` puis colle-la directement dans le champ de description GitHub — l'image s'intègre automatiquement.)*

---

## Ce que ça fait

Ce sprint ferme le module Réservation, jusque-là ouvert à tous, et le prouve par des tests.

- L'identité d'un adhérent vient **du token JWT** (via `JwtRequestFilter` → `SecurityContext` → `SecurityService`), jamais du corps de la requête : un adhérent ne peut réserver qu'à son nom (RS-04, poste le plus important du sujet).
- La matrice d'autorisations du sujet est appliquée sur les 5 endpoints de `/api/reservations` : anonyme → 401, ADHERENT → ses réservations seulement, BIBLIOTHECAIRE (rôle `Admin` existant) → tout.
- La distinction 401/403 du sujet est respectée jusqu'au cas limite : un token signé d'un utilisateur disparu de la base renvoie 401 (« je ne sais pas qui vous êtes »), pas 403.
- Les tests tournent sur H2 en mémoire (profil `test`) : `sh mvnw test` passe partout, sans Docker ni base externe.

Correspondance des rôles, documentée dans `SecurityService` : `ADHERENT` = rôle applicatif `User`, `BIBLIOTHECAIRE` = rôle applicatif `Admin` (le sujet demande de s'appuyer sur le système de rôles existant — création de rôles dédiés écartée, voir plus bas).

## Où chaque règle est implémentée

| Réf. | Où et comment |
|---|---|
| **RS-01** | `WebSecurityConfiguration` : `/api/reservations/**` passe de `permitAll()` à `authenticated()` ; 401 émis par `JwtAuthenticationEntryPoint`. Filet : `GlobalExceptionHandler` traduit aussi un refus `@PreAuthorize` d'anonyme en 401. Durcissement : `JwtRequestFilter` n'instaure aucune identité si l'utilisateur du token n'existe plus (`UsernameNotFoundException` intercepté), et `SecurityService` lève `AuthentificationRequiseException` (401). |
| **RS-02** | `@PreAuthorize("hasRole('Admin')")` sur `DELETE /api/reservations/{id}` (même convention que `AdminController`) ; un ADHERENT reçoit 403 JSON via `GlobalExceptionHandler`. |
| **RS-03** | `ReservationService.verifierAppartenance`, appelé par `consulter` et `annuler` : un ADHERENT qui accède à la réservation d'un autre reçoit 403 (`AccesRefuseException`) ; le BIBLIOTHECAIRE passe toujours. |
| **RS-04** | `SecurityService.adherentAutorise` : l'ADHERENT est pris du token — un `adherentId` étranger dans le corps donne un 403 explicite (pas d'override silencieux, pour rendre l'attaque observable) ; le `adherentId` du corps n'est consommé que par le BIBLIOTHECAIRE. |
| **RS-05** | `ReservationService.lister` force le filtre à l'identifiant du token pour un ADHERENT, quel que soit le `adherentId` demandé en paramètre. |

## Les tests

```
CAPTURE
```

`sh mvnw test` → **13 tests, 0 échec** (1 contexte Spring + 10 tests d'intégration `ReservationSecurityIntegrationTest` + 2 tests unitaires `ReservationServiceRg03Test`), sans base externe ni Docker.

- **Unitaire RG-03** (`ReservationServiceRg03Test`) : repository mocké (Mockito), les deux cas exigés — 2 réservations actives → la 3e passe ; 3 actives → refus (`RegleGestionException`, aucun `save`). Sans aucune base.
- **Intégration** (`ReservationSecurityIntegrationTest`) : vrais filtres Spring Security et vrai JWT sur un serveur aléatoire, H2 en mémoire. Couvre les 3 cas exigés du sujet (sans token → 401 ; token ADHERENT → 200 ; réservation d'un autre → 403) plus RS-02, RS-04 dans les deux sens, RS-05 avec paramètre frauduleux, l'annulation par un autre (statut inchangé en base), le token d'un utilisateur disparu → 401, et le scénario bibliothécaire complet.

### Tests frontend (bonus de la même branche)

```
npx ng test --watch=false --browsers=ChromeHeadless
TOTAL: 53 SUCCESS
```

- **Nouveaux specs Réservation** : `reservation.service.spec.ts` (les 5 appels HTTP vérifiés URL/méthode/corps via `HttpClientTestingModule`) et `reservation-page.component.spec.ts` (comportement par rôle : un User charge ses réservations par son identifiant et ne voit pas le formulaire — miroir de RS-05 ; un Admin voit tout et crée ; erreurs 403 et serveur injoignable affichées ; annulation confirmée).
- **Infrastructure réparée** : `src/test.ts` utilisait `require.context()`, supprimé par le builder Angular 17 — aucun spec ne tournait (« 0 of 0 ERROR »). Supprimé de `angular.json` / `tsconfig.spec.json`.
- **20 specs préexistants réparés** (générés par la CLI, jamais entretenus) : providers `HttpClient`/`ActivatedRoute`/`FormsModule` manquants, tests `AppComponent` obsolètes, spec `AuthGuard` réécrit avec ses trois branches.
- **Parité backend ↔ frontend** (au-delà du sujet, à la demande du formateur) : chaque règle a son miroir client — RG-03 via l'affichage du 409 dans le formulaire, RS-01 via le guard (sans token → /login) et l'intercepteur (réponse 401 → /login), RS-02 via l'intercepteur (403 → /forbidden), RS-03 via les messages d'erreur de la page et l'alerte d'annulation refusée, RS-04 via le corps envoyé et l'affichage du 403 par le formulaire, RS-05 via le chargement par l'identifiant et le formulaire masqué. Nouveaux specs : `auth.interceptor.spec.ts`, `reservation-form.component.spec.ts`, `reservation-list.component.spec.ts`.

## Comment tester

```bash
cd bibliotheque-backend
sh mvnw test

cd ../bibliotheque-frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

Comptes de démo (à créer en base avant le passage — par un Admin via `POST /admin/users`) :

- `adherent1` / `adherent2` — rôle `User` (ADHERENT), chacun avec au moins une réservation à son nom
- `biblio` — rôle `Admin` (BIBLIOTHECAIRE)

## Choix et ce que j'ai écarté

- **Rôles `User`/`Admin` réutilisés** plutôt que créer `ADHERENT`/`BIBLIOTHECAIRE` en base (Flyway V2) : le sujet demande de s'appuyer sur le système existant ; des rôles dédiés auraient cassé le routage Angular (`data:{roles:['Admin']}`), `roleMatch`, les comptes et l'écran des réservations, pour un bénéfice cosmétique.
- **403 explicite sur RS-04** plutôt qu'un override silencieux du `adherentId` étranger : la matrice dit « OUI pour lui-même **uniquement** », et un override masquerait l'attaque.
- **H2 en mémoire** (profil `test`, Flyway désactivé) plutôt que la vraie PostgreSQL : la commande de test doit passer partout, sans préparation d'environnement. Limite assumée : la compatibilité du SQL réel sur PostgreSQL n'est pas prouvée par cette suite (aucun SQL natif écrit dans ce sprint, risque faible).
- **`@WebMvcTest` écarté** : le service mocké aurait produit des 403 « prouvés » contre un mock ; les tests d'intégration avec vrais filtres prouvent réellement les refus.

## Dettes connues et ce qui reste à faire

- `POST /admin/users` reste ouvert (`permitAll`, `@PreAuthorize` en commentaire) : **hors périmètre de cette séance** (le sujet ne couvre que les réservations) et le fermer maintenant empêcherait de créer les comptes de démo sur une base vierge — à corriger en séance 5 avec `/admin/books/**` et `/borrow/**` (état antérieur à cette branche, non régressé).
- Non fait (bonus « finir en avance ») : message personnalisé sur l'expiration du token (le 401 est déjà garanti), test RG-01, journalisation des accès refusés.
- Petit écart d'IHM assumé : un ADHERENT ne peut pas créer de réservation depuis l'écran Angular (formulaire réservé au bibliothécaire) — la création par le token fonctionne, démontrable via Swagger ou curl.
