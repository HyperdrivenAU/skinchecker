export type AiAssessment = "Green" | "Yellow" | "Red";

export type SkinScoreAnswers = {
  age: string;
  hair: string;
  eyes: string;
  burns: string;
  moles: string;
  changing: string;
  outdoorWork: string;
  sunburns: string;
  sunscreen: string;
  solarium: string;
  previousSkinCancer: string;
  previousMelanoma: string;
  familyHistory: string;
};

export function calculateSkinScore(answers: SkinScoreAnswers, aiAssessment: AiAssessment) {
  let personal = 0;
  let uv = 0;
  let lesion = 0;
  const factors: string[] = [];

  const add = (points: number, label?: string) => {
    if (label) factors.push(label);
    return points;
  };

  personal += answers.age === "40-59" ? add(5, "Age over 40") : 0;
  personal += answers.age === "60+" ? add(8, "Age over 60") : 0;

  personal += answers.hair === "Blonde" ? add(4, "Fair hair") : 0;
  personal += answers.hair === "Red" ? add(6, "Red hair") : 0;

  personal += answers.eyes === "Blue" ? add(4, "Blue eyes") : 0;
  personal += answers.eyes === "Green" ? add(2, "Green eyes") : 0;

  personal += answers.burns === "Usually" ? add(4, "Skin burns easily") : 0;
  personal += answers.burns === "Always" ? add(6, "Skin burns very easily") : 0;

  personal += answers.moles === "50-100" ? add(4, "Many moles") : 0;
  personal += answers.moles === "100+" ? add(6, "Very high mole count") : 0;

  personal += answers.previousSkinCancer === "Yes" ? add(8, "Previous skin cancer") : 0;
  personal += answers.previousMelanoma === "Yes" ? add(10, "Previous melanoma") : 0;
  personal += answers.familyHistory === "Yes" ? add(6, "Family history of melanoma") : 0;

  uv += answers.outdoorWork === "Frequently" ? add(4, "Frequent outdoor work") : 0;
  uv += answers.outdoorWork === "Most career" ? add(6, "Long-term outdoor work") : 0;

  uv += answers.sunburns === "3-5" ? add(4, "Multiple blistering sunburns") : 0;
  uv += answers.sunburns === "5+" ? add(6, "Repeated blistering sunburns") : 0;

  uv += answers.sunscreen === "Rarely" ? add(4, "Infrequent sunscreen use") : 0;
  uv += answers.sunscreen === "Never" ? add(6, "Does not use sunscreen") : 0;

  uv += answers.solarium === "1-5" ? add(2, "Solarium use") : 0;
  uv += answers.solarium === "5-20" ? add(4, "Repeated solarium use") : 0;
  uv += answers.solarium === "20+" ? add(6, "Frequent solarium use") : 0;

  lesion = aiAssessment === "Green" ? 8 : aiAssessment === "Yellow" ? 24 : 38;

  if (answers.changing === "Yes") {
    lesion += add(2, "Mole has changed recently");
  }

  personal = Math.min(40, personal);
  uv = Math.min(20, uv);
  lesion = Math.min(40, lesion);

  const total = Math.min(100, personal + uv + lesion);

  const grade =
    total >= 75 ? "Very High" :
    total >= 50 ? "High" :
    total >= 25 ? "Moderate" :
    "Low";

  const colour =
    grade === "Very High" ? "Red" :
    grade === "High" ? "Orange" :
    grade === "Moderate" ? "Yellow" :
    "Green";

  return { total, grade, colour, personal, uv, lesion, factors };
}