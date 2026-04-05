import { useState } from "react";
import { motion } from "framer-motion";

interface NameModalProps {
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  title?: string;
}

export default function NameModal({ onSubmit, onCancel, title = "What's your name?" }: NameModalProps) {
  const stored = localStorage.getItem("staysharp_player_name") || "";
  const [name, setName] = useState(stored);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("staysharp_player_name", trimmed);
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[360px] bg-card rounded-2xl p-6 border border-border"
      >
        <h3 className="font-display text-lg font-800 text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-5">This will be shown to your opponent.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground font-display text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg disabled:opacity-50"
          >
            Continue
          </motion.button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
