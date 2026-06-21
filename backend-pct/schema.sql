-- ======================================================
-- SCHÉMA BASE DE DONNÉES – Gestion des heures enseignants
-- ======================================================

-- Activation des extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ======================================================
-- 1. ENSEIGNANTS (créé en premier car référencé par users)
-- ======================================================
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    grade VARCHAR(30) NOT NULL CHECK (grade IN ('Assistant', 'Maître-Assistant', 'Professeur')),
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('Permanent', 'Vacataire')),
    departement VARCHAR(100) NOT NULL,
    taux_horaire INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 2. UTILISATEURS (avec lien vers teachers)
-- ======================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'secretaire', 'enseignant')),
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 3. COURS
-- ======================================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intitule VARCHAR(255) NOT NULL,
    filiere VARCHAR(100) NOT NULL,
    niveau VARCHAR(10) NOT NULL CHECK (niveau IN ('L1', 'L2', 'L3', 'M1', 'M2')),
    semestre INTEGER NOT NULL CHECK (semestre IN (1, 2)),
    nombre_heures INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison many-to-many entre cours et enseignants
CREATE TABLE IF NOT EXISTS course_teachers (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, teacher_id)
);

-- ======================================================
-- 4. SÉQUENCES PÉDAGOGIQUES
-- ======================================================
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    ordre INTEGER NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 5. RESSOURCES PÉDAGOGIQUES
-- ======================================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    complexite VARCHAR(20) NOT NULL CHECK (complexite IN ('Faible', 'Moyen', 'Élevé')),
    contenu_texte TEXT,
    video_url TEXT,
    document_url TEXT,
    evaluation_url TEXT,
    quiz JSONB,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES sequences(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 6. ACTIVITÉS (Création / Mise à jour de ressources)
-- ======================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enseignant_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Création', 'Mise à jour')),
    complexite VARCHAR(20) NOT NULL CHECK (complexite IN ('Faible', 'Moyen', 'Élevé')),
    date DATE NOT NULL,
    heures_calculees DECIMAL(10,2) NOT NULL,
    statut VARCHAR(20) DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Validée', 'Rejetée')),
    valide_par UUID REFERENCES users(id),
    date_validation TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 7. PARAMÈTRES (settings)
-- ======================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 8. NOTIFICATIONS
-- ======================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Année academic
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_label VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements (historisation)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    total_heures DECIMAL(10,2) NOT NULL,
    heures_complementaires DECIMAL(10,2) NOT NULL,
    montant_total INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'payé', 'annulé')),
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- INDEX POUR LES PERFORMANCES
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_departement ON teachers(departement);
CREATE INDEX IF NOT EXISTS idx_courses_filiere ON courses(filiere);
CREATE INDEX IF NOT EXISTS idx_courses_niveau ON courses(niveau);
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_sequence ON resources(sequence_id);
CREATE INDEX IF NOT EXISTS idx_activities_teacher ON activities(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(statut);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_payments_teacher ON payments(teacher_id);
CREATE INDEX idx_payments_academic_year ON payments(academic_year_id);
CREATE INDEX idx_payments_status ON payments(status);


-- Index pour recherche textuelle (trigrammes)
CREATE INDEX IF NOT EXISTS idx_courses_intitule_trgm ON courses USING gin(intitule gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_teachers_nom_trgm ON teachers USING gin(nom gin_trgm_ops);

-- ======================================================
-- VUE MATÉRIALISÉE : heures totales par enseignant
-- ======================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_teacher_hours AS
SELECT
    t.id AS teacher_id,
    t.nom,
    t.prenom,
    COALESCE(SUM(CASE WHEN a.statut = 'Validée' THEN a.heures_calculees ELSE 0 END), 0) AS total_hours,
    COALESCE(SUM(CASE WHEN a.statut = 'Validée' THEN a.heures_calculees ELSE 0 END), 0) AS total_validated
FROM teachers t
LEFT JOIN activities a ON t.id = a.enseignant_id
GROUP BY t.id;

CREATE INDEX IF NOT EXISTS idx_mv_teacher_hours ON mv_teacher_hours(total_hours);


-- Fonction de rafraîchissement automatique (appelée par trigger)
CREATE OR REPLACE FUNCTION refresh_teacher_hours_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_teacher_hours;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger : rafraîchir la vue après chaque modification d'activité
CREATE TRIGGER refresh_mv_after_activity_change
AFTER INSERT OR UPDATE OR DELETE ON activities
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_teacher_hours_view();

-- ======================================================
-- TRIGGER POUR updated_at
-- ======================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables concernées
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================================
-- DONNÉES INITIALES (seed)
-- ======================================================

-- Insertion d'un utilisateur admin (mot de passe: admin123)
INSERT INTO users (email, password_hash, role, is_active)
VALUES ('admin@univ.dz', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/Jj2ZkZ.Z5qD7pX3xY7xVqY7xVqY', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insertion des paramètres par défaut
INSERT INTO app_settings (key, value, description) VALUES
('academic_year', '2024/2025', 'Année académique en cours'),
('normal_hours_quota', '240', 'Heures normales par enseignant'),
('base_hours_creation', '5', 'Base heures pour création'),
('base_hours_update', '2', 'Base heures pour mise à jour'),
('complexity_multiplier_low', '1', 'Coefficient complexité Faible'),
('complexity_multiplier_medium', '1.5', 'Coefficient complexité Moyen'),
('complexity_multiplier_high', '2', 'Coefficient complexité Élevé'),
('hourly_rate_assistant', '2000', 'Taux horaire Assistant (legacy)'),
('hourly_rate_maitre', '2800', 'Taux Maître-Assistant (legacy)'),
('hourly_rate_professor', '3500', 'Taux Professeur (legacy)'),
('hourly_rate_assistant_permanent', '2000', 'Taux Assistant — Permanent'),
('hourly_rate_maitre_permanent', '2800', 'Taux Maître-Assistant — Permanent'),
('hourly_rate_professor_permanent', '3500', 'Taux Professeur — Permanent'),
('hourly_rate_assistant_vacataire', '1500', 'Taux Assistant — Vacataire'),
('hourly_rate_maitre_vacataire', '2200', 'Taux Maître-Assistant — Vacataire'),
('hourly_rate_professor_vacataire', '2800', 'Taux Professeur — Vacataire')
ON CONFLICT (key) DO NOTHING;

-- Insertion de quelques départements
INSERT INTO teachers (nom, prenom, email, grade, statut, departement, taux_horaire, telephone)
VALUES 
('Admin', 'System', 'admin@univ.dz', 'Professeur', 'Permanent', 'Informatique', 3500, '0000000000')
ON CONFLICT (email) DO NOTHING;