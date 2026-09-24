import React, { useState } from 'react';
import { ResumeProject } from '../../types/resume';
import { FolderGit2, Plus, Trash2, ChevronRight } from 'lucide-react';

interface ProjectsFormProps {
  projects: ResumeProject[];
  onChange: (projects: ResumeProject[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ projects, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );

  const handleAddProject = () => {
    const newEntry: ResumeProject = {
      id: `proj_${Date.now()}`,
      name: '',
      role: '',
      description: '',
      technologies: '',
      url: '',
    };
    onChange([...projects, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleUpdate = (id: string, updates: Partial<ResumeProject>) => {
    onChange(projects.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDelete = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#004D40]" />
            Projects (Optional)
          </h3>
          <p className="text-xs text-slate-500">
            Showcase key deliverables, client solutions, or open-source projects
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <FolderGit2 className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700">No projects added</p>
          <p className="text-[11px] text-slate-400">
            Add significant career or technical projects to enrich your resume
          </p>
          <button
            type="button"
            onClick={handleAddProject}
            className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#004D40] text-xs font-semibold border border-teal-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => {
            const isExpanded = expandedId === proj.id;
            return (
              <div
                key={proj.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30"
              >
                <div className="p-3.5 sm:p-4 bg-white flex items-center justify-between gap-3 border-b border-slate-100">
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90 text-[#004D40]' : ''
                      }`}
                    />
                    <div className="min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {proj.name || 'Untitled Project'}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {proj.role || 'Contributor'} {proj.technologies ? `• ${proj.technologies}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    title="Delete Project"
                    onClick={() => handleDelete(proj.id)}
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
                          Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => handleUpdate(proj.id, { name: e.target.value })}
                          placeholder="e.g. Warehouse Inventory Automation"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Role / Contribution
                        </label>
                        <input
                          type="text"
                          value={proj.role}
                          onChange={(e) => handleUpdate(proj.id, { role: e.target.value })}
                          placeholder="e.g. Lead Coordinator / Developer"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Technologies / Skills Used
                        </label>
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={(e) => handleUpdate(proj.id, { technologies: e.target.value })}
                          placeholder="e.g. Python, SQL, ERP Systems"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Project URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={proj.url}
                          onChange={(e) => handleUpdate(proj.id, { url: e.target.value })}
                          placeholder="https://github.com/user/project"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => handleUpdate(proj.id, { description: e.target.value })}
                        placeholder="Brief summary of the objective, implementation, and quantified outcome"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20 resize-y"
                      />
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
