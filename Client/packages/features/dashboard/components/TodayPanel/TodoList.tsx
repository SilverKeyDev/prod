import React, { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import Dropdown from "packages/ui/components/form/Dropdown";
import { dateParseISO } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, CancelButton, Input, Title } from "@/components/ui";
import type { TodoItem, TodoPriority, TodoType } from "@/features/agent/types/agent";
type TodoListProps = {
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  onAddTodo: (title: string, priority: TodoPriority, type: TodoType) => void;
  onUpdatePriority?: (id: string, priority: TodoPriority) => void;
  canEdit?: boolean;
};
const priorityOrder: Record<TodoPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};
const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggleComplete,
  onAddTodo,
  onUpdatePriority,
  canEdit = true,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>("medium");
  const sortedTodos = useMemo(() => {
    const incomplete = todos.filter((todo) => !todo.completed);
    return [...incomplete].sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [todos]);
  const handleAddTodo = () => {
    if (newTodoTitle.trim()) {
      onAddTodo(newTodoTitle.trim(), selectedPriority, "manual");
      setNewTodoTitle("");
      setSelectedPriority("medium");
      setShowAddForm(false);
    }
  };
  const priorityColors: Record<TodoPriority, string> = {
    low: "text-neutral-600",
    medium: "text-gold",
    high: "text-olive",
    urgent: "text-rose-600",
  };
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <Title as="h2" size="sm" className="text-navy">
          Today's To-Do
        </Title>
      </div>

      {/* Todo List */}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {sortedTodos.length === 0 ? (
          <div className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-black/60">
              No todos for today
            </BodyText>
          </div>
        ) : (
          sortedTodos.map((todo) => (
            <div
              key={todo.id}
              className="border-beige/30 hover:bg-beige/5 flex items-start gap-3 rounded-lg border bg-white p-3 transition-colors"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (canEdit ? onToggleComplete(todo.id) : undefined)}
                disabled={!canEdit}
                className={`mt-0.5 flex h-5 w-5 min-w-0 flex-shrink-0 items-center justify-center rounded border-2 p-0 transition-colors sm:h-6 sm:w-6 ${
                  todo.completed
                    ? "bg-olive border-olive text-white"
                    : canEdit
                      ? "border-beige/50 hover:border-gold"
                      : "border-beige/50"
                }`}
              >
                {todo.completed && <Icon name="check" className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
              <div className="min-w-0 flex-1">
                <BodyText
                  as="p"
                  size="sm"
                  className={`${todo.completed ? "text-black/40 line-through" : "text-black"}`}
                >
                  {todo.title}
                </BodyText>
                <div className="mt-1 flex items-center gap-2">
                  {canEdit && onUpdatePriority && !todo.completed ? (
                    <div className="w-24">
                      <Dropdown<TodoPriority>
                        options={[
                          { value: "low", label: "Low" },
                          { value: "medium", label: "Medium" },
                          { value: "high", label: "High" },
                          { value: "urgent", label: "Urgent" },
                        ]}
                        value={todo.priority}
                        onChange={(value) => onUpdatePriority(todo.id, value)}
                        variant="compact"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <BodyText
                      as="span"
                      size="xs"
                      className={`font-medium ${priorityColors[todo.priority]}`}
                    >
                      {todo.priority}
                    </BodyText>
                  )}
                  <BodyText as="span" size="xs" className="text-black/40">
                    {dateParseISO(todo.due_date).toDate().toLocaleDateString()}
                  </BodyText>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Todo Form */}
      {!canEdit ? null : showAddForm ? (
        <div className="border-beige/30 bg-beige/5 mt-4 rounded-lg border p-3">
          <Input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Enter todo..."
            className="text-responsive-sm border-beige/30 focus:ring-olive/20 mb-2 w-full rounded-lg border bg-white px-3 py-2 focus:outline-none focus:ring-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTodo();
              } else if (e.key === "Escape") {
                setShowAddForm(false);
                setNewTodoTitle("");
                setSelectedPriority("medium");
              }
            }}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- Focus for quick add when panel opens
            autoFocus
          />
          <div className="mb-2">
            <Dropdown<TodoPriority>
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              value={selectedPriority}
              onChange={(value) => setSelectedPriority(value)}
              placeholder="Select priority"
              variant="compact"
              size="sm"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleAddTodo} className="flex-1">
              Add
            </Button>
            <CancelButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setNewTodoTitle("");
                setSelectedPriority("medium");
              }}
            >
              Cancel
            </CancelButton>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          iconName="plus"
          onClick={() => setShowAddForm(true)}
          className="mt-4 w-full"
        >
          Add Todo
        </Button>
      )}
    </Card>
  );
};
export default TodoList;
