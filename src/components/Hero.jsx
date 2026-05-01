import { useState, useEffect, useRef } from 'react';

export default function Hero() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]); // Stores persistent search history
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const RESULTS_PER_PAGE = 5;
  const API_BASE = "http://127.0.0.1:8000"; // Pointing to your Django Port

  const requestIdRef = useRef(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // --- 1. Load History on Mount ---
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- 2. Main Search Execution ---
  const fetchResults = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setDisplayedResults([]);
      return;
    }

    const currentId = ++requestIdRef.current;
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await response.json();

      if (currentId === requestIdRef.current) {
        setResults(data);
        setDisplayedResults(data.slice(0, RESULTS_PER_PAGE));
        setPage(1);
        setLoading(false);
        fetchHistory(); // Refresh history dropdown
      }
    } catch (error) {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // --- 3. Autocomplete Logic ---
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) fetchSuggestions(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle Outside Clicks
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (text) => {
    setQuery(text);
    setShowSuggestions(false);
    fetchResults(text);
  };

  const handleKeyDown = (e) => {
    const list = query.trim() ? suggestions : history;
    if (!showSuggestions || list.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0) {
        e.preventDefault();
        handleSelectSuggestion(list[activeSuggestion]);
      } else {
        fetchResults(query);
        setShowSuggestions(false);
      }
    }
  };

  // --- 4. Voice Search Fix ---
  const startVoiceSearch = () => {
    // Cross-browser compatibility check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Speech API not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsListening(true);
    setVoiceError('');

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setQuery(text);
      fetchResults(text);
    };

    recognition.onerror = () => setVoiceError('Voice Search failed.');
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleShowMore = () => {
    const nextPage = page + 1;
    setDisplayedResults(results.slice(0, nextPage * RESULTS_PER_PAGE));
    setPage(nextPage);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 mt-20 pointer-events-none">

      {/* Title HUD */}
      {results.length === 0 && !loading && (
        <div className="text-center max-w-5xl mb-16 transition-all duration-500 relative">
          <div className="inline-flex items-center gap-3 border border-[#ff5a1f]/30 rounded-full px-6 py-2 mb-10 bg-black/30 shadow-[0_0_20px_rgba(255,90,31,0.1)]">
            <span className="w-2 h-2 rounded-full bg-[#ff5a1f] animate-pulse"></span>
            <span className="font-mono text-[10px] tracking-[0.35em] text-[#ffb08a]">
              SYSTEM ONLINE — 800K+ WORDS INDEXED
            </span>
          </div>
          <h1 className="font-mono text-6xl md:text-8xl font-bold text-[#f5e6dc] tracking-tighter">
            Search <span className="text-[#ff5a1f] drop-shadow-[0_0_15px_rgba(255,90,31,0.5)]">Engine</span>
          </h1>
        </div>
      )}

      {/* Search Bar HUD */}
      <div className="w-full max-w-6xl relative pointer-events-auto">
        <div className="relative bg-black/60 backdrop-blur-xl border border-[#ff5a1f]/30 rounded-xl p-2 flex items-center gap-2">
          <div className="flex-1 flex items-center px-4">
            <span className="material-symbols-outlined text-[#ff5a1f] opacity-70">search</span>
            <input
              ref={inputRef}
              className="w-full bg-transparent border-none focus:ring-0 font-mono text-white placeholder:text-[#ff5a1f]/30 pl-4 py-5 outline-none"
              placeholder="S Y S T E M   S C A N . . ."
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
          </div>

          <button
            onClick={startVoiceSearch}
            className={`w-20 h-16 flex items-center justify-center rounded-lg border transition-all ${
              isListening ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-[#140500] border-[#ff5a1f]/20 hover:bg-[#ff5a1f]/10'
            }`}
          >
            <span className={`material-symbols-outlined ${isListening ? 'text-red-400' : 'text-[#f5e6dc]'}`}>mic</span>
          </button>
        </div>

        {/* Error/Listening Status */}
        {(voiceError || isListening) && (
          <div className={`mt-3 px-4 py-2 rounded-lg font-mono text-xs border ${voiceError ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-[#140500] border-[#ff5a1f]/30 text-[#ff5a1f]'}`}>
            {voiceError || '>>> AUDIO CAPTURE ACTIVE...'}
          </div>
        )}

        {/* Dropdown for History/Autocomplete */}
        {showSuggestions && (query.trim() === '' ? history : suggestions).length > 0 && (
          <div ref={suggestionsRef} className="absolute left-0 right-0 mt-2 z-50 bg-black/95 border border-[#ff5a1f]/20 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 py-2 bg-[#ff5a1f]/5 text-[#ff5a1f]/40 text-[9px] font-mono tracking-widest">
              {query.trim() === '' ? 'RECENT ENTRIES' : 'AUTOCOMPLETE SUGGESTIONS'}
            </div>
            {(query.trim() === '' ? history : suggestions).map((item, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(item); }}
                className={`w-full text-left px-5 py-3 font-mono text-sm transition-colors ${
                  idx === activeSuggestion ? 'bg-[#ff5a1f]/20 text-white' : 'text-[#f5e6dc]/70 hover:bg-[#ff5a1f]/10'
                }`}
              >
                {query.trim() === '' ? `🕒 ${item}` : item}
              </button>
            ))}
          </div>
        )}

        {/* Results Section */}
        {query.trim() !== '' && (results.length > 0 || loading) && (
          <div className="mt-8 w-full max-h-[60vh] overflow-y-auto rounded-2xl border border-[#ff5a1f]/10 bg-black/40 backdrop-blur-3xl p-6 space-y-4">
            {loading ? (
              <div className="py-10 text-center font-mono text-[#ff5a1f] animate-pulse">INITIALIZING SCAN...</div>
            ) : (
              <>
                <div className="flex justify-between font-mono text-[10px] text-[#ff5a1f]/50 tracking-widest border-b border-[#ff5a1f]/10 pb-2">
                  <span>MATCHES FOUND: {results.length}</span>
                  <span>NODE: SQLITE_CORE</span>
                </div>
                {displayedResults.map((res, i) => (
                  <a
                    key={i}
                    href={`${API_BASE}/view?url=${encodeURIComponent(res.url)}&q=${encodeURIComponent(query)}`}
                    target="_blank"
                    className="block p-4 border border-[#ff5a1f]/5 bg-white/5 hover:border-[#ff5a1f]/40 rounded-xl transition-all group"
                  >
                    <div className="font-mono text-[#ff5a1f] text-sm truncate">{res.url}</div>
                    <div className="flex gap-4 mt-2 font-mono text-[9px] text-white/30 uppercase">
                      <span>Score: {res.score}</span>
                      <span>Verified Result</span>
                    </div>
                  </a>
                ))}
                {results.length > displayedResults.length && (
                  <button onClick={handleShowMore} className="w-full py-3 border border-[#ff5a1f]/20 font-mono text-[10px] text-[#ff5a1f] hover:bg-[#ff5a1f]/10">LOAD MORE ENTRIES</button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}