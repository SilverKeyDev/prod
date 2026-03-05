import React from "react";

import { StyleSheet, View } from "react-native";

import { Calendar } from "packages/features/calendar";

type ClientCalendarProps = {
  userId: string;
};

export default function ClientCalendar({ userId: _userId }: ClientCalendarProps) {
  return (
    <View style={styles.container}>
      <Calendar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
});
