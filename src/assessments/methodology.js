// ============================================================
// AMARILLO PROFILE™ — Méthodologie commune
// Partagée par tous les types d'assessment
// ============================================================

const methodology = {
  title: "Méthodologie Amarillo Profile™",

  // Paragraphe synthétique destiné aux PDF et emails — permet à un tiers
  // (recruteur, dirigeant) de comprendre rapidement l'outil et sa méthode.
  summary: "Le DSI Profile™ est un outil d'évaluation comportementale conçu pour cartographier les compétences managériales des dirigeants IT. Fondé sur le Competing Values Framework (Quinn & Rohrbaugh), la théorie du leadership transformationnel (Bass & Avolio) et les référentiels de maturité IT (COBIT, CMMI), il évalue 12 dimensions regroupées en 3 piliers : Leadership & Influence, Excellence Opérationnelle et Innovation & Posture. Le candidat répond à des mises en situation professionnelles (Situational Judgment Test) en classant 4 options de la plus à la moins représentative de son approche. Ce format à choix forcé, reconnu pour sa validité prédictive, réduit les biais de désirabilité sociale. Les scores sont normalisés sur une échelle de 0 à 100 et des indicateurs de fiabilité intégrés (cohérence interne, détection de désirabilité) garantissent la qualité des résultats. Cet outil est un instrument d'aide au recrutement et de développement professionnel — il ne constitue pas un diagnostic psychométrique clinique.",

  sections: [
    {
      heading: "Fondements théoriques",
      content: "L'évaluation s'appuie sur le Competing Values Framework (Quinn & Rohrbaugh, 1983), la théorie du leadership transformationnel (Bass & Avolio, 1994) et les modèles de maturité IT (COBIT 2019, CMMI). Ces cadres structurent les trois piliers d'évaluation et les 12 dimensions de compétence."
    },
    {
      heading: "Format d'évaluation",
      content: "Chaque question utilise le format SJT (Situational Judgment Test) en choix forcé ipsatif : le candidat ordonne 4 options de la plus à la moins représentative de son approche. Ce format, reconnu pour sa validité prédictive (Weekley & Ployhart, 2006), réduit les biais d'acquiescement et de désirabilité sociale."
    },
    {
      heading: "Scoring",
      content: "Pondération par rang (1er : 1.0 / 2e : 0.66 / 3e : 0.33 / 4e : 0.0) appliquée aux valeurs calibrées de chaque option. La calibration est non linéaire : l'option la plus ambitieuse n'est pas systématiquement la mieux cotée, ce qui renforce la résistance au gaming. Le score de chaque dimension est la moyenne des scores pondérés de ses questions."
    },
    {
      heading: "Profilage",
      content: "Huit profils archétypaux sont définis par des vecteurs de pondération sur les 3 piliers. Le score de correspondance est la somme pondérée des scores de pilier, avec un seuil minimal d'éligibilité. Le candidat reçoit un pourcentage de correspondance pour ses 3 meilleurs profils."
    },
    {
      heading: "Indicateurs de fiabilité",
      content: "Deux mécanismes intégrés évaluent la qualité des réponses. L'indice de cohérence compare les réponses à des paires de questions miroir mesurant la même compétence sous des angles différents — un écart important signale des réponses aléatoires. L'échelle de désirabilité sociale identifie les candidats qui embellissent systématiquement leurs réponses via des questions où la réponse « idéale » est volontairement transparente."
    },
    {
      heading: "Limites",
      content: "L'évaluation repose sur du déclaratif et reflète la représentation que le candidat a de ses pratiques. Les scénarios sont ancrés dans le contexte du management IT en environnement corporate européen. Cet outil est un instrument de développement professionnel et d'aide au recrutement, non un outil psychométrique clinique."
    },
  ],
};

export default methodology;
