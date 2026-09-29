import { useState } from 'react';
import { Upload, FileText, Trash2, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { globalContentTable } from '../../pages/admin/catalogAdminHelpers';

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";

const LegalDocumentsManager = () => {
  const { settings, refreshSettings } = useSiteSettings();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const documents = [
    { 
      key: 'privacyPolicyDocUrl', 
      name: 'Privacy Policy', 
      label: 'Privacy Policy Document',
      dbField: 'legal_privacy_policy_doc_url'
    },
    { 
      key: 'termsOfServiceDocUrl', 
      name: 'Terms of Service', 
      label: 'Terms of Service Document',
      dbField: 'legal_terms_of_service_doc_url'
    },
    { 
      key: 'cookiePolicyDocUrl', 
      name: 'Cookie Policy', 
      label: 'Cookie Policy Document',
      dbField: 'legal_cookie_policy_doc_url'
    },
  ];

  const handleFileUpload = async (e, docKey, dbField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and Word documents are allowed');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase storage in legal/ subfolder
      const fileName = `legal/${docKey}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      const publicUrl = publicUrlData.publicUrl;

      // Update database - check if record exists and if user has permission
      let globalContent = null;
      const { data: fetchedContent, error: fetchError } = await supabase
        .from(globalContentTable)
        .select('id')
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      globalContent = fetchedContent;

      const updateData = {
        [dbField]: publicUrl,
      };

      if (globalContent?.id) {
        const { error: updateError } = await supabase
          .from(globalContentTable)
          .update(updateData)
          .eq('id', globalContent.id);

        if (updateError) {
          if (updateError.code === 'PGRST301' || updateError.message.includes('row-level security')) {
            throw new Error('Permission denied: You do not have permission to update global content. Contact your administrator to check RLS policies.');
          }
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from(globalContentTable)
          .insert([updateData]);

        if (insertError) {
          if (insertError.code === 'PGRST301' || insertError.message.includes('row-level security')) {
            throw new Error('Permission denied: You do not have permission to create global content. Contact your administrator to check RLS policies.');
          }
          throw insertError;
        }
      }

      // Refresh settings - wait a moment for database to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      if (refreshSettings) {
        await refreshSettings();
      }

      alert(`${documents.find(d => d.key === docKey)?.name} uploaded successfully! Please refresh the page to see the updated document.`);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading document: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (dbField, docName) => {
    if (!confirm(`Delete ${docName}?`)) return;

    setLoading(true);
    try {
      const { data: globalContent } = await supabase
        .from(globalContentTable)
        .select('*')
        .single();

      if (globalContent?.id) {
        const { error: updateError } = await supabase
          .from(globalContentTable)
          .update({ [dbField]: null })
          .eq('id', globalContent.id);

        if (updateError) throw updateError;

        if (refreshSettings) {
          await refreshSettings();
        }
        alert(`${docName} deleted successfully!`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Legal Documents</h3>
        <p className="text-sm text-white/60 mb-6">Upload PDF or Word documents for Privacy Policy, Terms of Service, and Cookie Policy. If uploaded, these documents will replace the default text content.</p>
      </div>

      <div className="grid gap-6">
        {documents.map((doc) => {
          const currentUrl = settings?.legal?.[doc.key];
          return (
            <div key={doc.key} className="rounded-lg border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-teal-400" />
                  <div>
                    <h4 className="font-semibold text-white">{doc.label}</h4>
                    <p className="text-xs text-white/50">PDF or Word document (max 10MB)</p>
                  </div>
                </div>
              </div>

              {currentUrl ? (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-300" />
                    <span className="text-sm text-white/80 truncate">{currentUrl.split('/').pop()}</span>
                  </div>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-300 hover:text-teal-200 underline"
                  >
                    View
                  </a>
                </div>
              ) : null}

              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-dashed border-white/20 bg-white/5 p-3 hover:bg-white/10 transition">
                  {uploading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin text-teal-400" />
                      <span className="text-sm text-white/60">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-teal-400" />
                      <span className="text-sm text-white/60">Choose file</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, doc.key, doc.dbField)}
                    disabled={uploading || loading}
                    className="hidden"
                  />
                </label>

                {currentUrl && (
                  <button
                    onClick={() => handleDelete(doc.dbField, doc.name)}
                    disabled={loading || uploading}
                    title="Delete this document"
                    className="px-3 rounded-lg border border-red-400/30 hover:border-red-400/60 bg-red-400/5 hover:bg-red-400/15 text-red-300 hover:text-red-200 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-100 space-y-2">
            <p>
              <strong>⚙️ Setup Required:</strong> Before uploading legal documents, you must run this SQL in your Supabase SQL Editor to create the database columns:
            </p>
            <div className="bg-black/30 p-3 rounded font-mono text-[11px] overflow-auto max-h-32">
{`ALTER TABLE public.storefront_global_content
ADD COLUMN IF NOT EXISTS legal_privacy_policy_doc_url TEXT,
ADD COLUMN IF NOT EXISTS legal_terms_of_service_doc_url TEXT,
ADD COLUMN IF NOT EXISTS legal_cookie_policy_doc_url TEXT;`}
            </div>
            <p>
              After running the SQL, any documents you upload will appear below with an option to delete them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentsManager;
