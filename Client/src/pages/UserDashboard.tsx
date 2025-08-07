
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  FolderOpen,
  Send,
  BellRing,
  MessageCircleMore,
  LucideIcon,
} from "lucide-react";
import TimelineProgress from "../components/TimelineProgress";

interface Feature {
  title: string;
  description: string;
  link: string;
  icon: LucideIcon;
}

const features: Feature[] = [
  {
    title: "Documents",
    description: "Securely store and access important home-buying documents.",
    link: "/documents",
    icon: FolderOpen,
  },
  {
    title: "Submit Offer",
    description: "Send offers directly to sellers or listing agents.",
    link: "/submit-offer",
    icon: Send,
  },
  {
    title: "Listing Alerts",
    description: "Get notified when new listings hit the market.",
    link: "/listing-alerts",
    icon: BellRing,
  },
];

export default function UserDashboard() {
  const progress = { current: 4, total: 9 }; // TODO: replace with dynamic values
  const progressPercent = (progress.current / progress.total) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-2">
        Dashboard
      </h1>
      <p className="text-gray-600 mb-6">
        All the tools you need for a seamless, agent-free buying experience.
      </p>
      
      {/* Timeline Progress */}
      <div className="mb-8">
        <TimelineProgress completedStepKey="search" currentStepKey="negotiate" /> {/* TODO: dynamic */}
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, description, link, icon: Icon }) => (
          <Link
            key={title}
            to={link}
            className="bg-white shadow hover:shadow-lg transition rounded-lg p-6 flex flex-col items-center text-center"
          >
            <Icon size={32} className="text-brown mb-4" />
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
