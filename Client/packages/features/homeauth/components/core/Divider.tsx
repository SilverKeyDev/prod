import { Box, Text } from "packages/ui/components/structure/primitives";

interface DividerProps {
  text?: string;
}

export default function AuthDivider({ text = "Or continue with" }: DividerProps) {
  return (
    <Box className="relative">
      <Box className="absolute inset-0 flex items-center">
        <Box className="border-border w-full border-t" />
      </Box>
      <Box className="relative flex justify-center">
        <Text className="bg-background-surface text-text-secondary px-2 text-sm">{text}</Text>
      </Box>
    </Box>
  );
}
