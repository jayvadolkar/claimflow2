import { DocumentRule } from '../types';
import { INITIAL_DOCS } from './documents';
import { normalize, buildRuleLabel } from '../utils/ruleEngine';

/**
 * Initial document rules — one rule per document, migrated from the legacy
 * applicableCases / vehicleTypes / vehicleClasses / hypothecation / required
 * fields that used to live on DocumentDef.
 *
 * Arrays containing ALL possible values are normalized to [] (empty = match all).
 */
export const INITIAL_DOCUMENT_RULES: DocumentRule[] = INITIAL_DOCS.map(doc => {
  const rule: DocumentRule = {
    id:             `dr-seed-${doc.id}`,
    documentId:     doc.id,
    applicableCases: normalize.cases(doc.applicableCases as any),
    vehicleTypes:   normalize.types(doc.vehicleTypes as any),
    vehicleClasses: normalize.classes(doc.vehicleClasses as any),
    hypothecation:  normalize.hypo(doc.hypothecation as any),
    required:       doc.required ?? false,
    canBeOverridden: doc.canBeOverridden ?? false,
    overrideRoles:  doc.permissions?.override ?? [],
    createdAt:      new Date().toISOString(),
  };
  rule.label = buildRuleLabel(rule);
  return rule;
});
