import { CircleAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";

const AdminInfoHint = ({ text }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/40 transition hover:text-teal-200"
        aria-label={text}
      >
        <CircleAlert className="h-3.5 w-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" sideOffset={8} className="max-w-sm bg-white text-slate-900">
      {text}
    </TooltipContent>
  </Tooltip>
);

export default AdminInfoHint;
