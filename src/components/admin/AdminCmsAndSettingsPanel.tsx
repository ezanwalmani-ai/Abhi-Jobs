import React, { useEffect, useState } from 'react';
import {
  FileText,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Edit3,
} from 'lucide-react';
import {
  listAllWebsiteContentAdmin,
  upsertWebsiteContent,
  deleteWebsiteContent,
  listPublicSettings,
  upsertPublicSetting,
  type WebsiteContentRecord,
  type PublicSettingRecord,
} from '../../services/recruitmentFirestoreService';

interface AdminCmsAndSettingsPanelProps {
  adminUid: string;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const CMS_SECTIONS: WebsiteContentRecord['section'][] = [
  'homepage',
  'announcement',
  'career_guide',
  'faq',
  'legal',
  'banner',
  'footer',
];

export const AdminCmsAndSettingsPanel: React.FC<AdminCmsAndSettingsPanelProps> = ({
  adminUid,
  onNotify,
}) => {
  const [contentItems, setContentItems] = useState<WebsiteContentRecord[]>([]);
  const [settingsItems, setSettingsItems] = useState<PublicSettingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCms, setSavingCms] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);

  // CMS form
  const [cmsKey, setCmsKey] = useState('');
  const [cmsSection, setCmsSection] = useState<WebsiteContentRecord['section']>('announcement');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsSubtitle, setCmsSubtitle] = useState('');
  const [cmsBody, setCmsBody] = useState('');
  const [cmsCtaLabel, setCmsCtaLabel] = useState('');
  const [cmsCtaUrl, setCmsCtaUrl] = useState('');
  const [cmsSortOrder, setCmsSortOrder] = useState(1);
  const [cmsStatus, setCmsStatus] = useState<WebsiteContentRecord['status']>('published');

  // Public Setting form
  const [settingKey, setSettingKey] = useState('site_contact');
  const [settingLabel, setSettingLabel] = useState('Public Contact & Support');
  const [settingJson, setSettingJson] = useState(
    JSON.stringify(
      {
        supportEmail: 'support@abhijobs.careers',
        hiringDeskPhone: '+91-80-4000-0000',
        maintenanceMode: false,
      },
      null,
      2
    )
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cms, settings] = await Promise.all([
        listAllWebsiteContentAdmin(),
        listPublicSettings(),
      ]);
      setContentItems(cms);
      setSettingsItems(settings);
    } catch (err: any) {
      onNotify('error', 'Load Failed', err?.message || 'Unable to fetch CMS & settings from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsKey.trim() || !cmsTitle.trim()) {
      onNotify('error', 'Missing Fields', 'Provide a content key and title.');
      return;
    }
    setSavingCms(true);
    try {
      await upsertWebsiteContent({
        key: cmsKey.trim(),
        section: cmsSection,
        title: cmsTitle.trim(),
        subtitle: cmsSubtitle.trim() || undefined,
        body: cmsBody,
        ctaLabel: cmsCtaLabel.trim() || undefined,
        ctaUrl: cmsCtaUrl.trim() || undefined,
        sortOrder: Number(cmsSortOrder) || 0,
        status: cmsStatus,
        updatedBy: adminUid,
      });
      onNotify('success', 'CMS Block Saved', `Saved /website_content/${cmsKey.trim()} to Firestore.`);
      setCmsKey('');
      setCmsTitle('');
      setCmsSubtitle('');
      setCmsBody('');
      setCmsCtaLabel('');
      setCmsCtaUrl('');
      await loadAll();
    } catch (err: any) {
      onNotify('error', 'CMS Save Failed', err?.message || 'Firestore rejected the CMS update.');
    } finally {
      setSavingCms(false);
    }
  };

  const handleDeleteCms = async (key: string) => {
    try {
      await deleteWebsiteContent(key);
      onNotify('info', 'CMS Block Deleted', `Removed /website_content/${key}.`);
      await loadAll();
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err?.message || 'Unable to delete CMS block.');
    }
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSetting(true);
    try {
      const parsed = JSON.parse(settingJson);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Setting value must be a JSON object of primitive values.');
      }
      await upsertPublicSetting({
        key: settingKey.trim(),
        label: settingLabel.trim() || settingKey.trim(),
        value: parsed,
        updatedBy: adminUid,
      });
      onNotify('success', 'Public Setting Updated', `Saved /public_settings/${settingKey.trim()}.`);
      await loadAll();
    } catch (err: any) {
      onNotify('error', 'Invalid Setting', err?.message || 'Check your JSON format and try again.');
    } finally {
      setSavingSetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#102B4E] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F47A24]" />
            <span>Website CMS &amp; Public Settings</span>
          </h2>
          <p className="text-xs text-[#778397] mt-0.5">
            Manage published announcements, FAQs, career guides, legal notices (<code className="font-mono">/website_content</code>) and public configuration (<code className="font-mono">/public_settings</code>).
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5EAF0] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* CMS Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#102B4E] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#F47A24]" />
            <span>Create / Edit Website Content Block</span>
          </h3>
          <form onSubmit={handleSaveCms} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">Key *</label>
                <input
                  type="text"
                  required
                  value={cmsKey}
                  onChange={(e) => setCmsKey(e.target.value)}
                  placeholder="e.g. homepage_banner_2026"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">Section *</label>
                <select
                  value={cmsSection}
                  onChange={(e) => setCmsSection(e.target.value as WebsiteContentRecord['section'])}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                >
                  {CMS_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102B4E] mb-1">Title *</label>
              <input
                type="text"
                required
                value={cmsTitle}
                onChange={(e) => setCmsTitle(e.target.value)}
                placeholder="Headline for this CMS block"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102B4E] mb-1">Body Copy</label>
              <textarea
                rows={4}
                value={cmsBody}
                onChange={(e) => setCmsBody(e.target.value)}
                placeholder="Plain text or structured announcement content..."
                className="w-full p-3 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">Status</label>
                <select
                  value={cmsStatus}
                  onChange={(e) => setCmsStatus(e.target.value as WebsiteContentRecord['status'])}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={cmsSortOrder}
                  onChange={(e) => setCmsSortOrder(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">CTA Label</label>
                <input
                  type="text"
                  value={cmsCtaLabel}
                  onChange={(e) => setCmsCtaLabel(e.target.value)}
                  placeholder="Optional"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingCms}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingCms ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save CMS Block</span>
            </button>
          </form>
        </div>

        {/* Public Settings Editor */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#102B4E] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#F47A24]" />
            <span>Public Site Settings (/public_settings)</span>
          </h3>
          <form onSubmit={handleSaveSetting} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">Setting Key *</label>
                <input
                  type="text"
                  required
                  value={settingKey}
                  onChange={(e) => setSettingKey(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">Label *</label>
                <input
                  type="text"
                  required
                  value={settingLabel}
                  onChange={(e) => setSettingLabel(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                Public JSON Value (NEVER store secrets here)
              </label>
              <textarea
                rows={6}
                value={settingJson}
                onChange={(e) => setSettingJson(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs font-mono focus:outline-none focus:border-[#102B4E]"
              />
            </div>
            <button
              type="submit"
              disabled={savingSetting}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingSetting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Public Setting</span>
            </button>
          </form>

          {settingsItems.length > 0 && (
            <div className="pt-3 border-t border-[#E5EAF0] space-y-2">
              <p className="text-xs font-semibold text-[#778397] uppercase tracking-wider">
                Stored Public Settings ({settingsItems.length})
              </p>
              {settingsItems.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSettingKey(s.key);
                    setSettingLabel(s.label);
                    setSettingJson(JSON.stringify(s.value, null, 2));
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[#F6F8FB] hover:bg-slate-100 border border-[#E5EAF0] text-xs flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-[#102B4E]">{s.label}</span>{' '}
                    <span className="font-mono text-[#778397]">({s.key})</span>
                  </div>
                  <Edit3 className="w-3.5 h-3.5 text-[#778397]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stored CMS Content List */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5EAF0] bg-[#F6F8FB]">
          <h3 className="text-sm font-bold text-[#102B4E]">
            Website Content Blocks ({contentItems.length})
          </h3>
        </div>
        <div className="divide-y divide-[#E5EAF0]">
          {contentItems.map((item) => (
            <div
              key={item.key}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#102B4E]">{item.title}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F6F8FB] border border-[#E5EAF0] text-[#566479]">
                    {item.section} / {item.key}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${
                      item.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-[#778397] border-[#E5EAF0]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-[#778397] line-clamp-2">{item.body}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCmsKey(item.key);
                    setCmsSection(item.section);
                    setCmsTitle(item.title);
                    setCmsSubtitle(item.subtitle || '');
                    setCmsBody(item.body);
                    setCmsCtaLabel(item.ctaLabel || '');
                    setCmsCtaUrl(item.ctaUrl || '');
                    setCmsSortOrder(item.sortOrder);
                    setCmsStatus(item.status);
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E5EAF0] hover:bg-[#F6F8FB] text-xs font-semibold text-[#102B4E] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCms(item.key)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                  aria-label={`Delete ${item.key}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {contentItems.length === 0 && (
            <div className="p-6 text-center text-xs text-[#778397]">
              No CMS content blocks stored in Firestore yet. Create one using the form above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
