import React, { useState } from "react";
import TodoList from "./TodoList";
import TodayCalendar from "./TodayCalendar";
import type {
  TodoItem,
  TodoPriority,
  TodoType,
} from "../../../../../packages/schemas/agent";

type TodayPanelProps = {
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onAddTodo: (title: string, priority: TodoPriority, type: TodoType) => void;
  onUpdatePriority?: (id: string, priority: TodoPriority) => void;
};

const TodayPanel: React.FC<TodayPanelProps> = ({
  todos,
  onToggleTodo,
  onAddTodo,
  onUpdatePriority,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* Todo List - Left */}
      <div className="md:col-span-1">
        <TodoList
          todos={todos}
          onToggleComplete={onToggleTodo}
          onAddTodo={onAddTodo}
          onUpdatePriority={onUpdatePriority}
        />
      </div>

      {/* Calendar - Right */}
      <div className="md:col-span-1">
        <TodayCalendar />
      </div>
    </div>
  );
};

export default TodayPanel;
