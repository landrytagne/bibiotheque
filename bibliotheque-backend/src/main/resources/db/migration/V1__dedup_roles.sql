-- Déduplication des rôles : la table role contient des doublons de role_name
-- (chaque création historique créait un nouveau rôle sans vérifier l'existant).

-- 1) Réaffecter les références user_role vers le role_id minimal de chaque role_name.
--    On traite chaque doublon (id de rôle > id minimal pour le même nom) et on
--    rebranche toutes ses références vers le rôle conservé.
UPDATE user_role ur
SET role_id = (
    SELECT MIN(r2.role_id)
    FROM role r2
    WHERE r2.role_name = (SELECT r3.role_name FROM role r3 WHERE r3.role_id = ur.role_id)
)
WHERE EXISTS (
    SELECT 1
    FROM role r1
    WHERE r1.role_id = ur.role_id
      AND r1.role_id > (
          SELECT MIN(r2.role_id)
          FROM role r2
          WHERE r2.role_name = r1.role_name
      )
);

-- 2) Supprimer les rôles dupliqués (tous sauf l'id minimal par role_name).
DELETE FROM role
WHERE role_id NOT IN (
    SELECT MIN(role_id)
    FROM role
    GROUP BY role_name
);

-- 3) Garantir l'unicité désormais.
ALTER TABLE role ADD CONSTRAINT uk_role_name UNIQUE (role_name);
