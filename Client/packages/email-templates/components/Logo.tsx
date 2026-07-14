import { Img } from "@react-email/components";

type LogoProps = {
  logoUrl?: string;
};

/** Default relative path; previews should pass an absolute origin + LOGO_URI. */
export function Logo({ logoUrl = "/logo.png" }: LogoProps) {
  if (!logoUrl) return null;

  return (
    <div style={{ textAlign: "center", marginBottom: "24px" }}>
      <Img
        src={logoUrl}
        alt="SilverKey Logo"
        width="180"
        height="auto"
        style={{
          maxWidth: "180px",
          height: "auto",
          margin: "0 auto",
        }}
      />
    </div>
  );
}
