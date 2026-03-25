export type ValidationRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};
