import React from 'react';
import { ResumeData } from '../../types/resume';
import { User, Mail, Phone, MapPin, Globe, Linkedin, Camera, Trash2, Eye } from 'lucide-react';

interface PersonalInfoFormProps {
  resume: ResumeData;
  onChange: (updates: Partial<ResumeData>) => void;
  errors?: Record<string, string>;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  resume,
  onChange,
  errors = {} as Record<string, string>,
}) => {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Constrain file size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange({ photoUrl: result, showPhoto: true });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChange({ photoUrl: '', showPhoto: false });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <User className="w-4 h-4 text-[#004D40]" />
            Personal Information
          </h3>
          <p className="text-xs text-slate-500">
            Contact information used by recruiters to reach you directly
          </p>
        </div>
      </div>

      {/* Photo Uploader & Toggle */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {resume.photoUrl ? (
            <img
              src={resume.photoUrl}
              alt={resume.fullName || 'Candidate Photo'}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-lg">
              <Camera className="w-6 h-6 text-slate-400" />
            </div>
          )}

          <div>
            <span className="text-xs sm:text-sm font-semibold text-slate-900 block">
              Profile Photo (Optional)
            </span>
            <span className="text-[11px] text-slate-500 block">
              PNG or JPG up to 2MB. Most ATS resumes do not require photos.
            </span>

            <div className="flex items-center gap-2 mt-2">
              <label
                htmlFor="photo-upload"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
              >
                {resume.photoUrl ? 'Change Photo' : 'Upload Photo'}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {resume.photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2 py-1 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toggle show on resume */}
        {resume.photoUrl && (
          <label className="flex items-center gap-2 self-start sm:self-auto cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={resume.showPhoto}
              onChange={(e) => onChange({ showPhoto: e.target.checked })}
              className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
            />
            <div className="text-xs text-slate-700">
              <span className="font-semibold block">Show on Resume</span>
              <span className="text-[11px] text-slate-500">Include photo in preview/PDF</span>
            </div>
          </label>
        )}
      </div>

      {/* Basic Info Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={resume.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="e.g. Aarav Sharma"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20 ${
              errors.fullName ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Professional Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Professional Title
          </label>
          <input
            type="text"
            value={resume.professionalTitle}
            onChange={(e) => onChange({ professionalTitle: e.target.value })}
            placeholder="Operations Specialist"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              value={resume.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="aarav@example.com"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20 ${
                errors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="tel"
              value={resume.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            City
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={resume.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="e.g. Bengaluru"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
            />
          </div>
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            State
          </label>
          <input
            type="text"
            value={resume.state}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder="e.g. Karnataka"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            LinkedIn Profile URL (Optional)
          </label>
          <div className="relative">
            <Linkedin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="url"
              value={resume.linkedIn}
              onChange={(e) => onChange({ linkedIn: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
            />
          </div>
        </div>

        {/* Portfolio / Website */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Portfolio / Website (Optional)
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="url"
              value={resume.portfolio}
              onChange={(e) => onChange({ portfolio: e.target.value })}
              placeholder="https://myportfolio.dev"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
