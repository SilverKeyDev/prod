import { useState } from "react";
import KeyLogo from "../../components/KeyLogo";
import {
  Home,
  Lightbulb,
  DollarSign,
  MessageCircle,
  FileText,
} from "lucide-react";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const label = "block text-navy font-medium mb-2";
const input =
  "w-full border border-beige rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive transition-colors";
const button =
  "bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-olive-light transition-colors duration-200 flex items-center gap-2";

interface Strategy {
  pricing: string;
  concessions: string;
  communication: string;
  extras: string;
}

export default function NegotiationStrategy() {
  // Mocked list of homes; replace with API data when backend is ready
  const sampleHomes = [
    { id: 1, address: "123 Maple St, Springfield" },
    { id: 2, address: "456 Oak Ave, Riverdale" },
    { id: 3, address: "789 Pine Ln, Sunnyvale" },
  ];

  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  const handleGenerate = () => {
    if (!selectedHomeId) return;
    // Mock generation logic – stub until backend/AI endpoint is available
    setStrategy({
      pricing:
        "Offer 2% below list price with escalation up to list if multiple offers.",
      concessions:
        "Request seller to cover up to 1% in closing costs and include washer/dryer.",
      communication:
        "Maintain friendly, data-driven tone. Emphasize strong financing and quick close.",
      extras:
        "Include personal cover letter highlighting intent to maintain the home's garden.",
    });
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4">
        <div className="mx-auto px-12 py-10">
          <div className="flex items-center gap-4 mb-4">
            <KeyLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-navy">
                Generate Negotiation Strategy
              </h1>
              <p className="text-navy/70">
                Craft a personalized approach for your selected home
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-12 py-10 max-w-4xl">
        {/* Home selector */}
        <div className={sectionBox}>
          <div className={sectionTitle}>
            <Home className="h-5 w-5 text-brown" />
            Select a Home
          </div>
          <label className={label} htmlFor="home">
            Available Homes
          </label>
          <select
            id="home"
            className={input}
            value={selectedHomeId ?? ""}
            onChange={(e) => {
              setSelectedHomeId(Number(e.target.value));
              setStrategy(null);
            }}
          >
            <option value="" disabled>
              -- Choose a home --
            </option>
            {sampleHomes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.address}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={button}
            onClick={handleGenerate}
            disabled={!selectedHomeId}
          >
            <Lightbulb className="h-5 w-5" />
            Generate Strategy
          </button>
        </div>

        {/* Strategy output */}
        {strategy && (
          <div className={sectionBox}>
            <div className={sectionTitle}>
              <FileText className="h-5 w-5 text-brown" />
              Strategy Recommendations
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brown" />
                Pricing Strategy
              </h3>
              <p className="text-navy/80">{strategy.pricing}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brown" />
                Concessions & Terms
              </h3>
              <p className="text-navy/80">{strategy.concessions}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-brown" />
                Communication Approach
              </h3>
              <p className="text-navy/80">{strategy.communication}</p>
            </div>

            <div>
              <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-brown" />
                Extra Tips
              </h3>
              <p className="text-navy/80">{strategy.extras}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
