import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Music,
  BookOpen,
  Image,
  Video,
  Megaphone,
  Square,
  GripVertical,
  Plus,
  Play,
  Trash2,
  Clock,
  ChevronRight,
  Calendar,
  Loader2
} from 'lucide-react'
import { useServiceStore } from '../store/useServiceStore'
import { usePresentationStore } from '../store/usePresentationStore'
import { useAppStore } from '../store/useAppStore'
import Button from './ui/Button'
import type { ServiceItem, ServicePlan } from '../types'

// ─── Item type helpers ────────────────────────────────────────────────────────

const typeConfig = {
  song: { icon: <Music size={14} />, label: 'Song', color: 'text-violet-400', bg: 'bg-violet-900/20' },
  scripture: { icon: <BookOpen size={14} />, label: 'Scripture', color: 'text-blue-400', bg: 'bg-blue-900/20' },
  media: { icon: <Video size={14} />, label: 'Media', color: 'text-orange-400', bg: 'bg-orange-900/20' },
  announcement: { icon: <Megaphone size={14} />, label: 'Announcement', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  blank: { icon: <Square size={14} />, label: 'Blank', color: 'text-slate-400', bg: 'bg-slate-800' }
}

function itemTitle(item: ServiceItem): string {
  if (item.song) return item.song.title
  if (item.scripture) return item.scripture.reference
  if (item.mediaFile) return item.mediaFile.title
  if (item.announcementText) return item.announcementText.slice(0, 40)
  return item.type.charAt(0).toUpperCase() + item.type.slice(1)
}

function itemSubtitle(item: ServiceItem): string {
  if (item.song?.artist) return item.song.artist
  if (item.scripture) return item.scripture.version
  if (item.mediaFile) return item.mediaFile.type
  return ''
}

// ─── Sortable Item Row ────────────────────────────────────────────────────────

interface SortableItemProps {
  item: ServiceItem
  index: number
  isCurrent: boolean
  isLive: boolean
  onSelect: (index: number) => void
  onDelete: (id: string) => void
  planId: string
}

function SortableItemRow({
  item,
  index,
  isCurrent,
  isLive,
  onSelect,
  onDelete,
  planId
}: SortableItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const cfg = typeConfig[item.type] || typeConfig.blank

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(index)}
      className={[
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
        isCurrent && isLive
          ? 'bg-brand-600/20 border border-brand-600/40 shadow-sm shadow-brand-900/50'
          : 'hover:bg-slate-800 border border-transparent'
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        className="drag-handle text-slate-700 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </button>

      {/* Index */}
      <span className="text-slate-600 text-xs font-mono w-4 shrink-0 text-right">
        {index + 1}
      </span>

      {/* Type badge */}
      <span className={`shrink-0 ${cfg.bg} ${cfg.color} rounded-md p-1`}>
        {cfg.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${isCurrent && isLive ? 'text-brand-300' : 'text-slate-200'}`}
          >
            {itemTitle(item)}
          </span>
          {isCurrent && isLive && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-brand-400 bg-brand-900/40 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        {itemSubtitle(item) && (
          <p className="text-xs text-slate-500 truncate">{itemSubtitle(item)}</p>
        )}
      </div>

      {/* Duration */}
      {item.durationSecs && (
        <span className="text-xs text-slate-600 flex items-center gap-1 shrink-0">
          <Clock size={10} />
          {Math.round(item.durationSecs / 60)}m
        </span>
      )}

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(item.id)
        }}
        className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Service Planner ──────────────────────────────────────────────────────────

export default function ServicePlanner(): JSX.Element {
  const { plans, activePlan, isLoading, fetchPlans, loadPlan, reorderItems, removeItem, createPlan } =
    useServiceStore()
  const { isLive, currentItemIndex, currentServiceId, goLive, endService, goToItem } =
    usePresentationStore()
  const { addToast } = useAppStore()

  const [showPlanPicker, setShowPlanPicker] = useState(!activePlan)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleDragEnd = (event: DragEndEvent): void => {
    if (!activePlan) return
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = activePlan.items.findIndex((i) => i.id === active.id)
      const newIndex = activePlan.items.findIndex((i) => i.id === over?.id)
      const reordered = arrayMove(activePlan.items, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        order: idx
      }))
      reorderItems(activePlan.id, reordered)
    }
  }

  const handleSelectItem = async (index: number): Promise<void> => {
    if (!activePlan) return
    if (isLive) {
      await goToItem(index)
    }
  }

  const handleGoLive = async (): Promise<void> => {
    if (!activePlan) return
    await goLive(activePlan.id)
    addToast('Service is now live', 'success')
  }

  const handleEndService = async (): Promise<void> => {
    await endService()
    addToast('Service ended', 'info')
  }

  const handleDeleteItem = async (itemId: string): Promise<void> => {
    if (!activePlan) return
    await removeItem(activePlan.id, itemId)
  }

  const handleCreatePlan = async (): Promise<void> => {
    const title = `Service - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    const plan = await createPlan(title)
    await loadPlan(plan.id)
    setShowPlanPicker(false)
  }

  // ── Plan Picker ──
  if (!activePlan || showPlanPicker) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="font-semibold text-slate-100">Service Plans</h2>
          <Button variant="primary" size="sm" onClick={handleCreatePlan}>
            <Plus size={14} /> New Plan
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-500" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Calendar size={28} className="text-slate-500" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">No service plans yet</p>
              <p className="text-slate-500 text-sm mt-1">Create your first plan to get started</p>
            </div>
            <Button variant="primary" onClick={handleCreatePlan}>
              <Plus size={16} /> Create Service Plan
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => {
                  loadPlan(plan.id)
                  setShowPlanPicker(false)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Service Planner ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setShowPlanPicker(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-100 truncate">{activePlan.title}</h2>
          {activePlan.date && (
            <p className="text-xs text-slate-500">
              {new Date(activePlan.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && currentServiceId === activePlan.id ? (
            <Button variant="danger" size="sm" onClick={handleEndService}>
              End Service
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleGoLive}>
              <Play size={12} /> Go Live
            </Button>
          )}
        </div>
      </div>

      {/* Items list */}
      {activePlan.items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <p className="text-slate-500 text-sm">No items yet. Add songs, scripture, or media.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activePlan.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {activePlan.items.map((item, index) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    isCurrent={isLive && currentItemIndex === index && currentServiceId === activePlan.id}
                    isLive={isLive}
                    onSelect={handleSelectItem}
                    onDelete={handleDeleteItem}
                    planId={activePlan.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Footer: Add item */}
      <div className="shrink-0 border-t border-slate-800 px-4 py-3">
        <AddItemBar planId={activePlan.id} />
      </div>
    </div>
  )
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onSelect }: { plan: ServicePlan; onSelect: () => void }): JSX.Element {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-800/40 flex items-center justify-center shrink-0">
        <Calendar size={18} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-200 truncate">{plan.title}</p>
        <p className="text-xs text-slate-500">
          {plan.items?.length ?? 0} items
          {plan.date
            ? ` · ${new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : ''}
        </p>
      </div>
      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </button>
  )
}

// ─── Add Item Bar ─────────────────────────────────────────────────────────────

function AddItemBar({ planId }: { planId: string }): JSX.Element {
  const { addItem } = useServiceStore()
  const { setSection } = useAppStore()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 shrink-0">Add:</span>
      <button
        onClick={() => setSection('media')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 hover:bg-violet-900/20 px-2 py-1.5 rounded-lg transition-colors"
        title="Add Song"
      >
        <Music size={13} /> Song
      </button>
      <button
        onClick={() => setSection('scripture')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 px-2 py-1.5 rounded-lg transition-colors"
        title="Add Scripture"
      >
        <BookOpen size={13} /> Scripture
      </button>
      <button
        onClick={() => addItem(planId, 'announcement', undefined, 'New Announcement')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-400 hover:bg-yellow-900/20 px-2 py-1.5 rounded-lg transition-colors"
        title="Add Announcement"
      >
        <Megaphone size={13} /> Announcement
      </button>
      <button
        onClick={() => addItem(planId, 'blank')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800 px-2 py-1.5 rounded-lg transition-colors"
        title="Add Blank Slide"
      >
        <Square size={13} /> Blank
      </button>
    </div>
  )
}
