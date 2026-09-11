# Rapport QA — Séance 4 : sécurisation et tests du module Réservation

**Revue effectuée par :** Buffy (QA + Dev senior) — 11 septembre 2026
**Branche revue :** `feature/reservation-securite-landry-tagne`
**Méthode :** lecture complète du code sécurité, des 3 classes de test, du diff de la branche, exécution réelle de `sh mvnw test`, revue du routage et des composants Angular concernés.
**Décisions d'ambiguïté actées avec l'auteur avant rédaction :** paramètre `adherentId` ignoré (pas rejeté) pour un non-Admin sur le GET liste ; 403 explicite conservé sur RS-04 ; mapping défensif 401 conservé dans `GlobalExceptionHandler` ; démo de création ADHERENT via Swagger/curl (pas de bouton front ajouté).

**Compléments appliqués après revue (décisions de l'auteur) :** R5 corrigé (token valide d'un utilisateur disparu → 401 au lieu de 403, test `lister_avecTokenUtilisateurDisparu_renvoie401` ajouté) ; R6 corrigé au passage (logger SLF4J dans `JwtRequestFilter` à la place des `System.out.println`) ; R2 documenté comme dette connue dans le rapport (non corrigé, hors périmètre).

---

## Verdict global

**✅ Conforme — prêt pour la Pull Request et la démo devant le formateur**, sous réserve des points d'attention listés en fin de rapport (aucun bloquant).

Les 5 règles de sécurité du sujet sont réellement implémentées (pas seulement déclarées), la matrice d'autorisations est respectée à la lettre, les tests exigés existent, portent des noms descriptifs et **passent en vert** — vérifié par exécution réelle pendant cette revue, pas sur la foi du rapport.

```
Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
  BibliothequeApplicationTests .......... 1 test  (contexte Spring, profil test)
  ReservationSecurityIntegrationTest .... 10 tests (vrais filtres, vrai JWT, H2 en mémoire)
  ReservationServiceRg03Test ............ 2 tests (unitaire, repository mocké)
```

---

## Partie 1 — La sécurité

### Matrice d'autorisations : vérification endpoint par endpoint

| Endpoint | Anonyme | ADHERENT (rôle `User`) | BIBLIOTHECAIRE (rôle `Admin`) | Verdict |
|---|---|---|---|---|
| `POST /api/reservations` | 401 | 201 pour lui-même uniquement ; 403 si `adherentId` d'un autre | 201 pour n'importe qui (`adherentId` requis) | ✅ |
| `GET /api/reservations` | 401 | 200, ses réservations seulement, paramètre `adherentId` forcé au token | 200, toutes, filtres `statut`/`adherentId` | ✅ |
| `GET /api/reservations/{id}` | 401 | 200 si elle lui appartient, sinon 403 | 200 toujours | ✅ |
| `PATCH /api/reservations/{id}/annuler` | 401 | 200 si elle lui appartient, sinon 403 | 200 toujours | ✅ |
| `DELETE /api/reservations/{id}` | 401 | 403 (`@PreAuthorize("hasRole('Admin')")`) | 204 | ✅ |

Sources : `WebSecurityConfiguration` (chaîne de filtres), `ReservationController` (`@PreAuthorize` sur le DELETE), `ReservationService` (`verifierAppartenance`, filtre de liste), `SecurityService` (`adherentAutorise`), `GlobalExceptionHandler` (traduction des refus en 401/403/404/409 JSON).

### Règles RS-01 → RS-05 : où elles vivent dans le code

