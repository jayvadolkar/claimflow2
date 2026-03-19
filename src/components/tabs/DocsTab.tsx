import React, { useState, useRef, useEffect } from 'react';
import { Survey, ValidationFlag, DocumentDef } from '../../types';
import { FileText, CheckCircle2, AlertCircle, ChevronRight, Download, UploadCloud, Loader2, ShieldCheck, ShieldAlert, RefreshCw, Link as LinkIcon, Smartphone, FileCheck, Plus, Eye, MoreVertical, Edit3, X, Image as ImageIcon, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

type DocSource = 'Link' | 'Digital' | 'Manual' | 'System';

interface Document {
  id: number;
  name: string;
  status: 'uploaded' | 'missing' | 'verified' | 'rejected';
  type: string;
  date: string;
  size: string;
  source: DocSource;
  ocrData: any;
  validation: any;
  fileUrl: string | null;
  docDef?: DocumentDef;
}

interface Photo {
  id: number;
  label: string;
  url: string;
  date: string;
  by: string;
  aiStatus: 'Verified' | 'Pending' | 'Flagged';
  category: 'vehicle' | 'damage';
}

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

export function DocsTab({ survey, onUpdateSurvey, userRole }: { survey: Survey, onUpdateSurvey?: (survey: Survey) => void, userRole?: string }) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'pre' | 'post'>('pre');
  const [activeSubTab, setActiveSubTab] = useState<'documents' | 'photos'>('documents');
  const [activePhotoCategory, setActivePhotoCategory] = useState<'vehicle' | 'damage'>('vehicle');

  const [preRepairDocs, setPreRepairDocs] = useState<Document[]>([]);
  const [postRepairDocs, setPostRepairDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock Photos Data
  const [photos, setPhotos] = useState<Photo[]>(survey.photos || [
    { id: 1, label: 'Front View', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified', category: 'vehicle' },
    { id: 2, label: 'Rear View', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified', category: 'vehicle' },
    { id: 3, label: 'Left Side', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified', category: 'vehicle' },
    { id: 4, label: 'Right Side', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified', category: 'vehicle' },
    { id: 5, label: 'Damage 1', url: 'https://images.unsplash.com/photo-1605557202138-097824c3e074?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Pending', category: 'damage' },
    { id: 6, label: 'Damage 2', url: 'https://images.unsplash.com/photo-1566315582498-8e6821217822?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Pending', category: 'damage' },
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [replacePhotoId, setReplacePhotoId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (response.ok) {
          const fetchedDocs: DocumentDef[] = await response.json();
          
          const preDocs: Document[] = [];
          const postDocs: Document[] = [];

          fetchedDocs.forEach((docDef, index) => {
            // Applicability Filters
            const hypothecationMatch = !docDef.hypothecation || 
                                      docDef.hypothecation === 'Both' || 
                                      (survey.isHypothecated && docDef.hypothecation === 'Yes') || 
                                      (!survey.isHypothecated && docDef.hypothecation === 'No');
            
            // Normalize survey loss type
            const caseMatch = !docDef.applicableCases || 
                             docDef.applicableCases.includes(survey.lossType as any);

            // Normalize survey vehicle category
            const vehicleTypeMatch = !docDef.vehicleTypes || 
                                    docDef.vehicleTypes.includes(survey.vehicleCategory as any);

            // Normalize survey vehicle class
            const vehicleClassMatch = !docDef.vehicleClasses || 
                                     docDef.vehicleClasses.includes(survey.vehicleClass as any);

            if (!hypothecationMatch || !caseMatch || !vehicleTypeMatch || !vehicleClassMatch) {
              console.log(`Doc ${docDef.name} filtered out: hypothecationMatch=${hypothecationMatch}, caseMatch=${caseMatch}, vehicleTypeMatch=${vehicleTypeMatch}, vehicleClassMatch=${vehicleClassMatch}, surveyVehicleClass=${survey.vehicleClass}, docDef.vehicleClasses=${JSON.stringify(docDef.vehicleClasses)}`);
              return;
            }

            const existingDoc = survey.documents?.find(d => d.name === docDef.name);
            
            const doc: Document = existingDoc ? { ...existingDoc, docDef } : {
              id: index + 1,
              name: docDef.name,
              status: docDef.isSystem ? 'uploaded' : 'missing',
              type: (docDef.allowedTypes && docDef.allowedTypes[0]) || '-',
              date: docDef.isSystem ? new Date().toLocaleDateString() : '-',
              size: docDef.isSystem ? '1.2 MB' : '-',
              source: docDef.isSystem ? 'System' : 'Manual',
              ocrData: {},
              validation: null,
              fileUrl: null,
              docDef: docDef
            };

            if (docDef.workflowStage && ['Survey Create/Intake', 'Evidence Collection', 'Inspection, Assessment & repair'].includes(docDef.workflowStage)) {
              preDocs.push(doc);
            } else {
              postDocs.push(doc);
            }
          });

          setPreRepairDocs(preDocs);
          setPostRepairDocs(postDocs);
        } else {
          toast.error('Failed to load document definitions');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Error loading document definitions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const currentDocs = activeCategory === 'pre' ? preRepairDocs : postRepairDocs;

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered`);
    api.logEvent(survey.id, {
      eventName: action,
      actor: userRole || 'User',
      triggerCondition: 'Manual action',
      systemAction: `Triggered ${action}`,
      outcomeState: 'Pending'
    }).catch(console.error);
  };

  const triggerUpload = (docId: number) => {
    const allDocs = [...preRepairDocs, ...postRepairDocs];
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;

    if (userRole && doc.docDef && !doc.docDef.uploadRoles.includes(userRole)) {
      toast.error(`You do not have permission to upload ${doc.name}`);
      return;
    }

    setActiveUploadId(docId);
    fileInputRef.current?.click();
  };

  const runAIInspection = async () => {
    setIsInspecting(true);
    const toastId = toast.loading('Running AI Inspection on photos...');

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const updatedPhotos = photos.map(p => {
        if (p.aiStatus === 'Pending') {
          // Randomly assign Verified or Flagged for simulation
          return { ...p, aiStatus: Math.random() > 0.2 ? 'Verified' : 'Flagged' } as Photo;
        }
        return p;
      });

      setPhotos(updatedPhotos);
      if (onUpdateSurvey) onUpdateSurvey({ ...survey, photos: updatedPhotos });

      toast.success('AI Inspection complete', { id: toastId });
      
      api.logEvent(survey.id, {
        eventName: 'AI Inspection Complete',
        actor: 'System',
        triggerCondition: 'Manual trigger',
        systemAction: 'Processed photos through AI model',
        outcomeState: 'Photos verified/flagged'
      }).catch(console.error);

    } catch (error) {
      toast.error('AI Inspection failed', { id: toastId });
    } finally {
      setIsInspecting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (activeSubTab === 'photos') {
      const fileUrl = URL.createObjectURL(file);
      
      if (replacePhotoId !== null) {
        // Handle photo replacement
        const updatedPhotos = photos.map(p => 
          p.id === replacePhotoId 
            ? { ...p, url: fileUrl, date: new Date().toLocaleDateString(), by: userRole || 'User', aiStatus: 'Pending' } as Photo 
            : p
        );
        setPhotos(updatedPhotos);
        if (onUpdateSurvey) onUpdateSurvey({ ...survey, photos: updatedPhotos });
        toast.success('Photo replaced successfully');
        setReplacePhotoId(null);
      } else {
        // Handle new photo upload
        const newPhoto: Photo = {
          id: Date.now(),
          label: `Uploaded ${activePhotoCategory === 'vehicle' ? 'Vehicle' : 'Damage'} Photo`,
          url: fileUrl,
          date: new Date().toLocaleDateString(),
          by: userRole || 'User',
          aiStatus: 'Pending',
          category: activePhotoCategory
        };
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        if (onUpdateSurvey) onUpdateSurvey({ ...survey, photos: updatedPhotos });
        toast.success('Photo uploaded successfully');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (activeUploadId === null) return;

    const docId = activeUploadId;
    const allDocs = [...preRepairDocs, ...postRepairDocs];
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;

    const docName = doc.name;
    const fileUrl = URL.createObjectURL(file);
    const fileType = file.type.includes('pdf') ? 'PDF' : 'Image';
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    setIsProcessing(true);
    toast.loading(`Processing ${docName}...`, { id: 'ocr' });

    await new Promise(resolve => setTimeout(resolve, 1500));

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
    } else {
      initialOcrData['Vehicle Number'] = survey.vehicle;
      initialOcrData['Insured Name'] = survey.customerName;
    }

    const updatedDoc: Document = {
      ...doc,
      status: 'uploaded',
      type: fileType,
      date: new Date().toLocaleDateString(),
      size: fileSize,
      source: 'Manual',
      ocrData: initialOcrData,
      validation: null,
      fileUrl: fileUrl
    };

    if (activeCategory === 'pre') {
      const newDocs = preRepairDocs.map(d => d.id === docId ? updatedDoc : d);
      setPreRepairDocs(newDocs);
      if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...newDocs, ...postRepairDocs] });
    } else {
      const newDocs = postRepairDocs.map(d => d.id === docId ? updatedDoc : d);
      setPostRepairDocs(newDocs);
      if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...preRepairDocs, ...newDocs] });
    }

    api.logEvent(survey.id, {
      eventName: 'Document Uploaded',
      actor: userRole || 'User',
      triggerCondition: 'Manual upload',
      systemAction: `Uploaded document: ${docName}`,
      outcomeState: 'Document uploaded'
    }).catch(console.error);

    setIsProcessing(false);
    setActiveUploadId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success(`${docName} processed successfully`, { id: 'ocr' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (selectedDoc) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm flex flex-col">
        {/* TOP BAR - CLOSE ONLY */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">{selectedDoc.name}</h3>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{selectedDoc.date} • {selectedDoc.size}</p>
          </div>
          <button 
            onClick={() => setSelectedDoc(null)} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* MAIN PREVIEW */}
          <div className="flex-1 p-12 overflow-y-auto flex items-center justify-center">
            {selectedDoc.fileUrl ? (
              selectedDoc.type === 'PDF' ? (
                <iframe src={selectedDoc.fileUrl} className="w-full h-full rounded-2xl shadow-2xl bg-white" title="Document Preview" />
              ) : (
                <img src={selectedDoc.fileUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
              )
            ) : (
              <div className="w-full max-w-2xl bg-white/5 aspect-[1/1.4] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/20">
                <FileText className="w-20 h-20 mb-6" />
                <p className="text-sm font-bold uppercase tracking-widest">No Preview Available</p>
              </div>
            )}
          </div>
          
          <div className="w-[450px] bg-white flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">AI Data Extraction</h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">98% Confidence</span>
              </div>
              <p className="text-sm text-gray-500">Verified fields from automated OCR processing.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Metadata Fields */}
              <div className="space-y-6">
                <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Primary Metadata
                </h5>
                
                {selectedDoc.docDef?.fields && selectedDoc.docDef.fields.length > 0 ? (
                  selectedDoc.docDef.fields.map((field) => (
                    <MetadataField 
                      key={field.id} 
                      label={field.label} 
                      value={selectedDoc.ocrData?.[field.label] || ''} 
                      status="success"
                      onChange={(val) => {
                        const updatedDoc = {
                          ...selectedDoc,
                          ocrData: { ...selectedDoc.ocrData, [field.label]: val }
                        };
                        setSelectedDoc(updatedDoc);
                        
                        // Update survey state
                        const updateDocInList = (docs: Document[]) => docs.map(d => d.id === selectedDoc.id ? updatedDoc : d);
                        if (activeCategory === 'pre') {
                          const newDocs = updateDocInList(preRepairDocs);
                          setPreRepairDocs(newDocs);
                          if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...newDocs, ...postRepairDocs] });
                        } else {
                          const newDocs = updateDocInList(postRepairDocs);
                          setPostRepairDocs(newDocs);
                          if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...preRepairDocs, ...newDocs] });
                        }
                      }}
                    />
                  ))
                ) : (
                  Object.entries(selectedDoc.ocrData || {}).map(([fieldName, fieldValue]) => (
                    <MetadataField 
                      key={fieldName} 
                      label={fieldName} 
                      value={fieldValue as string} 
                      status="success"
                      onChange={(val) => {
                        const updatedDoc = {
                          ...selectedDoc,
                          ocrData: { ...selectedDoc.ocrData, [fieldName]: val }
                        };
                        setSelectedDoc(updatedDoc);
                        
                        // Update survey state
                        const updateDocInList = (docs: Document[]) => docs.map(d => d.id === selectedDoc.id ? updatedDoc : d);
                        if (activeCategory === 'pre') {
                          const newDocs = updateDocInList(preRepairDocs);
                          setPreRepairDocs(newDocs);
                          if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...newDocs, ...postRepairDocs] });
                        } else {
                          const newDocs = updateDocInList(postRepairDocs);
                          setPostRepairDocs(newDocs);
                          if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...preRepairDocs, ...newDocs] });
                        }
                      }}
                    />
                  ))
                )}

                {Object.keys(selectedDoc.ocrData || {}).length === 0 && (!selectedDoc.docDef?.fields || selectedDoc.docDef.fields.length === 0) && (
                  <div className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-100 mx-auto mb-4 animate-spin" />
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Processing Data...</p>
                  </div>
                )}
              </div>

              {/* Validation Flags */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Validation Flags
                </h5>
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Vehicle Match</p>
                      <p className="text-[10px] text-emerald-700 mt-0.5">Registration number matches the claim intimation records.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">Authenticity Verified</p>
                      <p className="text-[10px] text-blue-700 mt-0.5">Digital signature and QR code validated against government database.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* BOTTOM CTAS - LEFT ALIGNED */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button 
                onClick={() => { 
                  if (userRole && selectedDoc.docDef && !selectedDoc.docDef.verifyRoles.includes(userRole)) {
                    toast.error(`You do not have permission to verify ${selectedDoc.name}`);
                    return;
                  }
                  
                  const updateDoc = (docs: Document[]) => docs.map(d => d.id === selectedDoc.id ? { ...d, status: 'verified' as const } : d);
                  if (activeCategory === 'pre') {
                    const newDocs = updateDoc(preRepairDocs);
                    setPreRepairDocs(newDocs);
                    if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...newDocs, ...postRepairDocs] });
                  } else {
                    const newDocs = updateDoc(postRepairDocs);
                    setPostRepairDocs(newDocs);
                    if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...preRepairDocs, ...newDocs] });
                  }
                  
                  api.logEvent(survey.id, {
                    eventName: 'Document Verified',
                    actor: userRole || 'User',
                    triggerCondition: 'Manual verification',
                    systemAction: `Verified document: ${selectedDoc.name}`,
                    outcomeState: 'Document verified'
                  }).catch(console.error);

                  toast.success('Document verified'); 
                  setSelectedDoc(null); 
                }} 
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" /> Confirm & Verify
              </button>
              <button 
                onClick={() => {
                  if (userRole && selectedDoc.docDef && !selectedDoc.docDef.rejectRoles.includes(userRole)) {
                    toast.error(`You do not have permission to reject ${selectedDoc.name}`);
                    return;
                  }
                  
                  const updateDoc = (docs: Document[]) => docs.map(d => d.id === selectedDoc.id ? { ...d, status: 'rejected' as const } : d);
                  if (activeCategory === 'pre') {
                    const newDocs = updateDoc(preRepairDocs);
                    setPreRepairDocs(newDocs);
                    if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...newDocs, ...postRepairDocs] });
                  } else {
                    const newDocs = updateDoc(postRepairDocs);
                    setPostRepairDocs(newDocs);
                    if (onUpdateSurvey) onUpdateSurvey({ ...survey, documents: [...preRepairDocs, ...newDocs] });
                  }
                  
                  api.logEvent(survey.id, {
                    eventName: 'Document Rejected',
                    actor: userRole || 'User',
                    triggerCondition: 'Manual rejection',
                    systemAction: `Rejected document: ${selectedDoc.name}`,
                    outcomeState: 'Document rejected'
                  }).catch(console.error);

                  toast.success('Document rejected');
                  setSelectedDoc(null);
                }}
                className="px-6 py-3 bg-white border border-gray-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,.pdf"
      />
      
      {/* Header Section */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
              <button 
                onClick={() => setActiveCategory('pre')}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === 'pre' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Pre-Repair
              </button>
              <button 
                onClick={() => setActiveCategory('post')}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === 'post' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Post-Repair
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveSubTab('documents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeSubTab === 'documents' 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Documents
              </button>
              <button 
                onClick={() => setActiveSubTab('photos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeSubTab === 'photos' 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Photos
              </button>
            </div>
          </div>

          {/* Dropdowns for quick testing */}
          <div className="flex gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Vehicle Type</label>
              <select value={survey.vehicleCategory} onChange={(e) => onUpdateSurvey?.({...survey, vehicleCategory: e.target.value as any})} className="text-sm font-bold border-b border-gray-200 outline-none">
                <option value="2W">2W</option>
                <option value="4W">4W</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Vehicle Class</label>
              <select value={survey.vehicleClass} onChange={(e) => onUpdateSurvey?.({...survey, vehicleClass: e.target.value as any})} className="text-sm font-bold border-b border-gray-200 outline-none">
                <option value="Personal">Personal</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Claim Type</label>
              <select value={survey.lossType} onChange={(e) => onUpdateSurvey?.({...survey, lossType: e.target.value})} className="text-sm font-bold border-b border-gray-200 outline-none">
                <option value="Repair">Repair</option>
                <option value="Total Loss">Total Loss</option>
                <option value="Theft">Theft</option>
                <option value="Third Party">Third Party</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Hypothecation</label>
              <select value={survey.isHypothecated ? 'Yes' : 'No'} onChange={(e) => onUpdateSurvey?.({...survey, isHypothecated: e.target.value === 'Yes'})} className="text-sm font-bold border-b border-gray-200 outline-none">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>{currentDocs.filter(d => d.status === 'uploaded' || d.status === 'verified').length} Collected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>{currentDocs.filter(d => d.status === 'missing' || d.status === 'rejected').length} Pending</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeSubTab === 'documents' ? (
          <div className="max-w-5xl space-y-2">
            {currentDocs.map((doc) => (
              <div 
                key={doc.id}
                className={`group flex items-center justify-between p-4 rounded-2xl transition-all ${
                  ['uploaded', 'verified', 'rejected'].includes(doc.status)
                    ? 'hover:bg-gray-50' 
                    : 'bg-gray-50/50 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    ['uploaded', 'verified', 'rejected'].includes(doc.status)
                      ? 'bg-indigo-50 text-indigo-600 group-hover:scale-110' 
                      : 'bg-white text-gray-300 border border-gray-100'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{doc.name}</h4>
                      <div className="flex items-center gap-1.5">
                        {doc.source === 'Link' && <LinkIcon className="w-3 h-3 text-blue-400" />}
                        {doc.source === 'Digital' && <Smartphone className="w-3 h-3 text-purple-400" />}
                        {doc.source === 'Manual' && <UploadCloud className="w-3 h-3 text-orange-400" />}
                        {doc.source === 'System' && <FileCheck className="w-3 h-3 text-green-400" />}
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{doc.source}</span>
                      </div>
                      {doc.status === 'verified' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Verified</span>}
                      {doc.status === 'rejected' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">Rejected</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {['uploaded', 'verified', 'rejected'].includes(doc.status) ? `${doc.type} • ${doc.size} • ${doc.date}` : 'Awaiting collection from source'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {['uploaded', 'verified', 'rejected'].includes(doc.status) ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => triggerUpload(doc.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing && activeUploadId === doc.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      Collect
                    </button>
                  )}
                  <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
                <button 
                  onClick={() => setActivePhotoCategory('vehicle')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activePhotoCategory === 'vehicle' 
                      ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Vehicle Photos
                </button>
                <button 
                  onClick={() => setActivePhotoCategory('damage')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activePhotoCategory === 'damage' 
                      ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Damage Photos
                </button>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={runAIInspection}
                  disabled={isInspecting}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isInspecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Run AI Inspection
                </button>
                <button 
                  onClick={() => {
                    setReplacePhotoId(null);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {photos.filter(p => p.category === activePhotoCategory).map((photo) => (
                <div key={photo.id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-xl transition-all">
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedPhoto(photo)} 
                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setReplacePhotoId(photo.id);
                          fileInputRef.current?.click();
                        }} 
                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900">{photo.label}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        photo.aiStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {photo.aiStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>{photo.date}</span>
                      <span>By {photo.by}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all aspect-video"
              >
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Add Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedPhoto.label}</h3>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{selectedPhoto.date} • By {selectedPhoto.by}</p>
            </div>
            <button 
              onClick={() => setSelectedPhoto(null)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 p-12 overflow-y-auto flex items-center justify-center">
            <img src={selectedPhoto.url} alt={selectedPhoto.label} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}


