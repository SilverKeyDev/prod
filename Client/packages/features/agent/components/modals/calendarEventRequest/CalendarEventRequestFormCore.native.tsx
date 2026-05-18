import React from "react";

import { StyleSheet, TextInput } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { CALENDAR_EVENT_KINDS, type CalendarEventKindId } from "packages/features/calendar";
import { Button, Dropdown } from "packages/ui";
import { Box, ScrollView, Text, TouchableBox } from "packages/ui/components/primitives";

import {
  useCalendarEventRequestForm,
  type UseCalendarEventRequestFormParams,
} from "@/features/agent/hooks/data/calendar/useCalendarEventRequestForm";
import { ViewingRoutePlanEditor } from "@/features/calendar/components/viewings/ViewingRoutePlanEditor";

import { EventRequestDateDropdown } from "./EventRequestDateDropdown.native";
import { EventRequestTimeDropdown } from "./EventRequestTimeDropdown.native";

export type CalendarEventRequestFormCoreProps = UseCalendarEventRequestFormParams;

export function CalendarEventRequestFormCore(props: CalendarEventRequestFormCoreProps) {
  const { t } = useLocalization();
  const {
    isAgent,
    clients,
    isLoadingClients,
    selectedClientId,
    setSelectedClientId,
    eventKindId,
    onEventKindIdChange,
    kindOptionSlice,
    checklistProgressLoading,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    isSending,
    canSend,
    minDate,
    handleSend,
    isPropertyViewing,
    viewingStops,
    setViewingStops,
    viewingStartSelection,
    setViewingStartSelection,
    viewingEndMode,
    setViewingEndMode,
    viewingEndFixed,
    setViewingEndFixed,
    viewingTourAnchors,
    eventRequestDateOptions,
    eventRequestTimeOptions,
  } = useCalendarEventRequestForm(props);

  const { onClose } = props;
  const showCustomTitle = eventKindId === "other";

  const kindDropdownOptions = kindOptionSlice.allowedKindIds.map((id) => ({
    value: id,
    label: CALENDAR_EVENT_KINDS[id].label,
    icon: (
      <Box
        className="mt-0.5 h-3 w-3 rounded-sm"
        style={{
          backgroundColor: color(CALENDAR_EVENT_KINDS[id].uiColorPath),
        }}
      />
    ),
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
    >
      {isAgent && (
        <Box className="mb-3">
          <Text className="text-text-secondary mb-1 text-sm font-medium">Send to client</Text>
          {isLoadingClients ? (
            <Text className="text-text-secondary text-sm">Loading clients...</Text>
          ) : clients.length === 0 ? (
            <Text className="text-text-secondary text-sm">No clients available.</Text>
          ) : (
            <Box className="mt-1 max-h-48">
              {clients.map((client) => {
                const selected = selectedClientId === client.id;
                return (
                  <TouchableBox
                    key={client.id}
                    onPress={() => setSelectedClientId(client.id)}
                    style={[styles.clientRow, selected && styles.clientRowSelected]}
                    label={client.name ?? client.email ?? client.id}
                    interactionStyles={{ base: "" }}
                  >
                    <Text
                      className={
                        selected
                          ? "text-base font-medium text-white"
                          : "text-text-primary text-base"
                      }
                    >
                      {client.name}
                    </Text>
                    {client.email ? (
                      <Text
                        className={
                          selected
                            ? "mt-0.5 text-sm text-white/90"
                            : "text-text-secondary mt-0.5 text-sm"
                        }
                      >
                        {client.email}
                      </Text>
                    ) : null}
                  </TouchableBox>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      <Dropdown<CalendarEventKindId>
        label="Event type"
        options={kindDropdownOptions}
        value={eventKindId}
        onChange={onEventKindIdChange}
        disabled={checklistProgressLoading}
        variant="mobile"
      />

      {showCustomTitle ? (
        <>
          <Text className="text-text-secondary mb-1 text-sm font-medium">Event title</Text>
          <TextInput
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder="e.g., Meet lender, Contractor walkthrough"
            placeholderTextColor={color("neutral.400")}
            style={styles.input}
          />
        </>
      ) : null}

      <Box className="mt-3 flex-row gap-3">
        <Box className="min-w-0 flex-1">
          <EventRequestDateDropdown
            minDate={minDate}
            value={eventDate}
            onChange={setEventDate}
            options={eventRequestDateOptions}
          />
        </Box>
        <Box className="min-w-0 flex-1">
          <EventRequestTimeDropdown
            value={eventTime}
            onChange={setEventTime}
            options={eventRequestTimeOptions}
          />
        </Box>
      </Box>

      {isPropertyViewing ? (
        <ViewingRoutePlanEditor
          viewingStops={viewingStops}
          onViewingStopsChange={setViewingStops}
          startSelection={viewingStartSelection}
          onStartSelectionChange={setViewingStartSelection}
          endMode={viewingEndMode}
          onEndModeChange={setViewingEndMode}
          endFixed={viewingEndFixed}
          onEndFixedChange={setViewingEndFixed}
          savedAnchors={viewingTourAnchors}
          scriptsReady={false}
          loadError={null}
        />
      ) : (
        <>
          <Text className="text-text-secondary mb-1 mt-3 text-sm font-medium">
            Location (optional)
          </Text>
          <TextInput
            value={eventLocation}
            onChangeText={setEventLocation}
            placeholder="e.g., 123 Main St or Zoom link"
            placeholderTextColor={color("neutral.400")}
            style={styles.input}
          />
        </>
      )}

      <Text className="text-text-secondary mb-1 mt-3 text-sm font-medium">
        Description (optional)
      </Text>
      <TextInput
        value={eventDescription}
        onChangeText={setEventDescription}
        placeholder="Event details (optional)"
        placeholderTextColor={color("neutral.400")}
        style={[styles.input, styles.textArea]}
        multiline
        textAlignVertical="top"
      />

      <Box className="mt-4 flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onPress={onClose}
          disabled={isSending}
          iconName="arrow-left"
        >
          {t("common.cancel")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onPress={() => void handleSend()}
          disabled={!canSend || isSending}
          iconName="send"
        >
          {isSending ? t("agent.sending") : t("agent.send_request")}
        </Button>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: "100%" },
  form: {
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: color("neutral.50"),
  },
  textArea: {
    minHeight: 80,
  },
  clientRow: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: color("neutral.50"),
  },
  clientRowSelected: {
    backgroundColor: color("brand.accent"),
    borderColor: color("brand.accent"),
  },
});
