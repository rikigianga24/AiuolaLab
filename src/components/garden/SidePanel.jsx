import AiAdvisor from "./AiAdvisor";
import BedInspector from "./BedInspector";
import IrrigationPanel from "./IrrigationPanel";
import PlantCatalog from "./PlantCatalog";
import ProjectPanel from "./ProjectPanel";
import { ENVIRONMENTS } from "../../lib/projects";

const TABS = [
  { id: "piante", label: "Piante", icon: "fa-seedling" },
  { id: "aiuola", label: "Aiuola", icon: "fa-vector-square" },
  { id: "ia", label: "Consigli IA", icon: "fa-wand-magic-sparkles" },
  { id: "irrigazione", label: "Irrigazione", icon: "fa-faucet-drip" },
  { id: "progetto", label: "Progetto", icon: "fa-folder-open" },
];

export default function SidePanel({ isMobile, open, onOpenChange, tab, onTabChange, environment, onEnvironmentChange, ...props }) {
  const expanded = !isMobile || open;

  const selectTab = (id) => {
    if (isMobile && id === tab) onOpenChange(!open);
    else {
      onTabChange(id);
      if (isMobile) onOpenChange(true);
    }
  };

  return (
    <aside className={`garden-panel ${isMobile ? "is-sheet" : ""} ${expanded ? "is-open" : ""}`} aria-label="Pannello">
      {isMobile && (
        <button className="sheet-handle" onClick={() => onOpenChange(!open)} aria-label={open ? "Chiudi pannello" : "Apri pannello"}>
          <span />
        </button>
      )}
      <div className="env-switch" role="radiogroup" aria-label="Ambiente">
        {Object.entries(ENVIRONMENTS).map(([k, v]) => (
          <button
            key={k}
            role="radio"
            aria-checked={environment === k}
            className={environment === k ? "is-active" : ""}
            onClick={() => onEnvironmentChange(k)}
          >
            <i className={`fa-solid ${v.icon}`} /> {v.label}
          </button>
        ))}
      </div>
      <nav className="gp-tabs" role="tablist">
        {TABS.map((t) => (t.id === "aiuola" && environment === "balcony" ? { ...t, label: "Vasi", icon: "fa-bucket" } : t)).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`gp-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => selectTab(t.id)}
          >
            <i className={`fa-solid ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="panel-body" hidden={!expanded}>
        {tab === "piante" && <PlantCatalog selectedBed={props.selectedBed} onPickPlant={props.onPickPlant} />}
        {tab === "aiuola" && (
          <BedInspector
            project={props.project}
            bed={props.selectedBed}
            selection={props.selection}
            onSelect={props.onSelect}
            onUpdate={props.onUpdateBed}
            onReplace={props.onReplaceBed}
            onDeletePlant={props.onDeleteSelection}
            onDeleteBed={props.onDeleteBed}
            onRemovePlants={props.onRemovePlants}
            onGoTo={onTabChange}
          />
        )}
        {tab === "ia" && (
          <AiAdvisor key={props.selectedBed?.id ?? "none"} bed={props.selectedBed} environment={environment} onUpdateBed={props.onUpdateBed} onApply={props.onApplySuggestion} />
        )}
        {tab === "irrigazione" && (
          <IrrigationPanel
            project={props.project}
            irrigation={props.irrigation}
            mode={props.mode}
            onStartFaucet={props.onStartFaucet}
            onRemoveFaucet={props.onRemoveFaucet}
            onSettings={props.onIrrigationSettings}
            showOnCanvas={props.showIrrigation}
            onToggleCanvas={props.onToggleIrrigation}
          />
        )}
        {tab === "progetto" && (
          <ProjectPanel
            project={props.project}
            onOpen={props.onOpenProject}
            onNew={props.onNewProject}
            onRename={props.onRenameProject}
            onSaved={props.onProjectSaved}
            notify={props.notify}
          />
        )}
      </div>
    </aside>
  );
}