| Réf. | Règle du sujet | Implémentation (fichier, mécanisme) | Preuve par test | Verdict |
|---|---|---|---|---|
| **RS-01** | Sans token, tout endpoint de réservation renvoie 401 | `WebSecurityConfiguration` : `/api/reservations/**` passe de `permitAll()` à `authenticated()` ; 401 émis par `JwtAuthenticationEntryPoint.sendError(401)`. Filet de sécurité : `GlobalExceptionHandler` renvoie aussi 401 si un `AccessDeniedException` survient alors que l'appelant est anonyme (session STATELESS + `AnonymousAuthenticationFilter`, donc l'anonyme est toujours détecté). | `lister_sansToken_renvoie401` | ✅ |
| **RS-02** | Un ADHERENT tentant une action de bibliothécaire reçoit 403 | `@PreAuthorize("hasRole('Admin')")` sur le DELETE (même convention que `AdminController`) ; l'ADHERENT (`ROLE_User`) ne porte pas l'autorité requise → `AccessDeniedException` → 403 JSON. | `supprimer_avecTokenAdherent_renvoie403` | ✅ |
| **RS-03** | Un ADHERENT accédant à la réservation d'un autre reçoit 403 | `ReservationService.verifierAppartenance` : appelé par `consulter` ET `annuler`, lève `AccesRefuseException` → 403 JSON. Le bibliothécaire passe toujours. | `consulter_reservationDAutre_renvoie403`, `annuler_reservationDAutre_renvoie403` (+ vérification que le statut reste `EN_ATTENTE` en base) | ✅ |
| **RS-04** (poste le plus noté) | Identité du token, pas du corps | `SecurityService.adherentAutorise` : l'adhérent d'un `User` vient **toujours** du `SecurityContext` (alimenté par `JwtRequestFilter` depuis le JWT) ; un `adherentId` étranger dans le corps → 403 explicite ; le `adherentId` n'est consommé que par le bibliothécaire. | `creer_pourUnAutreAdherent_renvoie403` (+ invariant : aucun enregistrement créé), `creer_avecPropreAdherentId_creePourLeToken` | ✅ |
| **RS-05** | Un GET liste par un ADHERENT ne retourne que ses réservations | `ReservationService.lister` ignore le `adherentId` demandé pour un non-Admin et force le filtre sur `utilisateur.getUserId()` du token. | `lister_avecTokenAdherent_renvoie200etSesReservationsSeulement`, `lister_avecParametreAdherentDAutre_neRenvoieQueLesSiennes` | ✅ |

