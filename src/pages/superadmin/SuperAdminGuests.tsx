import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, Loader2, ChevronUp, ChevronDown, ChevronsUpDown,
  Users, CheckCircle2, Clock3, ShieldCheck, Hash, Phone,
  Mail, FileStack, Download, FileSpreadsheet, FileText, AlertCircle,
  Edit3, Save, X, RefreshCw
} from "lucide-react";
import {
  adminGetAllRegistries, adminGetRegistryById, exportFullRegistryPDF,
  exportFullRegistryExcel, exportFullRegistryWord, downloadGuestListPDF,
  updateGuestDetail
} from "../../redux/slices/guestSlice";
import { fetchAllUsers } from "../../redux/slices/userSlice";
import type { AppDispatch, RootState } from "../../redux/store";
import type { IAdminRegistryRow, IGuest, RegistrationStatus } from "../../interfaces/guests.interface";

// ── Types & Meta ──────────────────────────────────────────────────────────
type FilterStatus = RegistrationStatus | "ALL" | "NOT_STARTED";
type SortKey = keyof Pick<IAdminRegistryRow, "judge_name" | "status" | "guest_count" | "updated_at">;
type SortDir = "asc" | "desc";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

const statusMeta: Record<RegistrationStatus | "NOT_STARTED", { label: string; colorClass: string }> = {
  SUBMITTED: { label: "Finalized", colorClass: "bg-green-50 text-green-700 border-green-100" },
  DRAFT: { label: "Draft Mode", colorClass: "bg-amber-50 text-amber-700 border-amber-100" },
  NOT_STARTED: { label: "Zero Submissions", colorClass: "bg-red-50 text-red-700 border-red-100" },
};

// ── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (iso: string | null | undefined): string => {
  if (!iso || iso === "") return "No Activity";
  return new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Sub-Components ────────────────────────────────────────────────────────
const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown size={13} className="inline opacity-30 ml-1" />;
  return sortDir === "asc"
    ? <ChevronUp size={13} className="inline ml-1 text-[#355E3B]" />
    : <ChevronDown size={13} className="inline ml-1 text-[#355E3B]" />;
};

