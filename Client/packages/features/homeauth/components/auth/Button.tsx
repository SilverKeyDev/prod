/**
 * Auth flow submit button — wraps design system Button with loading/disabled for login/signup.
 * Resolves packages/features/homeauth/Auth/Button and @/features/homeauth/Auth/Button imports.
 */
import { Button } from "@ui";

type AuthButtonProps = React.ComponentProps<typeof Button>;

export default function AuthButton({ loading, disabled, children, ...props }: AuthButtonProps) {
  return (
    <Button variant="primary" loading={loading} disabled={disabled ?? loading} {...props}>
      {children}
    </Button>
  );
}
