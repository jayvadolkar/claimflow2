import { SurveyProfile, SurveyProfileDocument, SurveyProfileImage } from '../types';
import { INITIAL_DOCUMENT_RULES } from './documentRules';
import { INITIAL_IMAGE_RULES } from './imageRules';
import { buildRuleLabel } from '../utils/ruleEngine';

/** Canonical sort-and-join fingerprint for a rule's 4 condition axes */
function fingerprint(rule: {
  applicableCases?: string[];
  vehicleTypes?: string[];
  vehicleClasses?: string[];
  hypothecation?: string[];
}): string {
  const s = (arr?: string[]) => [...(arr ?? [])].sort().join(',');
  return `${s(rule.applicableCases)}|${s(rule.vehicleTypes)}|${s(rule.vehicleClasses)}|${s(rule.hypothecation)}`;
}

/**
 * Generate INITIAL_SURVEY_PROFILES by grouping document rules and image rules
 * that share the same 4-axis condition fingerprint into one profile each.
 */
export const INITIAL_SURVEY_PROFILES: SurveyProfile[] = (() => {
  type GroupEntry = {
    docs: SurveyProfileDocument[];
    images: SurveyProfileImage[];
    first: { applicableCases?: string[]; vehicleTypes?: string[]; vehicleClasses?: string[]; hypothecation?: string[] };
  };

  const groups = new Map<string, GroupEntry>();

  const getOrCreate = (fp: string, rule: GroupEntry['first']): GroupEntry => {
    if (!groups.has(fp)) groups.set(fp, { docs: [], images: [], first: rule });
    return groups.get(fp)!;
  };

  for (const rule of INITIAL_DOCUMENT_RULES) {
    const fp = fingerprint(rule);
    getOrCreate(fp, rule).docs.push({
      documentId: rule.documentId,
      required: rule.required,
      canBeOverridden: rule.canBeOverridden,
      overrideRoles: rule.overrideRoles ?? [],
    });
  }

  for (const rule of INITIAL_IMAGE_RULES) {
    const fp = fingerprint(rule);
    getOrCreate(fp, rule).images.push({
      imageId: rule.imageId,
      required: rule.required,
      canBeOverridden: rule.canBeOverridden,
    });
  }

  return Array.from(groups.entries()).map(([, group], idx) => {
    const profile: SurveyProfile = {
      id: `sp-seed-${idx + 1}`,
      applicableCases: group.first.applicableCases as any,
      vehicleTypes: group.first.vehicleTypes as any,
      vehicleClasses: group.first.vehicleClasses as any,
      hypothecation: group.first.hypothecation as any,
      documents: group.docs,
      images: group.images,
      createdAt: new Date().toISOString(),
    };
    profile.label = buildRuleLabel(profile);
    return profile;
  });
})();
