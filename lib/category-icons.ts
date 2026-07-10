import {
  BookOpen,
  CircleHelp,
  Compass,
  FileText,
  Heart,
  Landmark,
  Library,
  Microscope,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon } from "@/types/content";

export const categoryIconMap = {
  scripture: BookOpen,
  jesus: Heart,
  preservation: ShieldCheck,
  questions: CircleHelp,
  science: Microscope,
  history: Landmark,
  theology: Scale,
  salvation: Compass,
  prophecies: Sparkles,
  glossary: FileText,
  sources: Library,
  warAndViolence: Swords,
  women: Users,
} satisfies Record<CategoryIcon, LucideIcon>;

export const fallbackCategoryIcon = ScrollText;
