import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAgentClients } from "../../../packages/hooks/data/useAgentClients";
import { useAgentTodos } from "../../../packages/hooks/data/useAgentTodos";
import KeyTurnLoader from "../components/ui/loading/KeyTurnLoader";
import { Button } from "../components/ui";
import TodayPanel from "../features/dashboard/TodayPanel/TodayPanel";
import ClientList from "../features/dashboard/ClientList/ClientList";
import ClientHub from "../features/dashboard/ClientHub/ClientHub";
import { SettingsModal } from "../features/agent/modals";
import type { TodoPriority, TodoType } from "../../../packages/schemas/agent";

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, isLoading } = useAgentClients();
  const {
    todos,
    isLoading: isLoadingTodos,
    createTodo,
    updateTodo,
  } = useAgentTodos(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      await updateTodo(id, {
        completed: !todo.completed,
      });
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleAddTodo = async (
    title: string,
    priority: TodoPriority,
    type: TodoType
  ) => {
    try {
      // Set due date to end of today by default
      const dueDate = new Date();
      dueDate.setHours(23, 59, 59, 999);

      await createTodo({
        title,
        due_date: dueDate.toISOString(),
        priority,
        type,
      });
    } catch (error) {
      console.error("Failed to create todo:", error);
      // Show error to user (could add toast notification here)
    }
  };

  const handleUpdatePriority = async (id: string, priority: TodoPriority) => {
    try {
      await updateTodo(id, {
        priority,
      });
    } catch (error) {
      console.error("Failed to update todo priority:", error);
    }
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/dashboard/client/${clientId}`);
  };

  // Check if we're viewing a specific client
  const pathMatch = location.pathname.match(/^\/dashboard\/client\/(.+)$/);
  const clientIdFromPath = pathMatch ? pathMatch[1] : null;

  // Show content if we have data (cached or fresh), only show loader if no data exists AND is loading
  if (!clients.length && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <KeyTurnLoader message="Loading dashboard..." />
      </div>
    );
  }

  // Show Client Hub if client ID is in path
  if (clientIdFromPath) {
    return <ClientHub clientId={clientIdFromPath} />;
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        {/* Settings Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsSettingsModalOpen(true)}
            variant="outline"
            size="md"
            icon={<Settings className="h-4 w-4" />}
            iconPosition="left"
          >
            Settings
          </Button>
        </div>

        {/* Today Panel */}
        <TodayPanel
          todos={todos}
          onToggleTodo={handleToggleTodo}
          onAddTodo={handleAddTodo}
          onUpdatePriority={handleUpdatePriority}
        />

        {/* Client List */}
        <ClientList onClientClick={handleClientClick} />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}
