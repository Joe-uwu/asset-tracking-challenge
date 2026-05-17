import { useEffect, useRef, useState } from "react";

export interface ScanInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
  // Hardware scanner specific
  hardwareScannerMode?: boolean;
  debounceMs?: number;
}

export function ScanInput({
  onScan,
  placeholder = "Scan or type a tag and press Enter…",
  autoFocus = true,
  disabled = false,
  label,
  hardwareScannerMode = false,
  debounceMs = 50,
}: ScanInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoFocus && ref.current && !disabled) {
      ref.current.focus();
    }
  }, [autoFocus, disabled]);

  // Handle hardware scanner input (raw input including \r, \n)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) {
        onScan(value.trim());
        setValue("");
        if (ref.current) {
          ref.current.focus();
        }
      }
    }
    // Handle hardware scanner termination tokens (like Tab) if needed
    // For hardware scanners, we might also want to handle other keys as termination
  };

  // Handle input change for debouncing (for hardware scanner mode) or state updates (for regular mode)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (hardwareScannerMode) {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer to trigger onScan after debounceMs
      debounceTimer.current = setTimeout(() => {
        if (newValue.trim()) {
          onScan(newValue.trim());
          setValue("");
          if (ref.current) {
            ref.current.focus();
          }
        }
      }, debounceMs);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <label className="block">
      {label ? (
        <span className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        className="w-full text-lg p-4 min-h-[44px] rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none disabled:bg-gray-100"
        onKeyDown={!hardwareScannerMode ? handleKeyDown : undefined}
        onChange={handleChange}
        // For hardware scanner mode: onChange with debounce, onKeyDown undefined
        // For regular mode: onChange for state updates, onKeyDown for Enter handling
      />
    </label>
  );
}