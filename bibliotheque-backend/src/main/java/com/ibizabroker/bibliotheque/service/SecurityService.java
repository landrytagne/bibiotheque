package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.AccesRefuseException;
import com.ibizabroker.bibliotheque.exceptions.AuthentificationRequiseException;
import com.ibizabroker.bibliotheque.exceptions.ChampManquantException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

/**
 * Fournit l'identité de l'utilisateur connecté à partir du token JWT (via le
 * SecurityContext alimenté par JwtRequestFilter).
 *
 * Règle RS-04 : l'identité d'un adhérent vient du token, jamais du corps de la
 * requête. Le rôle BIBLIOTHECAIRE est porté par le rôle applicatif "Admin",
 * l'ADHERENT par le rôle "User".
 */
@Service
public class SecurityService {

    private static final String ROLE_BIBLIOTHECAIRE = "Admin";

    @Autowired
    private UsersRepository usersRepository;

    /**
     * L'utilisateur authentifié porté par le token ; lève une erreur s'il n'y en a pas.
     * Si l'utilisateur du token a disparu de la base, l'identité ne peut pas être
     * établie : 401 (AuthentificationRequiseException), et non 403 — « je ne sais
     * pas qui vous êtes », conformément à la distinction 401/403 du sujet.
     */
    public Users utilisateurCourant() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserDetails)) {
            throw new AuthentificationRequiseException("Authentification requise.");
        }
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new AuthentificationRequiseException("Utilisateur du token introuvable."));
    }

    public boolean estBibliothecaire(Users user) {
        return user.getRole().stream()
                .anyMatch(role -> ROLE_BIBLIOTHECAIRE.equals(role.getRoleName()));
    }

    /**
     * RS-04 : un ADHERENT réserve pour lui-même — l'identité vient du token. S'il
     * envoie dans le corps l'adherentId d'un autre, il reçoit 403 ; s'il envoie le
     * sien (ou aucun), il est pris en compte. Un BIBLIOTHECAIRE choisit librement
     * l'adhérent, qui doit alors être renseigné.
     */
    public Users adherentAutorise(Integer adherentIdDemande) {
        Users userCourant = utilisateurCourant();
        if (estBibliothecaire(userCourant)) {
            if (adherentIdDemande == null) {
                throw new ChampManquantException("Champ(s) manquant(s) : adherentId");
            }
            return usersRepository.findById(adherentIdDemande)
                    .orElseThrow(() -> new NotFoundException(
                            "Adhérent avec l'id " + adherentIdDemande + " introuvable."));
        }
        if (adherentIdDemande != null && !adherentIdDemande.equals(userCourant.getUserId())) {
            throw new AccesRefuseException(
                    "RS-04 : un adhérent ne peut pas créer une réservation au nom d'un autre adhérent.");
        }
        return userCourant;
    }
}
