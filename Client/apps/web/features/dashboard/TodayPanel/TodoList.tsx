import React, { useState, useMemo } from "react";
import { Check, Plus } from "lucide-react";
import Card from "../../../components/layout/Card";
import Button from "../../../components/ui/button/Button";
import Dropdown from "../../../components/ui/form/Dropdown";
import type {
  TodoItem,
  TodoPriority,
  TodoType,
} from "../../../../../packages/schemas/agent";

type TodoListProps = {
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  onAddTodo: (title: string, priority: TodoPriority, type: TodoType) => void;
  onUpdatePriority?: (id: string, priority: TodoPriority) => void;
};

const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggleComplete,
  onAddTodo,
  onUpdatePriority,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedPriority, setSelectedPriority] =
    useState<TodoPriority>("medium");

  const priorityOrder: Record<TodoPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-responsive-sm text-navy">Today's To-Do</h2>
      </div>

      {/* Todo List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sortedTodos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-responsive-sm text-black/60">
              No todos for today
            </p>
          </div>
        ) : (
          sortedTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-beige/30 bg-white hover:bg-beige/5 transition-colors"
            >
              <button
                onClick={() => onToggleComplete(todo.id)}
                className={`flex-shrink-0 mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? "bg-olive border-olive text-white"
                    : "border-beige/50 hover:border-gold"
                }`}
              >
                {todo.completed && <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-responsive-sm ${
                    todo.completed ? "line-through text-black/40" : "text-black"
                  }`}
                >
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {onUpdatePriority && !todo.completed ? (
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
                    <span
                      className={`text-xs font-medium ${priorityColors[todo.priority]}`}
                    >
                      {todo.priority}
                    </span>
                  )}
                  <span className="text-xs text-black/40">
                    {new Date(todo.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Todo Form */}
      {showAddForm ? (
        <div className="mt-4 p-3 rounded-lg border border-beige/30 bg-beige/5">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Enter todo..."
            className="w-full text-responsive-sm border border-beige/30 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-olive/20 mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTodo();
              } else if (e.key === "Escape") {
                setShowAddForm(false);
                setNewTodoTitle("");
                setSelectedPriority("medium");
              }
            }}
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
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddTodo}
              className="flex-1"
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setNewTodoTitle("");
                setSelectedPriority("medium");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddForm(true)}
          className="w-full mt-4"
        >
          Add Todo
        </Button>
      )}
    </Card>
  );
};

export default TodoList;
