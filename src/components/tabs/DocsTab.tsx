import React, { useState, useRef, useEffect } from 'react';
import { Survey, DocumentDef, ImageDef, MatchedRule } from '../../types';
import { FileText, CheckCircle2, AlertCircle, Download, UploadCloud, Loader2, ShieldCheck, ShieldAlert, RefreshCw, Link as LinkIcon, Smartphone, FileCheck, Plus, Eye, MoreVertical, Edit3, X, Image as ImageIcon, Camera, ChevronLeft, ChevronRight, Check, Bell, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui';
import { api } from '../../services/api';
import { INITIAL_DOCS } from '../../data/documents';
import { INITIAL_SURVEY_PROFILES } from '../../data/surveyProfiles';
import { predefinedImages } from '../../data/images';
import { buildDocRuleMap, buildImageRuleMap, flattenProfilesToDocRules, flattenProfilesToImageRules } from '../../utils/ruleEngine';
import { stages } from '../../data';

type DocSource = 'Link' | 'Digital' | 'Manual' | 'System';

export interface EvidenceDocument {
  id: number;
  name: string;
  status: 'uploaded' | 'missing' | 'verified' | 'rejected' | 'overridden';
  type: string;
  date: string;
  size: string;
  source: DocSource;
  ocrData: any;
  validation: any;
  fileUrl: string | null;
  docDef?: DocumentDef;
  submitter?: string;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  _matchedRule?: MatchedRule; // runtime-computed from rule engine, flows through survey.documents
}

export interface EvidencePhoto {
  id: string | number;
  label: string;
  url: string | null;
  date: string;
  by: string;
  aiStatus: 'Verified' | 'Pending' | 'Flagged';
  category: 'vehicle' | 'damage';
  status: 'missing' | 'uploaded' | 'verified' | 'rejected';
  imgDef?: ImageDef;
  _matchedRule?: MatchedRule;
}

type EvidenceItem = 
  | ({ itemType: 'document' } & EvidenceDocument)
  | ({ itemType: 'photo' } & EvidencePhoto);

const MetadataField: React.FC<{ 
  label: string; 
  value: string; 
  status: 'success' | 'warning' | 'error'; 
  onChange?: (val: string) => void; 
}> = ({ label, value, status, onChange }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-2">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">{label}</label>
      {status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
    </div>
    <div className="relative">
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full text-sm font-bold border-b border-gray-100 py-2 outline-none focus:border-indigo-600 transition-all bg-transparent pr-8"
      />
      <button className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-indigo-600 transition-colors">
        <Edit3 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

// Renders a table-type field as add/remove line items
const TableLineItemField: React.FC<{
  field: import('../../types').DocField;
  rows: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
}> = ({ field, rows, onChange }) => {
  const cols = field.columns || [];

  const addRow = () => {
    const empty: Record<string, string> = {};
    cols.forEach(c => { empty[c.label] = ''; });
    onChange([...rows, empty]);
  };

  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const updateCell = (rowIdx: number, colLabel: string, val: string) => {
    const next = rows.map((row, i) => i === rowIdx ? { ...row, [colLabel]: val } : row);
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Table · {rows.length} row{rows.length !== 1 ? 's' : ''}</span>
      </div>

      {cols.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No columns configured for this table.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {cols.map(col => (
                  <th key={col.id} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                    {col.label}{col.required && <span className="text-red-400 ml-0.5">*</span>}
                  </th>
                ))}
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="px-3 py-4 text-center text-gray-400 text-xs italic">
                    No entries yet — click Add Row
                  </td>
                </tr>
              )}
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  {cols.map(col => (
                    <td key={col.id} className="px-2 py-1.5">
                      {col.type === 'select' && col.options?.length ? (
                        <select
                          value={row[col.label] || ''}
                          onChange={e => updateCell(rowIdx, col.label, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500 bg-white min-w-[80px]"
                        >
                          <option value="">—</option>
                          {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          value={row[col.label] || ''}
                          placeholder={col.placeholder || col.label}
                          onChange={e => updateCell(rowIdx, col.label, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500 bg-white min-w-[80px]"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    <button onClick={() => removeRow(rowIdx)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export function DocsTab({ survey, onUpdateSurvey, userRole }: { survey: Survey, onUpdateSurvey?: (survey: Survey) => void, userRole?: string }) {
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  
  // Navigation/Viewer State
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  // Upload Targeting State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{type: 'document' | 'photo', id: string | number} | null>(null);

  // Override Modal State
  const [overrideTarget, setOverrideTarget] = useState<EvidenceDocument | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Mark Collection Complete Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeReason, setCompleteReason] = useState('');

  useEffect(() => {
    const loadEvidence = async () => {
      try {
        // ── Load document defs + survey profiles ──────────────────────────────
        let fetchedDocs: DocumentDef[] = INITIAL_DOCS;
        let fetchedProfiles = INITIAL_SURVEY_PROFILES;

        try {
          const [docsRes, profilesRes] = await Promise.all([
            fetch('/api/documents'),
            fetch('/api/survey-profiles'),
          ]);
          if (docsRes.ok)    { const d = await docsRes.json();    if (d?.length) fetchedDocs = d; }
          if (profilesRes.ok){ const d = await profilesRes.json();if (d?.length) fetchedProfiles = d; }
        } catch { /* server offline — use seed fallbacks */ }

        // ── Flatten profiles → rules, then match against this survey's context ─
        const fetchedDocRules = flattenProfilesToDocRules(fetchedProfiles);
        const fetchedImageRules = flattenProfilesToImageRules(fetchedProfiles);

        const docIds = fetchedDocs.map(d => d.id);
        const docRuleMap = buildDocRuleMap(fetchedDocRules, docIds, survey);

        const imgIds = predefinedImages.map(i => i.id);
        const imageRuleMap = buildImageRuleMap(fetchedImageRules, imgIds, survey);

        // ── Build EvidenceDocument list ───────────────────────────────────────
        const parsedDocs: EvidenceDocument[] = [];
        fetchedDocs.forEach((docDef, index) => {
          const matchedRule = docRuleMap.get(docDef.id);
          if (!matchedRule) return; // no rule matches → hidden for this survey context

          const existingDoc = survey.documents?.find((d: any) => d.name === docDef.name);
          parsedDocs.push(existingDoc
            ? { ...existingDoc, docDef, _matchedRule: matchedRule, submitter: existingDoc.submitter || 'System' }
            : {
                id: index + 1,
                name: docDef.name,
                status: docDef.isSystem ? 'uploaded' : 'missing',
                type: (docDef.allowedTypes?.[0]) || '-',
                date: docDef.isSystem ? new Date().toLocaleDateString() : '-',
                size: docDef.isSystem ? '1.2 MB' : '-',
                source: docDef.isSystem ? 'System' : 'Manual',
                ocrData: {},
                validation: null,
                fileUrl: null,
                docDef,
                _matchedRule: matchedRule,
                submitter: docDef.isSystem ? 'System' : '-',
              } as EvidenceDocument
          );
        });
        setDocuments(parsedDocs);

        // ── Build EvidencePhoto list ──────────────────────────────────────────
        const initialPhotos: EvidencePhoto[] = [...(survey.photos || [])];
        predefinedImages
          .filter(img => img.workflowStage === 'Evidence Collection')
          .forEach(imgDef => {
            const matchedRule = imageRuleMap.get(imgDef.id);
            if (!matchedRule) return; // hidden for this survey context
            if (initialPhotos.find(p => p.label === imgDef.name)) return;
            initialPhotos.push({
              id: `stub-img-${imgDef.id}`,
              label: imgDef.name,
              url: null,
              date: '-',
              by: '-',
              aiStatus: 'Pending',
              category: imgDef.name.toLowerCase().includes('damage') ? 'damage' : 'vehicle',
              status: 'missing',
              imgDef,
              _matchedRule: matchedRule,
            });
          });
        setPhotos(initialPhotos);

      } catch (error) {
        console.error('Error loading evidence:', error);
        toast.error('Error loading evidence definitions');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvidence();
  }, [survey]);

  const allEvidence: EvidenceItem[] = [
    ...documents.map(d => ({ ...d, itemType: 'document' as const })),
    ...photos.map(p => ({ ...p, itemType: 'photo' as const }))
  ];

  const hasPermission = (item: any, action: 'upload' | 'verify' | 'reject' | 'view' | 'override') => {
    if (!userRole || userRole === 'role-superadmin') return true; // super admin god mode
    const def = item.docDef || item.imgDef;
    if (!def || !def.permissions) return true; // no permissions configured → open to all
    const roleId = userRole.startsWith('role-') ? userRole : `role-${userRole}`;
    return (def.permissions[action] || []).includes(roleId);
  };

  const selectedItem = selectedItemIndex !== null ? allEvidence[selectedItemIndex] : null;

  const navigateViewer = (dir: 1 | -1) => {
    if (selectedItemIndex === null) return;
    let nextIndex = selectedItemIndex + dir;
    if (nextIndex < 0) nextIndex = allEvidence.length - 1;
    if (nextIndex >= allEvidence.length) nextIndex = 0;
    setSelectedItemIndex(nextIndex);
  };

  const handleDocumentUpdate = (updatedDoc: EvidenceDocument) => {
    const newDocs = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    setDocuments(newDocs);
    if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: newDocs });
  };

  const handlePhotoUpdate = (updatedPhoto: EvidencePhoto, isNew: boolean = false) => {
    let newPhotos;
    if (isNew) {
      newPhotos = [...photos, updatedPhoto];
    } else {
      newPhotos = photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p);
    }
    setPhotos(newPhotos);
    if (onUpdateSurvey) onUpdateSurvey({ ...survey, photos: newPhotos });
  };

  const triggerUpload = (type: 'document' | 'photo', id: string | number) => {
    if (type === 'document') {
      const doc = documents.find(d => d.id === id);
      if (doc && !hasPermission(doc, 'upload')) {
        toast.error(`You do not have permission to upload ${doc.name}`);
        return;
      }
    } else if (type === 'photo') {
      const photo = photos.find(p => p.id === id);
      if (photo && !hasPermission(photo, 'upload')) {
        toast.error(`You do not have permission to upload ${photo.label}`);
        return;
      }
    }
    setActiveUploadTarget({ type, id });
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    const fileUrl = URL.createObjectURL(file);
    const fileType = file.type.includes('pdf') ? 'PDF' : 'Image';
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const submitter = userRole || 'User';
    const date = new Date().toLocaleDateString();

    if (activeUploadTarget.type === 'photo') {
      if (activeUploadTarget.id.toString().startsWith('new-')) {
        const category = activeUploadTarget.id === 'new-vehicle' ? 'vehicle' : 'damage';
        const newPhoto: EvidencePhoto = {
          id: Date.now(),
          label: `Additional ${category === 'vehicle' ? 'Angle' : 'Damage'}`,
          url: fileUrl,
          date,
          by: submitter,
          aiStatus: 'Pending',
          category,
          status: 'uploaded'
        };
        handlePhotoUpdate(newPhoto, true);
        toast.success(`Additional photo uploaded successfully`);
      } else {
        const photo = photos.find(p => p.id === activeUploadTarget.id);
        if (photo) {
          handlePhotoUpdate({
            ...photo,
            url: fileUrl,
            status: 'uploaded',
            date,
            by: submitter,
            aiStatus: 'Pending'
          });
          toast.success(`Photo uploaded successfully`);
        }
      }
    } else {
      const doc = documents.find(d => d.id === activeUploadTarget.id);
      if (doc) {
        setIsProcessing(true);
        const toastId = toast.loading(`Processing ${doc.name}...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate OCR

        const initialOcrData: any = {};
        if (doc.docDef?.fields) {
          doc.docDef.fields.forEach(field => {
            if (field.label.toLowerCase().includes('vehicle') || field.label.toLowerCase().includes('registration')) {
              initialOcrData[field.label] = survey.vehicle;
            } else if (field.label.toLowerCase().includes('name')) {
              initialOcrData[field.label] = survey.customerName;
            } else if (field.label.toLowerCase().includes('policy')) {
              initialOcrData[field.label] = survey.policyNumber;
            } else {
              initialOcrData[field.label] = '';
            }
          });
        }

        handleDocumentUpdate({
          ...doc,
          status: 'uploaded',
          type: fileType,
          date,
          size: fileSize,
          source: 'Manual',
          ocrData: initialOcrData,
          fileUrl,
          submitter
        });

        toast.success(`${doc.name} processed successfully`, { id: toastId });
        setIsProcessing(false);
      }
    }

    setActiveUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleItemAction = (item: EvidenceItem, action: 'verified' | 'rejected') => {
    if (item.itemType === 'document') {
      if (!hasPermission(item, action === 'verified' ? 'verify' : 'reject')) {
        toast.error(`No permission to ${action === 'verified' ? 'verify' : 'reject'}`);
        return;
      }
      handleDocumentUpdate({ ...item, status: action });
    } else {
      handlePhotoUpdate({ ...item, status: action, aiStatus: action === 'verified' ? 'Verified' : 'Flagged' });
    }
    toast.success(`Marked as ${action}`);
  };

  const handleMarkCollectionComplete = () => {
    if (!mandatoryPhotosComplete) {
      toast.error('All required vehicle photos must be collected before marking collection complete');
      return;
    }
    setShowCompleteModal(true);
  };

  const handleConfirmCollectionComplete = () => {
    const unresolved = documents.filter(d => d.status !== 'verified' && d.status !== 'overridden');
    if (!completeReason.trim() && unresolved.length > 0) {
      toast.error('Please provide a reason to proceed with unresolved documents');
      return;
    }
    const nextStage = stages[2]; // 'Inspection, AI Assessment & repair'
    if (onUpdateSurvey) {
      onUpdateSurvey({ ...survey, stage: nextStage });
    }
    setShowCompleteModal(false);
    setCompleteReason('');
    toast.success('Evidence collection marked complete — advancing to AI Assessment');
  };

  const handleOverrideSubmit = () => {
    if (!overrideTarget || !overrideReason.trim()) {
      toast.error('Please provide a reason for the override');
      return;
    }
    if (!hasPermission(overrideTarget, 'override')) {
      toast.error('You do not have permission to override this document');
      return;
    }
    handleDocumentUpdate({
      ...overrideTarget,
      status: 'overridden',
      overrideReason: overrideReason.trim(),
      overriddenBy: userRole || 'User',
      overriddenAt: new Date().toLocaleString(),
    });
    toast.success(`${overrideTarget.name} overridden`);
    setOverrideTarget(null);
    setOverrideReason('');
  };

  const runAIInspection = async () => {
    setIsInspecting(true);
    const toastId = toast.loading('Running AI Inspection on photos...');
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const updatedPhotos = photos.map(p => {
        if (p.url && p.aiStatus === 'Pending') {
          return { ...p, aiStatus: Math.random() > 0.2 ? 'Verified' : 'Flagged' } as EvidencePhoto;
        }
        return p;
      });
      setPhotos(updatedPhotos);
      if (onUpdateSurvey) onUpdateSurvey({ ...survey, photos: updatedPhotos });
      toast.success('AI Inspection complete', { id: toastId });
    } catch (error) {
      toast.error('AI Inspection failed', { id: toastId });
    } finally {
      setIsInspecting(false);
    }
  };

  const EvidenceCard: React.FC<{ item: EvidenceItem, index: number }> = ({ item, index }) => {
    const isMissing = item.status === 'missing';
    const isOverridden = item.status === 'overridden';
    const isDoc = item.itemType === 'document';
    const mr = (item as EvidenceDocument)._matchedRule;
    const canBeOverridden = mr ? mr.canBeOverridden : !!(item as EvidenceDocument).docDef?.canBeOverridden;
    const canOverride = isDoc && isMissing && canBeOverridden && hasPermission(item, 'override');

    let title = isDoc ? item.name : item.label;
    let url = isDoc ? item.fileUrl : item.url;
    let fileType = isDoc ? item.type : 'JPG';

    return (
      <div className={`group flex flex-col rounded-2xl overflow-hidden border-2 bg-white transition-all cursor-pointer ${
        isOverridden ? 'border-purple-200 hover:shadow-xl' :
        isMissing ? 'border-dashed border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30' :
        item.status === 'verified' ? 'border-emerald-200 hover:shadow-xl' :
        item.status === 'rejected' ? 'border-red-200 hover:shadow-xl' :
        'border-indigo-100 hover:shadow-xl'
      }`} onClick={() => {
        if (!isMissing || isOverridden) setSelectedItemIndex(index);
        else triggerUpload(item.itemType, item.id);
      }}>
        {/* Top Half: Thumbnail Aspect */}
        <div className="relative aspect-[4/3] w-full shrink-0 bg-gray-50 overflow-hidden border-b border-gray-100 flex items-center justify-center">
          {!isMissing && !isOverridden && url && (
             fileType === 'PDF' ? (
               <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                 <FileText className="w-16 h-16 text-indigo-300 group-hover:scale-110 transition-transform duration-500" />
               </div>
             ) : (
               <img src={url} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
             )
          )}

          {isOverridden && (
            <div className="flex flex-col items-center justify-center gap-2 text-purple-400">
              <ShieldOff className="w-8 h-8" />
              <span className="text-[10px] bg-purple-50 text-purple-600 px-2 rounded-full font-bold uppercase tracking-widest">Overridden</span>
            </div>
          )}

          {isMissing && !isOverridden && (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-indigo-500 transition-colors">
              {isDoc ? <UploadCloud className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
              <span className="text-[10px] bg-red-50 text-red-500 px-2 rounded-full font-bold uppercase tracking-widest">Missing</span>
            </div>
          )}

          {/* Status Badges */}
          {!isMissing && !isOverridden && (
            <div className="absolute top-3 right-3 flex gap-2">
              {item.status === 'verified' && <div className="bg-emerald-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>}
              {item.status === 'rejected' && <div className="bg-red-500 rounded-full p-1"><X className="w-3 h-3 text-white" /></div>}
              {item.status === 'uploaded' && <div className="bg-amber-500 rounded-full p-1"><AlertCircle className="w-3 h-3 text-white" /></div>}
            </div>
          )}
        </div>

        {/* Bottom Half: Name + Type + Override button */}
        <div className="px-3 py-2.5 flex items-center justify-between gap-2">
          <h4 className="text-gray-900 text-xs font-semibold truncate leading-tight" title={title}>{title}</h4>
          {isOverridden ? (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">Waived</span>
          ) : !isMissing ? (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{fileType}</span>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              {canOverride && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOverrideTarget(item as EvidenceDocument); }}
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors border border-purple-200"
                  title="Waive this document"
                >
                  Override
                </button>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100 transition-colors">Upload</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const documentItems = allEvidence.filter(e => e.itemType === 'document');
  const vehicleItems = allEvidence.filter(e => e.itemType === 'photo' && e.category === 'vehicle');
  const damageItems = allEvidence.filter(e => e.itemType === 'photo' && e.category === 'damage');


  const docsUploaded = documentItems.filter(d => d.status !== 'missing').length;
  const photosUploaded = [...vehicleItems, ...damageItems].filter(p => p.status !== 'missing').length;
  const totalPhotos = vehicleItems.length + damageItems.length;
  const docsVerified = documentItems.filter(d => d.status === 'verified').length;
  const docsRejected = documentItems.filter(d => d.status === 'rejected').length;
  const docsOverridden = documentItems.filter(d => d.status === 'overridden').length;

  // Gate conditions — use _matchedRule.required (falls back to docDef.required for legacy surveys)
  const requiredPhotos = [...vehicleItems, ...damageItems].filter(p => {
    const mr = (p as any)._matchedRule;
    return p.itemType === 'photo' && (mr ? mr.required : (p as any).imgDef?.required);
  });
  const mandatoryPhotosComplete = requiredPhotos.every(p => p.status !== 'missing');
  const mandatoryDocsComplete = documentItems.filter(d => {
    const mr = (d as any)._matchedRule;
    const isRequired = mr ? mr.required : (d as any).docDef?.required;
    return isRequired && d.status === 'missing';
  }).length === 0;

  // Docs not yet in a terminal approved state (verified or overridden) — used by collection-complete modal
  const problematicDocs = documents.filter(d => d.status !== 'verified' && d.status !== 'overridden');

  return (
    <div className="h-full flex flex-col bg-white">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />

      {/* Status Summary Bar */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Documents pill */}
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">Documents</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm font-bold text-gray-900">{docsUploaded}/{documentItems.length}</span>
                {docsVerified > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">{docsVerified} verified</span>}
                {docsRejected > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200">{docsRejected} rejected</span>}
                {docsOverridden > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">{docsOverridden} waived</span>}
                {documentItems.length - docsUploaded > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">{documentItems.length - docsUploaded} pending</span>}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100" />

          {/* Photos pill */}
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">Photos</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm font-bold text-gray-900">{photosUploaded}/{totalPhotos}</span>
                {vehicleItems.filter(p => p.status !== 'missing').length > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">{vehicleItems.filter(p => p.status !== 'missing').length} angles</span>}
                {damageItems.filter(p => p.status !== 'missing').length > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-200">{damageItems.filter(p => p.status !== 'missing').length} damage</span>}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-36 hidden lg:block">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400">Overall</span>
              <span className="text-[10px] font-bold text-gray-600">{allEvidence.length > 0 ? Math.round(((docsUploaded + photosUploaded) / allEvidence.length) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${allEvidence.length > 0 ? ((docsUploaded + photosUploaded) / allEvidence.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const missing = allEvidence.filter(e => e.status === 'missing').map(e => e.itemType === 'document' ? (e as any).name : (e as any).label).join(', ');
              alert(`Reminder sent for: ${missing || 'None pending'}`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" /> Send Reminder
          </button>
          <button
            onClick={runAIInspection}
            disabled={isInspecting || !mandatoryPhotosComplete}
            title={!mandatoryPhotosComplete ? 'Upload all required photos first' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isInspecting || !mandatoryPhotosComplete ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isInspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Run AI Analysis
          </button>
          <button
            onClick={handleMarkCollectionComplete}
            disabled={!mandatoryPhotosComplete}
            title={!mandatoryPhotosComplete ? 'Collect all required photos first' : 'Mark evidence collection complete and advance to AI Assessment'}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${!mandatoryPhotosComplete ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            <Check className="w-3.5 h-3.5" /> Mark Collection Complete
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12">
        
        {/* Documents */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Documents</h3>
            <span className="ml-2 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{documentItems.filter(d=>d.status!=='missing').length} / {documentItems.length}</span>
          </div>
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-6">
            {documentItems.map((item, idx) => <EvidenceCard key={item.id} item={item} index={allEvidence.indexOf(item)} />)}
          </div>
        </section>

        {/* Vehicle Angles */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <ImageIcon className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Vehicle Angles</h3>
            <span className="ml-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{vehicleItems.filter(d=>d.status!=='missing').length} / {vehicleItems.length}</span>
          </div>
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-6 items-start">
            {vehicleItems.map((item) => <EvidenceCard key={item.id} item={item} index={allEvidence.indexOf(item)} />)}
            <button
              onClick={() => triggerUpload('photo', 'new-vehicle')}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all aspect-[4/3] min-h-[160px] h-full shadow-sm"
            >
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Add Custom<br/>Angle</span>
            </button>
          </div>
        </section>

        {/* Damage Profiles */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Damage Profiles</h3>
            <span className="ml-2 text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">{damageItems.filter(d=>d.status!=='missing').length} / {damageItems.length}</span>
          </div>
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-6 items-start">
            {damageItems.map((item) => <EvidenceCard key={item.id} item={item} index={allEvidence.indexOf(item)} />)}
            <button
              onClick={() => triggerUpload('photo', 'new-damage')}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all aspect-[4/3] min-h-[160px] h-full shadow-sm"
            >
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Add Custom<br/>Damage</span>
            </button>
          </div>
        </section>

      </div>

      {/* FULLSCREEN LIGHTBOX & OCR VIEWER */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium text-white">
                {selectedItem.itemType === 'document' ? selectedItem.name : selectedItem.label}
              </h3>
              <div className="flex gap-2">
                {selectedItem.status === 'verified' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded border border-emerald-500/30">Verified</span>}
                {selectedItem.status === 'rejected' && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded border border-red-500/30">Rejected</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {selectedItemIndex! + 1} of {allEvidence.length}
              </div>
              <button onClick={() => setSelectedItemIndex(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Viewer Construction */}
          <div className="flex-1 flex overflow-hidden">

            {/* Left Nav Sidebar */}
            <div className="w-72 bg-gray-900 border-r border-white/10 flex flex-col shrink-0">
              <div className="p-4 border-b border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-gray-900/90 backdrop-blur z-10">
                Gallery Index
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                {allEvidence.map((ev, idx) => {
                   if (ev.status === 'missing') return null;
                   const isActive = selectedItemIndex === idx;
                   const name = ev.itemType === 'document' ? ev.name : ev.label;
                   const thumb = ev.itemType === 'document' ? ev.fileUrl : ev.url;
                   const isPdf = ev.itemType === 'document' && ev.type === 'PDF';
                   
                   return (
                     <button
                       key={ev.id}
                       onClick={(e) => { e.stopPropagation(); setSelectedItemIndex(idx); }}
                       className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left ${
                         isActive ? 'bg-indigo-600/30 ring-1 ring-indigo-500/50 shadow-inner' : 'hover:bg-white/10 opacity-70 hover:opacity-100'
                       }`}
                     >
                       <div className="w-12 h-12 shrink-0 bg-black/50 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative">
                         {isPdf ? <FileText className="w-6 h-6 text-indigo-400" /> : (thumb && <img src={thumb} className="w-full h-full object-cover" alt={name} />)}
                         {ev.status === 'verified' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-900 shadow"></div>}
                         {ev.status === 'rejected' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-900 shadow"></div>}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className={`text-xs font-bold truncate ${isActive ? 'text-indigo-200' : 'text-gray-200'}`}>{name}</div>
                         <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate mt-0.5">{ev.itemType === 'document' ? ev.type : 'Image'}</div>
                       </div>
                     </button>
                   );
                })}
              </div>
            </div>
            
            {/* Main Visual */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-black/20 overflow-hidden group/main">
              {/* Overlay Nav Left */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigateViewer(-1); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 text-white opacity-0 group-hover/main:opacity-100 hover:bg-black/80 transition-all backdrop-blur z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Overlay Nav Right */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigateViewer(1); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 text-white opacity-0 group-hover/main:opacity-100 hover:bg-black/80 transition-all backdrop-blur z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {(() => {
                const url = selectedItem.itemType === 'document' ? selectedItem.fileUrl : selectedItem.url;
                const type = selectedItem.itemType === 'document' ? selectedItem.type : 'JPG';
                if (!url) return <Loader2 className="w-10 h-10 animate-spin text-white/20" />;
                if (type === 'PDF') return <iframe src={url} className="w-full h-full rounded-2xl shadow-2xl bg-white border border-white/10 relative z-10" />;
                return <img src={url} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl ring-1 ring-white/10 relative z-10" alt="Evidence" referrerPolicy="no-referrer" />;
              })()}
            </div>

            {/* Sidebar Data/OCR Sheet */}
            <div className="w-[420px] bg-white flex flex-col border-l border-white/10 shrink-0 animate-in slide-in-from-right-8 duration-300">
              
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                    {selectedItem.itemType === 'document' ? 'OCR Extraction' : 'AI Analysis'}
                  </h4>
                  {selectedItem.itemType === 'document' ? (
                     <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full">Automated Parse</span>
                  ) : (
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full ${selectedItem.aiStatus === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selectedItem.aiStatus}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-2">
                  Uploaded By {selectedItem.itemType === 'document' ? selectedItem.submitter : selectedItem.by} on {selectedItem.date}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Override banner */}
                {selectedItem.itemType === 'document' && selectedItem.status === 'overridden' && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-700">
                      <ShieldOff className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-widest">Document Overridden / Waived</span>
                    </div>
                    {selectedItem.overrideReason && (
                      <p className="text-xs text-purple-700 font-medium pl-6">{selectedItem.overrideReason}</p>
                    )}
                    <p className="text-[10px] text-purple-500 pl-6">
                      By {selectedItem.overriddenBy} · {selectedItem.overriddenAt}
                    </p>
                  </div>
                )}
                {selectedItem.itemType === 'document' ? (
                  <div className="space-y-6">
                    {(selectedItem.docDef?.fields ?? []).length > 0 ? (
                      selectedItem.docDef!.fields.map((field) => (
                        field.type === 'table' ? (
                          <TableLineItemField
                            key={field.id}
                            field={field}
                            rows={Array.isArray(selectedItem.ocrData?.[field.label]) ? selectedItem.ocrData![field.label] : []}
                            onChange={(rows) => {
                              handleDocumentUpdate({
                                ...selectedItem,
                                ocrData: { ...selectedItem.ocrData, [field.label]: rows }
                              });
                            }}
                          />
                        ) : (
                          <MetadataField
                            key={field.id}
                            label={field.label}
                            value={selectedItem.ocrData?.[field.label] || ''}
                            status="success"
                            onChange={(val) => {
                              handleDocumentUpdate({
                                ...selectedItem,
                                ocrData: { ...selectedItem.ocrData, [field.label]: val }
                              });
                            }}
                          />
                        )
                      ))
                    ) : (
                      Object.entries(selectedItem.ocrData || {}).map(([fieldName, fieldValue]) => (
                        <MetadataField 
                          key={fieldName} 
                          label={fieldName} 
                          value={fieldValue as string} 
                          status="success"
                          onChange={(val) => {
                            handleDocumentUpdate({
                              ...selectedItem,
                              ocrData: { ...selectedItem.ocrData, [fieldName]: val }
                            });
                          }}
                        />
                      ))
                    )}

                    {Object.keys(selectedItem.ocrData || {}).length === 0 && (
                      <div className="text-center py-10 opacity-50">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No OCR Data Extracted</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Context</p>
                      <p className="text-sm font-medium text-gray-800">Visual match confirmed for {selectedItem.label} perspective. Resolution and clarity are within acceptable bounds.</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bottom Actions */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0 space-y-2">
                {selectedItem.itemType === 'document' && selectedItem.status === 'overridden' ? (
                  <button
                    onClick={() => handleDocumentUpdate({ ...selectedItem, status: 'missing', overrideReason: undefined, overriddenBy: undefined, overriddenAt: undefined })}
                    className="w-full py-3 bg-white border border-purple-200 text-purple-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldOff className="w-4 h-4" /> Undo Override
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleItemAction(selectedItem, 'verified')}
                      className="py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <FileCheck className="w-4 h-4" /> Verify
                    </button>
                    <button
                      onClick={() => handleItemAction(selectedItem, 'rejected')}
                      className="py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Mark Collection Complete Modal */}
      <Modal open={showCompleteModal} onClose={() => { setShowCompleteModal(false); setCompleteReason(''); }} blur closeOnOverlayClick maxWidth="lg" panelClassName="rounded-2xl shadow-2xl">
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-gray-900">Mark Evidence Collection Complete</h3>
                </div>
                <p className="text-xs text-gray-500">This will advance the survey to <span className="font-bold text-gray-700">Inspection, AI Assessment & Repair</span>.</p>
              </div>
              <button onClick={() => { setShowCompleteModal(false); setCompleteReason(''); }} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            {problematicDocs.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-xs font-black text-amber-800 uppercase tracking-widest">The following documents are not fully approved:</p>
                <ul className="space-y-1.5">
                  {problematicDocs.map(d => (
                    <li key={d.id} className="flex items-center gap-2 text-xs text-amber-900">
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.status === 'missing' ? 'bg-red-100 text-red-700' :
                        d.status === 'overridden' ? 'bg-purple-100 text-purple-700' :
                        d.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{d.status}</span>
                      <span className="font-semibold">{d.name}</span>
                      {d.status === 'overridden' && d.overrideReason && <span className="text-amber-600 truncate">— {d.overrideReason}</span>}
                    </li>
                  ))}
                </ul>
                <div>
                  <label className="block text-xs font-black text-amber-800 uppercase tracking-widest mb-1.5">Reason for proceeding <span className="text-red-500">*</span></label>
                  <textarea
                    rows={2}
                    value={completeReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompleteReason(e.target.value)}
                    placeholder="e.g. Remaining documents waived by manager approval — proceeding to assessment"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm resize-none outline-none focus:border-amber-400 bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {problematicDocs.length === 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">All documents are verified. Ready to advance.</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCompleteModal(false); setCompleteReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCollectionComplete}
                disabled={problematicDocs.length > 0 && !completeReason.trim()}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirm & Advance Stage
              </button>
            </div>
          </div>
      </Modal>

      {/* Override Modal */}
      <Modal open={!!overrideTarget} onClose={() => { setOverrideTarget(null); setOverrideReason(''); }} blur closeOnOverlayClick maxWidth="md" panelClassName="rounded-2xl shadow-2xl">
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldOff className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-black text-gray-900">Override Document</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Waiving <span className="font-bold text-gray-700">{overrideTarget?.name}</span> marks it as overridden so the workflow can proceed without it.
                </p>
              </div>
              <button onClick={() => { setOverrideTarget(null); setOverrideReason(''); }} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Reason <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOverrideReason(e.target.value)}
                placeholder="e.g. Document unavailable — approved by manager on call"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setOverrideTarget(null); setOverrideReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={!overrideReason.trim()}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShieldOff className="w-4 h-4" /> Confirm Override
              </button>
            </div>
          </div>
      </Modal>
    </div>
  );
}
