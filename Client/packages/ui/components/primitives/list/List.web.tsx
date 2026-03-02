import React from "react";

import { ScrollView } from "@ui/primitives/scroll";

export type ListProps<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  style?: React.CSSProperties;
  className?: string;
  horizontal?: boolean;
};

function List<T>({ data, renderItem, keyExtractor, style, className, horizontal }: ListProps<T>) {
  return (
    <ScrollView style={style} className={className} horizontal={horizontal}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem({ item, index })}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

export default List;
