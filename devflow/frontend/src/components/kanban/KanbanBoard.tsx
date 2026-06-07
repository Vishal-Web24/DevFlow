import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateTask, moveTaskOptimistic, setSelectedTask } from '../../store/slices/taskSlice';
import { Task, TaskStatus, Priority } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'border-gray-400',   bg: 'bg-gray-50 dark:bg-gray-900/50' },
  { id: 'IN_PROGRESS', label: 'In Progress',  color: 'border-blue-500',   bg: 'bg-blue-50/30 dark:bg-blue-900/10' },
  { id: 'IN_REVIEW',   label: 'In Review',   color: 'border-yellow-500', bg: 'bg-yellow-50/30 dark:bg-yellow-900/10' },
  { id: 'DONE',        label: 'Done',        color: 'border-green-500',  bg: 'bg-green-50/30 dark:bg-green-900/10' },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  MEDIUM:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface Props { projectId: string; }

export default function KanbanBoard({ projectId }: Props) {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(s => s.tasks.items);

  const tasksByStatus = (status: TaskStatus) =>
    [...tasks]
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const newStatus = destination.droppableId as TaskStatus;

    dispatch(moveTaskOptimistic({
      taskId: draggableId,
      status: newStatus,
      position: destination.index,
    }));

    try {
      await dispatch(updateTask({
        taskId: draggableId,
        projectId,
        status: newStatus,
        position: destination.index,
      }) as any);
    } catch {
      toast.error('Failed to move task');
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto px-6 pb-6 pt-2">
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus(col.id);
          return (
            <div key={col.id} className={`flex-shrink-0 w-72 flex flex-col rounded-xl border-t-4 ${col.color} ${col.bg} border border-gray-200 dark:border-gray-800`}>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto transition-colors rounded-b-xl
                      ${snapshot.isDraggingOver ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                    {colTasks.map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const dispatch = useAppDispatch();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => {
            if (!snapshot.isDragging) {
              dispatch(setSelectedTask(task));
            }
          }}
          className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border transition-all cursor-pointer
            border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800
            hover:shadow-md group
            ${snapshot.isDragging ? 'shadow-lg rotate-1 border-primary-300 dark:border-primary-700' : ''}`}>

          {task.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map(label => (
                <span key={label} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{label}</span>
              ))}
            </div>
          )}

          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between mt-2.5 gap-2">
            <span className={`badge text-xs ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
            <div className="flex items-center gap-1.5">
              {task.storyPoints && (
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{task.storyPoints}pt</span>
              )}
              {task.dueDate && (
                <span className={`text-xs ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  📅 {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
              {task.comments?.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">💬 {task.comments.length}</span>
              )}
              {task.assignee && (
                <img
                  src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=24&background=3B82F6&color=fff`}
                  className="w-5 h-5 rounded-full"
                  alt={task.assignee.name}
                  title={task.assignee.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}