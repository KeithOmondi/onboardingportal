import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  UserPlus,
  Trash2,
  Save,
  ArrowRight,
  Loader2,
  ShieldAlert,
  AlertCircle,
  X,
  Pencil,
  Check,
} from "lucide-react";

import {
  deleteMyRegistry,
  getMyGuestRegistry,
  saveGuestDraft,
  submitGuestRegistry,
  updateGuestDetail,
} from "../../redux/slices/guestSlice";
import type { AppDispatch, RootState } from "../../redux/store";
import type { IGuest, GuestType, Gender } from "../../interfaces/guests.interface";

/* =====================================================
    UI-ONLY HELPER TYPE
===================================================== */
interface IGuestWithUiId extends IGuest {
  uiId: string;
}

const toUiGuest = (g: IGuest): IGuestWithUiId => ({
  ...g,
  uiId: crypto.randomUUID(),
});

const createEmptyGuest = (): IGuestWithUiId => ({
  uiId: crypto.randomUUID(),
  name: "",
  type: "ADULT",
  gender: "MALE",
  id_number: "",
  birth_cert_number: "",
  phone: "",
  email: "",
});

const toApiGuest = (g: IGuestWithUiId): IGuest => {
  const result = { ...g } as Partial<IGuestWithUiId>;
  delete result.uiId;
  return result as IGuest;
};

