import { useState, useEffect, useRef } from 'react';

export default function Hero() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const RESULTS_PER_PAGE = 5;

  const requestIdRef = useRef(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const fetchResults = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setDisplayedResults([]);
      setLoading(false);
      return;
    }

    const currentId = ++requestIdRef.current;
    setLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await response.json();

      if (currentId === requestIdRef.current) {
        setResults(data);
        setDisplayedResults(data.slice(0, RESULTS_PER_PAGE));
        setPage(1);
        setLoading(false);
      }
    } catch (error) {
      if (currentId === requestIdRef.current) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDisplayedResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`
      );

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
      setActiveSuggestion(-1);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    fetchResults(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        Math.min(prev + 1, suggestions.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

const startVoiceSearch = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setVoiceError("Browser doesn't support speech recognition");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  setIsListening(true);

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    setQuery(text);
    fetchResults(text);
  };

  recognition.onerror = () => {
    setVoiceError('Voice recognition failed');
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognition.start();
};

  const handleShowMore = () => {
    const nextPage = page + 1;
    setDisplayedResults(results.slice(0, nextPage * RESULTS_PER_PAGE));
    setPage(nextPage);
  };

  const createHighlightLink = (url, searchQuery) => {
    return `http://127.0.0.1:5000/view?url=${encodeURIComponent(
      url
    )}&q=${encodeURIComponent(searchQuery.trim())}`;
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-margin mt-20 pointer-events-none">
      {results.length === 0 && !loading && (
        <div className="text-center max-w-5xl mb-16 transition-all duration-500 ease-in-out relative">
          <div className="inline-flex items-center gap-3 border border-[#ff5a1f]/30 rounded-full px-6 py-2 mb-10 bg-black/30 shadow-[0_0_20px_rgba(255,90,31,0.08)]">
            <span className="w-2 h-2 rounded-full bg-[#ff5a1f] animate-pulse"></span>
            <span className="font-mono text-xs tracking-[0.35em] text-[#ffb08a]">
              SYSTEM ONLINE — 100K+ URLS INDEXED
            </span>
          </div>

          <h1 className="font-mono text-5xl md:text-8xl font-bold text-[#f5e6dc] tracking-tight leading-none">
            INVERTED{' '}
            <span className="text-[#ff5a1f] drop-shadow-[0_0_18px_rgba(255,90,31,0.7)]">
              [INDEX]
            </span>{' '}
            
          </h1>

          
        </div>
      )}

      <div className="w-full max-w-6xl relative pointer-events-auto hud-panel">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#2a0d00]/60 to-[#ff5a1f]/40 rounded-xl blur-lg opacity-70"></div>

        <div className="relative bg-black/50 backdrop-blur-md border border-[#ff5a1f]/30 rounded-xl p-2 shadow-[0_0_35px_rgba(255,90,31,0.12)] flex items-center gap-2 transition-all hover:border-[#ff5a1f]/60">
          <div className="flex-1 flex items-center px-4 relative">
            <span className="material-symbols-outlined text-[#ff5a1f] text-2xl absolute left-4">
              search
            </span>

            <input
              ref={inputRef}
              className="w-full bg-transparent border-none focus:ring-0 font-mono text-headline-md text-white placeholder:text-[#ff5a1f]/40 pl-12 pr-4 h-full py-5 outline-none"
              placeholder="   S    E    A    R    C    H ..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() =>
                suggestions.length > 0 && setShowSuggestions(true)
              }
              autoComplete="off"
            />
          </div>

          <button
            onClick={startVoiceSearch}
            className={`relative w-24 h-20 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500/20 border-red-400'
                : 'bg-[#140500] border-[#ff5a1f]/40 hover:bg-[#ff5a1f]/10'
            }`}
          >
            <span
              className={`material-symbols-outlined text-3xl ${
                isListening ? 'text-red-400' : 'text-[#f5e6dc]'
              }`}
            >
              mic
            </span>
          </button>
        </div>

        {(voiceError || isListening) && (
          <div
            className={`mt-3 px-4 py-3 rounded-lg font-mono text-sm ${
              voiceError
                ? 'bg-red-900/30 border border-red-500/30 text-red-300'
                : 'bg-[#140500] border border-[#ff5a1f]/30 text-[#ff5a1f]'
            }`}
          >
            {voiceError || '> Listening...'}
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute left-0 right-0 mt-2 z-50 bg-black/95 border border-[#ff5a1f]/30 rounded-xl overflow-hidden"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(suggestion);
                }}
                className={`w-full text-left px-5 py-3 font-mono ${
                  idx === activeSuggestion
                    ? 'bg-[#ff5a1f]/20 text-[#ff5a1f]'
                    : 'text-[#f5e6dc] hover:bg-[#ff5a1f]/10'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center gap-14 flex-wrap font-mono pointer-events-none">
          <div className="text-center">
            <div className="text-[#ff8a4d] text-2xl font-bold">100K+</div>
            <div className="text-[#6d412f] text-xs tracking-[0.3em]">
              URLS INDEXED
            </div>
          </div>

          <div className="text-center">
            <div className="text-[#ff8a4d] text-2xl font-bold">&lt;0.5s</div>
            <div className="text-[#6d412f] text-xs tracking-[0.3em]">
              AVG RESPONSE
            </div>
          </div>

          <div className="text-center">
            <div className="text-[#ff8a4d] text-2xl font-bold">∞</div>
            <div className="text-[#6d412f] text-xs tracking-[0.3em]">
              DEPTH
            </div>
          </div>
        </div>

       {(loading || (query.trim() && results.length >= 0)) && query.trim() !== '' && (
  <div className="mt-6 w-full max-h-[65vh] overflow-y-auto rounded-2xl border border-[#ff5a1f]/20 bg-black/55 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,90,31,0.08)] p-5 space-y-4 scrollbar-thin scrollbar-thumb-[#ff5a1f]/40">
    
    {loading ? (
      <div className="flex flex-col items-center justify-center py-14">
        <div className="w-10 h-10 rounded-full border-2 border-[#ff5a1f]/30 border-t-[#ff5a1f] animate-spin"></div>
        <p className="mt-4 font-mono text-[#ff5a1f] tracking-[0.3em] text-sm">
          SEARCHING INDEX...
        </p>
      </div>
    ) : results.length > 0 ? (
      <>
        <div className="flex items-center justify-between border-b border-[#ff5a1f]/15 pb-3 mb-2">
          <span className="font-mono text-[#ff9a6b] text-sm tracking-[0.25em]">
            MATCHES FOUND: {results.length}
          </span>
          <span className="font-mono text-[#ff5a1f]/60 text-xs">
            LOCAL DATABASE
          </span>
        </div>

        {displayedResults.map((result, idx) => (
          <a
            key={idx}
            href={createHighlightLink(result.url, query)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-xl border border-[#ff5a1f]/10 bg-gradient-to-r from-[#0b0b0b] to-[#111111] hover:border-[#ff5a1f]/40 hover:shadow-[0_0_25px_rgba(255,90,31,0.12)] transition-all duration-300"
          >
            {/* Side Accent */}
            <div className="absolute left-0 top-0 h-full w-1 bg-[#ff5a1f] opacity-60 group-hover:opacity-100"></div>

            <div className="p-4 pl-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-mono text-xs text-[#ff5a1f]/50 mb-2 tracking-[0.25em]">
                    RESULT #{idx + 1}
                  </p>

                  <h3 className="font-mono text-[#ff5a1f] text-sm md:text-base break-all group-hover:underline">
                    {result.url}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono text-[#c4c5d7]/55">
                    <span>Score: {result.score}</span>
                    <span>Status: Indexed</span>
                    <span>Protocol: HTTP/HTTPS</span>
                  </div>
                </div>

                <div className="text-[#ff5a1f]/40 group-hover:text-[#ff5a1f] transition-all font-mono text-sm">
                  OPEN →
                </div>
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_left,_rgba(255,90,31,0.08),transparent_60%)]"></div>
          </a>
        ))}

        {results.length > displayedResults.length && (
          <button
            onClick={handleShowMore}
            className="w-full py-4 rounded-xl border border-[#ff5a1f]/30 text-[#ff5a1f] font-mono tracking-[0.3em] hover:bg-[#ff5a1f]/10 hover:shadow-[0_0_20px_rgba(255,90,31,0.12)] transition-all"
          >
            LOAD MORE RESULTS
          </button>
        )}
      </>
    ) : (
      <div className="text-center py-14">
        <p className="font-mono text-[#c4c5d7]/70 text-lg">
          NO MATCHES FOUND
        </p>
        <p className="font-mono text-[#ff5a1f]/50 text-sm mt-2 tracking-[0.2em]">
          TRY A DIFFERENT QUERY
        </p>
      </div>
    )}
  </div>
)}
      </div>
    </main>
  );
}