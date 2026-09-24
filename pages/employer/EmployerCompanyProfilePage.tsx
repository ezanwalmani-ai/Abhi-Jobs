import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, ShieldCheck, MapPin, Globe, Users, Briefcase, Mail, Phone, Edit3, Check, Save } from 'lucide-react';

interface EmployerCompanyProfilePageProps {
  navigate: (route: string) => void;
}

export const EmployerCompanyProfilePage: React.FC<EmployerCompanyProfilePageProps> = ({ navigate }) => {
  const { currentEmployer, updateEmployerProfile, showToast } = useApp();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: currentEmployer?.companyName || '',
    industry: currentEmployer?.industry || '',
    location: currentEmployer?.location || '',
    website: currentEmployer?.website || '',
    companySize: currentEmployer?.companySize || '',
    about: currentEmployer?.about || '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployerProfile(formData);
    setEditing(false);
    showToast('success', 'Profile Saved', 'Company profile details updated.');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Employer Journey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Company Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Public company information, recruiter branding, and verified employer status.
            </p>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>{editing ? 'Cancel Editing' : 'Edit Company Info'}</span>
          </button>
        </div>

        {/* Company Card / Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#061226] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                {formData.companyName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{formData.companyName}</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formData.industry}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/companies')}
              className="text-xs text-[#004D40] font-semibold hover:underline cursor-pointer"
            >
              View in Directory &rarr;
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">About Company</label>
                <textarea
                  rows={4}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className="w-full mt-1 p-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#061226] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Location</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {formData.location}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Company Size</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {formData.companySize}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Website</span>
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs sm:text-sm font-bold text-[#004D40] mt-1 flex items-center gap-1.5 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit Website
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Company Overview</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {formData.about}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
