import { useState, useRef, useEffect } from "react";
import airportsData from "../../assets/airports.json";
import { Input } from "./index.jsx";

export const AirportAutocomplete = ({ value, onChange, placeholder, disabled, required, id, className = "" }) => {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);

  // Sync internal query with external value if it changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter airports based on query
  const filtered = query.trim()
    ? airportsData.filter((a) => {
        const q = query.toLowerCase();
        return (
          a.code.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
        );
      }).slice(0, 8) // Limit to top 8 suggestions
    : [];

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    setIsOpen(true);
    setHighlightedIndex(0);
    // Bubble up raw typed text (in case it's a custom code not in JSON)
    onChange({ target: { value: val } });
  };

  const handleSelect = (code) => {
    setQuery(code);
    setIsOpen(false);
    onChange({ target: { value: code } });
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filtered[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filtered[highlightedIndex].code);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        id={id}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={className}
        style={{ textTransform: "uppercase" }}
        maxLength={3}
      />

      {isOpen && filtered.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden"
          style={{
            borderColor: "#E5E0D8",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {filtered.map((airport, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={airport.code}
                onClick={() => handleSelect(airport.code)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className="px-4 py-2 cursor-pointer transition-colors"
                style={{
                  background: isHighlighted ? "#F7F5F1" : "white",
                  borderBottom: index === filtered.length - 1 ? "none" : "1px solid #F0EDE7",
                }}
              >
                <div className="flex justify-between items-center">
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                      color: "#0E1F33",
                    }}
                  >
                    {airport.code}
                  </span>
                  <span className="text-xs text-right truncate ml-4" style={{ color: "#8FA3B1", maxWidth: "75%" }}>
                    <span style={{ color: "#5C7589", fontWeight: 600 }}>{airport.city}</span>
                    <span className="opacity-70"> · {airport.name}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
