// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// Each field type's icon, so the Add field list reads at a glance rather than
// as a column of words. Every type needs one: a new FieldType doesn't build
// until it's here.

import type { FieldType } from "@prisma/client";
import {
  AlignLeft,
  Cake,
  Calendar,
  CircleDot,
  Globe,
  Hash,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  SquareCheck,
  TextCursorInput,
  User,
  type LucideIcon,
} from "lucide-react";

export const FIELD_TYPE_ICONS: Record<FieldType, LucideIcon> = {
  NAME: User,
  EMAIL: Mail,
  PHONE: Phone,
  WEBSITE: Globe,
  ADDRESS: MapPin,
  DATE_OF_BIRTH: Cake,
  DATE: Calendar,
  NUMBER: Hash,
  TEXT: TextCursorInput,
  TEXTAREA: AlignLeft,
  APPROVAL: SquareCheck,
  CHOOSE_ONE: CircleDot,
  CHOOSE_SEVERAL: ListChecks,
};