const StatCard = ({ icon, label, value, color = "text-[#355E3B]" }: StatCardProps) => (
  <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl flex items-center gap-5 shadow-sm min-w-[160px]">
    <div className={`${color} bg-slate-50 p-3 rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xl font-bold leading-none ${color} tracking-tight`}>{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-xs font-bold text-slate-700">{value}</p>
  </div>
);

// ── GuestCard (Emergency Module Removed) ──────────────────────────────────
const GuestCard = ({ guest, idx }: { guest: IGuest; idx: number }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isSaving = useSelector((state: RootState) => state.guests.isSaving);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<IGuest>>({
    name: guest.name,
    phone: guest.phone,
    email: guest.email,
  });

  const handleStartEditing = () => {
    setFormData({ name: guest.name, phone: guest.phone, email: guest.email });
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!guest.id) return;
    const result = await dispatch(updateGuestDetail({ id: guest.id, guestData: formData }));
    if (updateGuestDetail.fulfilled.match(result)) {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 relative shadow-sm">
      <div className="flex justify-between items-start pt-1">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-[#355E3B]/10 flex items-center justify-center text-[#355E3B] font-bold text-xs shrink-0">
            {idx + 1}
          </div>
          {isEditing ? (
            <input
              className="text-sm font-bold text-slate-800 bg-white border border-[#355E3B]/30 rounded px-2 py-1 w-full focus:outline-none"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          ) : (
            <h4 className="text-sm font-bold text-slate-800 truncate">{guest.name || "Unnamed Guest"}</h4>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {!isEditing ? (
            <button onClick={handleStartEditing} className="p-1.5 text-[#355E3B] bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-sm">
              <Edit3 size={14} />
            </button>
          ) : (
            <div className="flex gap-1">
              <button onClick={handleUpdate} disabled={isSaving} className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              </button>
              <button onClick={() => setIsEditing(false)} className="p-1.5 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-slate-50">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailItem label="Gender" value={guest.gender || "Not Specified"} />
        <DetailItem label="ID Status" value={guest.id_number || guest.birth_cert_number ? "Verified" : "Missing Info"} />
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Hash size={14} className="text-slate-400 shrink-0" />
          <span className="font-medium truncate">{guest.id_number || guest.birth_cert_number || "No ID/Cert"}</span>
        </div>
        {guest.type === "ADULT" && (
          <>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone size={14} className="text-slate-400 shrink-0" />
              {isEditing ? (
                <input
                  className="text-xs font-medium text-slate-600 bg-white border border-[#355E3B]/30 rounded px-2 py-0.5 w-full"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <span className="font-medium">{guest.phone || "No Phone"}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail size={14} className="text-slate-400 shrink-0" />
              {isEditing ? (
                <input
                  className="text-xs font-medium text-slate-600 bg-white border border-[#355E3B]/30 rounded px-2 py-0.5 w-full"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <span className="truncate font-medium">{guest.email || "No Email"}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const SuperAdminGuests = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { allLists, loading: listLoading, expandedRegistry, expandLoading } = useSelector(
    (state: RootState) => state.guests.admin
  );
  const { users, loading: usersLoading } = useSelector((state: RootState) => state.user);
  const isGlobalLoading = useSelector((state: RootState) => state.guests.loading);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchExpanded = useCallback(
    (regId: number) => {
      if (regId !== -1) dispatch(adminGetRegistryById(regId));
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch(adminGetAllRegistries());
    dispatch(fetchAllUsers({ role: "judge", limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(adminGetAllRegistries());
      setLastRefreshed(new Date());
      if (expandedId !== null && expandedId !== -1) {
        fetchExpanded(expandedId);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch, expandedId, fetchExpanded]);

  const combinedData = useMemo(() => {
    return users.map((user) => {
      const registry = allLists.find((r) => r.user_id === user.id);
      if (registry) {
        const isZero = Number(registry.guest_count) === 0;
        return {
          ...registry,
          uiStatus: isZero && registry.status !== "SUBMITTED" ? ("NOT_STARTED" as const) : registry.status,
        };
      }
      return { id: -1, user_id: user.id, judge_name: user.full_name, status: "DRAFT" as RegistrationStatus, uiStatus: "NOT_STARTED" as const, updated_at: "", guest_count: 0 };
    });
  }, [users, allLists]);

  const rows = combinedData
    .filter((r) => {
      const matchesSearch = r.judge_name.toLowerCase().includes(search.toLowerCase()) || r.user_id.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "ALL" || r.uiStatus === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalGuests = allLists.reduce((s, r) => s + Number(r.guest_count || 0), 0);
  const zeroSubCount = combinedData.filter((r) => r.uiStatus === "NOT_STARTED").length;
  const submittedCount = allLists.filter((r) => r.status === "SUBMITTED").length;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleToggleRow = (regId: number) => {
    if (expandedId === regId) setExpandedId(null);
    else {
      setExpandedId(regId);
      fetchExpanded(regId);
      dispatch(adminGetAllRegistries());
    }
  };

  const handleBulkExport = (type: "pdf" | "excel" | "word") => {
    if (type === "pdf") dispatch(exportFullRegistryPDF());
    if (type === "excel") dispatch(exportFullRegistryExcel());
    if (type === "word") dispatch(exportFullRegistryWord());
    setShowExportMenu(false);
  };

  if ((listLoading || usersLoading) && combinedData.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#355E3B]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing High Court Registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-[#355E3B] font-serif text-3xl font-bold mb-2 tracking-tight">Guest Registration</h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">High Court Oversight Dashboard</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <StatCard icon={<ShieldCheck size={18} />} label="Total Judges" value={users.length} />
            <StatCard icon={<CheckCircle2 size={18} />} label="Finalized" value={submittedCount} color="text-green-600" />
            <StatCard icon={<AlertCircle size={18} />} label="Zero Submissions" value={zeroSubCount} color="text-red-600" />
            <StatCard icon={<Users size={18} />} label="Total Guests" value={totalGuests} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => { dispatch(adminGetAllRegistries()); setLastRefreshed(new Date()); }} disabled={listLoading} className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600">
              <RefreshCw size={15} className={listLoading ? "animate-spin" : ""} />
              <span className="text-[10px] font-black uppercase tracking-widest">Refresh</span>
            </button>
            <span className="text-[9px] text-slate-400 font-medium">Updated {lastRefreshed.toLocaleTimeString("en-KE")}</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={isGlobalLoading} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#1a3a32] text-white shadow-xl">
              {isGlobalLoading ? <Loader2 size={20} className="animate-spin" /> : <FileStack size={20} />}
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Export Registry</p>
                <p className="text-xs font-bold opacity-80 flex items-center gap-2">Format <ChevronDown size={12} /></p>
              </div>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2">
                <button onClick={() => handleBulkExport("pdf")} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl"><FileText size={16} className="text-red-500" /> PDF Document</button>
                <button onClick={() => handleBulkExport("excel")} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl"><FileSpreadsheet size={16} className="text-green-600" /> Excel Spreadsheet</button>
                <button onClick={() => handleBulkExport("word")} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl"><FileStack size={16} className="text-blue-600" /> Word Document</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search judge..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {(["ALL", "SUBMITTED", "DRAFT", "NOT_STARTED"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${filter === f ? "bg-[#1a3a32] text-white" : "bg-white text-slate-500 border-slate-200"}`}>
              {f === "ALL" ? "All" : f === "NOT_STARTED" ? "Zero Submissions" : statusMeta[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-black uppercase text-[10px] text-slate-400 tracking-widest">
                <th className="px-8 py-5 cursor-pointer" onClick={() => handleSort("judge_name")}>Judge <SortIcon col="judge_name" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className="px-8 py-5 cursor-pointer" onClick={() => handleSort("guest_count")}>Guests <SortIcon col="guest_count" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className="px-8 py-5 cursor-pointer" onClick={() => handleSort("status")}>Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className="px-8 py-5 cursor-pointer" onClick={() => handleSort("updated_at")}>Activity <SortIcon col="updated_at" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <React.Fragment key={row.user_id}>
                  <tr className={`hover:bg-slate-50/80 transition-all ${expandedId === row.id ? "bg-slate-50/50" : ""}`}>
                    <td className="px-8 py-6"><p className={`text-sm font-bold ${row.uiStatus === "NOT_STARTED" ? "text-red-600" : "text-[#355E3B]"}`}>{row.judge_name}</p><p className="text-[10px] font-mono text-slate-400">{row.user_id}</p></td>
                    <td className="px-8 py-6 text-base font-bold text-slate-700">{row.guest_count}</td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${statusMeta[row.uiStatus].colorClass}`}>
                        {row.uiStatus === "NOT_STARTED" ? <AlertCircle size={12} /> : row.uiStatus === "SUBMITTED" ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                        {statusMeta[row.uiStatus].label}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-500 font-semibold">{formatDate(row.updated_at)}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => dispatch(downloadGuestListPDF(row.user_id))} disabled={row.uiStatus === "NOT_STARTED"} className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#355E3B] disabled:opacity-20"><Download size={16} /></button>
                        <button onClick={() => handleToggleRow(row.id as number)} disabled={row.uiStatus === "NOT_STARTED"} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${expandedId === row.id ? "bg-[#355E3B] text-white shadow-lg" : "bg-white text-[#355E3B] hover:bg-slate-50 disabled:opacity-20"}`}>
                          {expandedId === row.id ? "Close" : "View Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="bg-white">
                      <td colSpan={5} className="px-8 py-8">
                        {expandLoading ? (
                          <div className="flex items-center justify-center gap-3 py-8 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]"><Loader2 size={18} className="animate-spin text-[#355E3B]" /> Loading Guests...</div>
                        ) : expandedRegistry && (
                          <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Guest Manifest</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {expandedRegistry.guests.map((g, idx) => (<GuestCard key={g.id || idx} guest={g} idx={idx} />))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminGuests;