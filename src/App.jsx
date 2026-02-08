import { useState, useEffect, useCallback, useRef } from "react";
import html2pdf from "html2pdf.js";
import amarilloLogoWhite from "./assets/amarillo-logo-white.png";

// ============================================================
// AMARILLO DSI PROFILE™ v3
// Full app: Admin + Candidate + JSONBin persistence
// Deploy on: GitHub + Netlify + JSONBin.io
// ============================================================

// --- CONFIGURATION (from environment variables) ---
const JSONBIN_BASE = "https://api.jsonbin.io/v3";
const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "amarillo2025";

// --- DATA ---
const DIMENSIONS = [
  { id: "vision", name: "Vision Stratégique IT", pillar: 0, icon: "🔭", color: "#FECC02" },
  { id: "leadership", name: "Leadership d'Équipe", pillar: 0, icon: "👥", color: "#E5B800" },
  { id: "change", name: "Conduite du Changement", pillar: 0, icon: "🔄", color: "#D4A900" },
  { id: "influence", name: "Influence COMEX", pillar: 0, icon: "🎯", color: "#B8930A" },
  { id: "budget", name: "Pilotage Budgétaire & ROI", pillar: 1, icon: "📊", color: "#2D6A4F" },
  { id: "risk", name: "Gestion des Risques & Cyber", pillar: 1, icon: "🛡️", color: "#40916C" },
  { id: "complexity", name: "Maîtrise de la Complexité", pillar: 1, icon: "⚙️", color: "#52B788" },
  { id: "results", name: "Orientation Résultats", pillar: 1, icon: "🏆", color: "#74C69D" },
  { id: "innovation", name: "Innovation & Veille Tech", pillar: 2, icon: "💡", color: "#3A5BA0" },
  { id: "client", name: "Orientation Client / Métier", pillar: 2, icon: "🤝", color: "#4A6FB5" },
  { id: "resilience", name: "Résilience & Gestion du Stress", pillar: 2, icon: "🧘", color: "#5A83CA" },
  { id: "agility", name: "Agilité & Adaptabilité", pillar: 2, icon: "⚡", color: "#6A97DF" },
];

const PILLARS = [
  { name: "Leadership & Influence", color: "#FECC02" },
  { name: "Excellence Opérationnelle", color: "#2D6A4F" },
  { name: "Innovation & Posture", color: "#3A5BA0" },
];

const FORMATS = {
  court: { label: "Court", questionsPerDim: 3, total: 36, duration: "~15 min" },
  standard: { label: "Standard", questionsPerDim: 4, total: 48, duration: "~20 min" },
  complet: { label: "Complet", questionsPerDim: 5, total: 60, duration: "~25 min" },
};

