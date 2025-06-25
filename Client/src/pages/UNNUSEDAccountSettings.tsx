import React, { useState } from "react";
import { User } from "../types/index.ts";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Upload,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

interface AccountSettingsProps {
  user?: User;
  expanded?: boolean;
}

export default function AccountSettings({
  user,
  expanded = false,
}: AccountSettingsProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    agencyName: user?.agencyName || "",
    profilePicture: user?.profilePicture || null,
  });

  const [notifications, setNotifications] = useState({
    emailReports: true,
    emailMarketing: false,
    pushNotifications: true,
    smsNotifications: false,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  });

  const [apiToken] = useState("pk_live_51234567890abcdef...");
  const [showApiToken, setShowApiToken] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurity((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file here
      console.log("Uploading file:", file);
    }
  };

  const copyApiToken = () => {
    navigator.clipboard.writeText(apiToken);
  };

  const regenerateApiToken = () => {
    // In a real app, you would regenerate the API token here
    console.log("Regenerating API token...");
  };

  return (
    <div
      className={`
        w-full min-h-screen p-6 transition-all duration-300
        ${expanded ? "ml-64" : "ml-16"}
      `}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-navy mb-2">Account Settings</h1>
        <p className="text-navy/60">
          Manage your profile, preferences, and security settings
        </p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <h2 className="text-xl font-medium text-navy mb-6">
          Profile Information
        </h2>

        {/* Profile Picture */}
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mr-4">
            <span className="text-navy font-semibold text-xl">
              {formData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <div className="relative">
              <button
                type="button"
                className="btn-secondary flex items-center"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-navy/60 mt-1">JPG, PNG up to 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="Your phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Agency Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="text"
                name="agencyName"
                value={formData.agencyName}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="Your real estate agency"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="text-xl font-medium text-navy mb-6">
          Notification Preferences
        </h2>

        <div className="space-y-4">
          {[
            {
              key: "emailReports",
              title: "Report Completion",
              description: "Get notified when your property reports are ready",
            },
            {
              key: "emailMarketing",
              title: "Marketing Updates",
              description: "Receive product updates and feature announcements",
            },
            {
              key: "pushNotifications",
              title: "Push Notifications",
              description: "Browser notifications for important updates",
            },
            {
              key: "smsNotifications",
              title: "SMS Notifications",
              description: "Text message alerts for urgent notifications",
            },
          ].map((notification) => (
            <div
              key={notification.key}
              className="flex items-center justify-between py-3"
            >
              <div>
                <h3 className="font-medium text-navy">{notification.title}</h3>
                <p className="text-sm text-navy/60">
                  {notification.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    notifications[
                      notification.key as keyof typeof notifications
                    ]
                  }
                  onChange={(e) =>
                    handleNotificationChange(notification.key, e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-beige peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h2 className="text-xl font-medium text-navy mb-6">Security</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-navy mb-4">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={security.showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={security.currentPassword}
                    onChange={handleSecurityChange}
                    className="input-field pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSecurity((prev) => ({
                        ...prev,
                        showCurrentPassword: !prev.showCurrentPassword,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {security.showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-navy/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-navy/40" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={security.showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={security.newPassword}
                    onChange={handleSecurityChange}
                    className="input-field pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSecurity((prev) => ({
                        ...prev,
                        showNewPassword: !prev.showNewPassword,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {security.showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-navy/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-navy/40" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={security.showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={security.confirmPassword}
                    onChange={handleSecurityChange}
                    className="input-field pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSecurity((prev) => ({
                        ...prev,
                        showConfirmPassword: !prev.showConfirmPassword,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {security.showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-navy/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-navy/40" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* API Token */}
          <div>
            <h3 className="font-medium text-navy mb-4">API Access</h3>
            <div className="bg-beige/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-navy">
                  API Token
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowApiToken(!showApiToken)}
                    className="text-navy/60 hover:text-navy"
                  >
                    {showApiToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={copyApiToken}
                    className="text-gold hover:text-gold-light text-sm font-medium"
                  >
                    Copy
                  </button>
                  <button
                    onClick={regenerateApiToken}
                    className="text-navy hover:text-navy-light text-sm font-medium"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div className="font-mono text-sm text-navy/80 bg-white p-3 rounded border">
                {showApiToken ? apiToken : "••••••••••••••••••••••••••••••••"}
              </div>
              <p className="text-xs text-navy/60 mt-2">
                Keep your API token secure. It provides access to your account
                and data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="shimmer w-4 h-4 rounded mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
