import React, { useMemo } from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Asterisk,
  BarChart2,
  Bath,
  Bed,
  Bookmark,
  Bot,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileImage,
  FileSignature,
  FileText,
  Flag,
  FolderLock,
  Footprints,
  GitCompare,
  GraduationCap,
  Grid3X3,
  Handshake,
  Heart,
  Home,
  Inbox,
  Info,
  Key,
  Lightbulb,
  Link2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Send,
  SendHorizontal,
  Settings2,
  Share,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Users,
  UtensilsCrossed,
  Video,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react-native";
import type { SvgProps } from "react-native-svg";

import { color as tokenColor } from "packages/design-tokens";
import type { IconName } from "packages/ui/types/icons";

const ICONS: Record<IconName, React.ComponentType<SvgProps>> = {
  activity: Activity,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  asterisk: Asterisk,
  "bar-chart-2": BarChart2,
  bath: Bath,
  bed: Bed,
  bookmark: Bookmark,
  bot: Bot,
  building: Building,
  "building-2": Building2,
  calendar: Calendar,
  check: Check,
  "check-circle": CheckCircle,
  "check-circle-2": CheckCircle2,
  "check-square": CheckSquare,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "clipboard-check": ClipboardCheck,
  clock: Clock,
  copy: Copy,
  "credit-card": CreditCard,
  "dollar-sign": CreditCard,
  download: Download,
  edit: Edit,
  "external-link": ExternalLink,
  eye: Eye,
  "eye-off": EyeOff,
  file: File,
  "file-image": FileImage,
  "file-signature": FileSignature,
  "file-text": FileText,
  flag: Flag,
  "folder-lock": FolderLock,
  footprints: Footprints,
  "git-compare": GitCompare,
  "graduation-cap": GraduationCap,
  "grid-3x3": Grid3X3,
  handshake: Handshake,
  heart: Heart,
  home: Home,
  inbox: Inbox,
  info: Info,
  key: Key,
  lightbulb: Lightbulb,
  "link-2": Link2,
  "loader-2": Loader2,
  lock: Lock,
  "log-in": LogIn,
  "log-out": LogOut,
  mail: Mail,
  map: Map,
  "map-pin": MapPin,
  menu: Menu,
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  "more-horizontal": MoreHorizontal,
  pencil: Pencil,
  phone: Phone,
  plus: Plus,
  receipt: Receipt,
  "refresh-cw": RefreshCw,
  save: Save,
  search: Search,
  send: Send,
  "send-horizontal": SendHorizontal,
  settings: Settings2,
  "settings-2": Settings2,
  share: Share,
  shield: Shield,
  "sliders-horizontal": SlidersHorizontal,
  sparkles: Sparkles,
  square: Square,
  target: Target,
  trash: Trash2,
  "trash-2": Trash2,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  upload: Upload,
  user: User,
  users: Users,
  "utensils-crossed": UtensilsCrossed,
  video: Video,
  "volume-2": Volume2,
  "volume-x": VolumeX,
  x: X,
  "x-circle": XCircle,
};

const TAILWIND_STEP_PX = 4;

function deriveSizeFromClassName(className?: string): number | undefined {
  if (!className) return undefined;

  // Tailwind patterns we commonly use: `h-4 w-4`, `size-5`, etc.
  const sizeMatch = className.match(/(?:^|\\s)size-(\\d+(?:\\.5)?)(?:\\s|$)/);
  const hMatch = className.match(/(?:^|\\s)h-(\\d+(?:\\.5)?)(?:\\s|$)/);
  const wMatch = className.match(/(?:^|\\s)w-(\\d+(?:\\.5)?)(?:\\s|$)/);

  const token =
    (sizeMatch?.[1] ?? hMatch?.[1] ?? wMatch?.[1]) !== undefined
      ? Number(sizeMatch?.[1] ?? hMatch?.[1] ?? wMatch?.[1])
      : undefined;
  if (!token || Number.isNaN(token)) return undefined;
  return token * TAILWIND_STEP_PX;
}

function deriveColorFromClassName(className?: string): string | undefined {
  if (!className) return undefined;

  if (/(?:^|\\s)text-white(?:\\s|$)/.test(className)) return "#ffffff";
  if (/(?:^|\\s)text-black(?:\\s|$)/.test(className)) return "#000000";
  if (/(?:^|\\s)text-brand-accent(?:\\s|$)/.test(className)) return tokenColor("brand.accent");
  if (/(?:^|\\s)text-brand-secondary(?:\\s|$)/.test(className))
    return tokenColor("brand.secondary");
  if (/(?:^|\\s)text-brand-primary(?:\\s|$)/.test(className)) return tokenColor("brand.primary");

  const neutralMatch = className.match(/(?:^|\\s)text-(?:gray|neutral)-(\\d{2,3})(?:\\s|$)/);
  if (neutralMatch?.[1]) {
    const shade = neutralMatch[1];
    return tokenColor(`neutral.${shade}`);
  }

  const roseMatch = className.match(/(?:^|\\s)text-rose-(\\d{2,3})(?:\\s|$)/);
  if (roseMatch?.[1]) {
    const shade = Number(roseMatch[1]);
    if (shade <= 100) return tokenColor("rose.100");
    if (shade >= 800) return tokenColor("rose.800");
    return tokenColor("rose.DEFAULT");
  }

  const greenMatch = className.match(/(?:^|\\s)text-(?:green|emerald)-(\\d{2,3})(?:\\s|$)/);
  if (greenMatch?.[1]) {
    const shade = greenMatch[1];
    return tokenColor(`green.${shade}`);
  }

  const yellowMatch = className.match(/(?:^|\\s)text-(?:yellow|amber)-(\\d{2,3})(?:\\s|$)/);
  if (yellowMatch?.[1]) {
    const shade = Number(yellowMatch[1]);
    if (shade >= 800) return tokenColor("yellow.800");
    if (shade >= 700) return tokenColor("yellow.700");
    return tokenColor("yellow.DEFAULT");
  }

  const blueMatch = className.match(/(?:^|\\s)text-blue-(\\d{2,3})(?:\\s|$)/);
  if (blueMatch?.[1]) {
    const shade = blueMatch[1];
    return tokenColor(`blue.${shade}`);
  }

  return undefined;
}

export type IconProps = {
  name: IconName;
  /**
   * Web-only, but accepted so shared code can pass `className` without breaking RN.
   * Used to derive `size` and `color` when those props aren't provided.
   */
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
  accessibilityLabel?: string;
};

export function Icon({
  name,
  className,
  size,
  color,
  strokeWidth,
  testID,
  accessibilityLabel,
}: IconProps): JSX.Element | null {
  const IconComponent = ICONS[name];
  const derivedSize = useMemo(() => deriveSizeFromClassName(className), [className]);
  const derivedColor = useMemo(() => deriveColorFromClassName(className), [className]);

  if (!IconComponent) return null;

  const resolvedSize = size ?? derivedSize ?? 24;
  const resolvedColor = color ?? derivedColor ?? tokenColor("neutral.700");

  return (
    <IconComponent
      width={resolvedSize}
      height={resolvedSize}
      // lucide-react-native uses react-native-svg under the hood
      color={resolvedColor}
      strokeWidth={strokeWidth}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
