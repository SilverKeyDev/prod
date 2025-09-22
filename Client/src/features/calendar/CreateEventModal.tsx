import { X } from "lucide-react";
import React from "react";

import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/form/Input";
import type { GoogleEvent } from "../../core/config/api";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: GoogleEvent) => void;
  isLoading: boolean;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = React.useState({
    summary: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.summary || !formData.startDateTime || !formData.endDateTime) {
      return;
    }

    const event: GoogleEvent = {
      summary: formData.summary,
      description: formData.description || undefined,
      start: { dateTime: formData.startDateTime },
      end: { dateTime: formData.endDateTime },
      location: formData.location || undefined,
    };

    onSubmit(event);
  };

  const handleClose = () => {
    setFormData({
      summary: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      location: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Create New Event
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-responsive-sm">
          <Input
            label="Event Title"
            placeholder="Enter event title"
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            required
          />

          <div>
            <label className="block text-responsive-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown transition-colors text-responsive-sm"
              rows={3}
              placeholder="Enter event description"
            />
          </div>

          <Input
            label="Start Time"
            type="datetime-local"
            value={formData.startDateTime}
            onChange={(e) =>
              setFormData({ ...formData, startDateTime: e.target.value })
            }
            required
          />

          <Input
            label="End Time"
            type="datetime-local"
            value={formData.endDateTime}
            onChange={(e) =>
              setFormData({ ...formData, endDateTime: e.target.value })
            }
            required
          />

          <Input
            label="Location"
            placeholder="Enter event location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />

          <div className="flex space-x-responsive-sm pt-4">
            <Button
              type="submit"
              variant="olive"
              fullWidth
              loading={isLoading}
              disabled={
                isLoading ||
                !formData.summary ||
                !formData.startDateTime ||
                !formData.endDateTime
              }
            >
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
