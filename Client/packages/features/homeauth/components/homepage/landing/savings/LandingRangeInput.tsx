import RangeInput from "packages/ui/components/inputs/form/pickers/RangeInput";
import { Box } from "packages/ui/components/structure/primitives";

type LandingRangeInputProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export function LandingRangeInput({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: LandingRangeInputProps) {
  return (
    <Box className="w-full">
      <RangeInput
        id={id}
        label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="landing-range-input accent-gold h-1 w-full cursor-pointer"
      />
    </Box>
  );
}
