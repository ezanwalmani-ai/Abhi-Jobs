import React, { useState } from 'react';
import { ResumeCertification } from '../../types/resume';
import { ShieldCheck, Plus, Trash2, ChevronRight } from 'lucide-react';

interface CertificationsFormProps {
  certifications: ResumeCertification[];
  onChange: (certifications: ResumeCertification[]) => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certifications,
  onChange,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    certifications.length > 0 ? certifications[0].id : null
  );

  const handleAdd = () => {
    const newEntry: ResumeCertification = {
      id: `cert_${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    };
    onChange([...certifications, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleUpdate = (id: string, updates: Partial<ResumeCertification>) => {
    onChange(certifications.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDelete = (id: string) => {
    onChange(certifications.filter((c) => c.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#004D40]" />
            Certifications (Optional)
          </h3>
          <p className="text-xs text-slate-500">
            Professional licenses, industry certifications, or verified credentials
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certification</span>
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <ShieldCheck className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700">No certifications added</p>
          <p className="text-[11px] text-slate-400">
            Add recognized certifications from AWS, Google, Microsoft, Six Sigma, etc.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#004D40] text-xs font-semibold border border-teal-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => {
            const isExpanded = expandedId === cert.id;
            return (
              <div
                key={cert.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30"
              >
                <div className="p-3.5 sm:p-4 bg-white flex items-center justify-between gap-3 border-b border-slate-100">
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : cert.id)}
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90 text-[#004D40]' : ''
                      }`}
                    />
                    <div className="min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {cert.name || 'Untitled Certification'}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {cert.issuer || 'Issuing Authority'} {cert.issueDate ? `• ${cert.issueDate}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    title="Delete Certification"
                    onClick={() => handleDelete(cert.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Certification Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => handleUpdate(cert.id, { name: e.target.value })}
                          placeholder="e.g. Certified Scrum Master (CSM)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Issuing Organization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => handleUpdate(cert.id, { issuer: e.target.value })}
                          placeholder="e.g. Scrum Alliance / Google"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Issue Date
                        </label>
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={(e) => handleUpdate(cert.id, { issueDate: e.target.value })}
                          placeholder="e.g. May 2025"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Credential ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={cert.credentialId}
                          onChange={(e) => handleUpdate(cert.id, { credentialId: e.target.value })}
                          placeholder="e.g. ID-89423984"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
