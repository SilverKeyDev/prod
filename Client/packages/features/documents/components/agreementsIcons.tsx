import { Icon } from "@ui/icons";

type Status = "draft" | "sent" | "delivered" | "signed" | "voided" | "declined" | string | null;

type StatusIconProps = {
  className?: string;
};

export function getAgreementStatusIcon(status?: Status) {
  const DraftIcon = ({ className }: StatusIconProps) => (
    <Icon name="file-pen" className={className} />
  );
  const SentIcon = ({ className }: StatusIconProps) => <Icon name="send" className={className} />;
  const DeliveredIcon = ({ className }: StatusIconProps) => (
    <Icon name="mail" className={className} />
  );
  const SignedIcon = ({ className }: StatusIconProps) => (
    <Icon name="file-signature" className={className} />
  );
  const VoidedIcon = ({ className }: StatusIconProps) => (
    <Icon name="x-circle" className={className} />
  );
  const DeclinedIcon = ({ className }: StatusIconProps) => (
    <Icon name="alert-circle" className={className} />
  );

  switch (status) {
    case "sent":
      return SentIcon;
    case "delivered":
      return DeliveredIcon;
    case "signed":
      return SignedIcon;
    case "voided":
      return VoidedIcon;
    case "declined":
      return DeclinedIcon;
    case "draft":
    default:
      return DraftIcon;
  }
}