// All 60 questions (5 per dimension)
const ALL_QUESTIONS = [
  // VISION STRATÉGIQUE IT
  { dim: "vision", order: 1, text: "Lors de l'élaboration d'un schéma directeur SI, vous privilégiez :", options: [
    { id: "a", text: "La stabilité et la continuité des systèmes existants", score: 1 },
    { id: "b", text: "L'optimisation des coûts et l'efficacité opérationnelle", score: 2 },
    { id: "c", text: "L'alignement avec la stratégie business à 3 ans", score: 3 },
    { id: "d", text: "La création de nouveaux avantages compétitifs par la technologie", score: 4 },
  ]},
  { dim: "vision", order: 2, text: "Face à une technologie émergente potentiellement disruptive pour votre secteur :", options: [
    { id: "a", text: "Vous attendez que d'autres l'adoptent avant de vous positionner", score: 1 },
    { id: "b", text: "Vous lancez une veille approfondie pour évaluer le potentiel", score: 2 },
    { id: "c", text: "Vous proposez un POC au COMEX avec une analyse d'impact business", score: 3 },
    { id: "d", text: "Vous construisez une feuille de route stratégique intégrant cette technologie", score: 4 },
  ]},
  { dim: "vision", order: 3, text: "Comment définissez-vous la réussite d'une DSI ?", options: [
    { id: "a", text: "Des systèmes qui fonctionnent sans incident", score: 1 },
    { id: "b", text: "Le respect des budgets et des délais projets", score: 2 },
    { id: "c", text: "La satisfaction des métiers et l'adoption des outils", score: 3 },
    { id: "d", text: "La contribution mesurable au chiffre d'affaires et à la compétitivité", score: 4 },
  ]},
  { dim: "vision", order: 4, text: "Votre approche de la dette technique :", options: [
    { id: "a", text: "Vous la gérez au fil de l'eau quand les problèmes surviennent", score: 1 },
    { id: "b", text: "Vous maintenez un inventaire mais priorisez les projets business", score: 2 },
    { id: "c", text: "Vous intégrez un budget dédié dans chaque cycle budgétaire", score: 3 },
    { id: "d", text: "Vous en faites un axe stratégique avec un plan pluriannuel présenté au Board", score: 4 },
  ]},
  { dim: "vision", order: 5, text: "Le CEO vous demande 'Quelle sera notre IT dans 5 ans ?'. Vous répondez :", options: [
    { id: "a", text: "En présentant les évolutions prévues de l'infrastructure", score: 1 },
    { id: "b", text: "En décrivant les projets majeurs du pipeline", score: 2 },
    { id: "c", text: "En articulant une vision technologique alignée sur le plan stratégique", score: 3 },
    { id: "d", text: "En co-construisant une vision business-tech qui challenge le modèle d'affaires", score: 4 },
  ]},
  // LEADERSHIP
  { dim: "leadership", order: 1, text: "Pour attirer les meilleurs talents tech dans votre équipe :", options: [
    { id: "a", text: "Vous comptez principalement sur la rémunération compétitive", score: 1 },
    { id: "b", text: "Vous misez sur la qualité des projets et des technologies utilisées", score: 2 },
    { id: "c", text: "Vous développez une marque employeur tech et un parcours de carrière clair", score: 3 },
    { id: "d", text: "Vous créez un écosystème d'innovation avec contributions open source et conférences", score: 4 },
  ]},
  { dim: "leadership", order: 2, text: "Un conflit éclate entre deux de vos managers sur les priorités :", options: [
    { id: "a", text: "Vous tranchez la décision vous-même rapidement", score: 1 },
    { id: "b", text: "Vous organisez une réunion pour entendre les deux parties", score: 2 },
    { id: "c", text: "Vous facilitez un échange structuré pour qu'ils trouvent un compromis", score: 3 },
    { id: "d", text: "Vous utilisez ce conflit pour renforcer la collaboration et revoir la gouvernance", score: 4 },
  ]},
  { dim: "leadership", order: 3, text: "Votre approche du développement des compétences de vos équipes :", options: [
    { id: "a", text: "Chacun est responsable de sa propre formation", score: 1 },
    { id: "b", text: "Vous proposez un catalogue de formations annuel", score: 2 },
    { id: "c", text: "Vous définissez des parcours individualisés avec des objectifs de montée en compétence", score: 3 },
    { id: "d", text: "Vous créez une culture d'apprentissage continu avec mentorat et communautés de pratiques", score: 4 },
  ]},
  { dim: "leadership", order: 4, text: "Face à un collaborateur talentueux mais difficile à manager :", options: [
    { id: "a", text: "Vous tolérez son comportement tant qu'il délivre", score: 1 },
    { id: "b", text: "Vous recadrez fermement avec des objectifs comportementaux clairs", score: 2 },
    { id: "c", text: "Vous travaillez avec lui pour comprendre ses motivations et adapter son rôle", score: 3 },
    { id: "d", text: "Vous en faites un cas d'école pour développer votre intelligence managériale", score: 4 },
  ]},
  { dim: "leadership", order: 5, text: "Nouveau poste de DSI — votre priorité dans les 100 premiers jours :", options: [
    { id: "a", text: "Comprendre l'infrastructure et les systèmes en place", score: 1 },
    { id: "b", text: "Rencontrer chaque membre de votre équipe directe", score: 2 },
    { id: "c", text: "Évaluer les compétences, identifier les leaders et construire votre équipe", score: 3 },
    { id: "d", text: "Créer une vision partagée et mobiliser l'équipe autour d'un projet fédérateur", score: 4 },
  ]},
  // CONDUITE DU CHANGEMENT
  { dim: "change", order: 1, text: "Pour déployer un nouvel ERP dans l'entreprise :", options: [
    { id: "a", text: "Vous planifiez le déploiement technique et formez les utilisateurs", score: 1 },
    { id: "b", text: "Vous impliquez les key users métiers dans les phases de test", score: 2 },
    { id: "c", text: "Vous créez un réseau d'ambassadeurs et un plan de communication multi-canal", score: 3 },
    { id: "d", text: "Vous co-construisez la transformation avec les métiers en repensant les processus", score: 4 },
  ]},
  { dim: "change", order: 2, text: "La résistance au changement dans votre organisation est :", options: [
    { id: "a", text: "Un obstacle à surmonter par la formation et la communication", score: 1 },
    { id: "b", text: "Un signal à écouter pour ajuster le rythme de déploiement", score: 2 },
    { id: "c", text: "Une source d'information précieuse pour améliorer votre approche", score: 3 },
    { id: "d", text: "Une opportunité de transformer la culture d'entreprise en profondeur", score: 4 },
  ]},
  { dim: "change", order: 3, text: "Votre meilleur levier pour réussir une transformation digitale :", options: [
    { id: "a", text: "Des outils performants et une infrastructure solide", score: 1 },
    { id: "b", text: "Le sponsorship fort de la Direction Générale", score: 2 },
    { id: "c", text: "L'engagement des managers intermédiaires comme relais du changement", score: 3 },
    { id: "d", text: "Une culture d'expérimentation qui permet l'échec et l'apprentissage rapide", score: 4 },
  ]},
  { dim: "change", order: 4, text: "Un projet de transformation prend du retard, les métiers se découragent :", options: [
    { id: "a", text: "Vous renforcez les ressources pour rattraper le planning", score: 1 },
    { id: "b", text: "Vous revoyez le périmètre pour livrer un MVP rapidement", score: 2 },
    { id: "c", text: "Vous organisez des quick wins visibles pour redonner confiance", score: 3 },
    { id: "d", text: "Vous transformez la crise en moment de vérité et redéfinissez l'ambition", score: 4 },
  ]},
  { dim: "change", order: 5, text: "Votre vision de la transformation digitale :", options: [
    { id: "a", text: "Digitaliser les processus existants pour gagner en efficacité", score: 1 },
    { id: "b", text: "Moderniser le SI pour supporter la croissance de l'entreprise", score: 2 },
    { id: "c", text: "Transformer les parcours clients et collaborateurs grâce au digital", score: 3 },
    { id: "d", text: "Réinventer le modèle d'affaires en exploitant la data et les nouvelles technologies", score: 4 },
  ]},
  // INFLUENCE COMEX
  { dim: "influence", order: 1, text: "En comité de direction, pour un projet IT majeur vous mettez en avant :", options: [
    { id: "a", text: "Les spécifications techniques et l'architecture proposée", score: 1 },
    { id: "b", text: "Le planning, le budget et les risques du projet", score: 2 },
    { id: "c", text: "Le ROI attendu et l'impact sur les KPIs business", score: 3 },
    { id: "d", text: "La vision stratégique et la transformation de l'avantage compétitif", score: 4 },
  ]},
  { dim: "influence", order: 2, text: "Le DAF conteste votre budget IT jugé trop élevé :", options: [
    { id: "a", text: "Vous défendez chaque ligne budgétaire avec des justifications techniques", score: 1 },
    { id: "b", text: "Vous proposez des scénarios de réduction avec leurs impacts", score: 2 },
    { id: "c", text: "Vous recadrez le débat en termes de valeur créée vs. investissement", score: 3 },
    { id: "d", text: "Vous invitez le DAF à co-construire un modèle de pilotage de la valeur IT", score: 4 },
  ]},
  { dim: "influence", order: 3, text: "Votre relation avec les autres membres du COMEX :", options: [
    { id: "a", text: "Vous êtes principalement sollicité quand il y a un problème technique", score: 1 },
    { id: "b", text: "Vous participez aux comités et rendez compte de l'avancement des projets", score: 2 },
    { id: "c", text: "Vous êtes perçu comme un partenaire stratégique", score: 3 },
    { id: "d", text: "Vous influencez activement la stratégie globale et challengez les autres directions", score: 4 },
  ]},
  { dim: "influence", order: 4, text: "Pour convaincre le Board d'investir dans l'IA :", options: [
    { id: "a", text: "Vous présentez les capacités techniques de l'IA et ses cas d'usage", score: 1 },
    { id: "b", text: "Vous montrez ce que font les concurrents et les risques de ne pas agir", score: 2 },
    { id: "c", text: "Vous présentez un business case chiffré avec des pilotes concrets", score: 3 },
    { id: "d", text: "Vous racontez une histoire de transformation projetant l'entreprise dans 3 ans", score: 4 },
  ]},
  { dim: "influence", order: 5, text: "Incident de cybersécurité majeur — votre communication au COMEX :", options: [
    { id: "a", text: "Vous détaillez l'incident technique et les mesures correctives", score: 1 },
    { id: "b", text: "Vous présentez l'impact opérationnel et le plan de remédiation", score: 2 },
    { id: "c", text: "Communication transparente sur l'impact business et actions immédiates", score: 3 },
    { id: "d", text: "Vous transformez la crise en opportunité pour renforcer la stratégie cyber", score: 4 },
  ]},
  // PILOTAGE BUDGÉTAIRE
  { dim: "budget", order: 1, text: "Votre approche du budget IT :", options: [
    { id: "a", text: "Vous reconduisez le budget N-1 avec des ajustements", score: 1 },
    { id: "b", text: "Vous construisez un budget bottom-up basé sur les demandes", score: 2 },
    { id: "c", text: "Vous articulez Run vs. Build avec un TCO par service", score: 3 },
    { id: "d", text: "Budget orienté valeur avec métriques de ROI par initiative", score: 4 },
  ]},
  { dim: "budget", order: 2, text: "Pour justifier un investissement cloud de 2M€ :", options: [
    { id: "a", text: "Vous comparez les coûts on-premise vs. cloud", score: 1 },
    { id: "b", text: "TCO sur 5 ans avec les gains d'efficacité", score: 2 },
    { id: "c", text: "Business case intégrant agilité, time-to-market et scalabilité", score: 3 },
    { id: "d", text: "Démonstration de nouveaux modèles de revenus permis par le cloud", score: 4 },
  ]},
  { dim: "budget", order: 3, text: "Le budget doit être réduit de 15% en cours d'année :", options: [
    { id: "a", text: "Coupe linéaire sur tous les postes", score: 1 },
    { id: "b", text: "Identification des projets les moins prioritaires à reporter", score: 2 },
    { id: "c", text: "Re-priorisation du portefeuille selon l'impact business", score: 3 },
    { id: "d", text: "Arbitrage stratégique au COMEX avec conséquences de chaque scénario", score: 4 },
  ]},
  { dim: "budget", order: 4, text: "Comment mesurez-vous la performance de votre DSI ?", options: [
    { id: "a", text: "Respect du budget et des SLA techniques", score: 1 },
    { id: "b", text: "Satisfaction utilisateurs et taux de disponibilité", score: 2 },
    { id: "c", text: "Contribution aux objectifs business avec KPIs partagés", score: 3 },
    { id: "d", text: "Tableau de bord : valeur créée, vélocité d'innovation, maturité digitale", score: 4 },
  ]},
  { dim: "budget", order: 5, text: "Votre relation avec les prestataires IT :", options: [
    { id: "a", text: "Négociation principalement sur les prix", score: 1 },
    { id: "b", text: "Contrats avec SLA et pénalités clairs", score: 2 },
    { id: "c", text: "Partenariats stratégiques avec engagements mutuels", score: 3 },
    { id: "d", text: "Co-innovation avec un écosystème de partenaires", score: 4 },
  ]},
  // GESTION DES RISQUES
  { dim: "risk", order: 1, text: "Votre approche de la cybersécurité :", options: [
    { id: "a", text: "Solutions de sécurité standard du marché", score: 1 },
    { id: "b", text: "Politique de sécurité formalisée avec audits réguliers", score: 2 },
    { id: "c", text: "Stratégie cyber alignée sur les risques business, RSSI au COMEX", score: 3 },
    { id: "d", text: "Cyber-résilience intégrée dans la culture, Zero Trust, exercices de crise", score: 4 },
  ]},
  { dim: "risk", order: 2, text: "Face à une nouvelle réglementation (NIS2, DORA, RGPD...) :", options: [
    { id: "a", text: "Mise en conformité des systèmes concernés", score: 1 },
    { id: "b", text: "Projet dédié avec chef de projet et planning", score: 2 },
    { id: "c", text: "Intégration dans la gouvernance IT et sensibilisation des métiers", score: 3 },
    { id: "d", text: "Transformation de la contrainte réglementaire en avantage compétitif", score: 4 },
  ]},
  { dim: "risk", order: 3, text: "Un ransomware paralyse 30% de votre SI un vendredi soir :", options: [
    { id: "a", text: "Mobilisation de l'équipe technique pour restaurer", score: 1 },
    { id: "b", text: "Activation du PCA/PRA et information de la direction", score: 2 },
    { id: "c", text: "Pilotage de la cellule de crise avec communication coordonnée", score: 3 },
    { id: "d", text: "Orchestration de la réponse technique, business et médiatique", score: 4 },
  ]},
  { dim: "risk", order: 4, text: "Votre cartographie des risques IT :", options: [
    { id: "a", text: "Gestion au fil de l'eau quand les risques se matérialisent", score: 1 },
    { id: "b", text: "Registre des risques mis à jour annuellement", score: 2 },
    { id: "c", text: "Cartographie dynamique intégrée au risk management", score: 3 },
    { id: "d", text: "Approche prédictive avec scénarios prospectifs et stress tests", score: 4 },
  ]},
  { dim: "risk", order: 5, text: "La gestion des données sensibles :", options: [
    { id: "a", text: "Chaque système a ses propres règles d'accès", score: 1 },
    { id: "b", text: "Politique de classification des données", score: 2 },
    { id: "c", text: "Gouvernance data avec DPO et data lineage", score: 3 },
    { id: "d", text: "Data comme actif stratégique avec CDO et gouvernance transverse", score: 4 },
  ]},
  // COMPLEXITÉ
  { dim: "complexity", order: 1, text: "SI avec 200 applications dont 40% en fin de vie :", options: [
    { id: "a", text: "Maintien de l'existant tant que ça fonctionne", score: 1 },
    { id: "b", text: "Planification des migrations les plus urgentes", score: 2 },
    { id: "c", text: "Plan de rationalisation pluriannuel avec critères objectifs", score: 3 },
    { id: "d", text: "Refonte de l'architecture en approche API-first et microservices", score: 4 },
  ]},
  { dim: "complexity", order: 2, text: "Projet impliquant 8 directions métier aux besoins contradictoires :", options: [
    { id: "a", text: "Tentative de satisfaire tout le monde avec un périmètre large", score: 1 },
    { id: "b", text: "Priorisation des besoins par criticité business", score: 2 },
    { id: "c", text: "Gouvernance projet avec arbitrages structurés", score: 3 },
    { id: "d", text: "Approche produit avec squads cross-fonctionnelles et itérations rapides", score: 4 },
  ]},
  { dim: "complexity", order: 3, text: "Intégration post-acquisition d'une filiale :", options: [
    { id: "a", text: "Migration progressive vers vos systèmes existants", score: 1 },
    { id: "b", text: "Audit SI et plan d'intégration", score: 2 },
    { id: "c", text: "Arbitrage convergence/coexistence selon la valeur business", score: 3 },
    { id: "d", text: "Architecture cible prenant le meilleur des deux SI", score: 4 },
  ]},
  { dim: "complexity", order: 4, text: "Gestion d'un portefeuille de 50 projets simultanés :", options: [
    { id: "a", text: "Chaque chef de projet gère son périmètre en autonomie", score: 1 },
    { id: "b", text: "PMO qui consolide les reportings", score: 2 },
    { id: "c", text: "Pilotage par la valeur avec comité de portefeuille mensuel", score: 3 },
    { id: "d", text: "Modèle hybride projet/produit avec métriques de flow en temps réel", score: 4 },
  ]},
  { dim: "complexity", order: 5, text: "Gestion multi-fournisseurs sur un programme complexe :", options: [
    { id: "a", text: "Chaque fournisseur sur son périmètre avec interfaces définies", score: 1 },
    { id: "b", text: "Intégrateur qui coordonne l'ensemble", score: 2 },
    { id: "c", text: "Orchestration de l'écosystème avec gouvernance commune", score: 3 },
    { id: "d", text: "Collaboration intégrée avec partage des risques et gains", score: 4 },
  ]},
  // RÉSULTATS
  { dim: "results", order: 1, text: "Votre définition du 'delivery' :", options: [
    { id: "a", text: "Livrer dans les délais et le budget prévus", score: 1 },
    { id: "b", text: "Solution qui fonctionne et satisfait les utilisateurs", score: 2 },
    { id: "c", text: "Valeur business attendue et mesurée", score: 3 },
    { id: "d", text: "Impact durable qui transforme les pratiques", score: 4 },
  ]},
  { dim: "results", order: 2, text: "Projet stratégique : +30% coût, +6 mois de retard :", options: [
    { id: "a", text: "Renforcement du contrôle et reportings hebdomadaires", score: 1 },
    { id: "b", text: "Audit des causes et plan de recovery", score: 2 },
    { id: "c", text: "Décisions difficiles : rescoping, changement d'équipe, pivot", score: 3 },
    { id: "d", text: "Culture du feedback et amélioration continue", score: 4 },
  ]},
  { dim: "results", order: 3, text: "Rythme de déploiement des nouvelles fonctionnalités :", options: [
    { id: "a", text: "Releases majeures 2 à 3 fois par an", score: 1 },
    { id: "b", text: "Releases mensuelles avec cycle de test structuré", score: 2 },
    { id: "c", text: "Continuous delivery avec feature flags et A/B testing", score: 3 },
    { id: "d", text: "Squads autonomes déployant plusieurs fois par jour", score: 4 },
  ]},
  { dim: "results", order: 4, text: "Gestion de la qualité logicielle :", options: [
    { id: "a", text: "Tests manuels avant chaque mise en production", score: 1 },
    { id: "b", text: "Tests automatisés avec couverture de code", score: 2 },
    { id: "c", text: "DevOps avec CI/CD, monitoring et observabilité", score: 3 },
    { id: "d", text: "Engineering excellence : SRE, chaos engineering, blameless postmortems", score: 4 },
  ]},
  { dim: "results", order: 5, text: "Engagements de service (SLA) :", options: [
    { id: "a", text: "Garantie de disponibilité des systèmes", score: 1 },
    { id: "b", text: "SLA formalisés avec indicateurs de suivi", score: 2 },
    { id: "c", text: "SLA business alignés sur l'expérience utilisateur", score: 3 },
    { id: "d", text: "SLO orientés outcome avec error budgets", score: 4 },
  ]},
  // INNOVATION
  { dim: "innovation", order: 1, text: "Votre veille technologique :", options: [
    { id: "a", text: "Suivi des tendances via la presse spécialisée", score: 1 },
    { id: "b", text: "Participation régulière à des conférences et salons", score: 2 },
    { id: "c", text: "Processus structuré avec technology radars et POC réguliers", score: 3 },
    { id: "d", text: "Lab d'innovation avec partenariats startups et académiques", score: 4 },
  ]},
  { dim: "innovation", order: 2, text: "Face à l'IA générative :", options: [
    { id: "a", text: "Observation de ce que font les autres", score: 1 },
    { id: "b", text: "Tests de quelques outils et évaluation des gains", score: 2 },
    { id: "c", text: "Stratégie IA avec cas d'usage prioritaires et gouvernance", score: 3 },
    { id: "d", text: "Repositionnement de la chaîne de valeur autour de l'IA", score: 4 },
  ]},
  { dim: "innovation", order: 3, text: "Le budget innovation dans votre DSI :", options: [
    { id: "a", text: "Pas de budget dédié, innovation dans les projets", score: 1 },
    { id: "b", text: "Enveloppe annuelle pour expérimentations", score: 2 },
    { id: "c", text: "Processus d'innovation avec funnel et critères de go/no-go", score: 3 },
    { id: "d", text: "Innovation décentralisée avec squads et intrapreneuriat", score: 4 },
  ]},
  { dim: "innovation", order: 4, text: "Votre approche de l'innovation ouverte :", options: [
    { id: "a", text: "Innovation principalement en interne", score: 1 },
    { id: "b", text: "Quelques partenaires technologiques privilégiés", score: 2 },
    { id: "c", text: "Programme de collaboration avec startups et incubateurs", score: 3 },
    { id: "d", text: "Écosystème complet : startups, universités, clients", score: 4 },
  ]},
  { dim: "innovation", order: 5, text: "Un collaborateur propose une idée innovante mais risquée :", options: [
    { id: "a", text: "Vous lui demandez de se concentrer sur ses priorités", score: 1 },
    { id: "b", text: "Du temps accordé pour approfondir l'idée", score: 2 },
    { id: "c", text: "Budget et délai pour un prototype avec critères de succès", score: 3 },
    { id: "d", text: "Cadre encourageant ce type d'initiative dans toute la DSI", score: 4 },
  ]},
  // CLIENT
  { dim: "client", order: 1, text: "Votre connaissance des métiers de l'entreprise :", options: [
    { id: "a", text: "Connaissance de leurs besoins IT principaux", score: 1 },
    { id: "b", text: "Business Relationship Managers dédiés à chaque direction", score: 2 },
    { id: "c", text: "Temps régulier passé sur le terrain", score: 3 },
    { id: "d", text: "Compréhension des P&L, KPIs et enjeux stratégiques de chaque BU", score: 4 },
  ]},
  { dim: "client", order: 2, text: "Le DG Commercial se plaint du CRM inadapté :", options: [
    { id: "a", text: "Analyse des remontées et planification d'évolutions", score: 1 },
    { id: "b", text: "Ateliers avec les équipes commerciales", score: 2 },
    { id: "c", text: "Observation terrain et co-conception de la solution", score: 3 },
    { id: "d", text: "Repenser l'expérience commerciale globale au-delà de l'outil", score: 4 },
  ]},
  { dim: "client", order: 3, text: "Votre approche de l'expérience utilisateur :", options: [
    { id: "a", text: "Livraison des fonctionnalités demandées par les métiers", score: 1 },
    { id: "b", text: "Intégration des retours utilisateurs", score: 2 },
    { id: "c", text: "UX designers et mesure NPS de satisfaction", score: 3 },
    { id: "d", text: "Design thinking : chaque outil traité comme un produit grand public", score: 4 },
  ]},
  { dim: "client", order: 4, text: "Le shadow IT prolifère dans l'entreprise :", options: [
    { id: "a", text: "Contrôle et interdiction", score: 1 },
    { id: "b", text: "Inventaire et proposition d'alternatives", score: 2 },
    { id: "c", text: "Compréhension des besoins et amélioration de l'offre", score: 3 },
    { id: "d", text: "Shadow IT comme signal d'innovation, gouvernance flexible", score: 4 },
  ]},
  { dim: "client", order: 5, text: "Votre positionnement vis-à-vis des métiers :", options: [
    { id: "a", text: "Centre de services répondant aux demandes", score: 1 },
    { id: "b", text: "Partenaire accompagnant les projets métiers", score: 2 },
    { id: "c", text: "Business partner co-construisant les solutions", score: 3 },
    { id: "d", text: "Catalyseur de transformation qui anticipe et propose", score: 4 },
  ]},
  // RÉSILIENCE
  { dim: "resilience", order: 1, text: "Après un échec majeur de projet :", options: [
    { id: "a", text: "Passer à autre chose rapidement", score: 1 },
    { id: "b", text: "Analyse des causes et documentation des leçons", score: 2 },
    { id: "c", text: "Partage ouvert du REX et ajustement des processus", score: 3 },
    { id: "d", text: "Transformation de l'échec en apprentissage collectif", score: 4 },
  ]},
  { dim: "resilience", order: 2, text: "Votre rythme en période de crise :", options: [
    { id: "a", text: "Sur le pont 24/7, gestion personnelle de tout", score: 1 },
    { id: "b", text: "Délégation opérationnelle et supervision", score: 2 },
    { id: "c", text: "Alternance phases intenses/récupération, protection des équipes", score: 3 },
    { id: "d", text: "Processus de crise rodés, gestion sereine", score: 4 },
  ]},
  { dim: "resilience", order: 3, text: "Pression du COMEX pour un projet irréaliste :", options: [
    { id: "a", text: "Acceptation du challenge, pression sur les équipes", score: 1 },
    { id: "b", text: "Alerte sur les risques, engagement sur un planning ambitieux", score: 2 },
    { id: "c", text: "Négociation d'un périmètre réaliste avec jalons de vérification", score: 3 },
    { id: "d", text: "Recadrage assertif et approche agile avec valeur rapide", score: 4 },
  ]},
  { dim: "resilience", order: 4, text: "Votre gestion de l'incertitude :", options: [
    { id: "a", text: "Besoin de visibilité claire avant de décider", score: 1 },
    { id: "b", text: "Décision avec les infos disponibles, ajustement ensuite", score: 2 },
    { id: "c", text: "À l'aise avec l'ambiguïté, approches itératives", score: 3 },
    { id: "d", text: "L'incertitude comme avantage compétitif", score: 4 },
  ]},
  { dim: "resilience", order: 5, text: "Équilibre vie professionnelle / personnelle :", options: [
    { id: "a", text: "Le travail passe en premier en période intense", score: 1 },
    { id: "b", text: "Tentative de maintenir des limites", score: 2 },
    { id: "c", text: "Rituels et limites claires respectés", score: 3 },
    { id: "d", text: "Cet équilibre comme valeur d'équipe et performance durable", score: 4 },
  ]},
  // AGILITÉ
  { dim: "agility", order: 1, text: "L'adoption de l'agilité dans votre DSI :", options: [
    { id: "a", text: "Quelques équipes font du Scrum sur certains projets", score: 1 },
    { id: "b", text: "L'agile est la méthode standard pour les développements", score: 2 },
    { id: "c", text: "Agilité à l'échelle avec SAFe ou équivalent", score: 3 },
    { id: "d", text: "L'agilité comme culture dépassant la DSI", score: 4 },
  ]},
  { dim: "agility", order: 2, text: "Nouveau concurrent digital qui bouleverse votre marché :", options: [
    { id: "a", text: "Renforcement de la fiabilité des systèmes actuels", score: 1 },
    { id: "b", text: "Accélération des projets digitaux en cours", score: 2 },
    { id: "c", text: "Plan de riposte digitale : quick wins + structurant", score: 3 },
    { id: "d", text: "Challenge du business model avec le COMEX, réponse disruptive", score: 4 },
  ]},
  { dim: "agility", order: 3, text: "Votre organisation IT :", options: [
    { id: "a", text: "Organisation traditionnelle par silos", score: 1 },
    { id: "b", text: "Équipes projets transverses avec compétences mixtes", score: 2 },
    { id: "c", text: "Squads produit autonomes avec product owners métier", score: 3 },
    { id: "d", text: "Organisation liquide se reconfigurant selon les priorités", score: 4 },
  ]},
  { dim: "agility", order: 4, text: "Le COVID impose le télétravail du jour au lendemain :", options: [
    { id: "a", text: "Continuité technique assurée en mode urgence", score: 1 },
    { id: "b", text: "Outils collaboratifs et accès sécurisés en quelques jours", score: 2 },
    { id: "c", text: "La crise comme accélérateur de transformation digitale", score: 3 },
    { id: "d", text: "Refonte du modèle de travail hybride, IT comme pilier", score: 4 },
  ]},
  { dim: "agility", order: 5, text: "Capacité à pivoter quand une stratégie ne fonctionne pas :", options: [
    { id: "a", text: "Difficulté à abandonner un plan lancé", score: 1 },
    { id: "b", text: "Ajustement quand les indicateurs sont clairement négatifs", score: 2 },
    { id: "c", text: "Checkpoints réguliers avec critères de pivot prédéfinis", score: 3 },
    { id: "d", text: "Mentalité d'expérimentation où le pivot est naturel", score: 4 },
  ]},
];

