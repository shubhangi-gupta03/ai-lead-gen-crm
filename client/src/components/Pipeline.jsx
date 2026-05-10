import { useMemo } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import { useLeadStore } from "../store/leadStore";
import LeadCard from "./LeadCard";

const columns = [
  { id: "new", title: "New", color: "border-blue-400/40 bg-blue-500/10 text-blue-200" },
  {
    id: "contacted",
    title: "Contacted",
    color: "border-yellow-400/40 bg-yellow-500/10 text-yellow-200"
  },
  {
    id: "qualified",
    title: "Qualified",
    color: "border-purple-400/40 bg-purple-500/10 text-purple-200"
  },
  { id: "closed", title: "Closed", color: "border-green-400/40 bg-green-500/10 text-green-200" }
];

const matchSearch = (lead, search) => {
  if (!search) return true;
  const q = search.toLowerCase();
  return [lead.name, lead.company, lead.role].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(q)
  );
};

const matchFilter = (lead, filters) => {
  const { industry, stage, buyingIntent, companySize } = filters;
  const leadIntent = lead.enrichment?.buyingIntent || "";
  const leadCompanySize = lead.enrichment?.companySize || "";

  return (
    (!industry || lead.industry === industry) &&
    (!stage || lead.stage === stage) &&
    (!buyingIntent || leadIntent === buyingIntent) &&
    (!companySize || leadCompanySize === companySize)
  );
};

export default function Pipeline() {
  const allLeads = useLeadStore((s) => s.leads);
  const search = useLeadStore((s) => s.search);
  const filters = useLeadStore((s) => s.filters);
  const moveLead = useLeadStore((s) => s.moveLead);
  const enrichLead = useLeadStore((s) => s.enrichLead);
  const summarizeLead = useLeadStore((s) => s.summarizeLead);
  const generateEmail = useLeadStore((s) => s.generateEmail);
  const removeLead = useLeadStore((s) => s.removeLead);

  const leads = useMemo(
    () => allLeads.filter((lead) => matchSearch(lead, search) && matchFilter(lead, filters)),
    [allLeads, search, filters]
  );

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const nextStage = result.destination.droppableId;
    moveLead(leadId, nextStage);
  };

  if (!leads.length) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-600 bg-slate-800/60 p-10 text-center">
        <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-200">No leads yet</h3>
        <p className="mt-1 text-sm text-slate-400">
          Import a CSV or add leads manually to start your pipeline.
        </p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {columns.map((col) => {
          const stageLeads = leads.filter((lead) => lead.stage === col.id);

          return (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <section
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[420px] rounded-xl border p-3 transition ${col.color} ${
                    snapshot.isDraggingOver ? "ring-2 ring-indigo-400/50" : ""
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{col.title}</h3>
                    <span className="rounded-full bg-slate-900/40 px-2 py-0.5 text-xs text-slate-100">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence>
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <LeadCard
                                lead={lead}
                                onEnrich={() => enrichLead(lead.id)}
                                onSummary={() => summarizeLead(lead.id)}
                                onEmail={() => generateEmail(lead.id)}
                                onDelete={() => removeLead(lead.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                </section>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
