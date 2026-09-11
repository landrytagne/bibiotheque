# Rapport de sprint — Séance 4 : sécuriser et tester le module Réservation

**Branche :** `feature/reservation-securite-landry-tagne` (coupée de `feature/reservation-landry-tagne`, qui porte le module réservation fonctionnel)
**Auteur :** Landry Tagne

---

**Ma partie ce sprint :** la sécurisation du module Réservation (règles RS-01 à RS-05) et sa preuve par les tests (test unitaire RG-03 avec repository simulé, test d'intégration sur `GET /api/reservations`).

**Décision :** je fais venir l'identité du token JWT (`SecurityService` lisant le `SecurityContext` alimenté par `JwtRequestFilter`) au lieu du `adherentId` envoyé par le client, je sécurise au deux niveaux existants du projet (URL dans `WebSecurityConfiguration`, méthode avec `@PreAuthorize("hasRole('Admin')")` sur le DELETE, comme dans `AdminController`), et j'exécute les tests sur un H2 en mémoire (profil `test`) plutôt que sur la vraie base PostgreSQL.

**Pourquoi :** un adhérent malveillant peut écrire n'importe quel `adherentId` dans le corps de la requête — c'est le point que le sujet marque comme le plus important (RS-04). En déduisant l'identité du token, il ne peut réserver qu'à son nom ; le bibliothécaire, lui, choisit librement l'adhérent. Réutiliser les deux niveaux de sécurité déjà en place évite une nouvelle abstraction ; le H2 en mémoire permet de lancer `mvn test` partout, sans Docker ni base, donc de faire la démo devant le formateur sans préparation d'environnement.

**Ce que j'ai écarté :** créer les rôles `ADHERENT`/`BIBLIOTHECAIRE` en base avec une migration Flyway V2. Littéralement conforme au sujet, mais ça cassait le routage Angular (`data: {roles: ['Admin']}`), le `roleMatch(['Admin'])` du front, tous les comptes existants et l'écran de réservations — pour un bénéfice purement cosmétique. J'ai écarté aussi le `@WebMvcTest` (le service mocké aurait fait des 403 « prouvés » contre un mock, donc rien) et les override silencieux du `adherentId` étranger (la matrice du sujet exige un refus : un bibliothécaire qui s'autocorre en silence masquerait l'attaque). J'ai laissé `POST /admin/users` ouvert (permitAll, `@PreAuthorize` en commentaire) : hors périmètre de la séance, et le fermer maintenant empêcherait de créer les comptes de démo sur une base vierge — dette connue à traiter en séance 5.

**Le coût que j'accepte :** le code parle d'« Admin » et de « User » là où le sujet dit « BIBLIOTHECAIRE » et « ADHERENT » — la correspondance est documentée dans `SecurityService` mais reste une convention à connaître. Les tests d'intégration tournent sur H2 et non sur PostgreSQL ; la compatibilité du SQL réel n'est donc pas prouvée par la suite (aucun SQL spécifique écrit ici, risque faible). Ajouter deux dépendances de test (`h2`, `httpclient`) au `pom.xml`, validé avant implémentation.

**IA :** je lui ai demandé de sécuriser le module ; elle a d'abord fait ignorer silencieusement le `adherentId` étranger en POST. En relisant la matrice d'autorisations (« OUI pour lui-même uniquement ») et la remarque du sujet sur RS-04, j'ai corrigé vers un refus 403 explicite — un override silencieux rendait l'attaque invisible. Ensuite, ses premiers tests d'intégration échouaient en série (409 RG-02, listes vides, erreur `ResourceAccess` sur le PATCH) : elle semait un seul livre/réservation partagé par tous les cas et supposait un client HTTP sans PATCH. En lisant les erreurs (`Expecting 409 to be 201`, `Expected size 1 but was 2`), j'ai vu que ses assertions comptaient toutes les lignes d'une table partagée ; j'ai corrigé avec un livre dédié aux créations et une réservation par adhérent, plus un `httpclient` de test pour le PATCH. Elle avait aussi écrit `assertThat(repository).count()`, une assertion sans effet — supprimée.

---

## Où chaque règle est implémentée

| Réf. | Règle | Implémentation | Preuve par test |
|---|---|---|---|
| RS-01 | 401 sans token sur tout endpoint de réservation | `WebSecurityConfiguration` : `/api/reservations/**` passe de `permitAll()` à `authenticated()` ; 401 émis par `JwtAuthenticationEntryPoint` existant. Bonus : les refus `@PreAuthorize` d'un anonyme sont traduits en 401 dans `GlobalExceptionHandler`. Durcissement 401/403 : un token signé d'un utilisateur disparu de la base ne peut plus donner de 403 — le filtre n'instaure aucune identité (`UsernameNotFoundException` intercepté) et `SecurityService` lève `AuthentificationRequiseException` (401), car « je ne sais pas qui vous êtes ». | `lister_sansToken_renvoie401`, `lister_avecTokenUtilisateurDisparu_renvoie401` |
| RS-02 | 403 pour un ADHERENT sur une action de bibliothécaire | `@PreAuthorize("hasRole('Admin')")` sur `DELETE /api/reservations/{id}` ; 403 JSON via `GlobalExceptionHandler`. | `supprimer_avecTokenAdherent_renvoie403` |
| RS-03 | 403 sur la réservation d'un autre | `ReservationService.verifierAppartenance` appelé par `consulter` et `annuler` ; lève `AccesRefuseException` → 403 JSON. | `consulter_reservationDAutre_renvoie403`, `annuler_reservationDAutre_renvoie403` |
| RS-04 | Identité du token, pas du corps | `SecurityService.adherentAutorise` : l'ADHERENT est pris du token (403 si le corps désigne un autre) ; le `adherentId` n'est utilisé que par le BIBLIOTHECAIRE. | `creer_pourUnAutreAdherent_renvoie403`, `creer_avecPropreAdherentId_creePourLeToken` |
| RS-05 | Un adhérent ne voit que ses réservations | `ReservationService.lister` force le filtre à l'identifiant du token pour un ADHERENT, quel que soit le `adherentId` demandé. | `lister_avecTokenAdherent_renvoie200etSesReservationsSeulement`, `lister_avecParametreAdherentDAutre_neRenvoieQueLesSiennes` |
| RG-03 | Maximum 3 réservations actives (test unitaire) | Règle déjà dans `ReservationService.creer` (comptage `countByAdherentUserIdAndStatutIn`) ; testée avec `ReservationRepository` mocké. | `ReservationServiceRg03Test` (2 cas requis) |

## Exécution des tests

```
cd bibliotheque-backend
sh mvnw test        # ou ./mvnw test si le wrapper est exécutable
```

Résultat : `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS`
(1 contexte Spring + 10 tests d'intégration `ReservationSecurityIntegrationTest` + 2 tests unitaires `ReservationServiceRg03Test`), sans aucune base externe ni Docker.

## Tests frontend (Angular 17 / Karma)

Le module Réservation n'avait **aucun test** côté client, et la suite Angular était morte depuis le départ : `src/test.ts` utilisait `require.context()` (style Angular ≤ 15), supprimé par le builder de test d'Angular 17 — `ng test` exécutait « 0 of 0 ERROR », aucun des 24 specs existants ne tournait.

**Réparation de l'infrastructure :** suppression de `src/test.ts` et de sa référence dans `angular.json` / `tsconfig.spec.json` (les specs sont découverts automatiquement).

**Nouveaux specs Réservation :**

- `reservation.service.spec.ts` (6 tests) : unitaire avec `HttpClientTestingModule` — URL, méthode et corps des 5 appels (liste, filtre statut, filtre adhérent, création POST, annulation PATCH).
- `reservation-page.component.spec.ts` (8 tests) : intégration avec services espionnés — un User appelle `getReservationsByAdherent(userId)` et ne voit pas le formulaire (miroir de RS-05) ; un Admin appelle `getReservations()` et voit le formulaire ; filtre par statut ; erreurs 403 (message du backend) et serveur injoignable affichées ; annulation avec confirmation, et absence d'appel si refusée.

**Réparation de la suite existante :** les 20 specs en échec (générés par la CLI, jamais entretenus) sont corrigés — `HttpClientTestingModule` sur les services, espions et `ActivatedRoute` factice sur les composants, `FormsModule` là où les templates utilisent `ngModel`, tests `AppComponent` obsolètes remplacés, spec `AuthGuard` réécrit (sans token → /login, rôle insuffisant → /forbidden, rôle requis → passage).

```
npx ng test --watch=false --browsers=ChromeHeadless
Résultat : TOTAL: 53 SUCCESS — 0 échec
```

## Comptes pour la démo (à créer en base avant le passage)

Créer deux ADHERENT distincts et un BIBLIOTHECAIRE, chacun avec au moins une réservation à son nom :

- `adherent1` / `adherent2` — rôle `User` (ADHERENT)
- `biblio` — rôle `Admin` (BIBLIOTHECAIRE)

Mots de passe hachés en BCrypt (les comptes peuvent être créés par un Admin via `POST /admin/users`).

## Ce qui reste à faire

- Pousser la branche et ouvrir la Pull Request avec la capture des tests et ce tableau RS-01 → RS-05 dans la description, puis la faire relire par un pair.
- Si fin en avance (non fait) : message personnalisé sur l'expiration du token (le 401 est déjà garanti), test sur RG-01, journalisation des accès refusés.
- Séance 5 : fermer `POST /admin/users` et `/admin/**` (dette documentée ci-dessus).
