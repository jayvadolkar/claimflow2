import { DocumentRule, ImageRule, MatchedRule, Survey, LossType, VehicleType, VehicleClass, HypothecationType, SurveyProfile } from '../types';

// ── Axis constants (all possible values per axis) ──────────────────────────────
const ALL_CASES: LossType[]        = ['Repair', 'Theft', 'Total Loss', 'Third Party'];
const ALL_VEHICLE_TYPES: VehicleType[] = ['2W', '4W', 'Others'];
const ALL_VEHICLE_CLASSES: VehicleClass[] = ['Commercial', 'Personal'];
const ALL_HYPO: HypothecationType[] = ['Yes', 'No'];

/**
 * Normalize an axis array: if it contains ALL possible values, treat it as
 * "match all" (empty array). Used during seed data migration.
 */
export function normalizeAxis<T>(arr: T[] | undefined, allValues: T[]): T[] {
  if (!arr || arr.length === 0) return [];
  const allPresent = allValues.every(v => arr.includes(v));
  return allPresent ? [] : [...arr];
}

export const normalize = {
  cases:   (arr?: LossType[])        => normalizeAxis(arr, ALL_CASES),
  types:   (arr?: VehicleType[])     => normalizeAxis(arr, ALL_VEHICLE_TYPES),
  classes: (arr?: VehicleClass[])    => normalizeAxis(arr, ALL_VEHICLE_CLASSES),
  hypo:    (arr?: HypothecationType[]) => normalizeAxis(arr, ALL_HYPO),
};

/**
 * Specificity score: number of constrained (non-empty) context axes.
 * Range 0 (catch-all) to 4 (fully constrained).
 */
export function ruleSpecificity(rule: Pick<DocumentRule | ImageRule, 'applicableCases' | 'vehicleTypes' | 'vehicleClasses' | 'hypothecation'>): number {
  let score = 0;
  if (rule.applicableCases && rule.applicableCases.length > 0) score++;
  if (rule.vehicleTypes    && rule.vehicleTypes.length    > 0) score++;
  if (rule.vehicleClasses  && rule.vehicleClasses.length  > 0) score++;
  if (rule.hypothecation   && rule.hypothecation.length   > 0) score++;
  return score;
}

/**
 * Returns true if a rule's context conditions match the given survey.
 * Empty / absent axis = match all values on that axis.
 */
function ruleMatches(rule: DocumentRule | ImageRule, survey: Survey): boolean {
  const hypoValue: HypothecationType = survey.isHypothecated ? 'Yes' : 'No';

  const caseOk  = !rule.applicableCases || rule.applicableCases.length === 0
    || rule.applicableCases.includes(survey.lossType as LossType);

  const typeOk  = !rule.vehicleTypes || rule.vehicleTypes.length === 0
    || rule.vehicleTypes.includes(survey.vehicleCategory as VehicleType);

  const classOk = !rule.vehicleClasses || rule.vehicleClasses.length === 0
    || rule.vehicleClasses.includes(survey.vehicleClass as VehicleClass);

  const hypoOk  = !rule.hypothecation || rule.hypothecation.length === 0
    || rule.hypothecation.includes(hypoValue);

  return caseOk && typeOk && classOk && hypoOk;
}

/**
 * Find the best matching rule from a set of rules for a single document/image.
 * Returns null if no rules match → document/image should be hidden from this survey.
 */
export function findBestRule(rules: (DocumentRule | ImageRule)[], survey: Survey): MatchedRule | null {
  const matching = rules.filter(r => ruleMatches(r, survey));
  if (matching.length === 0) return null;

  // Most specific rule wins; ties keep insertion order
  matching.sort((a, b) => ruleSpecificity(b) - ruleSpecificity(a));
  const best = matching[0];

  return {
    required:        best.required,
    canBeOverridden: best.canBeOverridden,
    overrideRoles:   best.overrideRoles ?? [],
    matchedRuleId:   best.id,
    specificity:     ruleSpecificity(best),
  };
}

/**
 * Build a map of documentId → MatchedRule|null for a full list of doc IDs.
 * null = no rule matches → document hidden from this survey.
 */
export function buildDocRuleMap(
  allRules: DocumentRule[],
  docIds: string[],
  survey: Survey
): Map<string, MatchedRule | null> {
  const map = new Map<string, MatchedRule | null>();
  for (const docId of docIds) {
    const docRules = allRules.filter(r => r.documentId === docId);
    map.set(docId, findBestRule(docRules, survey));
  }
  return map;
}

/**
 * Build a map of imageId → MatchedRule|null for a full list of image IDs.
 */
export function buildImageRuleMap(
  allRules: ImageRule[],
  imageIds: string[],
  survey: Survey
): Map<string, MatchedRule | null> {
  const map = new Map<string, MatchedRule | null>();
  for (const imgId of imageIds) {
    const imgRules = allRules.filter(r => r.imageId === imgId);
    map.set(imgId, findBestRule(imgRules, survey));
  }
  return map;
}

/**
 * Flatten SurveyProfiles → DocumentRule[] for use with buildDocRuleMap.
 * Each profile × document assignment becomes one DocumentRule.
 */
export function flattenProfilesToDocRules(profiles: SurveyProfile[]): DocumentRule[] {
  return profiles.flatMap(p =>
    p.documents.map(d => ({
      id: `${p.id}__${d.documentId}`,
      documentId: d.documentId,
      applicableCases: p.applicableCases,
      vehicleTypes: p.vehicleTypes,
      vehicleClasses: p.vehicleClasses,
      hypothecation: p.hypothecation,
      required: d.required,
      canBeOverridden: d.canBeOverridden,
      overrideRoles: d.overrideRoles ?? [],
    }))
  );
}

/**
 * Flatten SurveyProfiles → ImageRule[] for use with buildImageRuleMap.
 */
export function flattenProfilesToImageRules(profiles: SurveyProfile[]): ImageRule[] {
  return profiles.flatMap(p =>
    p.images.map(img => ({
      id: `${p.id}__${img.imageId}`,
      imageId: img.imageId,
      applicableCases: p.applicableCases,
      vehicleTypes: p.vehicleTypes,
      vehicleClasses: p.vehicleClasses,
      hypothecation: p.hypothecation,
      required: img.required,
      canBeOverridden: img.canBeOverridden,
      overrideRoles: [],
    }))
  );
}

/**
 * Auto-build a human-readable label from active (non-empty) axes.
 */
export function buildRuleLabel(rule: Pick<DocumentRule | ImageRule, 'applicableCases' | 'vehicleTypes' | 'vehicleClasses' | 'hypothecation'>): string {
  const parts: string[] = [];
  if (rule.applicableCases && rule.applicableCases.length > 0 && rule.applicableCases.length < ALL_CASES.length)
    parts.push(rule.applicableCases.join('/'));
  if (rule.vehicleTypes && rule.vehicleTypes.length > 0 && rule.vehicleTypes.length < ALL_VEHICLE_TYPES.length)
    parts.push(rule.vehicleTypes.join('/'));
  if (rule.vehicleClasses && rule.vehicleClasses.length > 0 && rule.vehicleClasses.length < ALL_VEHICLE_CLASSES.length)
    parts.push(rule.vehicleClasses[0]);
  if (rule.hypothecation && rule.hypothecation.length > 0 && rule.hypothecation.length < ALL_HYPO.length)
    parts.push(`Hypo:${rule.hypothecation[0]}`);
  return parts.length > 0 ? parts.join(' · ') : 'Default (All)';
}