**Chaîne RS-04 vérifiée de bout en bout :** header `Authorization: Bearer` → `JwtRequestFilter` (extrait le username, valide la signature via `JwtUtil`, charge `UserDetails`, pose l'`Authentication`) → `SecurityService.utilisateurCourant()` lit le principal → l'identité ne peut pas être forgée par le corps de la requête. C'est exactement ce que le sujet demande.

### Distinction 401 / 403 (2 pts du barème)

| Situation | Code renvoyé | Émetteur | Correct ? |
|---|---|---|---|
| Aucun token | 401 | `JwtAuthenticationEntryPoint` | ✅ |
| Token expiré / signature invalide | 401 | Le filtre n'instaure pas d'authentification → entry point | ✅ (voir risque R4 sur le message) |
| Utilisateur inconnu dans un token encore signé | 401 (via `utilisateurCourant`) | `SecurityService` → `AuthentificationRequiseException` mappé 401 ; en amont, `JwtRequestFilter` intercepte `UsernameNotFoundException` et laisse la requête anonyme | ✅ (R5 corrigé pendant la revue) |
| ADHERENT → DELETE, ou POST pour un autre | 403 | `@PreAuthorize` / `AccesRefuseException` | ✅ |
| ADHERENT → réservation d'autre (GET/PATCH) | 403 | `verifierAppartenance` | ✅ |
| Bibliothécaire sans `adherentId` en POST | 400 | `ChampManquantException` | ✅ |

Le point critique du sujet — « renvoyer un 403 à un non-authentifié est une erreur » — est traité : le mapping défensif de `GlobalExceptionHandler` délègue explicitement l'anonyme vers 401.

### Choix d'architecture (validés comme pertinents)

- **Rôles `User`/`Admin` réutilisés** plutôt que créer `ADHERENT`/`BIBLIOTHECAIRE` : le sujet dit explicitement « Si votre projet possède déjà un système de rôles, appuyez-vous dessus ». La correspondance est documentée dans le Javadoc de `SecurityService` et dans le rapport. Ce choix évite de casser le routage Angular (`data:{roles:['Admin']}`), `roleMatch`, les comptes existants et l'écran des réservations. Bonne décision.
- **403 explicite sur RS-04** plutôt qu'override silencieux : conforme à la matrice (« OUI pour lui-même **uniquement** ») et rend l'attaque observable. Acté en revue.
- **H2 en mémoire (profil `test`)** : les tests tournent sans Docker ni base — exigence « s'exécutent par la commande de test du projet » pleinement satisfaite. `spring.flyway.enabled=false` en test évite le piège des migrations V1/V2 conçues pour PostgreSQL.

---

## Partie 2 — Les tests

### Test unitaire RG-03 (`ReservationServiceRg03Test`) — 5 pts

| Exigence du sujet | Constat | Verdict |
|---|---|---|
| Test unitaire sur la couche service | `@ExtendWith(MockitoExtension.class)`, `@InjectMocks ReservationService` | ✅ |
| Repository simulé (mock), pas de vraie base | `@Mock ReservationRepository` (+ Books/Users/SecurityService) ; aucun contexte Spring | ✅ |
| Cas 1 : 2 actives → 3e créée | `countByAdherentUserIdAndStatutIn → 2L` ; 201 logique, `save` capturé, adhérent vérifié | ✅ |
| Cas 2 : 3 actives → refus | `→ 3L` ; `RegleGestionException` contenant « RG-03 », `verify(never()).save` | ✅ |
| Passe sans aucune base | Confirmé : 0,17 s, aucune connexion | ✅ |

Soins supplémentaires relevés : `lenient()` pour les stubs partagés (pas de `UnnecessaryStubbingException`), `ArgumentCaptor` pour prouver l'identité de l'adhérent dans l'entité sauvegardée.

### Test d'intégration (`ReservationSecurityIntegrationTest`) — 5 pts

| Exigence du sujet | Constat | Verdict |
|---|---|---|
| Sur `GET /api/reservations` | Sans token → 401 ; avec token ADHERENT → 200 ; ✅ les 3 cas du sujet sont couverts | ✅ |
| + « réservation d'un autre » → 403 | Couvert via `consulter_reservationDAutre_renvoie403` (GET /{id}, autre endpoint de la même ressource) | ✅ |
| Exécution par la commande du projet | `sh mvnw test` — vérifié en réel pendant cette revue | ✅ |
| Noms de méthodes descriptifs | `lister_sansToken_renvoie401`, `supprimer_avecTokenAdherent_renvoie403`, `creer_pourUnAutreAdherent_renvoie403`, etc. + `@DisplayName` | ✅ |

Au-delà du minimum exigé, la classe couvre RS-02, RS-04 (double sens), RS-05 (y compris le paramètre frauduleux), l'annulation par un autre, et un scénario positif bibliothécaire complet (consulter → créer pour quelqu'un → supprimer). Les fixtures sont reconstruites par test (`@BeforeEach` + `TransactionTemplate`), avec un livre dédié aux créations — c'est ce qui a corrigé la série d'échecs décrite dans le rapport (409 RG-02, listes vides).

