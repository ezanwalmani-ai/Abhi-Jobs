import React, { useState } from 'react';
import {
  ResumeData,
  ResumeLanguageProficiency,
  ResumeSimpleEntry,
} from '../../../types/resume';
import {
  Plus,
  Trash2,
  Award,
  FolderGit2,
  Languages,
  Trophy,
  BookOpen,
  HeartHandshake,
  FileText,
  Users,
  Layers,
  BadgeCheck,
  ChevronDown,
} from 'lucide-react';

interface ResumeAdditionalSectionsEditorProps {
  resume: ResumeData;
  onChange: (updates: Partial<ResumeData>) => void;
}

type OptionalSectionId =
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'achievements'
  | 'awards'
  | 'training'
  | 'volunteer'
  | 'publications'
  | 'memberships'
  | 'customSections';

const OPTIONAL_SECTIONS: Array<{
  id: OptionalSectionId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'certifications', label: 'Certifications', desc: 'Licenses & professional credentials', icon: BadgeCheck },
  { id: 'projects', label: 'Projects', desc: 'Key portfolio, work, or academic projects', icon: FolderGit2 },
  { id: 'languages', label: 'Languages', desc: 'Spoken & written language proficiencies', icon: Languages },
  { id: 'achievements', label: 'Achievements', desc: 'Notable career milestones & highlights', icon: Trophy },
  { id: 'awards', label: 'Awards & Honors', desc: 'Industry recognitions & scholarships', icon: Award },
  { id: 'training', label: 'Training & Workshops', desc: 'Bootcamps, executive programs & seminars', icon: BookOpen },
  { id: 'volunteer', label: 'Volunteer Experience', desc: 'Community & non-profit leadership', icon: HeartHandshake },
  { id: 'publications', label: 'Publications', desc: 'Articles, whitepapers & research papers', icon: FileText },
  { id: 'memberships', label: 'Professional Memberships', desc: 'Associations, councils & societies', icon: Users },
  { id: 'customSections', label: 'Custom Sections', desc: 'Create your own titled section', icon: Layers },
];