/* =====================================================
    COMPONENT
===================================================== */
const JudgeGuest = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { myRegistry, loading, isSaving } = useSelector(
    (state: RootState) => state.guests
  );

  // Seed from store in case it's already hydrated (e.g. Redux persist / StrictMode)
  const [guests, setGuests] = useState<IGuestWithUiId[]>(() =>
    myRegistry.guests?.length > 0 ? myRegistry.guests.map(toUiGuest) : []
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // The single form — used for both adding and editing
  const [formData, setFormData] = useState<IGuestWithUiId>(createEmptyGuest());
  // When non-null, we’re editing an existing guest
  const [editingUiId, setEditingUiId] = useState<string | null>(null);

  /* =====================================================
      BOOTSTRAP
  ===================================================== */
  useEffect(() => {
    dispatch(getMyGuestRegistry())
      .unwrap()
      .then((data) => {
        // Always hydrate from the API response — source of truth
        if (data?.guests) {
          setGuests(data.guests.length > 0 ? data.guests.map(toUiGuest) : []);
        }
      })
      .catch(() => {});
  }, [dispatch]);

  /* =====================================================
      FORM FIELD HELPERS
  ===================================================== */
  const updateFormField = <K extends keyof IGuest>(field: K, value: IGuest[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(createEmptyGuest());
    setEditingUiId(null);
  };

  /* =====================================================
      FORM VALIDATION
  ===================================================== */
  const validateForm = (g: IGuestWithUiId): boolean => {
    if (!g.name.trim()) { toast.error("Full Name is required"); return false; }
    if (!g.gender) { toast.error("Gender is required"); return false; }

    if (g.type === "ADULT") {
      if (!g.id_number?.trim()) { toast.error("National ID / Passport is required"); return false; }
      if (!g.phone?.trim()) { toast.error("Phone Number is required"); return false; }
      if (!g.email?.trim()) { toast.error("Email Address is required"); return false; }
      if (!/^\S+@\S+\.\S+$/.test(g.email ?? "")) { toast.error("Provide a valid email"); return false; }
    } else {
      if (!g.birth_cert_number?.trim()) { toast.error("Birth Certificate Number is required"); return false; }
    }
    return true;
  };

  const validateAllGuests = (): boolean => {
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const label = `Guest #${i + 1}`;
      if (!g.name.trim()) { toast.error(`${label}: Full Name is required`); return false; }
      if (!g.gender) { toast.error(`${label}: Gender is required`); return false; }
      if (g.type === "ADULT") {
        if (!g.id_number?.trim()) { toast.error(`${label}: ID / Passport required`); return false; }
        if (!g.phone?.trim()) { toast.error(`${label}: Phone required`); return false; }
        if (!g.email?.trim()) { toast.error(`${label}: Email required`); return false; }
        if (!/^\S+@\S+\.\S+$/.test(g.email ?? "")) { toast.error(`${label}: Valid email required`); return false; }
      } else {
        if (!g.birth_cert_number?.trim()) { toast.error(`${label}: Birth Cert required`); return false; }
      }
    }
    return true;
  };

  /* =====================================================
      ADD / EDIT / DELETE HANDLERS
  ===================================================== */
  const handleAddOrUpdate = () => {
    if (!validateForm(formData)) return;

    if (editingUiId) {
      const persisted = guests.find((g) => g.uiId === editingUiId);

      if (persisted?.id) {
        // Guest exists in DB — dispatch a PATCH to keep the server in sync
        dispatch(updateGuestDetail({ id: persisted.id, guestData: toApiGuest(formData) }))
          .unwrap()
          .then((updated) => {
            setGuests((prev) =>
              prev.map((g) => (g.uiId === editingUiId ? { ...toUiGuest(updated), uiId: editingUiId } : g))
            );
            toast.success("Guest updated.");
          })
          .catch((err: string) => toast.error(err));
      } else {
        // Unsaved guest — update locally only
        setGuests((prev) =>
          prev.map((g) => (g.uiId === editingUiId ? { ...formData, uiId: editingUiId } : g))
        );
        toast.success("Guest updated.");
      }
    } else {
      if (guests.length >= 5) { toast.error("Maximum allocation (5) reached."); return; }
      setGuests((prev) => [...prev, { ...formData, uiId: crypto.randomUUID() }]);
      toast.success("Guest added.");
    }
    resetForm();
  };

  const handleEditGuest = (g: IGuestWithUiId) => {
    setFormData({ ...g });
    setEditingUiId(g.uiId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

 const handleDeleteGuest = (uiId: string) => {
  const target = guests.find((g) => g.uiId === uiId);
  const remaining = guests.filter((g) => g.uiId !== uiId);

  if (target?.id) {
    // Delete the whole registry then re-save with the remaining guests
    dispatch(deleteMyRegistry())
      .unwrap()
      .then(() => dispatch(saveGuestDraft(remaining.map(toApiGuest))).unwrap())
      .then(() => {
        setGuests(remaining);
        if (editingUiId === uiId) resetForm();
        toast.success("Guest removed.");
      })
      .catch((err: string) => toast.error(err));
  } else {
    // Unsaved guest — remove locally only, no API call needed
    setGuests(remaining);
    if (editingUiId === uiId) resetForm();
    toast.success("Guest removed.");
  }
};

  /* =====================================================
      SAVE / SUBMIT HANDLERS
  ===================================================== */
  const handleSaveDraft = () => {
    dispatch(saveGuestDraft(guests.map(toApiGuest)))
      .unwrap()
      .then(() => toast.success("Changes saved to local registry."))
      .catch((err: string) => toast.error(err));
  };

  const handleFinalSubmit = () => {
    setShowConfirmModal(false);
    dispatch(saveGuestDraft(guests.map(toApiGuest)))
      .unwrap()
      .then(() => dispatch(submitGuestRegistry()).unwrap())
      .then(() => toast.success("Registry updated successfully.", { icon: "⚖️" }))
      .catch((err: string) => toast.error(err));
  };

  /* =====================================================
      DERIVED VALUES
  ===================================================== */
  const status = myRegistry.status;
  const busy = loading || isSaving;

  /* =====================================================
      RENDER
  ===================================================== */
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-8">
      <Toaster position="top-right" />

      {/* ── LOADING ── */}
      {loading && guests.length === 0 && (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Loading registry…</span>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#b48222]" />
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-amber-50 p-4 rounded-full text-amber-600">
                <AlertCircle size={48} />
              </div>
              <div className="space-y-3">
                <h3 className="text-[#1a3a32] font-serif text-2xl font-bold uppercase tracking-tighter">
                  Confirm Registration
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium px-2">
                  Kindly confirm whether these will be the only guests accompanying you to the swearing-in ceremony.{" "}
                  <span className="text-[#355E3B] font-bold underline decoration-[#C5A059]">
                    {guests.length} guest(s)
                  </span>
                  ? You can still modify this later if required.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={handleFinalSubmit}
                  disabled={busy}
                  className="w-full py-4 bg-[#1a3a32] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="animate-spin" size={14} />}
                  Yes, Confirm & Update
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY NOTICE ── */}
      <div className="bg-[#1a3a32]/5 border border-[#1a3a32]/10 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="bg-[#1a3a32] p-4 rounded-2xl text-white shadow-xl shrink-0">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-[#1a3a32] text-[11px] font-black uppercase tracking-[0.25em]">
            Security Reminder
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You may register up to{" "}
            <span className="font-bold text-slate-900">5 guests</span>. Ensure names match their official Identification Documents.
          </p>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#1a3a32] uppercase tracking-tighter">
            Guest Registration
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                status === "SUBMITTED"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {status}
            </span>
            {myRegistry.updatedAt && (
              <span className="text-[10px] text-slate-400 font-medium">
                Last saved {new Date(myRegistry.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm font-black text-[#1a3a32] tracking-widest">
          {guests.length} / 5 GUESTS
        </p>
      </div>

      {/* ── SINGLE GUEST FORM ── */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1a3a32] mb-6">
          {editingUiId ? "✏️ Editing Guest" : "Add a Guest"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(v) => updateFormField("name", v)}
          />

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Classification <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(["ADULT", "MINOR"] as GuestType[]).map((t) => (
                <Toggle
                  key={t}
                  active={formData.type === t}
                  label={t}
                  onClick={() => updateFormField("type", t)}
                />
              ))}
            </div>
          </div>

          <Select
            label="Gender"
            required
            value={formData.gender}
            options={["MALE", "FEMALE", "OTHER"]}
            onChange={(v) => updateFormField("gender", v as Gender)}
          />

          {formData.type === "ADULT" ? (
            <>
              <Input
                label="ID / Passport"
                required
                value={formData.id_number ?? ""}
                onChange={(v) => updateFormField("id_number", v)}
              />
              <Input
                label="Phone Number"
                required
                value={formData.phone ?? ""}
                onChange={(v) => updateFormField("phone", v)}
              />
              <Input
                label="Email Address"
                required
                value={formData.email ?? ""}
                onChange={(v) => updateFormField("email", v)}
              />
            </>
          ) : (
            <>
              <Input
                label="Birth Cert Number"
                required
                value={formData.birth_cert_number ?? ""}
                onChange={(v) => updateFormField("birth_cert_number", v)}
              />
              <Input
                label="Guardian Phone (Optional)"
                value={formData.phone ?? ""}
                onChange={(v) => updateFormField("phone", v)}
              />
            </>
          )}
        </div>

        {/* Form action buttons */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handleAddOrUpdate}
            disabled={(guests.length >= 5 && !editingUiId) || busy}
            className="flex items-center gap-2 px-8 py-4 bg-[#1a3a32] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142d27] shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
          >
            {editingUiId ? (
              <><Check size={14} /> Save Changes</>
            ) : (
              <><UserPlus size={14} /> Add Guest</>
            )}
          </button>

          {editingUiId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-6 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* ── GUESTS TABLE ── */}
      {guests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1a3a32]">
              Registered Guests
            </h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              {guests.length} of 5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID / Cert</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g, index) => (
                  <tr
                    key={g.uiId}
                    className={`border-b border-slate-50 transition-colors ${
                      editingUiId === g.uiId
                        ? "bg-amber-50/60"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a3a32] text-white text-[10px] font-black">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-800">{g.name || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          g.type === "ADULT"
                            ? "bg-[#1a3a32]/10 text-[#1a3a32]"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {g.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500">{g.gender}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-600">
                        {g.type === "ADULT"
                          ? g.id_number || "—"
                          : g.birth_cert_number || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{g.phone || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{g.email || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditGuest(g)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#1a3a32] border border-[#1a3a32]/20 rounded-xl hover:bg-[#1a3a32]/5 transition-all disabled:opacity-40"
                          aria-label={`Edit guest ${index + 1}`}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(g.uiId)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-all disabled:opacity-40"
                          aria-label={`Delete guest ${index + 1}`}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FOOTER ACTIONS ── */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-slate-100">
        <button
          onClick={handleSaveDraft}
          disabled={busy || guests.length === 0}
          className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Save size={14} />
          )}
          Save Draft
        </button>
        <button
          onClick={() => validateAllGuests() && setShowConfirmModal(true)}
          disabled={busy || guests.length === 0}
          className="px-10 py-4 bg-[#1a3a32] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142d27] shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {status === "SUBMITTED" ? "Update Registration" : "Finalize Registry"}{" "}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

/* =====================================================
    REUSABLE SUB-COMPONENTS
===================================================== */

interface InputProps {
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
}

const Input = ({ label, value, required, onChange }: InputProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 ring-[#b48222]/20 outline-none transition-all"
      placeholder={required ? "Required..." : "Optional..."}
    />
  </div>
);

interface SelectProps {
  label: string;
  value?: string;
  required?: boolean;
  options: string[];
  onChange: (v: string) => void;
}

const Select = ({ label, value, required, options, onChange }: SelectProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none ring-[#b48222]/20 focus:ring-2 appearance-none"
    >
      <option value="" disabled>Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

interface ToggleProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const Toggle = ({ active, label, onClick }: ToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all ${
      active
        ? "bg-[#1a3a32] border-[#1a3a32] text-white shadow-lg shadow-emerald-900/10"
        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
    }`}
  >
    {label}
  </button>
);

export default JudgeGuest;