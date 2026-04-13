import { useEffect, useState } from "react";
import { 
  Maximize2, X, Search, ShieldCheck,
  Calendar, Tag, AlertCircle, 
  Film, Image as ImageIcon, LayoutGrid, Loader2, MapPin
} from "lucide-react";

import { type IGalleryAlbum, MediaType } from "../../interfaces/gallery.interface";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchAlbums } from "../../redux/slices/gallerySlice";

const RegistrarGallery = () => {
  const dispatch = useAppDispatch();
  const { albums, loading } = useAppSelector((state) => state.gallery);

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedAlbum, setSelectedAlbum] = useState<IGalleryAlbum | null>(null);

  const filterOptions = ["All", ...Object.values(MediaType)];

  useEffect(() => {
    const categoryParam = activeCategory === "All" ? undefined : activeCategory;
    dispatch(fetchAlbums(categoryParam));

    const pollInterval = setInterval(() => {
      dispatch(fetchAlbums(categoryParam));
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [dispatch, activeCategory]);

  const filteredAlbums = albums.filter((item: IGalleryAlbum) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] font-sans overflow-hidden">
      {/* HEADER SECTION */}
      <header className="bg-[#1a3a32] text-white px-8 py-6 shadow-2xl z-20 border-b border-[#c2a336]/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#c2a336] p-2.5 rounded-xl text-[#1a3a32] shadow-lg shadow-yellow-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl uppercase tracking-tight text-white">
                Registry Gallery
              </h1>
              <p className="text-[10px] text-[#c2a336] uppercase tracking-[0.3em] font-black">
                Official Archives • Office of the Registrar
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type="text"
              placeholder="Search archives, events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#c2a336]/50 focus:bg-white/10 transition-all shadow-inner"
            />
          </div>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <LayoutGrid size={18} className="text-[#1a3a32] mr-2 shrink-0" />
          {filterOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeCategory === cat
                  ? "bg-[#1a3a32] text-[#c2a336] border-[#1a3a32] shadow-md"
                  : "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          {loading && albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <Loader2 size={48} className="text-[#c2a336] animate-spin mb-4" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Syncing Records...</span>
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No archival media found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAlbums.map((album) => (
                <div 
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-[4/3] relative bg-slate-900 overflow-hidden">
                    <img 
                      src={album.thumbnail_url} 
                      alt={album.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {album.media_counts.videos > 0 && (
                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] flex items-center gap-1">
                          <Film size={10} /> {album.media_counts.videos}
                        </div>
                      )}
                      {album.media_counts.images > 0 && (
                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] flex items-center gap-1">
                          <ImageIcon size={10} /> {album.media_counts.images}
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a32] via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex-1 min-w-0">
                         <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest bg-[#c2a336] text-[#1a3a32]">
                           {album.category}
                         </span>
                         <h3 className="text-white font-bold text-sm mt-1 truncate pr-2">{album.title}</h3>
                         <div className="flex items-center gap-1 text-white/50 text-[10px] mt-0.5">
                           <MapPin size={10} /> {album.location}
                         </div>
                      </div>
                      <Maximize2 size={18} className="text-white/70 group-hover:text-[#c2a336] transition-colors shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL VIEW */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-[#0F172A]/98 backdrop-blur-xl" onClick={() => setSelectedAlbum(null)} />
          
          <div className="relative w-full max-w-4xl bg-[#1a3a32] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-serif font-bold mb-2">{selectedAlbum.title}</h2>
                    <p className="text-[#c2a336] text-xs font-black uppercase tracking-widest">{selectedAlbum.location}</p>
                  </div>
                  <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <p className="text-slate-300 text-sm mb-8 bg-white/5 p-6 rounded-2xl border border-white/5 italic">
                  {selectedAlbum.description || "Official registry record for this session."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                    <Calendar className="text-[#c2a336]" />
                    <div>
                      <p className="text-[9px] text-white/30 uppercase font-black">Archive Date</p>
                      <p className="font-bold">
                        {new Date(selectedAlbum.event_date).toLocaleDateString("en-KE", { dateStyle: 'full' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                    <Tag className="text-[#c2a336]" />
                    <div>
                      <p className="text-[9px] text-white/30 uppercase font-black">Classification</p>
                      <p className="font-bold">{selectedAlbum.category}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button className="flex-1 bg-[#c2a336] text-[#1a3a32] py-4 rounded-xl font-black text-sm hover:bg-[#d4b54d] transition-all">
                    VIEW ARCHIVAL MEDIA
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarGallery;