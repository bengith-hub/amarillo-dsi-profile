// ============================================================
// AMARILLO DSI PROFILE™ — Assessment Configuration
// All DSI-specific data: dimensions, pillars, questions, profiles
// ============================================================

import methodology from "./methodology";

const dsi = {
  id: "dsi",
  label: "DSI Profile™",
  subtitle: "Assessment comportemental pour Directeurs des Systèmes d'Information",
  rolePlaceholder: "DSI Groupe",
  defaultRole: "DSI",
  pdfPrefix: "DSI-Profile",

  dimensions: [
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
  ],

  pillars: [
    { name: "Leadership & Influence", color: "#FECC02" },
    { name: "Excellence Opérationnelle", color: "#2D6A4F" },
    { name: "Innovation & Posture", color: "#3A5BA0" },
  ],

  formats: {
    court: { label: "Court", questionsPerDim: 3, total: 42, mirrorCount: 4, desirabilityCount: 2, duration: "~17 min" },
    standard: { label: "Standard", questionsPerDim: 4, total: 58, mirrorCount: 6, desirabilityCount: 4, duration: "~24 min" },
    complet: { label: "Complet", questionsPerDim: 5, total: 70, mirrorCount: 6, desirabilityCount: 4, duration: "~29 min" },
  },

  // 8 profiles ordered by priority (first match wins)
  // Weighted scoring: each profile defined by relative emphasis across 3 pillars
  // [Leadership & Influence, Excellence Opérationnelle, Innovation & Posture]
  profiles: [
    {
      name: "🚀 DSI Visionnaire",
      weights: [0.45, 0.10, 0.45],
      minScore: 3.0,
      description: "Profil de leader transformationnel combinant une forte capacité d'influence stratégique et un sens aigu de l'innovation. Ce DSI sait porter une vision ambitieuse auprès du COMEX tout en restant connecté aux tendances technologiques. Il excelle dans la conduite de transformations digitales d'envergure et sait fédérer les équipes autour d'un projet de changement.",
      strengths: "Capacité à articuler une vision technologique alignée sur la stratégie business, influence naturelle auprès de la Direction Générale, aptitude à identifier et exploiter les innovations disruptives.",
      development: "Veiller à ne pas négliger l'excellence opérationnelle et le delivery au quotidien. La vision doit s'accompagner de rigueur d'exécution pour maintenir la crédibilité.",
      context: "Idéal pour les entreprises en pleine transformation digitale, les organisations cherchant à repositionner leur IT comme levier stratégique, ou les contextes de forte croissance.",
    },
    {
      name: "⚡ DSI Stratège-Opérationnel",
      weights: [0.45, 0.45, 0.10],
      minScore: 3.0,
      description: "Profil rare et très recherché alliant un leadership influent à une excellence d'exécution remarquable. Ce DSI sait à la fois porter des projets stratégiques au COMEX et garantir un delivery irréprochable. Il maîtrise la gestion de la complexité et sait piloter des programmes d'envergure avec rigueur tout en maintenant une influence déterminante sur la stratégie globale.",
      strengths: "Crédibilité forte auprès du COMEX grâce à des résultats concrets, capacité à gérer simultanément vision stratégique et contraintes opérationnelles, pilotage budgétaire maîtrisé.",
      development: "Intégrer davantage d'innovation et de veille technologique pour anticiper les ruptures. Développer une culture d'expérimentation au sein des équipes pour ne pas rester en mode « delivery only ».",
      context: "Parfait pour les programmes complexes à fort enjeu de delivery, les environnements réglementés (banque, santé, industrie), ou les DSI en phase de structuration et d'industrialisation.",
    },
    {
      name: "🔬 DSI Innovateur-Pragmatique",
      weights: [0.10, 0.45, 0.45],
      minScore: 3.0,
      description: "Profil d'excellence technique combinant innovation maîtrisée et rigueur opérationnelle. Ce DSI est à l'aise dans les environnements technologiques complexes et sait transformer les idées innovantes en solutions concrètes et fiables. Il est reconnu pour sa capacité à maintenir un haut niveau de qualité technique tout en explorant de nouvelles approches.",
      strengths: "Maîtrise technique approfondie, capacité à évaluer et intégrer les nouvelles technologies de manière pragmatique, gestion des risques et cybersécurité solides.",
      development: "Renforcer le leadership d'influence et la communication au COMEX. Le savoir-faire technique doit se doubler d'une capacité à raconter une histoire stratégique convaincante.",
      context: "Adapté aux environnements technologiques exigeants, aux DSI de grande taille avec des enjeux de modernisation du SI, ou aux contextes nécessitant une forte expertise technique (cybersécurité, cloud, IA).",
    },
    {
      name: "🎯 DSI Leader d'Influence",
      weights: [0.65, 0.15, 0.20],
      minScore: 3.0,
      description: "Profil orienté leadership et influence stratégique. Ce DSI excelle dans la relation avec le COMEX et la conduite du changement. Il sait positionner la DSI comme un partenaire stratégique et obtenir les arbitrages nécessaires. Sa force réside dans sa capacité à mobiliser les parties prenantes et à piloter des transformations organisationnelles.",
      strengths: "Excellente communication avec la Direction Générale, capacité à faire évoluer la perception de l'IT dans l'organisation, conduite du changement et gestion des parties prenantes.",
      development: "Renforcer soit l'axe opérationnel (rigueur d'exécution, pilotage budgétaire) soit l'axe innovation (veille technologique, agilité) pour compléter le profil et gagner en crédibilité technique.",
      context: "Pertinent pour les organisations où l'IT doit gagner en visibilité et en influence, les contextes de transformation culturelle, ou les DSI qui doivent repositionner leur rôle auprès de la Direction.",
    },
    {
      name: "🏗️ DSI Bâtisseur",
      weights: [0.15, 0.65, 0.20],
      minScore: 3.0,
      description: "Profil solide, structuré et orienté résultats. Ce DSI est reconnu pour sa fiabilité et sa capacité à délivrer dans les délais et les budgets. Il maîtrise la complexité opérationnelle et apporte une rigueur appréciée dans le pilotage des projets et la gestion des risques. C'est un gestionnaire efficace qui sécurise l'existant tout en conduisant des évolutions maîtrisées.",
      strengths: "Pilotage budgétaire rigoureux, gestion des risques et cybersécurité, maîtrise de la complexité des SI, orientation résultats et sens du delivery.",
      development: "Développer le leadership stratégique (influence COMEX, vision IT) et la capacité d'innovation pour passer d'un rôle de gestionnaire à un rôle de leader transformationnel.",
      context: "Adapté aux environnements stables nécessitant fiabilité et rigueur, aux contextes de rationalisation du SI, ou aux organisations où la DSI doit d'abord prouver sa crédibilité opérationnelle.",
    },
    {
      name: "💡 DSI Explorateur",
      weights: [0.20, 0.15, 0.65],
      minScore: 3.0,
      description: "Profil tourné vers l'innovation et l'agilité. Ce DSI est un early adopter qui sait identifier les tendances technologiques et les opportunités d'innovation. Il est à l'aise avec l'incertitude et favorise une culture d'expérimentation au sein de ses équipes. Sa posture orientée client et sa résilience lui permettent de s'adapter rapidement aux changements.",
      strengths: "Veille technologique active, culture d'innovation et d'expérimentation, agilité organisationnelle, orientation client et capacité d'adaptation.",
      development: "Renforcer l'influence au COMEX pour faire valoir la vision innovation, et améliorer la rigueur opérationnelle (pilotage budgétaire, gestion des risques) pour sécuriser les initiatives.",
      context: "Idéal pour les startups en croissance, les entreprises en phase d'exploration digitale, ou les contextes nécessitant une forte capacité d'adaptation et d'innovation rapide.",
    },
    {
      name: "📈 DSI en Développement",
      weights: [0.33, 0.34, 0.33],
      minScore: 2.2,
      description: "Profil présentant un socle de compétences solide et équilibré, avec un potentiel d'évolution significatif. Ce DSI dispose des fondamentaux nécessaires pour exercer la fonction mais n'a pas encore développé de dominante forte. C'est un profil prometteur qui gagnerait à se spécialiser et à renforcer une ou deux dimensions clés pour affirmer sa posture de leader.",
      strengths: "Polyvalence et équilibre entre les différents piliers, capacité d'apprentissage, base solide pour évoluer dans plusieurs directions.",
      development: "Identifier 2-3 dimensions prioritaires à développer en fonction du contexte visé. Un accompagnement type coaching de dirigeant ou mentorat par un DSI expérimenté serait particulièrement bénéfique.",
      context: "Adapté à des postes de DSI dans des organisations de taille intermédiaire, ou comme adjoint/directeur de programme dans une grande DSI avant une prise de poste de DSI à part entière.",
    },
    {
      name: "🌱 DSI Émergent",
      weights: [0.33, 0.34, 0.33],
      minScore: 0,
      description: "Profil en phase de construction, avec des marges de progression importantes sur l'ensemble des dimensions évaluées. Les réponses suggèrent une approche encore opérationnelle et réactive, avec un potentiel à développer vers une posture plus stratégique et proactive. Ce profil bénéficierait fortement d'un plan de développement structuré.",
      strengths: "Potentiel de croissance sur tous les axes, conscience des enjeux IT, socle technique sur lequel construire.",
      development: "Prioriser le développement du leadership (prise de parole COMEX, conduite du changement) et de la rigueur opérationnelle (pilotage budgétaire, gestion des risques). Un parcours de formation dirigeant IT et un mentorat sont fortement recommandés.",
      context: "Ce profil gagnerait à évoluer d'abord dans un rôle de directeur de programme ou responsable IT avant de prendre un poste de DSI, ou à être accompagné par un coach spécialisé dans un premier poste.",
    },
  ],

  methodology,

  // Reliability configuration: coherence index + social desirability
  reliabilityConfig: {
    coherenceThreshold: 0.8,  // max acceptable gap between mirror pairs (on weighted 1.48-3.52 scale)
    desirabilityLevels: [
      { max: 55, label: "Sincère", color: "#52B788" },
      { max: 75, label: "Tendance à embellir", color: "#FECC02" },
      { max: 100, label: "Forte désirabilité sociale", color: "#e74c3c" },
    ],
    coherenceLevels: [
      { min: 70, label: "Fiable", color: "#52B788" },
      { min: 50, label: "À vérifier", color: "#FECC02" },
      { min: 0, label: "Incohérent", color: "#e74c3c" },
    ],
  },

  // Mirror pairs: each entry links a mirror question to its original
  // mirrorDim is the key used in session.answers for storing mirror scores
  mirrorPairs: [
    { mirrorDim: "mirror_vision", originalDim: "vision", originalOrder: 1 },
    { mirrorDim: "mirror_leadership", originalDim: "leadership", originalOrder: 2 },
    { mirrorDim: "mirror_change", originalDim: "change", originalOrder: 3 },
    { mirrorDim: "mirror_influence", originalDim: "influence", originalOrder: 1 },
    { mirrorDim: "mirror_budget", originalDim: "budget", originalOrder: 3 },
    { mirrorDim: "mirror_resilience", originalDim: "resilience", originalOrder: 3 },
  ],

  // 60 questions (5 per dimension)
  // Score calibration: non-linear scoring to reduce social desirability bias
  // ~40% straightforward (1-2-3-4), ~30% moderate reorder, ~30% significant reorder
  questions: [
    // =============================================
    // VISION STRATÉGIQUE IT
    // =============================================
    { dim: "vision", order: 1, text: "Lors de l'élaboration d'un schéma directeur SI, vous privilégiez :", options: [
      { id: "a", text: "La stabilité et la continuité des systèmes existants", score: 1 },
      { id: "b", text: "L'optimisation des coûts et l'efficacité opérationnelle", score: 2 },
      { id: "c", text: "L'alignement avec la stratégie business à 3 ans", score: 4 },
      { id: "d", text: "La création de nouveaux avantages compétitifs par la technologie", score: 3 },
    ]},
    { dim: "vision", order: 2, text: "Face à une technologie émergente potentiellement disruptive pour votre secteur :", options: [
      { id: "a", text: "Vous attendez que d'autres l'adoptent avant de vous positionner", score: 1 },
      { id: "b", text: "Vous lancez une veille approfondie pour évaluer le potentiel", score: 2 },
      { id: "c", text: "Vous proposez un POC au COMEX avec une analyse d'impact business", score: 4 },
      { id: "d", text: "Vous construisez une feuille de route stratégique intégrant cette technologie", score: 3 },
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
      { id: "c", text: "Vous intégrez un budget dédié dans chaque cycle budgétaire", score: 4 },
      { id: "d", text: "Vous en faites un axe stratégique avec un plan pluriannuel présenté au Board", score: 3 },
    ]},
    { dim: "vision", order: 5, text: "Le CEO vous demande 'Quelle sera notre IT dans 5 ans ?'. Vous répondez :", options: [
      { id: "a", text: "En présentant les évolutions prévues de l'infrastructure", score: 1 },
      { id: "b", text: "En décrivant les projets majeurs du pipeline", score: 2 },
      { id: "c", text: "En articulant une vision technologique alignée sur le plan stratégique", score: 3 },
      { id: "d", text: "En co-construisant une vision business-tech qui challenge le modèle d'affaires", score: 4 },
    ]},

    // =============================================
    // LEADERSHIP
    // =============================================
    { dim: "leadership", order: 1, text: "Pour attirer les meilleurs talents tech dans votre équipe :", options: [
      { id: "a", text: "Vous comptez principalement sur la rémunération compétitive", score: 1 },
      { id: "b", text: "Vous misez sur la qualité des projets et des technologies utilisées", score: 3 },
      { id: "c", text: "Vous développez une marque employeur tech et un parcours de carrière clair", score: 4 },
      { id: "d", text: "Vous créez un écosystème d'innovation avec contributions open source et conférences", score: 2 },
    ]},
    { dim: "leadership", order: 2, text: "Un conflit éclate entre deux de vos managers sur les priorités :", options: [
      { id: "a", text: "Vous tranchez la décision vous-même rapidement", score: 1 },
      { id: "b", text: "Vous organisez une réunion pour entendre les deux parties", score: 2 },
      { id: "c", text: "Vous facilitez un échange structuré pour qu'ils trouvent un compromis", score: 4 },
      { id: "d", text: "Vous utilisez ce conflit pour renforcer la collaboration et revoir la gouvernance", score: 3 },
    ]},
    { dim: "leadership", order: 3, text: "Votre approche du développement des compétences de vos équipes :", options: [
      { id: "a", text: "Chacun est responsable de sa propre formation", score: 1 },
      { id: "b", text: "Vous proposez un catalogue de formations annuel", score: 2 },
      { id: "c", text: "Vous définissez des parcours individualisés avec des objectifs de montée en compétence", score: 3 },
      { id: "d", text: "Vous créez une culture d'apprentissage continu avec mentorat et communautés de pratiques", score: 4 },
    ]},
    { dim: "leadership", order: 4, text: "Face à un collaborateur talentueux mais difficile à manager :", options: [
      { id: "a", text: "Vous tolérez son comportement tant qu'il délivre", score: 1 },
      { id: "b", text: "Vous recadrez fermement avec des objectifs comportementaux clairs", score: 3 },
      { id: "c", text: "Vous travaillez avec lui pour comprendre ses motivations et adapter son rôle", score: 4 },
      { id: "d", text: "Vous en faites un cas d'école pour développer votre intelligence managériale", score: 2 },
    ]},
    { dim: "leadership", order: 5, text: "Nouveau poste de DSI — votre priorité dans les 100 premiers jours :", options: [
      { id: "a", text: "Comprendre l'infrastructure et les systèmes en place", score: 1 },
      { id: "b", text: "Rencontrer chaque membre de votre équipe directe", score: 3 },
      { id: "c", text: "Évaluer les compétences, identifier les leaders et construire votre équipe", score: 4 },
      { id: "d", text: "Créer une vision partagée et mobiliser l'équipe autour d'un projet fédérateur", score: 2 },
    ]},

    // =============================================
    // CONDUITE DU CHANGEMENT
    // =============================================
    { dim: "change", order: 1, text: "Pour déployer un nouvel ERP dans l'entreprise :", options: [
      { id: "a", text: "Vous planifiez le déploiement technique et formez les utilisateurs", score: 1 },
      { id: "b", text: "Vous impliquez les key users métiers dans les phases de test", score: 2 },
      { id: "c", text: "Vous créez un réseau d'ambassadeurs et un plan de communication multi-canal", score: 3 },
      { id: "d", text: "Vous co-construisez la transformation avec les métiers en repensant les processus", score: 4 },
    ]},
    { dim: "change", order: 2, text: "La résistance au changement dans votre organisation est :", options: [
      { id: "a", text: "Un obstacle à surmonter par la formation et la communication", score: 1 },
      { id: "b", text: "Un signal à écouter pour ajuster le rythme de déploiement", score: 3 },
      { id: "c", text: "Une source d'information précieuse pour améliorer votre approche", score: 4 },
      { id: "d", text: "Une opportunité de transformer la culture d'entreprise en profondeur", score: 2 },
    ]},
    { dim: "change", order: 3, text: "Votre meilleur levier pour réussir une transformation digitale :", options: [
      { id: "a", text: "Des outils performants et une infrastructure solide", score: 1 },
      { id: "b", text: "Le sponsorship fort de la Direction Générale", score: 3 },
      { id: "c", text: "L'engagement des managers intermédiaires comme relais du changement", score: 4 },
      { id: "d", text: "Une culture d'expérimentation qui permet l'échec et l'apprentissage rapide", score: 2 },
    ]},
    { dim: "change", order: 4, text: "Un projet de transformation prend du retard, les métiers se découragent :", options: [
      { id: "a", text: "Vous renforcez les ressources pour rattraper le planning", score: 1 },
      { id: "b", text: "Vous revoyez le périmètre pour livrer un MVP rapidement", score: 3 },
      { id: "c", text: "Vous organisez des quick wins visibles pour redonner confiance", score: 4 },
      { id: "d", text: "Vous transformez la crise en moment de vérité et redéfinissez l'ambition", score: 2 },
    ]},
    { dim: "change", order: 5, text: "Votre vision de la transformation digitale :", options: [
      { id: "a", text: "Digitaliser les processus existants pour gagner en efficacité", score: 1 },
      { id: "b", text: "Moderniser le SI pour supporter la croissance de l'entreprise", score: 2 },
      { id: "c", text: "Transformer les parcours clients et collaborateurs grâce au digital", score: 3 },
      { id: "d", text: "Réinventer le modèle d'affaires en exploitant la data et les nouvelles technologies", score: 4 },
    ]},

    // =============================================
    // INFLUENCE COMEX
    // =============================================
    { dim: "influence", order: 1, text: "En comité de direction, pour un projet IT majeur vous mettez en avant :", options: [
      { id: "a", text: "Les spécifications techniques et l'architecture proposée", score: 1 },
      { id: "b", text: "Le planning, le budget et les risques du projet", score: 2 },
      { id: "c", text: "Le ROI attendu et l'impact sur les KPIs business", score: 4 },
      { id: "d", text: "La vision stratégique et la transformation de l'avantage compétitif", score: 3 },
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
      { id: "c", text: "Vous êtes perçu comme un partenaire stratégique", score: 4 },
      { id: "d", text: "Vous influencez activement la stratégie globale et challengez les autres directions", score: 3 },
    ]},
    { dim: "influence", order: 4, text: "Pour convaincre le Board d'investir dans l'IA :", options: [
      { id: "a", text: "Vous présentez les capacités techniques de l'IA et ses cas d'usage", score: 1 },
      { id: "b", text: "Vous montrez ce que font les concurrents et les risques de ne pas agir", score: 2 },
      { id: "c", text: "Vous présentez un business case chiffré avec des pilotes concrets", score: 4 },
      { id: "d", text: "Vous racontez une histoire de transformation projetant l'entreprise dans 3 ans", score: 3 },
    ]},
    { dim: "influence", order: 5, text: "Incident de cybersécurité majeur — votre communication au COMEX :", options: [
      { id: "a", text: "Vous détaillez l'incident technique et les mesures correctives", score: 1 },
      { id: "b", text: "Vous présentez l'impact opérationnel et le plan de remédiation", score: 3 },
      { id: "c", text: "Communication transparente sur l'impact business et actions immédiates", score: 4 },
      { id: "d", text: "Vous transformez la crise en opportunité pour renforcer la stratégie cyber", score: 2 },
    ]},

    // =============================================
    // PILOTAGE BUDGÉTAIRE
    // =============================================
    { dim: "budget", order: 1, text: "Votre approche du budget IT :", options: [
      { id: "a", text: "Vous reconduisez le budget N-1 avec des ajustements", score: 1 },
      { id: "b", text: "Vous construisez un budget bottom-up basé sur les demandes", score: 2 },
      { id: "c", text: "Vous articulez Run vs. Build avec un TCO par service", score: 4 },
      { id: "d", text: "Budget orienté valeur avec métriques de ROI par initiative", score: 3 },
    ]},
    { dim: "budget", order: 2, text: "Pour justifier un investissement cloud de 2M€ :", options: [
      { id: "a", text: "Vous comparez les coûts on-premise vs. cloud", score: 1 },
      { id: "b", text: "TCO sur 5 ans avec les gains d'efficacité", score: 3 },
      { id: "c", text: "Business case intégrant agilité, time-to-market et scalabilité", score: 4 },
      { id: "d", text: "Démonstration de nouveaux modèles de revenus permis par le cloud", score: 2 },
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
      { id: "c", text: "Contribution aux objectifs business avec KPIs partagés", score: 4 },
      { id: "d", text: "Tableau de bord : valeur créée, vélocité d'innovation, maturité digitale", score: 3 },
    ]},
    { dim: "budget", order: 5, text: "Votre relation avec les prestataires IT :", options: [
      { id: "a", text: "Négociation principalement sur les prix", score: 1 },
      { id: "b", text: "Contrats avec SLA et pénalités clairs", score: 3 },
      { id: "c", text: "Partenariats stratégiques avec engagements mutuels", score: 4 },
      { id: "d", text: "Co-innovation avec un écosystème de partenaires", score: 2 },
    ]},

    // =============================================
    // GESTION DES RISQUES
    // =============================================
    { dim: "risk", order: 1, text: "Votre approche de la cybersécurité :", options: [
      { id: "a", text: "Solutions de sécurité standard du marché", score: 1 },
      { id: "b", text: "Politique de sécurité formalisée avec audits réguliers", score: 2 },
      { id: "c", text: "Stratégie cyber alignée sur les risques business, RSSI au COMEX", score: 4 },
      { id: "d", text: "Cyber-résilience intégrée dans la culture, Zero Trust, exercices de crise", score: 3 },
    ]},
    { dim: "risk", order: 2, text: "Face à une nouvelle réglementation (NIS2, DORA, RGPD...) :", options: [
      { id: "a", text: "Mise en conformité des systèmes concernés", score: 1 },
      { id: "b", text: "Projet dédié avec chef de projet et planning", score: 2 },
      { id: "c", text: "Intégration dans la gouvernance IT et sensibilisation des métiers", score: 3 },
      { id: "d", text: "Transformation de la contrainte réglementaire en avantage compétitif", score: 4 },
    ]},
    { dim: "risk", order: 3, text: "Un ransomware paralyse 30% de votre SI un vendredi soir :", options: [
      { id: "a", text: "Mobilisation de l'équipe technique pour restaurer", score: 1 },
      { id: "b", text: "Activation du PCA/PRA et information de la direction", score: 3 },
      { id: "c", text: "Pilotage de la cellule de crise avec communication coordonnée", score: 4 },
      { id: "d", text: "Orchestration de la réponse technique, business et médiatique", score: 2 },
    ]},
    { dim: "risk", order: 4, text: "Votre cartographie des risques IT :", options: [
      { id: "a", text: "Gestion au fil de l'eau quand les risques se matérialisent", score: 1 },
      { id: "b", text: "Registre des risques mis à jour annuellement", score: 2 },
      { id: "c", text: "Cartographie dynamique intégrée au risk management", score: 4 },
      { id: "d", text: "Approche prédictive avec scénarios prospectifs et stress tests", score: 3 },
    ]},
    { dim: "risk", order: 5, text: "La gestion des données sensibles :", options: [
      { id: "a", text: "Chaque système a ses propres règles d'accès", score: 1 },
      { id: "b", text: "Politique de classification des données", score: 2 },
      { id: "c", text: "Gouvernance data avec DPO et data lineage", score: 3 },
      { id: "d", text: "Data comme actif stratégique avec CDO et gouvernance transverse", score: 4 },
    ]},

    // =============================================
    // COMPLEXITÉ
    // =============================================
    { dim: "complexity", order: 1, text: "SI avec 200 applications dont 40% en fin de vie :", options: [
      { id: "a", text: "Maintien de l'existant tant que ça fonctionne", score: 1 },
      { id: "b", text: "Planification des migrations les plus urgentes", score: 2 },
      { id: "c", text: "Plan de rationalisation pluriannuel avec critères objectifs", score: 4 },
      { id: "d", text: "Refonte de l'architecture en approche API-first et microservices", score: 3 },
    ]},
    { dim: "complexity", order: 2, text: "Projet impliquant 8 directions métier aux besoins contradictoires :", options: [
      { id: "a", text: "Tentative de satisfaire tout le monde avec un périmètre large", score: 1 },
      { id: "b", text: "Priorisation des besoins par criticité business", score: 3 },
      { id: "c", text: "Gouvernance projet avec arbitrages structurés", score: 4 },
      { id: "d", text: "Approche produit avec squads cross-fonctionnelles et itérations rapides", score: 2 },
    ]},
    { dim: "complexity", order: 3, text: "Intégration post-acquisition d'une filiale :", options: [
      { id: "a", text: "Migration progressive vers vos systèmes existants", score: 1 },
      { id: "b", text: "Audit SI et plan d'intégration", score: 2 },
      { id: "c", text: "Arbitrage convergence/coexistence selon la valeur business", score: 4 },
      { id: "d", text: "Architecture cible prenant le meilleur des deux SI", score: 3 },
    ]},
    { dim: "complexity", order: 4, text: "Gestion d'un portefeuille de 50 projets simultanés :", options: [
      { id: "a", text: "Chaque chef de projet gère son périmètre en autonomie", score: 1 },
      { id: "b", text: "PMO qui consolide les reportings", score: 2 },
      { id: "c", text: "Pilotage par la valeur avec comité de portefeuille mensuel", score: 3 },
      { id: "d", text: "Modèle hybride projet/produit avec métriques de flow en temps réel", score: 4 },
    ]},
    { dim: "complexity", order: 5, text: "Gestion multi-fournisseurs sur un programme complexe :", options: [
      { id: "a", text: "Chaque fournisseur sur son périmètre avec interfaces définies", score: 1 },
      { id: "b", text: "Intégrateur qui coordonne l'ensemble", score: 3 },
      { id: "c", text: "Orchestration de l'écosystème avec gouvernance commune", score: 4 },
      { id: "d", text: "Collaboration intégrée avec partage des risques et gains", score: 2 },
    ]},

    // =============================================
    // RÉSULTATS
    // =============================================
    { dim: "results", order: 1, text: "Votre définition du 'delivery' :", options: [
      { id: "a", text: "Livrer dans les délais et le budget prévus", score: 1 },
      { id: "b", text: "Solution qui fonctionne et satisfait les utilisateurs", score: 2 },
      { id: "c", text: "Valeur business attendue et mesurée", score: 4 },
      { id: "d", text: "Impact durable qui transforme les pratiques", score: 3 },
    ]},
    { dim: "results", order: 2, text: "Projet stratégique : +30% coût, +6 mois de retard :", options: [
      { id: "a", text: "Renforcement du contrôle et reportings hebdomadaires", score: 1 },
      { id: "b", text: "Audit des causes et plan de recovery", score: 3 },
      { id: "c", text: "Décisions difficiles : rescoping, changement d'équipe, pivot", score: 4 },
      { id: "d", text: "Culture du feedback et amélioration continue", score: 2 },
    ]},
    { dim: "results", order: 3, text: "Rythme de déploiement des nouvelles fonctionnalités :", options: [
      { id: "a", text: "Releases majeures 2 à 3 fois par an", score: 1 },
      { id: "b", text: "Releases mensuelles avec cycle de test structuré", score: 2 },
      { id: "c", text: "Continuous delivery avec feature flags et A/B testing", score: 4 },
      { id: "d", text: "Squads autonomes déployant plusieurs fois par jour", score: 3 },
    ]},
    { dim: "results", order: 4, text: "Gestion de la qualité logicielle :", options: [
      { id: "a", text: "Tests manuels avant chaque mise en production", score: 1 },
      { id: "b", text: "Tests automatisés avec couverture de code", score: 2 },
      { id: "c", text: "DevOps avec CI/CD, monitoring et observabilité", score: 3 },
      { id: "d", text: "Engineering excellence : SRE, chaos engineering, blameless postmortems", score: 4 },
    ]},
    { dim: "results", order: 5, text: "Engagements de service (SLA) :", options: [
      { id: "a", text: "Garantie de disponibilité des systèmes", score: 1 },
      { id: "b", text: "SLA formalisés avec indicateurs de suivi", score: 3 },
      { id: "c", text: "SLA business alignés sur l'expérience utilisateur", score: 4 },
      { id: "d", text: "SLO orientés outcome avec error budgets", score: 2 },
    ]},

    // =============================================
    // INNOVATION
    // =============================================
    { dim: "innovation", order: 1, text: "Votre veille technologique :", options: [
      { id: "a", text: "Suivi des tendances via la presse spécialisée", score: 1 },
      { id: "b", text: "Participation régulière à des conférences et salons", score: 2 },
      { id: "c", text: "Processus structuré avec technology radars et POC réguliers", score: 4 },
      { id: "d", text: "Lab d'innovation avec partenariats startups et académiques", score: 3 },
    ]},
    { dim: "innovation", order: 2, text: "Face à l'IA générative :", options: [
      { id: "a", text: "Observation de ce que font les autres", score: 1 },
      { id: "b", text: "Tests de quelques outils et évaluation des gains", score: 2 },
      { id: "c", text: "Stratégie IA avec cas d'usage prioritaires et gouvernance", score: 4 },
      { id: "d", text: "Repositionnement de la chaîne de valeur autour de l'IA", score: 3 },
    ]},
    { dim: "innovation", order: 3, text: "Le budget innovation dans votre DSI :", options: [
      { id: "a", text: "Pas de budget dédié, innovation dans les projets", score: 1 },
      { id: "b", text: "Enveloppe annuelle pour expérimentations", score: 2 },
      { id: "c", text: "Processus d'innovation avec funnel et critères de go/no-go", score: 3 },
      { id: "d", text: "Innovation décentralisée avec squads et intrapreneuriat", score: 4 },
    ]},
    { dim: "innovation", order: 4, text: "Votre approche de l'innovation ouverte :", options: [
      { id: "a", text: "Innovation principalement en interne", score: 1 },
      { id: "b", text: "Quelques partenaires technologiques privilégiés", score: 3 },
      { id: "c", text: "Programme de collaboration avec startups et incubateurs", score: 4 },
      { id: "d", text: "Écosystème complet : startups, universités, clients", score: 2 },
    ]},
    { dim: "innovation", order: 5, text: "Un collaborateur propose une idée innovante mais risquée :", options: [
      { id: "a", text: "Vous lui demandez de se concentrer sur ses priorités", score: 1 },
      { id: "b", text: "Du temps accordé pour approfondir l'idée", score: 2 },
      { id: "c", text: "Budget et délai pour un prototype avec critères de succès", score: 4 },
      { id: "d", text: "Cadre encourageant ce type d'initiative dans toute la DSI", score: 3 },
    ]},

    // =============================================
    // CLIENT
    // =============================================
    { dim: "client", order: 1, text: "Votre connaissance des métiers de l'entreprise :", options: [
      { id: "a", text: "Connaissance de leurs besoins IT principaux", score: 1 },
      { id: "b", text: "Business Relationship Managers dédiés à chaque direction", score: 2 },
      { id: "c", text: "Temps régulier passé sur le terrain", score: 4 },
      { id: "d", text: "Compréhension des P&L, KPIs et enjeux stratégiques de chaque BU", score: 3 },
    ]},
    { dim: "client", order: 2, text: "Le DG Commercial se plaint du CRM inadapté :", options: [
      { id: "a", text: "Analyse des remontées et planification d'évolutions", score: 1 },
      { id: "b", text: "Ateliers avec les équipes commerciales", score: 2 },
      { id: "c", text: "Observation terrain et co-conception de la solution", score: 4 },
      { id: "d", text: "Repenser l'expérience commerciale globale au-delà de l'outil", score: 3 },
    ]},
    { dim: "client", order: 3, text: "Votre approche de l'expérience utilisateur :", options: [
      { id: "a", text: "Livraison des fonctionnalités demandées par les métiers", score: 1 },
      { id: "b", text: "Intégration des retours utilisateurs", score: 2 },
      { id: "c", text: "UX designers et mesure NPS de satisfaction", score: 3 },
      { id: "d", text: "Design thinking : chaque outil traité comme un produit grand public", score: 4 },
    ]},
    { dim: "client", order: 4, text: "Le shadow IT prolifère dans l'entreprise :", options: [
      { id: "a", text: "Contrôle et interdiction", score: 1 },
      { id: "b", text: "Inventaire et proposition d'alternatives", score: 3 },
      { id: "c", text: "Compréhension des besoins et amélioration de l'offre", score: 4 },
      { id: "d", text: "Shadow IT comme signal d'innovation, gouvernance flexible", score: 2 },
    ]},
    { dim: "client", order: 5, text: "Votre positionnement vis-à-vis des métiers :", options: [
      { id: "a", text: "Centre de services répondant aux demandes", score: 1 },
      { id: "b", text: "Partenaire accompagnant les projets métiers", score: 2 },
      { id: "c", text: "Business partner co-construisant les solutions", score: 4 },
      { id: "d", text: "Catalyseur de transformation qui anticipe et propose", score: 3 },
    ]},

    // =============================================
    // RÉSILIENCE
    // =============================================
    { dim: "resilience", order: 1, text: "Après un échec majeur de projet :", options: [
      { id: "a", text: "Passer à autre chose rapidement", score: 1 },
      { id: "b", text: "Analyse des causes et documentation des leçons", score: 3 },
      { id: "c", text: "Partage ouvert du REX et ajustement des processus", score: 4 },
      { id: "d", text: "Transformation de l'échec en apprentissage collectif", score: 2 },
    ]},
    { dim: "resilience", order: 2, text: "Votre rythme en période de crise :", options: [
      { id: "a", text: "Sur le pont 24/7, gestion personnelle de tout", score: 1 },
      { id: "b", text: "Délégation opérationnelle et supervision", score: 3 },
      { id: "c", text: "Alternance phases intenses/récupération, protection des équipes", score: 4 },
      { id: "d", text: "Processus de crise rodés, gestion sereine", score: 2 },
    ]},
    { dim: "resilience", order: 3, text: "Pression du COMEX pour un projet irréaliste :", options: [
      { id: "a", text: "Acceptation du challenge, pression sur les équipes", score: 1 },
      { id: "b", text: "Alerte sur les risques, engagement sur un planning ambitieux", score: 2 },
      { id: "c", text: "Négociation d'un périmètre réaliste avec jalons de vérification", score: 4 },
      { id: "d", text: "Recadrage assertif et approche agile avec valeur rapide", score: 3 },
    ]},
    { dim: "resilience", order: 4, text: "Votre gestion de l'incertitude :", options: [
      { id: "a", text: "Besoin de visibilité claire avant de décider", score: 1 },
      { id: "b", text: "Décision avec les infos disponibles, ajustement ensuite", score: 3 },
      { id: "c", text: "À l'aise avec l'ambiguïté, approches itératives", score: 4 },
      { id: "d", text: "L'incertitude comme avantage compétitif", score: 2 },
    ]},
    { dim: "resilience", order: 5, text: "Équilibre vie professionnelle / personnelle :", options: [
      { id: "a", text: "Le travail passe en premier en période intense", score: 1 },
      { id: "b", text: "Tentative de maintenir des limites", score: 2 },
      { id: "c", text: "Rituels et limites claires respectés", score: 4 },
      { id: "d", text: "Cet équilibre comme valeur d'équipe et performance durable", score: 3 },
    ]},

    // =============================================
    // AGILITÉ
    // =============================================
    { dim: "agility", order: 1, text: "L'adoption de l'agilité dans votre DSI :", options: [
      { id: "a", text: "Quelques équipes font du Scrum sur certains projets", score: 1 },
      { id: "b", text: "L'agile est la méthode standard pour les développements", score: 2 },
      { id: "c", text: "Agilité à l'échelle avec SAFe ou équivalent", score: 3 },
      { id: "d", text: "L'agilité comme culture dépassant la DSI", score: 4 },
    ]},
    { dim: "agility", order: 2, text: "Nouveau concurrent digital qui bouleverse votre marché :", options: [
      { id: "a", text: "Renforcement de la fiabilité des systèmes actuels", score: 1 },
      { id: "b", text: "Accélération des projets digitaux en cours", score: 2 },
      { id: "c", text: "Plan de riposte digitale : quick wins + structurant", score: 4 },
      { id: "d", text: "Challenge du business model avec le COMEX, réponse disruptive", score: 3 },
    ]},
    { dim: "agility", order: 3, text: "Votre organisation IT :", options: [
      { id: "a", text: "Organisation traditionnelle par silos", score: 1 },
      { id: "b", text: "Équipes projets transverses avec compétences mixtes", score: 2 },
      { id: "c", text: "Squads produit autonomes avec product owners métier", score: 4 },
      { id: "d", text: "Organisation liquide se reconfigurant selon les priorités", score: 3 },
    ]},
    { dim: "agility", order: 4, text: "Le COVID impose le télétravail du jour au lendemain :", options: [
      { id: "a", text: "Continuité technique assurée en mode urgence", score: 1 },
      { id: "b", text: "Outils collaboratifs et accès sécurisés en quelques jours", score: 3 },
      { id: "c", text: "La crise comme accélérateur de transformation digitale", score: 4 },
      { id: "d", text: "Refonte du modèle de travail hybride, IT comme pilier", score: 2 },
    ]},
    { dim: "agility", order: 5, text: "Capacité à pivoter quand une stratégie ne fonctionne pas :", options: [
      { id: "a", text: "Difficulté à abandonner un plan lancé", score: 1 },
      { id: "b", text: "Ajustement quand les indicateurs sont clairement négatifs", score: 2 },
      { id: "c", text: "Checkpoints réguliers avec critères de pivot prédéfinis", score: 4 },
      { id: "d", text: "Mentalité d'expérimentation où le pivot est naturel", score: 3 },
    ]},
  ],

  // =============================================
  // QUESTIONS MIROIR (cohérence)
  // Reformulations de questions existantes — stockées sous mirrorDim
  // =============================================
  mirrorQuestions: [
    // Miroir de vision order:1 (schéma directeur SI)
    { dim: "mirror_vision", mirrorOf: { dim: "vision", order: 1 }, order: 1, text: "Quand vous définissez les grandes orientations SI à 3 ans, votre priorité est :", options: [
      { id: "a", text: "Préserver la fiabilité des systèmes en place", score: 1 },
      { id: "b", text: "Réduire les coûts de fonctionnement du SI", score: 2 },
      { id: "c", text: "Synchroniser la roadmap IT avec le plan stratégique de l'entreprise", score: 4 },
      { id: "d", text: "Identifier des leviers technologiques pour différencier l'entreprise", score: 3 },
    ]},
    // Miroir de leadership order:2 (conflit entre managers)
    { dim: "mirror_leadership", mirrorOf: { dim: "leadership", order: 2 }, order: 1, text: "Deux responsables de votre équipe sont en désaccord sur l'allocation des ressources :", options: [
      { id: "a", text: "Vous imposez votre arbitrage pour ne pas perdre de temps", score: 1 },
      { id: "b", text: "Vous écoutez chacun séparément pour comprendre les positions", score: 2 },
      { id: "c", text: "Vous organisez une médiation pour co-construire un compromis", score: 4 },
      { id: "d", text: "Vous en profitez pour revoir les règles de gouvernance de l'équipe", score: 3 },
    ]},
    // Miroir de change order:3 (levier transformation digitale)
    { dim: "mirror_change", mirrorOf: { dim: "change", order: 3 }, order: 1, text: "Pour garantir le succès d'un programme de transformation, vous misez avant tout sur :", options: [
      { id: "a", text: "La qualité des solutions techniques déployées", score: 1 },
      { id: "b", text: "L'implication de la Direction Générale comme sponsor", score: 3 },
      { id: "c", text: "La mobilisation des managers comme relais terrain", score: 4 },
      { id: "d", text: "Un environnement qui tolère les erreurs et favorise l'itération", score: 2 },
    ]},
    // Miroir de influence order:1 (présentation COMEX)
    { dim: "mirror_influence", mirrorOf: { dim: "influence", order: 1 }, order: 1, text: "Vous présentez un investissement IT majeur au Board. Votre angle d'attaque :", options: [
      { id: "a", text: "L'architecture technique et les choix technologiques", score: 1 },
      { id: "b", text: "Le calendrier, l'enveloppe budgétaire et les risques identifiés", score: 2 },
      { id: "c", text: "L'impact attendu sur les indicateurs business clés", score: 4 },
      { id: "d", text: "La transformation de l'avantage concurrentiel de l'entreprise", score: 3 },
    ]},
    // Miroir de budget order:3 (réduction budget 15%)
    { dim: "mirror_budget", mirrorOf: { dim: "budget", order: 3 }, order: 1, text: "Contrainte budgétaire imprévue : vous devez réduire vos dépenses IT de 20% :", options: [
      { id: "a", text: "Réduction proportionnelle sur chaque ligne budgétaire", score: 1 },
      { id: "b", text: "Report des projets les moins avancés", score: 2 },
      { id: "c", text: "Repriorisation du portefeuille par contribution business", score: 3 },
      { id: "d", text: "Présentation au COMEX des scénarios de coupe avec impacts chiffrés", score: 4 },
    ]},
    // Miroir de resilience order:3 (pression COMEX projet irréaliste)
    { dim: "mirror_resilience", mirrorOf: { dim: "resilience", order: 3 }, order: 1, text: "La Direction Générale exige un délai irréaliste pour un projet critique :", options: [
      { id: "a", text: "Vous acceptez et demandez à vos équipes de redoubler d'efforts", score: 1 },
      { id: "b", text: "Vous signalez les risques tout en vous engageant sur un planning tendu", score: 2 },
      { id: "c", text: "Vous proposez un périmètre réduit avec des points de contrôle réguliers", score: 4 },
      { id: "d", text: "Vous recadrez les attentes et proposez une approche itérative rapide", score: 3 },
    ]},
  ],

  // =============================================
  // QUESTIONS DÉSIRABILITÉ SOCIALE
  // Questions où la réponse "parfaite" est volontairement transparente
  // Score élevé = réponse socialement désirable choisie en 1er
  // =============================================
  desirabilityQuestions: [
    { dim: "desirability", order: 1, text: "Honnêtement, quand un projet que vous portez rencontre des difficultés majeures :", options: [
      { id: "a", text: "Il m'arrive de minimiser les problèmes dans mes reportings", score: 4 },
      { id: "b", text: "Je partage une vision réaliste, même si elle est inconfortable", score: 2 },
      { id: "c", text: "Je suis toujours 100% transparent sur toutes les difficultés dès le premier jour", score: 1 },
      { id: "d", text: "J'adapte le niveau de détail selon l'interlocuteur et le moment", score: 3 },
    ]},
    { dim: "desirability", order: 2, text: "Concernant vos erreurs de management passées :", options: [
      { id: "a", text: "J'ai rarement commis d'erreurs significatives dans ma carrière", score: 1 },
      { id: "b", text: "J'en ai fait mais j'ai toujours su les transformer en opportunités", score: 2 },
      { id: "c", text: "Certaines erreurs ont eu des conséquences que je n'ai pas pu rattraper", score: 4 },
      { id: "d", text: "Je préfère ne pas m'attarder sur le passé et regarder vers l'avant", score: 3 },
    ]},
    { dim: "desirability", order: 3, text: "Votre rapport aux feedbacks négatifs de vos collaborateurs :", options: [
      { id: "a", text: "Je les accueille toujours avec ouverture et gratitude", score: 1 },
      { id: "b", text: "Je les sollicite activement mais certains sont difficiles à entendre", score: 4 },
      { id: "c", text: "Je les écoute mais je ne suis pas toujours d'accord", score: 3 },
      { id: "d", text: "Mon équipe sait qu'elle peut tout me dire sans filtre", score: 2 },
    ]},
    { dim: "desirability", order: 4, text: "Face à une décision importante avec des informations incomplètes :", options: [
      { id: "a", text: "Je prends toujours la bonne décision grâce à mon intuition et mon expérience", score: 1 },
      { id: "b", text: "Il m'arrive de douter et de remettre en question mes choix après coup", score: 4 },
      { id: "c", text: "Je m'appuie sur mon réseau pour valider mes intuitions", score: 3 },
      { id: "d", text: "Je décide vite et j'ajuste ensuite sans regret", score: 2 },
    ]},
  ],
};

export default dsi;
