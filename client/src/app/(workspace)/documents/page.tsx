"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderArchive, FileText, AlertTriangle, Download, Plus, Upload, CheckCircle2 } from "lucide-react";
import { api, token } from "@/lib/api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any>({ vendorDocs: [], generalDocs: [] });
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState("LEASE");
  const [propertyId, setPropertyId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api("/documents"), api("/documents/expiring"), api("/properties")])
      .then(([docRes, expRes, propRes]) => {
        setDocuments(docRes.documents || []);
        setExpiring(expRes || { vendorDocs: [], generalDocs: [] });
        setProperties(propRes.properties || []);
        if (propRes.properties?.length && !propertyId) {
          setPropertyId(propRes.properties[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRealUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileCategory", fileCategory);
      formData.append("propertyId", propertyId);
      formData.append("entityType", "PROPERTY");
      formData.append("entityId", propertyId || "GENERAL");

      const t = token();
      const res = await fetch("http://localhost:4000/api/documents/upload", {
        method: "POST",
        headers: {
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: formData,
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Upload failed");

      setUploadSuccess(`Uploaded ${d.document?.fileName} successfully!`);
      setShowUploadModal(false);
      setSelectedFile(null);
      load();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function downloadDoc(doc: any) {
    const t = token();
    const url = `http://localhost:4000/api/documents/${doc.id}/download`;
    const res = await fetch(url, {
      headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    });
    if (!res.ok) {
      alert("Download failed");
      return;
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Document Repository</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Documents & Compliance Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cloud-ready private file repository for lease agreements, blueprints, equipment manuals, and certificates.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Upload size={14} />
          <span>Upload Document</span>
        </button>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={14} /> {uploadSuccess}
          </span>
          <button onClick={() => setUploadSuccess("")} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Expiring Compliance Alerts (SRS Section 13) */}
      {(expiring.vendorDocs?.length > 0 || expiring.generalDocs?.length > 0) && (
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} />
            <h2 className="text-xs font-bold uppercase tracking-wider">Compliance Expiry Watch (Next 30 Days)</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {expiring.vendorDocs.map((vd: any) => (
              <div key={vd.id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{vd.docType} ({vd.docNumber || "N/A"})</p>
                  <p className="text-[11px] text-slate-500">Vendor: {vd.vendor?.legalName}</p>
                </div>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Expires {new Date(vd.expiryDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Library */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Document Library</h2>
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No documents found. Upload a file above.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{doc.fileName}</p>
                    <p className="text-[11px] text-slate-400">
                      {doc.fileCategory} · {doc.fileSizeKb} KB · {doc.property?.name || "General"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => downloadDoc(doc)}
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Real File Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRealUpload}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Upload New File</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Choose File *</label>
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Document Category</label>
              <select
                value={fileCategory}
                onChange={(e) => setFileCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="LEASE">Lease Agreement</option>
                <option value="COMPLIANCE">Compliance / Certificate</option>
                <option value="INSPECTION_REPORT">Inspection Report</option>
                <option value="BLUEPRINT">Blueprint / Architecture</option>
                <option value="INVOICE">Invoice / Receipt</option>
                <option value="PHOTO">Proof of Work Photo</option>
                <option value="GENERAL">General Manual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Linked Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Upload size={13} /> {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
