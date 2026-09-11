package com.ibizabroker.bibliotheque;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.RoleRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.Role;
import com.ibizabroker.bibliotheque.entity.StatutReservation;
import com.ibizabroker.bibliotheque.entity.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests d'intégration de la sécurité sur les endpoints de réservation.
 * Vrais filtres Spring Security et vrai JWT sur un serveur démarré au hasard ;
 * la base est un H2 en mémoire (profil "test") : aucun MySQL/PostgreSQL requis.
 *
 * RS-01 : sans token, tout endpoint de réservation renvoie 401.
 * RS-02 : un ADHERENT qui tente une action réservée au bibliothécaire reçoit 403.
 * RS-03 : un ADHERENT qui accède à la réservation d'un autre reçoit 403.
 * RS-04 : un ADHERENT ne peut pas créer une réservation au nom d'un autre.
 * RS-05 : un GET /api/reservations par un ADHERENT ne retourne que ses réservations.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ReservationSecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BooksRepository booksRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private static final String MOT_DE_PASSE = "mdp123";

    private Integer adherent1Id;
    private Integer adherent2Id;
    private Integer reservationAdherent1Id;
    private Integer reservationAdherent2Id;
    private Integer livreId;
    private Integer livreCreationId;

    @BeforeEach
    void preparerDonnees() {
        reservationRepository.deleteAll();
        booksRepository.deleteAll();
        usersRepository.deleteAll();

        transactionTemplate.executeWithoutResult(status -> {
            Role roleUser = roleRepository.findFirstByRoleNameOrderByRoleIdAsc("User").orElseGet(() -> {
                Role r = new Role();
                r.setRoleName("User");
                return roleRepository.save(r);
            });
            Role roleAdmin = roleRepository.findFirstByRoleNameOrderByRoleIdAsc("Admin").orElseGet(() -> {
                Role r = new Role();
                r.setRoleName("Admin");
                return roleRepository.save(r);
            });

            Users adherent1 = creerUtilisateur("adherent.un", "Adhérent Un", roleUser);
            Users adherent2 = creerUtilisateur("adherent.deux", "Adhérent Deux", roleUser);
            creerUtilisateur("admin.biblio", "Bibliothécaire", roleAdmin);
            adherent1Id = adherent1.getUserId();
            adherent2Id = adherent2.getUserId();

            Books livre = new Books();
            livre.setBookName("Livre reserve");
            livre.setBookAuthor("Auteur");
            livre.setBookGenre("Roman");
            livre.setNoOfCopies(0);
            livre = booksRepository.save(livre);
            livreId = livre.getBookId();

            reservationAdherent1Id = enregistrerReservation(livre, adherent1);
            reservationAdherent2Id = enregistrerReservation(livre, adherent2);

            Books livreCreation = new Books();
            livreCreation.setBookName("Livre pour creation");
            livreCreation.setBookAuthor("Auteur");
            livreCreation.setBookGenre("Roman");
            livreCreation.setNoOfCopies(0);
            livreCreationId = booksRepository.save(livreCreation).getBookId();
        });
    }

    private Integer enregistrerReservation(Books livre, Users adherent) {
        Reservation reservation = new Reservation();
        reservation.setLivre(livre);
        reservation.setAdherent(adherent);
        reservation.setDateReservation(new Date());
        reservation.setDateExpiration(new Date(System.currentTimeMillis() + 86_400_000L));
        reservation.setStatut(StatutReservation.EN_ATTENTE);
        return reservationRepository.save(reservation).getReservationId();
    }

    private Users creerUtilisateur(String username, String nom, Role role) {
        Users user = new Users();
        user.setUsername(username);
        user.setName(nom);
        user.setPassword(passwordEncoder.encode(MOT_DE_PASSE));
        user.setRole(new HashSet<>(Collections.singletonList(role)));
        return usersRepository.save(user);
    }

    private String tokenDe(String username) {
        Map<String, String> identifiants = new HashMap<>();
        identifiants.put("username", username);
        identifiants.put("password", MOT_DE_PASSE);
        ResponseEntity<Map> reponse = restTemplate.postForEntity(url("/authenticate"),
                identifiants, Map.class);
        assertThat(reponse.getStatusCode().value()).isEqualTo(200);
        return (String) reponse.getBody().get("jwtToken");
    }

    private String url(String chemin) {
        return "http://localhost:" + port + chemin;
    }

    private HttpHeaders entetesAvecToken(String token) {
        HttpHeaders entetes = new HttpHeaders();
        entetes.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            entetes.set(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        return entetes;
    }

    private String corpsCreation(Integer livreId, Integer adherentId) {
        String champAdherent = adherentId == null ? "" : (", \"adherentId\": " + adherentId);
        return "{\"livreId\": " + livreId + champAdherent + "}";
    }

    @Test
    @DisplayName("RS-01 : sans token, GET /api/reservations renvoie 401")
    void lister_sansToken_renvoie401() {
        ResponseEntity<String> reponse = restTemplate.exchange(url("/api/reservations"),
                HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), String.class);
        assertThat(reponse.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    @DisplayName("401/403 : un token encore valide d'un utilisateur disparu de la base renvoie 401, pas 500 ni 403")
    void lister_avecTokenUtilisateurDisparu_renvoie401() {
        String token = tokenDe("adherent.un");

        // l'utilisateur du token disparaît (son username n'existe plus au moment de l'appel)
        transactionTemplate.executeWithoutResult(status -> {
            Users adherent = usersRepository.findById(adherent1Id).orElseThrow();
            adherent.setUsername("adherent.disparu");
            usersRepository.save(adherent);
        });

        ResponseEntity<String> reponse = restTemplate.exchange(url("/api/reservations"),
                HttpMethod.GET, new HttpEntity<>(entetesAvecToken(token)), String.class);

        // « Je ne sais pas qui vous êtes » → 401, conformément à la distinction du sujet
        assertThat(reponse.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    @DisplayName("RS-05 : GET /api/reservations avec un token ADHERENT renvoie 200 et ses réservations seulement")
    void lister_avecTokenAdherent_renvoie200etSesReservationsSeulement() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(url("/api/reservations"),
                HttpMethod.GET, new HttpEntity<>(entetesAvecToken(token)), String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(200);
        assertThat(reponse.getBody()).contains("\"id\":" + reservationAdherent1Id);
        assertThat(reponse.getBody()).contains("\"adherentId\":" + adherent1Id);
        assertThat(reponse.getBody()).doesNotContain("\"id\":" + reservationAdherent2Id);
        assertThat(reponse.getBody()).doesNotContain("\"adherentId\":" + adherent2Id);
    }

    @Test
    @DisplayName("RS-05 : le paramètre adherentId d'un adhérent est ignoré, la liste reste la sienne")
    void lister_avecParametreAdherentDAutre_neRenvoieQueLesSiennes() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(
                url("/api/reservations?adherentId=" + adherent2Id),
                HttpMethod.GET, new HttpEntity<>(entetesAvecToken(token)), String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(200);
        assertThat(reponse.getBody()).doesNotContain("\"adherentId\":" + adherent2Id);
    }

    @Test
    @DisplayName("RS-03 : un ADHERENT qui accède à la réservation d'un autre reçoit 403")
    void consulter_reservationDAutre_renvoie403() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(
                url("/api/reservations/" + reservationAdherent2Id),
                HttpMethod.GET, new HttpEntity<>(entetesAvecToken(token)), String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(403);
    }

    @Test
    @DisplayName("RS-03 : un ADHERENT qui annule la réservation d'un autre reçoit 403")
    void annuler_reservationDAutre_renvoie403() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(
                url("/api/reservations/" + reservationAdherent2Id + "/annuler"),
                HttpMethod.PATCH, new HttpEntity<>(entetesAvecToken(token)), String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(403);
        assertThat(reservationRepository.findById(reservationAdherent2Id))
                .hasValueSatisfying(r -> assertThat(r.getStatut()).isEqualTo(StatutReservation.EN_ATTENTE));
    }

    @Test
    @DisplayName("RS-04 : un ADHERENT ne peut pas créer une réservation au nom d'un autre (403)")
    void creer_pourUnAutreAdherent_renvoie403() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(url("/api/reservations"),
                HttpMethod.POST,
                new HttpEntity<>(corpsCreation(livreCreationId, adherent2Id), entetesAvecToken(token)),
                String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(403);
        // aucune réservation créée pour adherent2 en plus de celle déjà présente en seed
        assertThat(reservationRepository.findByAdherentUserId(adherent2Id))
                .hasSize(1)
                .first()
                .satisfies(r -> assertThat(r.getReservationId()).isEqualTo(reservationAdherent2Id));
    }

    @Test
    @DisplayName("RS-04 : l'adherentId envoyé par un ADHERENT pour lui-même est ignoré — la réservation porte le token")
    void creer_avecPropreAdherentId_creePourLeToken() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(url("/api/reservations"),
                HttpMethod.POST,
                new HttpEntity<>(corpsCreation(livreCreationId, adherent1Id), entetesAvecToken(token)),
                String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(201);
        // la réservation créée porte l'identité du token (adherent1), pas celle du corps
        assertThat(reservationRepository.findByAdherentUserId(adherent1Id))
                .hasSize(2)
                .satisfies(list -> assertThat(list).anySatisfy(r -> {
                    assertThat(r.getReservationId()).isNotEqualTo(reservationAdherent1Id);
                    assertThat(r.getStatut()).isEqualTo(StatutReservation.EN_ATTENTE);
                }));
    }

    @Test
    @DisplayName("RS-02 : un ADHERENT qui supprime une réservation reçoit 403")
    void supprimer_avecTokenAdherent_renvoie403() {
        String token = tokenDe("adherent.un");

        ResponseEntity<String> reponse = restTemplate.exchange(
                url("/api/reservations/" + reservationAdherent2Id),
                HttpMethod.DELETE, new HttpEntity<>(entetesAvecToken(token)), String.class);

        assertThat(reponse.getStatusCode().value()).isEqualTo(403);
        assertThat(reservationRepository.findById(reservationAdherent2Id)).isPresent();
    }

    @Test
    @DisplayName("Un BIBLIOTHECAIRE (Admin) consulte, supprime et crée pour n'importe qui")
    void endpoints_avecTokenBibliothecaire_autorises() {
        String token = tokenDe("admin.biblio");

        ResponseEntity<String> consultation = restTemplate.exchange(
                url("/api/reservations/" + reservationAdherent2Id),
                HttpMethod.GET, new HttpEntity<>(entetesAvecToken(token)), String.class);
        assertThat(consultation.getStatusCode().value()).isEqualTo(200);

        ResponseEntity<String> creation = restTemplate.exchange(url("/api/reservations"),
                HttpMethod.POST,
                new HttpEntity<>(corpsCreation(livreCreationId, adherent1Id), entetesAvecToken(token)),
                String.class);
        assertThat(creation.getStatusCode().value()).isEqualTo(201);

        ResponseEntity<String> suppression = restTemplate.exchange(
                url("/api/reservations/" + reservationAdherent2Id),
                HttpMethod.DELETE, new HttpEntity<>(entetesAvecToken(token)), String.class);
        assertThat(suppression.getStatusCode().value()).isEqualTo(204);
        assertThat(reservationRepository.findById(reservationAdherent2Id)).isEmpty();
    }
}