// --- UTILS ---
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AMA-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function selectQuestions(format) {
  const perDim = FORMATS[format].questionsPerDim;
  const selected = [];
  DIMENSIONS.forEach((dim) => {
    const dimQs = ALL_QUESTIONS.filter((q) => q.dim === dim.id).sort((a, b) => a.order - b.order);
    selected.push(...dimQs.slice(0, perDim));
  });
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected;
}

// --- JSONBin API ---
async function readBin() {
  const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Master-Key": JSONBIN_MASTER_KEY }
  });
  const data = await res.json();
  return data.record;
}

async function updateBin(record) {
  await fetch(`${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_MASTER_KEY
    },
    body: JSON.stringify(record)
  });
}

async function saveSession(session) {
  try {
    const record = await readBin();
    record.sessions[session.code] = session;
    const idx = record.index.findIndex(s => s.code === session.code);
    const summary = {
      code: session.code,
      name: session.candidateName,
      role: session.candidateRole,
      format: session.format,
      status: session.status,
      email: session.candidateEmail || "",
      createdAt: session.createdAt,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) record.index[idx] = summary;
    else record.index.push(summary);
    await updateBin(record);
    return true;
  } catch (e) {
    console.error("Save error:", e);
    return false;
  }
}

async function loadSession(code) {
  try {
    const record = await readBin();
    return record.sessions[code] || null;
  } catch (e) {
    return null;
  }
}

async function loadAllSessions() {
  try {
    const record = await readBin();
    return record.index || [];
  } catch (e) {
    return [];
  }
}

// --- COMPONENTS ---
const RANK_WEIGHTS = [1.0, 0.66, 0.33, 0.0];

function RankingCard({ question, dimColor, onComplete }) {
  const [ranked, setRanked] = useState([]);
  const [remaining, setRemaining] = useState(() => [...question.options].sort(() => Math.random() - 0.5));
  const rankLabels = ["1er — Me ressemble le plus", "2e", "3e", "4e — Me ressemble le moins"];
  const rankColors = ["#FECC02", "#b8923a", "#7a6a4a", "#4a4a4a"];

  const selectOption = (opt) => {
    const newRanked = [...ranked, opt];
    const newRemaining = remaining.filter((o) => o.id !== opt.id);
    setRanked(newRanked);
    setRemaining(newRemaining);
    if (newRanked.length === 4) setTimeout(() => onComplete(newRanked), 500);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#888", margin: 0, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
          Classez de la plus proche à la plus éloignée de vous
        </p>
        {ranked.length > 0 && (
          <button onClick={() => { setRemaining([...remaining, ranked[ranked.length - 1]]); setRanked(ranked.slice(0, -1)); }}
            style={{ fontSize: 12, color: "#888", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
            ← Annuler
          </button>
        )}
      </div>
      {ranked.map((opt, i) => (
        <div key={opt.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", marginBottom: 8, background: `${rankColors[i]}11`, border: `1px solid ${rankColors[i]}44`, borderRadius: 2, animation: "slideIn 0.3s ease" }}>
          <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: rankColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a0b0e", fontFamily: "'DM Mono', monospace" }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.5 }}>{opt.text}</div>
            <div style={{ fontSize: 11, color: rankColors[i], marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{rankLabels[i]}</div>
          </div>
        </div>
      ))}
      {ranked.length > 0 && ranked.length < 4 && (
        <div style={{ padding: "8px 0", margin: "12px 0", borderTop: "1px dashed rgba(255,255,255,0.08)", fontSize: 12, color: "#555", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>
          Sélectionnez votre {ranked.length + 1}{ranked.length === 0 ? "er" : "e"} choix
        </div>
      )}
      {remaining.map((opt) => (
        <button key={opt.id} onClick={() => selectOption(opt)}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "16px 20px", marginBottom: 8, fontSize: 15, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "#ccc", cursor: "pointer", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${dimColor}15`; e.currentTarget.style.borderColor = `${dimColor}55`; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#ccc"; }}>
          {opt.text}
        </button>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function RadarChart({ scores, size = 440 }) {
  const pad = 120;
  const vw = size + pad * 2;
  const c = vw / 2, r = size * 0.38, n = 12;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return { x: c + (v / 4) * r * Math.cos(a), y: c + (v / 4) * r * Math.sin(a) }; };
  return (
    <svg viewBox={`0 0 ${vw} ${vw}`} style={{ width: "100%", maxWidth: vw, display: "block", margin: "0 auto" }}>
      {[1,2,3,4].map(l => <polygon key={l} points={DIMENSIONS.map((_,i) => { const p=pt(i,l); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      {DIMENSIONS.map((d,i) => { const p=pt(i,4); return <line key={d.id} x1={c} y1={c} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />; })}
      <polygon points={DIMENSIONS.map((d,i) => { const p=pt(i,scores[d.id]||0); return `${p.x},${p.y}`; }).join(" ")} fill="rgba(232,168,56,0.15)" stroke="#FECC02" strokeWidth="2.5" />
      {DIMENSIONS.map((d,i) => { const p=pt(i,scores[d.id]||0); return <circle key={d.id} cx={p.x} cy={p.y} r="5" fill={d.color} stroke="#fff" strokeWidth="1.5" />; })}
      {DIMENSIONS.map((d,i) => { const p=pt(i,4.9); const a=(360*i)/n-90; const isR=a>-90&&a<90; const isB=a>0&&a<180; return <text key={d.id} x={p.x} y={p.y} textAnchor={Math.abs(a+90)<10||Math.abs(a-90)<10?"middle":isR?"start":"end"} dominantBaseline={isB?"hanging":"auto"} fill="#999" fontSize="11" fontFamily="'DM Sans', sans-serif">{d.icon} {d.name}</text>; })}
    </svg>
  );
}

function ScoreBar({ dimension, score }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#d0d0d0", fontSize: 13 }}>{dimension.icon} {dimension.name}</span>
        <span style={{ color: dimension.color, fontWeight: 700, fontSize: 14, fontFamily: "'DM Mono', monospace" }}>{score.toFixed(2)}/4</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${(score/4)*100}%`, background: `linear-gradient(90deg, ${dimension.color}, ${dimension.color}cc)`, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function getAnalysis(scores) {
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  const top3 = sorted.slice(0,3).map(([id]) => DIMENSIONS.find(d => d.id===id));
  const bottom3 = sorted.slice(-3).map(([id]) => DIMENSIONS.find(d => d.id===id));
  const avg = Object.values(scores).reduce((a,b) => a+b, 0) / 12;
  const ps = PILLARS.map((_,pi) => { const ds=DIMENSIONS.filter(d=>d.pillar===pi); return ds.reduce((s,d)=>s+(scores[d.id]||0),0)/ds.length; });
  let profile, desc, strengths, development, context;
  if (ps[0]>=3&&ps[2]>=3) {
    profile="🚀 DSI Visionnaire";
    desc="Profil de leader transformationnel combinant une forte capacité d'influence stratégique et un sens aigu de l'innovation. Ce DSI sait porter une vision ambitieuse auprès du COMEX tout en restant connecté aux tendances technologiques. Il excelle dans la conduite de transformations digitales d'envergure et sait fédérer les équipes autour d'un projet de changement.";
    strengths="Capacité à articuler une vision technologique alignée sur la stratégie business, influence naturelle auprès de la Direction Générale, aptitude à identifier et exploiter les innovations disruptives.";
    development="Veiller à ne pas négliger l'excellence opérationnelle et le delivery au quotidien. La vision doit s'accompagner de rigueur d'exécution pour maintenir la crédibilité.";
    context="Idéal pour les entreprises en pleine transformation digitale, les organisations cherchant à repositionner leur IT comme levier stratégique, ou les contextes de forte croissance.";
  }
  else if (ps[0]>=3&&ps[1]>=3) {
    profile="⚡ DSI Stratège-Opérationnel";
    desc="Profil rare et très recherché alliant un leadership influent à une excellence d'exécution remarquable. Ce DSI sait à la fois porter des projets stratégiques au COMEX et garantir un delivery irréprochable. Il maîtrise la gestion de la complexité et sait piloter des programmes d'envergure avec rigueur tout en maintenant une influence déterminante sur la stratégie globale.";
    strengths="Crédibilité forte auprès du COMEX grâce à des résultats concrets, capacité à gérer simultanément vision stratégique et contraintes opérationnelles, pilotage budgétaire maîtrisé.";
    development="Intégrer davantage d'innovation et de veille technologique pour anticiper les ruptures. Développer une culture d'expérimentation au sein des équipes pour ne pas rester en mode « delivery only ».";
    context="Parfait pour les programmes complexes à fort enjeu de delivery, les environnements réglementés (banque, santé, industrie), ou les DSI en phase de structuration et d'industrialisation.";
  }
  else if (ps[1]>=3&&ps[2]>=3) {
    profile="🔬 DSI Innovateur-Pragmatique";
    desc="Profil d'excellence technique combinant innovation maîtrisée et rigueur opérationnelle. Ce DSI est à l'aise dans les environnements technologiques complexes et sait transformer les idées innovantes en solutions concrètes et fiables. Il est reconnu pour sa capacité à maintenir un haut niveau de qualité technique tout en explorant de nouvelles approches.";
    strengths="Maîtrise technique approfondie, capacité à évaluer et intégrer les nouvelles technologies de manière pragmatique, gestion des risques et cybersécurité solides.";
    development="Renforcer le leadership d'influence et la communication au COMEX. Le savoir-faire technique doit se doubler d'une capacité à raconter une histoire stratégique convaincante.";
    context="Adapté aux environnements technologiques exigeants, aux DSI de grande taille avec des enjeux de modernisation du SI, ou aux contextes nécessitant une forte expertise technique (cybersécurité, cloud, IA).";
  }
  else if (ps[0]>=3) {
    profile="🎯 DSI Leader d'Influence";
    desc="Profil orienté leadership et influence stratégique. Ce DSI excelle dans la relation avec le COMEX et la conduite du changement. Il sait positionner la DSI comme un partenaire stratégique et obtenir les arbitrages nécessaires. Sa force réside dans sa capacité à mobiliser les parties prenantes et à piloter des transformations organisationnelles.";
    strengths="Excellente communication avec la Direction Générale, capacité à faire évoluer la perception de l'IT dans l'organisation, conduite du changement et gestion des parties prenantes.";
    development="Renforcer soit l'axe opérationnel (rigueur d'exécution, pilotage budgétaire) soit l'axe innovation (veille technologique, agilité) pour compléter le profil et gagner en crédibilité technique.";
    context="Pertinent pour les organisations où l'IT doit gagner en visibilité et en influence, les contextes de transformation culturelle, ou les DSI qui doivent repositionner leur rôle auprès de la Direction.";
  }
  else if (ps[1]>=3) {
    profile="🏗️ DSI Bâtisseur";
    desc="Profil solide, structuré et orienté résultats. Ce DSI est reconnu pour sa fiabilité et sa capacité à délivrer dans les délais et les budgets. Il maîtrise la complexité opérationnelle et apporte une rigueur appréciée dans le pilotage des projets et la gestion des risques. C'est un gestionnaire efficace qui sécurise l'existant tout en conduisant des évolutions maîtrisées.";
    strengths="Pilotage budgétaire rigoureux, gestion des risques et cybersécurité, maîtrise de la complexité des SI, orientation résultats et sens du delivery.";
    development="Développer le leadership stratégique (influence COMEX, vision IT) et la capacité d'innovation pour passer d'un rôle de gestionnaire à un rôle de leader transformationnel.";
    context="Adapté aux environnements stables nécessitant fiabilité et rigueur, aux contextes de rationalisation du SI, ou aux organisations où la DSI doit d'abord prouver sa crédibilité opérationnelle.";
  }
  else if (ps[2]>=3) {
    profile="💡 DSI Explorateur";
    desc="Profil tourné vers l'innovation et l'agilité. Ce DSI est un early adopter qui sait identifier les tendances technologiques et les opportunités d'innovation. Il est à l'aise avec l'incertitude et favorise une culture d'expérimentation au sein de ses équipes. Sa posture orientée client et sa résilience lui permettent de s'adapter rapidement aux changements.";
    strengths="Veille technologique active, culture d'innovation et d'expérimentation, agilité organisationnelle, orientation client et capacité d'adaptation.";
    development="Renforcer l'influence au COMEX pour faire valoir la vision innovation, et améliorer la rigueur opérationnelle (pilotage budgétaire, gestion des risques) pour sécuriser les initiatives.";
    context="Idéal pour les startups en croissance, les entreprises en phase d'exploration digitale, ou les contextes nécessitant une forte capacité d'adaptation et d'innovation rapide.";
  }
  else if (avg>=2.5) {
    profile="📈 DSI en Développement";
    desc="Profil présentant un socle de compétences solide et équilibré, avec un potentiel d'évolution significatif. Ce DSI dispose des fondamentaux nécessaires pour exercer la fonction mais n'a pas encore développé de dominante forte. C'est un profil prometteur qui gagnerait à se spécialiser et à renforcer une ou deux dimensions clés pour affirmer sa posture de leader.";
    strengths="Polyvalence et équilibre entre les différents piliers, capacité d'apprentissage, base solide pour évoluer dans plusieurs directions.";
    development="Identifier 2-3 dimensions prioritaires à développer en fonction du contexte visé. Un accompagnement type coaching de dirigeant ou mentorat par un DSI expérimenté serait particulièrement bénéfique.";
    context="Adapté à des postes de DSI dans des organisations de taille intermédiaire, ou comme adjoint/directeur de programme dans une grande DSI avant une prise de poste de DSI à part entière.";
  }
  else {
    profile="🌱 DSI Émergent";
    desc="Profil en phase de construction, avec des marges de progression importantes sur l'ensemble des dimensions évaluées. Les réponses suggèrent une approche encore opérationnelle et réactive, avec un potentiel à développer vers une posture plus stratégique et proactive. Ce profil bénéficierait fortement d'un plan de développement structuré.";
    strengths="Potentiel de croissance sur tous les axes, conscience des enjeux IT, socle technique sur lequel construire.";
    development="Prioriser le développement du leadership (prise de parole COMEX, conduite du changement) et de la rigueur opérationnelle (pilotage budgétaire, gestion des risques). Un parcours de formation dirigeant IT et un mentorat sont fortement recommandés.";
    context="Ce profil gagnerait à évoluer d'abord dans un rôle de directeur de programme ou responsable IT avant de prendre un poste de DSI, ou à être accompagné par un coach spécialisé dans un premier poste.";
  }
  return { top3, bottom3, avg, pillarScores: ps, profile, description: desc, strengths, development, context };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [view, setView] = useState("home");
  const [adminPwd, setAdminPwd] = useState("");
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [resumeCode, setResumeCode] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newFormat, setNewFormat] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const resultsRef = useRef(null);

  useEffect(() => { if (view === "admin") loadSessions(); }, [view]);
  useEffect(() => { if (view === "quiz") setStartTime(Date.now()); }, [view]);

  const loadSessions = async () => { setLoading(true); const s = await loadAllSessions(); setSessions(s); setLoading(false); };

  const createSession = async () => {
    const code = generateCode();
    const session = {
      code, candidateName: newName, candidateRole: newRole, format: newFormat,
      status: "pending", answers: {}, currentQ: 0, createdAt: new Date().toISOString(),
      totalTimeMs: 0, questions: selectQuestions(newFormat).map((q, i) => ({ ...q, idx: i })),
    };
    await saveSession(session);
    setNewName(""); setNewRole("");
    await loadSessions();
  };

  const startQuiz = (session) => {
    setCurrentSession(session);
    setQuestions(session.questions);
    setCurrentQ(session.currentQ || 0);
    setElapsedBefore(session.totalTimeMs || 0);
    setView("quiz");
  };

  const handleResume = async () => {
    setResumeError("");
    const code = resumeCode.trim().toUpperCase();
    if (!code) { setResumeError("Veuillez entrer un code"); return; }
    setLoading(true);
    const session = await loadSession(code);
    setLoading(false);
    if (!session) { setResumeError("Code introuvable. Vérifiez et réessayez."); return; }
    if (session.status === "completed") { setCurrentSession(session); setView("results"); return; }
    startQuiz(session);
  };

  const handleRankComplete = async (rankedOptions) => {
    const q = questions[currentQ];
    const ws = rankedOptions.reduce((s, o, i) => s + o.score * RANK_WEIGHTS[i], 0) / RANK_WEIGHTS.reduce((a, b) => a + b, 0);
    const newAnswers = { ...currentSession.answers };
    if (!newAnswers[q.dim]) newAnswers[q.dim] = [];
    newAnswers[q.dim] = [...newAnswers[q.dim], ws];
    const elapsed = elapsedBefore + (Date.now() - startTime);
    const nextQ = currentQ + 1;
    const isLast = nextQ >= questions.length;
    const updated = { ...currentSession, answers: newAnswers, currentQ: nextQ, totalTimeMs: elapsed, status: isLast ? "completed" : "in_progress" };
    setCurrentSession(updated);

    if (nextQ % 5 === 0 || isLast) await saveSession(updated);

    setTimeout(() => {
      if (isLast) { setView("results"); }
      else { setCurrentQ(nextQ); }
    }, 300);
  };

  const handleSaveAndQuit = async () => {
    setSaving(true);
    const elapsed = elapsedBefore + (Date.now() - startTime);
    const updated = { ...currentSession, currentQ, totalTimeMs: elapsed, status: "in_progress" };
    await saveSession(updated);
    setSaving(false);
    setView("home");
  };

  const computeScores = () => {
    if (!currentSession) return {};
    const scores = {};
    DIMENSIONS.forEach((dim) => {
      const arr = currentSession.answers[dim.id] || [];
      scores[dim.id] = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    });
    return scores;
  };

  const formatTime = (ms) => { const m = Math.floor(ms / 60000); const s = Math.floor((ms % 60000) / 1000); return `${m} min ${s}s`; };

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    const el = resultsRef.current;
    const name = currentSession?.candidateName?.replace(/\s+/g, "_") || "Candidat";
    // Add PDF mode class
    el.classList.add("pdf-mode");
    // Hide interactive elements
    const hideEls = el.querySelectorAll("[data-pdf-hide], [data-pdf-hide-btns]");
    hideEls.forEach(e => e.style.display = "none");
    const footer = el.querySelector("[data-section='footer']");
    if (footer) footer.style.borderTop = "none";
    // Use margin to create space for page numbers, html2canvas bg fills content area
    const opt = {
      margin: [16, 10, 12, 10],
      filename: `DSI-Profile_${name}.pdf`,
      image: { type: "png" },
      html2canvas: { scale: 2, backgroundColor: "#0a0b0e", useCORS: true, logging: false, windowWidth: 880 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };
    const worker = html2pdf().set(opt).from(el);
    await worker.toPdf().get("pdf").then((pdf) => {
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        // Fill margin areas with dark bg (top, bottom, left, right strips)
        pdf.setFillColor(10, 11, 14);
        pdf.rect(0, 0, pw, 16, "F"); // top margin
        pdf.rect(0, ph - 12, pw, 12, "F"); // bottom margin
        pdf.rect(0, 0, 10, ph, "F"); // left margin
        pdf.rect(pw - 10, 0, 10, ph, "F"); // right margin
        // Page number
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${i} / ${totalPages}`, pw / 2, ph - 4, { align: "center" });
      }
    }).save();
    // Restore
    el.classList.remove("pdf-mode");
    hideEls.forEach(e => e.style.display = "");
    if (footer) footer.style.borderTop = "";
  };

  const handleSendEmail = async () => {
    if (!candidateEmail.includes("@") || emailSending) return;
    setEmailSending(true);
    setEmailError("");
    setEmailSent(false);
    try {
      // Save email to JSONBin
      if (currentSession) {
        const updated = { ...currentSession, candidateEmail };
        setCurrentSession(updated);
        await saveSession(updated);
      }
      // Send email via Netlify Function
      const scores = computeScores();
      const analysis = getAnalysis(scores);
      const res = await fetch("/.netlify/functions/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: candidateEmail,
          candidateName: currentSession.candidateName,
          profileType: analysis.profile,
          globalScore: analysis.avg.toFixed(2),
          resultsCode: currentSession.code,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setEmailSent(true);
    } catch (e) {
      setEmailError("Erreur lors de l'envoi. Réessayez plus tard.");
      console.error("Email error:", e);
    } finally {
      setEmailSending(false);
    }
  };

  const progress = questions.length > 0 ? (currentQ / questions.length) * 100 : 0;

  const box = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 };
  const input = { width: "100%", padding: "14px 16px", fontSize: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, color: "#f0f0f0", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
  const btn = (active = true) => ({ padding: "14px 28px", fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", background: active ? "linear-gradient(135deg, #FECC02, #E5B800)" : "rgba(255,255,255,0.05)", color: active ? "#0a0b0e" : "#555", border: "none", borderRadius: 2, cursor: active ? "pointer" : "default" });
  const btnOutline = { padding: "12px 24px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 1, background: "transparent", color: "#888", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0e", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ===== HOME ===== */}
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px", textAlign: "center", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 32, alignSelf: "center" }}>
            <img src={amarilloLogoWhite} alt="Amarillo Search" style={{ width: "clamp(220px, 50vw, 340px)", objectFit: "contain", display: "block" }} />
          </div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #FECC02, #FEE066, #FECC02)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            DSI Profile™
          </h1>
          <p style={{ color: "#888", fontSize: 15, marginBottom: 48, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            Assessment comportemental pour Directeurs des Systèmes d'Information
          </p>

          <div style={{ ...box, padding: 32, marginBottom: 24, textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
              Reprendre une évaluation
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <input type="text" value={resumeCode} onChange={(e) => setResumeCode(e.target.value.toUpperCase())} placeholder="AMA-XXXX" maxLength={8}
                style={{ ...input, flex: 1, fontFamily: "'DM Mono', monospace", letterSpacing: 3, textAlign: "center", fontSize: 20 }}
                onKeyDown={(e) => e.key === "Enter" && handleResume()} />
              <button onClick={handleResume} disabled={loading} style={btn(!loading)}>
                {loading ? "..." : "→"}
              </button>
            </div>
            {resumeError && <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>{resumeError}</p>}
          </div>

          <button onClick={() => setView("adminLogin")} style={{ ...btnOutline, marginTop: 16 }}>
            Accès Administration
          </button>
        </div>
      )}

      {/* ===== ADMIN LOGIN ===== */}
      {view === "adminLogin" && (
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, marginBottom: 32, color: "#FECC02" }}>Administration</h2>
          <div style={{ ...box, padding: 32 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Mot de passe</label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input type={showPassword ? "text" : "password"} value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && adminPwd === ADMIN_PASSWORD) setView("admin"); }}
                style={{ ...input, paddingRight: 48 }} />
              <button onClick={() => setShowPassword(!showPassword)} type="button"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <button onClick={() => { if (adminPwd === ADMIN_PASSWORD) setView("admin"); }} style={btn(adminPwd.length > 0)}>Connexion</button>
          </div>
          <button onClick={() => setView("home")} style={{ ...btnOutline, marginTop: 24 }}>← Retour</button>
        </div>
      )}

      {/* ===== ADMIN PANEL ===== */}
      {view === "admin" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, color: "#FECC02", margin: 0 }}>Administration</h2>
            <button onClick={() => { setView("home"); setAdminPwd(""); }} style={btnOutline}>← Accueil</button>
          </div>

          <div style={{ ...box, padding: 32, marginBottom: 40 }}>
            <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#FECC02", marginBottom: 24 }}>Créer une nouvelle évaluation</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Candidat</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Prénom Nom" style={input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Poste visé</label>
                <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="DSI Groupe" style={input} />
              </div>
            </div>

            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Format</label>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {Object.entries(FORMATS).map(([key, fmt]) => (
                <button key={key} onClick={() => setNewFormat(key)}
                  style={{
                    flex: 1, padding: "16px 12px", textAlign: "center", borderRadius: 2, cursor: "pointer",
                    background: newFormat === key ? "rgba(232,168,56,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${newFormat === key ? "#FECC02" : "rgba(255,255,255,0.08)"}`,
                    color: newFormat === key ? "#FECC02" : "#888",
                  }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{fmt.label}</div>
                  <div style={{ fontSize: 12 }}>{fmt.total} questions</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{fmt.duration}</div>
                </button>
              ))}
            </div>

            <button onClick={createSession} disabled={!newName.trim()} style={{ ...btn(!!newName.trim()), width: "100%" }}>
              Générer le code d'accès
            </button>
          </div>

          <div style={{ ...box, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", margin: 0 }}>Sessions ({sessions.length})</h3>
              <button onClick={loadSessions} style={{ ...btnOutline, padding: "6px 14px", fontSize: 11 }}>Rafraîchir</button>
            </div>

            {sessions.length === 0 && <p style={{ color: "#555", textAlign: "center", padding: 24 }}>Aucune session créée</p>}

            {sessions.map((s) => {
              const statusColors = { pending: "#888", in_progress: "#FECC02", completed: "#52B788" };
              const statusLabels = { pending: "En attente", in_progress: "En cours", completed: "Terminé" };
              return (
                <div key={s.code} style={{ padding: "16px 20px", marginBottom: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{s.role} · {FORMATS[s.format]?.label}{s.email ? ` · ${s.email}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, letterSpacing: 3, color: "#FECC02", fontWeight: 700 }}>{s.code}</span>
                    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 2, background: `${statusColors[s.status]}22`, color: statusColors[s.status], fontFamily: "'DM Mono', monospace" }}>
                      {statusLabels[s.status]}
                    </span>
                    {s.status === "completed" && (
                      <button onClick={async () => { const full = await loadSession(s.code); if (full) { setCurrentSession(full); setView("results"); } }}
                        style={{ ...btnOutline, padding: "6px 14px", fontSize: 11, color: "#52B788", borderColor: "#52B78844" }}>
                        Voir résultats
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== QUIZ ===== */}
      {view === "quiz" && questions.length > 0 && currentQ < questions.length && (() => {
        const q = questions[currentQ];
        const dim = DIMENSIONS.find((d) => d.id === q.dim);
        const pillar = PILLARS[dim.pillar];
        const fmt = FORMATS[currentSession.format];
        return (
          <div style={{ maxWidth: 750, margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#FECC02", letterSpacing: 2 }}>AMARILLO DSI PROFILE™</span>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#666" }}>{currentQ + 1} / {questions.length}</span>
                <button onClick={handleSaveAndQuit} disabled={saving}
                  style={{ ...btnOutline, padding: "6px 14px", fontSize: 11 }}>
                  {saving ? "Sauvegarde..." : "Sauvegarder et quitter"}
                </button>
              </div>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${progress}%`, background: "linear-gradient(90deg, #FECC02, #E5B800)", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 32, fontFamily: "'DM Mono', monospace" }}>
              {fmt.label} · {fmt.duration} · Code : {currentSession.code}
            </div>

            <div key={currentQ} style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ padding: "6px 14px", borderRadius: 2, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 1, background: `${pillar.color}15`, color: pillar.color, border: `1px solid ${pillar.color}33` }}>{pillar.name}</span>
                <span style={{ fontSize: 12, color: "#666" }}>›</span>
                <span style={{ fontSize: 13, color: dim.color }}>{dim.icon} {dim.name}</span>
              </div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, lineHeight: 1.4, marginBottom: 32, color: "#f0f0f0" }}>{q.text}</h2>
              <RankingCard key={`${currentQ}-${q.dim}`} question={q} dimColor={dim.color} onComplete={handleRankComplete} />
            </div>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
          </div>
        );
      })()}

      {/* ===== RESULTS ===== */}
      {view === "results" && currentSession && (() => {
        const scores = computeScores();
        const analysis = getAnalysis(scores);
        return (
          <div ref={resultsRef} style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", background: "#0a0b0e" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ marginBottom: 24 }}>
                <img src={amarilloLogoWhite} alt="Amarillo Search" style={{ width: "clamp(180px, 40vw, 280px)", objectFit: "contain", display: "block", margin: "0 auto 16px" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 4, color: "#FECC02", textTransform: "uppercase", fontWeight: 500 }}>Rapport d'évaluation</span>
              </div>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em", color: "#f0f0f0" }}>{currentSession.candidateName}</h1>
              <p style={{ color: "#888", fontSize: 15 }}>
                {currentSession.candidateRole || "DSI"} · {FORMATS[currentSession.format]?.label} · {new Date(currentSession.createdAt).toLocaleDateString("fr-FR")}
                {currentSession.totalTimeMs > 0 && ` · Temps : ${formatTime(currentSession.totalTimeMs)}`}
              </p>
            </div>

            <div style={{ padding: "32px 36px", marginBottom: 40, background: "rgba(254,204,2,0.03)", border: "1px solid rgba(254,204,2,0.12)", borderLeft: "4px solid #FECC02", borderRadius: 2 }}>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, marginBottom: 12, color: "#FECC02" }}>{analysis.profile}</h2>
              <div style={{ display: "inline-block", marginBottom: 16, padding: "6px 16px", background: "rgba(254,204,2,0.08)", borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#FECC02" }}>
                Score global : {analysis.avg.toFixed(2)} / 4.00
              </div>
              <p style={{ color: "#bbb", lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>{analysis.description}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                <div style={{ padding: "16px 20px", background: "rgba(82,183,136,0.05)", border: "1px solid rgba(82,183,136,0.15)", borderRadius: 2 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#52B788", marginBottom: 8 }}>Atouts identifiés</div>
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{analysis.strengths}</p>
                </div>
                <div style={{ padding: "16px 20px", background: "rgba(254,204,2,0.03)", border: "1px solid rgba(254,204,2,0.12)", borderRadius: 2 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#FECC02", marginBottom: 8 }}>Axes de développement recommandés</div>
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{analysis.development}</p>
                </div>
                <div style={{ padding: "16px 20px", background: "rgba(58,91,160,0.05)", border: "1px solid rgba(58,91,160,0.15)", borderRadius: 2 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#6A97DF", marginBottom: 8 }}>Environnements adaptés</div>
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{analysis.context}</p>
                </div>
              </div>
            </div>

            <div style={{ ...box, padding: 32, marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 24, textAlign: "center" }}>Profil Radar — 12 Dimensions</h3>
              <RadarChart scores={scores} />
            </div>

            <div data-section="pillars" style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
              {PILLARS.map((p, i) => (
                <div key={i} style={{ flex: "1 1 250px", padding: "24px 28px", background: `${p.color}08`, border: `1px solid ${p.color}22`, borderRadius: 2 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: p.color, marginBottom: 12 }}>{p.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, color: "#f0f0f0" }}>{analysis.pillarScores[i].toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>/4.00</div>
                </div>
              ))}
            </div>

            {PILLARS.map((p, pi) => (
              <div key={pi} data-section="pillar-detail" style={{ ...box, padding: "28px 32px", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: p.color, marginBottom: 20 }}>{p.name}</h3>
                {DIMENSIONS.filter(d => d.pillar === pi).map(dim => <ScoreBar key={dim.id} dimension={dim} score={scores[dim.id]} />)}
              </div>
            ))}

            <div data-section="synthesis" style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px", padding: "28px 32px", background: "rgba(45,106,79,0.06)", border: "1px solid rgba(45,106,79,0.2)", borderRadius: 2 }}>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#52B788", marginBottom: 16 }}>Points forts</h3>
                {analysis.top3.map(dim => (
                  <div key={dim.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", color: "#aaa", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span>{dim.icon} {dim.name}</span>
                    <span style={{ color: "#52B788", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{scores[dim.id].toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: "1 1 280px", padding: "28px 32px", background: "rgba(232,168,56,0.04)", border: "1px solid rgba(232,168,56,0.15)", borderRadius: 2 }}>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#FECC02", marginBottom: 16 }}>Axes de développement</h3>
                {analysis.bottom3.map(dim => (
                  <div key={dim.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", color: "#aaa", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span>{dim.icon} {dim.name}</span>
                    <span style={{ color: "#FECC02", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{scores[dim.id].toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Email section --- */}
            <div data-pdf-hide="true" style={{ ...box, padding: 32, marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 16 }}>Recevoir vos résultats par email</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder="votre@email.com"
                  style={{ ...input, flex: 1, minWidth: 200 }}
                  onKeyDown={(e) => e.key === "Enter" && candidateEmail.includes("@") && !emailSending && handleSendEmail()} />
                <button onClick={handleSendEmail} disabled={!candidateEmail.includes("@") || emailSending}
                  style={btn(candidateEmail.includes("@") && !emailSending)}>
                  {emailSending ? "Envoi..." : emailSent ? "✓ Envoyé" : "Envoyer"}
                </button>
              </div>
              {emailSent && <p style={{ color: "#52B788", fontSize: 13, marginTop: 8 }}>✓ Email envoyé avec succès !</p>}
              {emailError && <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>{emailError}</p>}
            </div>

            {/* --- Footer --- */}
            <div data-section="footer" style={{ textAlign: "center", padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={amarilloLogoWhite} alt="Amarillo Search" style={{ width: 140, objectFit: "contain", marginBottom: 12, opacity: 0.5, display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, color: "#FECC0288", textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>DSI Profile™</div>
              <p style={{ fontSize: 12, color: "#444", marginBottom: 16 }}>Rapport confidentiel · Code session : {currentSession.code}</p>
              <div data-pdf-hide-btns="true" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={handleDownloadPDF} style={{ ...btnOutline, color: "#FECC02", borderColor: "#FECC0255" }}>
                  📄 Télécharger PDF
                </button>
                <button onClick={() => { setCurrentSession(null); setView("home"); }} style={btnOutline}>← Retour à l'accueil</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
