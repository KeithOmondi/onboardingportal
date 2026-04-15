import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchEvents, deleteEvent, setFilter } from "../../redux/slices/eventsSlice";
import { 
  Plus, Search, Edit3, Trash2, 
  Calendar, CheckCircle2, Clock, AlertCircle,
  ChevronDown, Filter
} from "lucide-react";
import type { IJudicialEvent, EventStatus } from "../../interfaces/events.interface";
import EventModal from "./EventModal";

const SuperAdminEvents = () => {
  const dispatch = useAppDispatch();
  const { events, currentFilter } = useAppSelector((state) => state.events);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IJudicialEvent | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const [, setTick] = useState(0);

  useEffect(() => {
    dispatch(fetchEvents(currentFilter));
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [dispatch, currentFilter]);

  const handleFilterChange = (status: EventStatus) => {
    dispatch(setFilter(status));
    setIsFilterDropdownOpen(false);
  };

  const handleEdit = (event: IJudicialEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Permanent Action: Delete this judicial event record?")) {
      dispatch(deleteEvent(id));
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1a3a2a] rounded-xl text-[#C9922A]">
             <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-[#1a3a2a]">Judicial Calendar</h1>
            <p className="text-sm text-stone-500">Official oversight of swearing-in ceremonies and court events.</p>
          </div>
        </div>
        <button 
          className="flex items-center justify-center gap-2 bg-[#1a3a2a] text-[#C9922A] px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-md active:scale-95"
          onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
        >
          <Plus size={18} />
          Schedule Event
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Upcoming", value: events.filter(e => e.current_status === "UPCOMING").length, icon: <Calendar className="text-blue-600" />, type: 'UPCOMING' },
          { label: "Ongoing", value: events.filter(e => e.current_status === "ONGOING").length, icon: <Clock className="text-[#C9922A]" />, type: 'ONGOING' },
          { label: "Concluded", value: events.filter(e => e.current_status === "PAST").length, icon: <CheckCircle2 className="text-green-600" />, type: 'PAST' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center gap-4">
            <div className="p-3 bg-stone-50 rounded-xl">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-stone-800">{stat.value.toString().padStart(2, '0')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-stone-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder="Search ceremonies or organizers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 transition-all text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Dropdown Filter */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
            >
              <Filter size={14} className="text-[#C9922A]" />
              STATUS: <span className="text-[#1a3a2a]">{currentFilter}</span>
              <ChevronDown size={14} className={`transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-xl z-50 py-2">
                {['ALL', 'UPCOMING', 'ONGOING', 'PAST'].map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f as EventStatus)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${currentFilter === f ? 'bg-stone-50 text-[#C9922A]' : 'text-stone-500 hover:bg-stone-50 hover:text-[#1a3a2a]'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] border-b border-stone-100">
                <th className="px-8 py-4">Event Details</th>
                <th className="px-8 py-4">Timing</th>
                <th className="px-8 py-4">Venue</th>
                <th className="px-8 py-4">Live Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredEvents.map((event) => (
                <tr 
                  key={event.id} 
                  className={`transition-all group ${event.is_past ? 'opacity-50 grayscale-[0.3] bg-stone-50/20' : 'hover:bg-stone-50/50'}`}
                >
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1a3a2a] group-hover:text-[#C9922A] transition-colors">{event.title}</span>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">{event.organizer}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-bold text-stone-600">
                      {new Date(event.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      <div className="text-[10px] text-stone-400 font-medium">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {event.is_virtual ? (
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[9px] font-black border border-blue-100">VIRTUAL</span>
                    ) : (
                      <span className="text-xs font-medium text-stone-500 uppercase truncate max-w-[120px] block">{event.location}</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                      event.current_status === 'ONGOING' ? "bg-green-50 border-green-200 text-green-700" : 
                      event.current_status === 'PAST' ? "bg-stone-100 border-stone-200 text-stone-500" : 
                      "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      {event.current_status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(event)} className="p-2 text-stone-400 hover:text-[#1a3a2a] hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEvents.length === 0 && (
            <div className="py-24 text-center">
              <AlertCircle size={40} className="mx-auto text-stone-200 mb-2" />
              <p className="text-stone-400 font-serif italic">No judicial records match your current query.</p>
            </div>
          )}
        </div>
      </div>

      <EventModal 
        key={selectedEvent?.id || "new"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedEvent={selectedEvent} 
      />
    </div>
  );
};

export default SuperAdminEvents;