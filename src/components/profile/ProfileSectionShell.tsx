import React from 'react';
import { Pencil, Plus } from 'lucide-react';

interface ProfileSectionShellProps {
  id: string;
  title: string;
  description: string;
  countLabel?: string;
  isEditing?: boolean;
  canEdit?: boolean;
  canAdd?: boolean;
  addLabel?: string;
  editLabel?: string;
  onEdit?: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}

export const ProfileSectionShell: React.FC<ProfileSectionShellProps> = ({
  id,
  title,
  description,
  countLabel,
  isEditing = false,
  canEdit = false,
  canAdd = false,
  addLabel = 'Add',
  editLabel = 'Edit',
  onEdit,
  onAdd,
  children,
}) => {
  return (
    <section
      id={`profile-section-${id}`}
      className="scroll-mt-24 bg-white rounded-xl border border-[#E5EAF0] transition-colors"
    >
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#EEF2F6] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-[17px] font-semibold text-[#102B4E] tracking-tight">
              {title}
            </h2>
            {countLabel && (
              <span className="text-xs font-medium text-[#64748B] tabular-nums">
                {countLabel}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-[13px] text-[#64748B] mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>

        {!isEditing && (canEdit || canAdd) && (
          <div className="flex items-center gap-2 shrink-0 self-start">
            {canAdd && onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] sm:min-h-[36px] rounded-lg border border-[#F47A24]/35 bg-[#FFF7F1] hover:bg-[#FFF0E4] text-[#DE6816] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{addLabel}</span>
              </button>
            )}
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] sm:min-h-[36px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] hover:border-[#102B4E]/35 text-[#102B4E] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>{editLabel}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-5">{children}</div>
    </section>
  );
};
