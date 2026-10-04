"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Save, CheckCircle2 } from "lucide-react";
import { fetchApi, Need } from "@/lib/api";

interface EditNeedModalProps {
  need: Need | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditNeedModal: React.FC<EditNeedModalProps> = ({
  need,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    quantity_required: 0,
    unit: "",
    location: "",
    priority: "MEDIUM",
    status: "OPEN",
  });

  useEffect(() => {
    if (need) {
      setFormData({
        title: need.title,
        quantity_required: need.quantity_required,
        unit: need.unit,
        location: need.location,
        priority: need.priority,
        status: need.status,
      });
    }
  }, [need]);

  if (!isOpen || !need) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetchApi(`/needs/${need.id}`, {
      method: "PUT",
      body: JSON.stringify(formData),
    });

    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error?.message || "Failed to update emergency requirement.");
    }
  };

  const handleCloseNeed = async () => {
    if (!confirm("Mark this emergency requirement as CLOSED?")) return;
    setLoading(true);
    const res = await fetchApi(`/needs/${need.id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "CLOSED" }),
    });
    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 relative shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-mono font-bold text-slate-100">Update Requirement #{need.id}</h2>
            <p className="text-xs text-slate-400">Modify priority, status, or remaining quantity</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="PARTIALLY_MATCHED">PARTIALLY_MATCHED</option>
                <option value="MATCHED">MATCHED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Quantity Required</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity_required}
                onChange={(e) => setFormData({ ...formData, quantity_required: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={handleCloseNeed}
              className="px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Closed
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