**Qualité des assertions :** pas d'assertion sans effet ; le test RS-04 vérifie l'invariant en base (rien créé pour l'autre adhérent), le test d'annulation vérifie que le statut n'a pas changé — c'est du QA sérieux.

---

## Complément revue : tests frontend (décision de l'auteur — ajoutés après la revue initiale)

Le sujet demande la preuve par les tests ; l'auteur a étendu cette preuve au client Angular, conformément à la demande du formateur :

- **Infrastructure réparée** : `ng test` était mort depuis le départ (`src/test.ts` en style Angular ≤ 15, « 0 of 0 ERROR » sous Angular 17) — aucun des 24 specs existants ne tournait. `test.ts` supprimé de `angular.json` et `tsconfig.spec.json`.
- **Nouveaux specs Réservation** (14 tests) : `reservation.service.spec.ts` — les 5 appels HTTP vérifiés URL/méthode/corps via `HttpClientTestingModule` ; `reservation-page.component.spec.ts` — comportement par rôle (User → ses réservations via son identifiant, pas de formulaire — miroir de RS-05 ; Admin → tout + formulaire), erreurs 403/serveur injoignable, annulation confirmée.
- **20 specs CLI réparés** (providers `HttpClient`/`ActivatedRoute`/`FormsModule`, tests `AppComponent` obsolètes, spec `AuthGuard` réécrit avec ses trois branches).
- **Vérifié en réel : `TOTAL: 53 SUCCESS`** (`npx ng test --watch=false --browsers=ChromeHeadless`), zéro échec.
- **Extension vers la parité backend ↔ frontend** (demande du formateur) : ajout de `auth.interceptor.spec.ts` (écho de RS-01/RS-02 : Bearer ajouté, 401 → /login, 403 → /forbidden), `reservation-form.component.spec.ts` (miroir de RG-03/RS-04 : messages 409 et 403 du backend affichés, corps du POST vérifié), `reservation-list.component.spec.ts` (miroir UX de RG-05/RG-06 : bouton Annuler réservé aux statuts actifs) et du test d'annulation refusée 403 dans la page. Suite finale vérifiée : **`TOTAL: 75 SUCCESS`**.

## Barème estimé

| Élément | Points max | Estimation | Justification |
|---|---|---|---|
| RS-01 authentification exigée partout | 4 | **4** | `/api/reservations/**` → `authenticated()` + entry point 401 + filet défensif |
| RS-02 autorisations par rôle | 5 | **5** | Matrice complète respectée, `@PreAuthorize` + refus métier |
| RS-03 + RS-05 (voit/modifie les siennes seulement) | 5 | **5** | `verifierAppartenance` sur GET/{id} et PATCH, filtre forcé sur la liste, tests à l'appui |
| RS-04 identité du token | 4 | **4** | `SecurityService.adherentAutorise`, 403 explicite, invariant testé en base |
| Distinction 401 / 403 | 2 | **2** | Correct partout, y compris le cas limite R5 (corrigé : 401 sur token d'utilisateur disparu, prouvé par test) |
| Test unitaire RG-03 avec mock | 5 | **5** | Les deux cas exigés, sans base |
| Test d'intégration sur endpoint sécurisé | 5 | **5** | Les 3 cas du sujet + bien plus, exécution vérifiée |
| **Total** | **30** | **30** | |

---

## Points d'attention (aucun bloquant)

Classés par impact réel sur la note/démo.

- **R1 — Démo front : un `User` ne peut pas créer de réservation depuis l'UI.** La page `/reservations` masque `app-reservation-form` aux non-Admins, et le formulaire exige de toute façon un `adherentId`. Le backend accepte parfaitement la création par le token (POST avec `livreId` seul). **Décision actée : démo via Swagger (`/swagger-ui.html`) ou curl pour ce geste.** Option de repli si le formateur insiste sur l'IHM : petit formulaire « réserver pour moi » (livreId uniquement) — ~30 lignes, non fait dans ce sprint.
- **R2 — Ombre portée du périmètre : `/admin/**` reste `permitAll`.** `POST /admin/users` (création de comptes) n'a plus de `@PreAuthorize` actif (mis en commentaire) et l'URL est ouverte. Hors périmètre de la séance 4 (elle n'a rien régressé — c'était l'état d'arrivée), mais c'est LE trou à signaler dans la PR et à corriger en séance 5 : une personne non authentifiée peut se créer un compte `Admin`… puis un jeton. Sur un endpoint où l'on n'est censé rien faire sans être bibliothécaire.
- **R3 — Régression latente confirmée : les livres (`/admin/books/**`) restent `permitAll`.** Préexistant à la branche, signalé pour mémoire ; l'écran `/books` Angular est resté réservé `Admin` côté guard, donc la faille n'est visible qu'à l'appel direct d'API.
- **R4 — `/borrow/**` reste `permitAll`.** Préexistant, non touché par la séance 4. À fermer avec R2/R3.
- **R5 — Cas limite 401/403 — CORRIGÉ pendant la revue :** un JWT **signé et non expiré** dont le username n'existe plus en base renvoyait 403 ; renvoie désormais **401** (`UsernameNotFoundException` intercepté dans `JwtRequestFilter`, `AuthentificationRequiseException` mappé 401 dans `GlobalExceptionHandler`), prouvé par `lister_avecTokenUtilisateurDisparu_renvoie401`.
- **R6 — Cosmétique — CORRIGÉ au passage :** `System.out.println` dans `JwtRequestFilter` remplacés par un logger SLF4J.
- **R7 — « Finir en avance » non traité** (expiration du token et message, test RG-01, journalisation des refus) : cohérent avec le rapport, non exigé par le barème. Le journal des refus (R7c) serait un plus rapide à ajouter et très visible en démo.

---

## Checklist livrable (sujet)

- [x] Branche `feature/reservation-securite-landry-tagne` — conforme au nommage demandé
- [x] Règles RS-01 → RS-05 implémentées et localisables (tableau du rapport)
- [x] Test unitaire RG-03, repository mocké, 2 cas, sans base
- [x] Test d'intégration sur `GET /api/reservations`, 3 cas du sujet, noms descriptifs
- [x] `sh mvnw test` vert (vérifié en réel : 13/13)
- [x] Comptes de démo documentés (2 ADHERENT + 1 BIBLIOTHECAIRE)
- [ ] **Pull Request ouverte avec description, capture des tests, phrase par règle** — reste à faire (le rapport le liste déjà)
- [ ] **Relecture par un pair** — reste à faire
- [x] Rapport honnête sur les choix écartés (Flyway V2, `@WebMvcTest`, override silencieux) — très bon point en relecture

## Script de démo prêt à l'emploi (Swagger ou curl)

```bash
TOKEN_USER=$(curl -s -X POST http://localhost:8080/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"adherent1","password":"..."}' | jq -r .jwtToken)
TOKEN_ADMIN=$(curl -s -X POST http://localhost:8080/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"biblio","password":"..."}' | jq -r .jwtToken)

# RS-01 — sans token → 401
curl -i http://localhost:8080/api/reservations

# RS-05 — adhérent ne voit que les siennes (même en trichant sur adherentId)
curl -s http://localhost:8080/api/reservations -H "Authorization: Bearer $TOKEN_USER"

# RS-04 — création au nom d'un autre → 403
curl -i -X POST http://localhost:8080/api/reservations \
  -H "Authorization: Bearer $TOKEN_USER" -H "Content-Type: application/json" \
  -d '{"livreId": 2, "adherentId": 99}'

# RS-03 — réservation d'un autre → 403
curl -i http://localhost:8080/api/reservations/3 -H "Authorization: Bearer $TOKEN_USER"

# RS-02 — suppression par un adhérent → 403 ; par le bibliothécaire → 204
curl -i -X DELETE http://localhost:8080/api/reservations/3 -H "Authorization: Bearer $TOKEN_USER"
curl -i -X DELETE http://localhost:8080/api/reservations/3 -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

## Réservations / limites de cette revue

1. La compatibilité PostgreSQL réelle du schéma n'est pas prouvée par la suite (H2 en test) — risque faible, aucun SQL natif écrit dans ce sprint, `ddl-auto=update` en prod le masque. C'est la seule limite que le rapport ne mentionne pas explicitement ; ajoute-la à la PR.
2. Les tests d'intégration valident les refus via les codes HTTP et l'état en base ; ils ne capturent pas les corps de réponse JSON en détail.
3. Cette revue est statique + suite de tests ; aucune exécution manuelle de l'IHM Angular n'a été faite (build front non lancé).

**Conclusion :** travail solide et honnête, défendable ligne par ligne devant le formateur. Ouvre la PR avec le tableau RS-01→RS-05 et la capture de tests, mentionne R2/R3/R5 comme connus, et la note maximale est jouable.
