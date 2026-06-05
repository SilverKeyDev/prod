import React from "react";

import { FlatList, type FlatListProps } from "react-native";

export type ListProps<T> = FlatListProps<T> & { className?: string };

function List<T>({ data, renderItem, keyExtractor, className, style, ...props }: ListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      className={className}
      style={style}
      {...props}
    />
  );
}

export default List;
