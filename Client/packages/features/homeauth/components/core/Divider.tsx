import { Box, Text } from "packages/ui/components/primitives";

interface DividerProps {
  text?: string;
}

export default function AuthDivider({ text = "Or continue with" }: DividerProps) {
  return (
    <Box className="relative">
      <Box className="absolute inset-0 flex items-center">
        <Box className="w-full border-t border-gray-300" />
      </Box>
      <Box className="relative flex justify-center">
        <Text className="bg-white px-2 text-sm text-gray-500">
          {text}
        </Text>
      </Box>
    </Box>
  );
}
