/**
 * Cookie Consent Banner Component
 * GDPR-compliant cookie consent with granular controls
 */

import { useState, useEffect } from "react";
import { X, Settings, Shield, Eye, BarChart3, Target } from "lucide-react";
import Card from "../layout/Card";
import Button from "../ui/button/Button";
import { log } from "../../lib/security/secureLogger";
import { reportSecurityEvent } from "../../lib/security/errorReporting";

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  sessionReplay: boolean;
}

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  sessionReplay: false,
};

const cookieCategories = {
  necessary: {
    name: "Necessary Cookies",
    description:
      "Essential for authentication, security, and basic website functionality.",
    icon: Shield,
    purposes: ["Authentication", "Security", "Basic website functionality"],
  },
  analytics: {
    name: "Analytics Cookies",
    description:
      "Help us understand how you use our website to improve performance and user experience.",
    icon: BarChart3,
    purposes: ["Website analytics", "Performance monitoring"],
  },
  marketing: {
    name: "Marketing Cookies",
    description:
      "Used to deliver personalized advertisements and measure campaign effectiveness.",
    icon: Target,
    purposes: ["Personalized advertising", "Campaign measurement"],
  },
  sessionReplay: {
    name: "Session Replay",
    description:
      "Records anonymized user sessions to help identify and fix usability issues.",
    icon: Eye,
    purposes: ["Session recording", "Usability improvement"],
  },
};

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] =
    useState<ConsentPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
      log.info(
        "privacy",
        "Cookie consent banner displayed - no previous consent found",
      );
    } else {
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        log.info("privacy", "Cookie consent loaded from storage", {
          preferences: savedPreferences,
        });
      } catch (error) {
        setShowBanner(true);
        log.warn(
          "privacy",
          "Cookie consent banner displayed - invalid stored consent",
          { error },
        );
      }
    }
  }, []);

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem("cookieConsent", JSON.stringify(prefs));
    localStorage.setItem("cookieConsentDate", new Date().toISOString());

    // Log consent decision for audit trail
    log.info("privacy", "Cookie consent updated", {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Report security event for compliance monitoring
    reportSecurityEvent({
      type: "data_access",
      severity: "low",
      description: "User updated cookie consent preferences",
      metadata: {
        consentGiven: prefs,
        essential: prefs.necessary,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        sessionReplay: prefs.sessionReplay,
      },
    });

    // Dispatch event for analytics/tracking services
    window.dispatchEvent(
      new CustomEvent("cookieConsentUpdated", {
        detail: prefs,
      }),
    );

    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      sessionReplay: true,
    });
  };

  const handlePreferenceChange = (
    key: keyof ConsentPreferences,
    checked: boolean,
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: checked }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Card
          className="mx-4 mb-4 border-t-4 border-t-brand-accent"
          shadow="lg"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Shield className="w-5 h-5 text-brand-accent mr-2" />
                <h3 className="text-sm font-medium text-gray-900">
                  We value your privacy
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, analyze site usage,
                and assist in marketing. You can customize your preferences or
                accept all cookies.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                icon={<Settings className="w-4 h-4" />}
              >
                Customize
              </Button>
              <Button variant="primary" size="sm" onClick={handleAcceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowSettings(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <Card className="relative w-full max-w-2xl" padding="lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-brand-accent mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">
                    Cookie Preferences
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  icon={<X className="w-5 h-5" />}
                  className="text-gray-400 hover:text-gray-500"
                />
              </div>

              {/* Cookie Categories */}
              <div className="space-y-4 mb-6">
                {Object.entries(cookieCategories).map(([key, category]) => (
                  <Card
                    key={key}
                    className="border-l-4 border-l-gray-300"
                    padding="md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          <category.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {category.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[key as keyof ConsentPreferences]}
                          onChange={(e) =>
                            handlePreferenceChange(
                              key as keyof ConsentPreferences,
                              e.target.checked,
                            )
                          }
                          disabled={key === "necessary"}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    </div>

                    {category.purposes.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">
                          Purposes:
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {category.purposes.map((purpose, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full mr-2 flex-shrink-0"></span>
                              {purpose}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    saveConsent({
                      necessary: true,
                      analytics: false,
                      marketing: false,
                      sessionReplay: false,
                    })
                  }
                  className="flex-1"
                >
                  Reject All
                </Button>
                <Button
                  variant="primary"
                  onClick={() => saveConsent(preferences)}
                  className="flex-1"
                >
                  Save Preferences
                </Button>
                <Button
                  variant="success"
                  onClick={handleAcceptAll}
                  className="flex-1"
                >
                  Accept All
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