export const ResumeAdditionalSectionsEditor: React.FC<ResumeAdditionalSectionsEditorProps> = ({
  resume,
  onChange,
}) => {
  const [openSections, setOpenSections] = useState<OptionalSectionId[]>(() => {
    const initiallyOpen: OptionalSectionId[] = [];
    if (resume.certifications.length > 0) initiallyOpen.push('certifications');
    if (resume.projects.length > 0) initiallyOpen.push('projects');
    if (resume.languages.length > 0) initiallyOpen.push('languages');
    if ((resume.achievements || []).length > 0) initiallyOpen.push('achievements');
    if ((resume.awards || []).length > 0) initiallyOpen.push('awards');
    if ((resume.training || []).length > 0) initiallyOpen.push('training');
    if ((resume.volunteer || []).length > 0) initiallyOpen.push('volunteer');
    if ((resume.publications || []).length > 0) initiallyOpen.push('publications');
    if ((resume.memberships || []).length > 0) initiallyOpen.push('memberships');
    if ((resume.customSections || []).length > 0) initiallyOpen.push('customSections');
    return initiallyOpen.length > 0 ? initiallyOpen : ['certifications', 'projects'];
  });

  const [newAchievement, setNewAchievement] = useState('');
  const [newMembership, setNewMembership] = useState('');

  const toggleSection = (id: OptionalSectionId) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getCount = (id: OptionalSectionId): number => {
    switch (id) {
      case 'certifications':
        return resume.certifications.length;
      case 'projects':
        return resume.projects.length;
      case 'languages':
        return resume.languages.length;
      case 'achievements':
        return (resume.achievements || []).length;
      case 'awards':
        return (resume.awards || []).length;
      case 'training':
        return (resume.training || []).length;
      case 'volunteer':
        return (resume.volunteer || []).length;
      case 'publications':
        return (resume.publications || []).length;
      case 'memberships':
        return (resume.memberships || []).length;
      case 'customSections':
        return (resume.customSections || []).length;
    }
  };

  // Generic helper for Awards, Training, Volunteer, Publications
  const renderSimpleEntryList = (
    field: 'awards' | 'training' | 'volunteer' | 'publications',
    singularLabel: string,
    orgPlaceholder: string
  ) => {
    const list: ResumeSimpleEntry[] = resume[field] || [];
    return (
      <div className="space-y-3">
        {list.map((entry) => (
          <div
            key={entry.id}
            className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2.5 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) =>
                    onChange({
                      [field]: list.map((it) =>
                        it.id === entry.id ? { ...it, title: e.target.value } : it
                      ),
                    })
                  }
                  placeholder={`${singularLabel} Title`}
                  className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white font-semibold text-[#102B4E]"
                />
                <input
                  type="text"
                  value={entry.organization}
                  onChange={(e) =>
                    onChange({
                      [field]: list.map((it) =>
                        it.id === entry.id ? { ...it, organization: e.target.value } : it
                      ),
                    })
                  }
                  placeholder={orgPlaceholder}
                  className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                />
                <input
                  type="text"
                  value={entry.date}
                  onChange={(e) =>
                    onChange({
                      [field]: list.map((it) =>
                        it.id === entry.id ? { ...it, date: e.target.value } : it
                      ),
                    })
                  }
                  placeholder="Year / Date"
                  className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({ [field]: list.filter((it) => it.id !== entry.id) })
                }
                aria-label={`Delete ${singularLabel}`}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={2}
              value={entry.description}
              onChange={(e) =>
                onChange({
                  [field]: list.map((it) =>
                    it.id === entry.id ? { ...it, description: e.target.value } : it
                  ),
                })
              }
              placeholder="Brief description (optional)"
              className="w-full p-2.5 rounded-lg border border-[#E5EAF0] bg-white"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              [field]: [
                ...list,
                {
                  id: `${field}_${Date.now()}`,
                  title: '',
                  organization: '',
                  date: '',
                  description: '',
                },
              ],
            })
          }
          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#102B4E]/30 hover:border-[#102B4E] text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#F47A24]" />
          <span>Add {singularLabel}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {OPTIONAL_SECTIONS.map((sec) => {
        const Icon = sec.icon;
        const isOpen = openSections.includes(sec.id);
        const count = getCount(sec.id);

        return (
          <div
            key={sec.id}
            className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden shadow-2xs"
          >
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F8FB]/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#102B4E]/[0.06] text-[#102B4E] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#F47A24]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#102B4E]">{sec.label}</span>
                    {count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#102B4E] text-white text-[10px] font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#778397] truncate">{sec.desc}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#778397] transition-transform duration-200 shrink-0 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#F0F3F7]">
                {/* Certifications */}
                {sec.id === 'certifications' && (
                  <div className="space-y-3">
                    {resume.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) =>
                                onChange({
                                  certifications: resume.certifications.map((c) =>
                                    c.id === cert.id ? { ...c, name: e.target.value } : c
                                  ),
                                })
                              }
                              placeholder="Certification Name"
                              className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white font-semibold text-[#102B4E]"
                            />
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) =>
                                onChange({
                                  certifications: resume.certifications.map((c) =>
                                    c.id === cert.id ? { ...c, issuer: e.target.value } : c
                                  ),
                                })
                              }
                              placeholder="Issuing Organization"
                              className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                            />
                            <input
                              type="text"
                              value={cert.issueDate}
                              onChange={(e) =>
                                onChange({
                                  certifications: resume.certifications.map((c) =>
                                    c.id === cert.id ? { ...c, issueDate: e.target.value } : c
                                  ),
                                })
                              }
                              placeholder="Year (e.g. 2024)"
                              className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                certifications: resume.certifications.filter((c) => c.id !== cert.id),
                              })
                            }
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          certifications: [
                            ...resume.certifications,
                            {
                              id: `cert_${Date.now()}`,
                              name: '',
                              issuer: '',
                              issueDate: '',
                              expiryDate: '',
                              credentialId: '',
                              credentialUrl: '',
                            },
                          ],
                        })
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#102B4E]/30 hover:border-[#102B4E] text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span>Add Certification</span>
                    </button>
                  </div>
                )}

                {/* Projects */}
                {sec.id === 'projects' && (
                  <div className="space-y-3">
                    {resume.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) =>
                                onChange({
                                  projects: resume.projects.map((p) =>
                                    p.id === proj.id ? { ...p, name: e.target.value } : p
                                  ),
                                })
                              }
                              placeholder="Project Title"
                              className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white font-semibold text-[#102B4E]"
                            />
                            <input
                              type="text"
                              value={proj.role}
                              onChange={(e) =>
                                onChange({
                                  projects: resume.projects.map((p) =>
                                    p.id === proj.id ? { ...p, role: e.target.value } : p
                                  ),
                                })
                              }
                              placeholder="Your Role"
                              className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                            />
                            <input
                              type="text"
                              value={proj.technologies}
                              onChange={(e) =>
                                onChange({
                                  projects: resume.projects.map((p) =>
                                    p.id === proj.id ? { ...p, technologies: e.target.value } : p
                                  ),
                                })
                              }
                              placeholder="Tools / Technologies"
                              className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                projects: resume.projects.filter((p) => p.id !== proj.id),
                              })
                            }
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) =>
                            onChange({
                              projects: resume.projects.map((p) =>
                                p.id === proj.id ? { ...p, description: e.target.value } : p
                              ),
                            })
                          }
                          placeholder="What did you build or accomplish?"
                          className="w-full p-2.5 rounded-lg border border-[#E5EAF0] bg-white"
                        />
                        <input
                          type="text"
                          value={proj.url}
                          onChange={(e) =>
                            onChange({
                              projects: resume.projects.map((p) =>
                                p.id === proj.id ? { ...p, url: e.target.value } : p
                              ),
                            })
                          }
                          placeholder="Project URL (optional)"
                          className="w-full px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          projects: [
                            ...resume.projects,
                            {
                              id: `proj_${Date.now()}`,
                              name: '',
                              role: '',
                              description: '',
                              technologies: '',
                              url: '',
                            },
                          ],
                        })
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#102B4E]/30 hover:border-[#102B4E] text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span>Add Project</span>
                    </button>
                  </div>
                )}

                {/* Languages */}
                {sec.id === 'languages' && (
                  <div className="space-y-3">
                    {resume.languages.map((lang) => (
                      <div key={lang.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          value={lang.language}
                          onChange={(e) =>
                            onChange({
                              languages: resume.languages.map((l) =>
                                l.id === lang.id ? { ...l, language: e.target.value } : l
                              ),
                            })
                          }
                          placeholder="Language (e.g. English)"
                          className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white"
                        />
                        <select
                          value={lang.proficiency}
                          onChange={(e) =>
                            onChange({
                              languages: resume.languages.map((l) =>
                                l.id === lang.id
                                  ? { ...l, proficiency: e.target.value as ResumeLanguageProficiency }
                                  : l
                              ),
                            })
                          }
                          className="px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white cursor-pointer"
                        >
                          <option value="Native">Native</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Professional">Professional</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Basic">Basic</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              languages: resume.languages.filter((l) => l.id !== lang.id),
                            })
                          }
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          languages: [
                            ...resume.languages,
                            { id: `lang_${Date.now()}`, language: '', proficiency: 'Professional' },
                          ],
                        })
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#102B4E]/30 hover:border-[#102B4E] text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span>Add Language</span>
                    </button>
                  </div>
                )}

                {/* Achievements */}
                {sec.id === 'achievements' && (
                  <div className="space-y-3 text-xs">
                    {(resume.achievements || []).map((ach, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ach}
                          onChange={(e) =>
                            onChange({
                              achievements: (resume.achievements || []).map((item, i) =>
                                i === idx ? e.target.value : item
                              ),
                            })
                          }
                          className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              achievements: (resume.achievements || []).filter((_, i) => i !== idx),
                            })
                          }
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newAchievement.trim()) {
                            e.preventDefault();
                            onChange({
                              achievements: [...(resume.achievements || []), newAchievement.trim()],
                            });
                            setNewAchievement('');
                          }
                        }}
                        placeholder="Add a key achievement and press Enter..."
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white min-h-[40px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAchievement.trim()) return;
                          onChange({
                            achievements: [...(resume.achievements || []), newAchievement.trim()],
                          });
                          setNewAchievement('');
                        }}
                        className="min-h-[40px] px-3.5 rounded-xl bg-[#102B4E] text-white font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Awards / Training / Volunteer / Publications */}
                {sec.id === 'awards' &&
                  renderSimpleEntryList('awards', 'Award', 'Awarding Body / Organization')}
                {sec.id === 'training' &&
                  renderSimpleEntryList('training', 'Training', 'Institute / Provider')}
                {sec.id === 'volunteer' &&
                  renderSimpleEntryList('volunteer', 'Volunteer Role', 'Organization / Cause')}
                {sec.id === 'publications' &&
                  renderSimpleEntryList('publications', 'Publication', 'Journal / Publisher')}

                {/* Memberships */}
                {sec.id === 'memberships' && (
                  <div className="space-y-3 text-xs">
                    {(resume.memberships || []).map((mem, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={mem}
                          onChange={(e) =>
                            onChange({
                              memberships: (resume.memberships || []).map((item, i) =>
                                i === idx ? e.target.value : item
                              ),
                            })
                          }
                          className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              memberships: (resume.memberships || []).filter((_, i) => i !== idx),
                            })
                          }
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMembership}
                        onChange={(e) => setNewMembership(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMembership.trim()) {
                            e.preventDefault();
                            onChange({
                              memberships: [...(resume.memberships || []), newMembership.trim()],
                            });
                            setNewMembership('');
                          }
                        }}
                        placeholder="e.g. Member, Project Management Institute (PMI)"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white min-h-[40px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newMembership.trim()) return;
                          onChange({
                            memberships: [...(resume.memberships || []), newMembership.trim()],
                          });
                          setNewMembership('');
                        }}
                        className="min-h-[40px] px-3.5 rounded-xl bg-[#102B4E] text-white font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Sections */}
                {sec.id === 'customSections' && (
                  <div className="space-y-3 text-xs">
                    {(resume.customSections || []).map((cs) => (
                      <div
                        key={cs.id}
                        className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cs.title}
                            onChange={(e) =>
                              onChange({
                                customSections: (resume.customSections || []).map((item) =>
                                  item.id === cs.id ? { ...item, title: e.target.value } : item
                                ),
                              })
                            }
                            placeholder="Custom Section Heading (e.g. Speaking Engagements)"
                            className="flex-1 px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white font-bold text-[#102B4E]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                customSections: (resume.customSections || []).filter(
                                  (item) => item.id !== cs.id
                                ),
                              })
                            }
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={(cs.items || []).join('\n')}
                          onChange={(e) =>
                            onChange({
                              customSections: (resume.customSections || []).map((item) =>
                                item.id === cs.id
                                  ? { ...item, items: e.target.value.split('\n') }
                                  : item
                              ),
                            })
                          }
                          placeholder="Enter one bullet point per line..."
                          className="w-full p-2.5 rounded-lg border border-[#E5EAF0] bg-white"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          customSections: [
                            ...(resume.customSections || []),
                            { id: `custom_${Date.now()}`, title: '', items: [''] },
                          ],
                        })
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#102B4E]/30 hover:border-[#102B4E] text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span>Add Custom Section</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResumeAdditionalSectionsEditor;
