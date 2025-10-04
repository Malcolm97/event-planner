import { motion } from "framer-motion";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = ''
}: ToggleSwitchProps) {
  const sizes = {
    sm: { width: 32, height: 18, knob: 14 },
    md: { width: 44, height: 24, knob: 18 },
    lg: { width: 56, height: 30, knob: 24 }
  };

  const { width, height, knob } = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
        checked
          ? 'bg-yellow-500'
          : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 bg-white rounded-full shadow-md"
        animate={{
          x: checked ? width - knob - 2 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
        style={{ width: knob, height: knob }}
      />
    </button>
  );
}
