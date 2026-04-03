import { ImageRule } from '../types';
import { predefinedImages } from './images';
import { normalize, buildRuleLabel } from '../utils/ruleEngine';

/**
 * Initial image rules — one rule per predefined image.
 * All images use defaultApplicability (all values on every axis), so after
 * normalization every rule gets empty arrays (catch-all) + required: true.
 */
export const INITIAL_IMAGE_RULES: ImageRule[] = predefinedImages.map(img => {
  const rule: ImageRule = {
    id:             `ir-seed-${img.id}`,
    imageId:        img.id,
    applicableCases: normalize.cases(img.applicableCases as any),
    vehicleTypes:   normalize.types(img.vehicleTypes as any),
    vehicleClasses: normalize.classes(img.vehicleClasses as any),
    hypothecation:  normalize.hypo(img.hypothecation as any),
    required:       img.required ?? true,
    canBeOverridden: false,
    overrideRoles:  [],
    createdAt:      new Date().toISOString(),
  };
  rule.label = buildRuleLabel(rule);
  return rule;
});
