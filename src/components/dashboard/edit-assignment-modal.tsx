"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputRounded } from "@/components/ui/input-rounded";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MultiSelectComboboxBadges } from "@/components/ui/multi-select-combobox-badges";
import { Textarea } from "@/components/ui/textarea";
import type { EditImpact } from "@/lib/utils/assignment-change-detection";
import type { ManageAssignmentRow } from "@/types/manage";
import { AssignmentEditConfirmationDialog } from "./assignment-edit-confirmation-dialog";

interface EditAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: ManageAssignmentRow;
  courseId: string;
  onUpdatedAction?: (
    assignment: Pick<ManageAssignmentRow, "id"> & Partial<ManageAssignmentRow>,
  ) => void;
}

function parseDescriptionJSON(description: string | null) {
  if (!description) {
    return { text: "", skills: [], topics: [] };
  }

  try {
    const parsed = JSON.parse(description);
    return {
      text: parsed.text || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch {
    return { text: description, skills: [], topics: [] };
  }
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function EditAssignmentModalBody({
  open,
  onOpenChange,
  assignment,
  courseId,
  onUpdatedAction,
}: EditAssignmentModalProps) {
  const t = useTranslations("dashboard.assignments.edit");
  const parsedAssignmentDescription = parseDescriptionJSON(assignment.description);
  const [title, setTitle] = useState(() => assignment.title);
  const [description, setDescription] = useState(() => parsedAssignmentDescription.text);
  const [skills, setSkills] = useState<string[]>(() => parsedAssignmentDescription.skills);
  const [topics, setTopics] = useState<string[]>(() => parsedAssignmentDescription.topics);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editImpact, setEditImpact] = useState<EditImpact | null>(null);

  const isFormValid = Boolean(title.trim()) && skills.length > 0;
  const hasUnsavedChanges =
    title !== assignment.title ||
    description !== parsedAssignmentDescription.text ||
    !areStringArraysEqual(skills, parsedAssignmentDescription.skills) ||
    !areStringArraysEqual(topics, parsedAssignmentDescription.topics);

  const handleClose = (newOpen: boolean) => {
    if (newOpen) {
      onOpenChange(true);
      return;
    }

    if (hasUnsavedChanges && !submitting) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?",
      );
      if (!confirmClose) {
        return;
      }
    }

    onOpenChange(false);
  };

  const performUpdate = async (confirmDestructive: boolean) => {
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          skills,
          topics,
          confirmDestructiveChanges: confirmDestructive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || t("error"));
      }
      onUpdatedAction?.({
        id: assignment.id,
        title: data.data?.title ?? title.trim(),
        description: data.data?.description === undefined ? null : data.data.description,
        status: data.data?.status,
        startAt: data.data?.startAt ?? assignment.startAt,
        submissionsCount: data.data?.submissionsCount,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const impactRes = await fetch(`/api/assignments/${assignment.id}/check-edit-impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          topics,
        }),
      });

      const impactData = await impactRes.json();
      if (!impactRes.ok || !impactData?.success) {
        throw new Error(impactData?.error || t("error"));
      }

      const impact = impactData.data as EditImpact;
      setEditImpact(impact);

      if (impact.tier === 1) {
        await performUpdate(false);
        return;
      }

      setShowConfirmation(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
      setSubmitting(false);
    }
  };

  const handleConfirmEdit = async () => {
    if (!editImpact) {
      return;
    }

    await performUpdate(editImpact.tier === 3);
  };

  const handleCancelEdit = () => {
    setShowConfirmation(false);
    setEditImpact(null);
    setSubmitting(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">{t("title")}</DialogTitle>
            <DialogDescription className="text-base font-normal">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-base mb-2">{t("titleField")}</h3>
                  <InputRounded
                    className="w-full"
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <h3 className="font-medium text-base mb-2">
                    {t("descriptionField")} <span className="font-light">({t("optional")})</span>
                  </h3>
                  <Textarea
                    className="bg-neutral-50 w-full h-32 resize-none"
                    placeholder={t("descriptionPlaceholder")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-base mb-2">{t("skills")}</h3>
                  <MultiSelectComboboxBadges
                    value={skills}
                    onChange={setSkills}
                    placeholder={t("skillsPlaceholder")}
                    suggestionsEndpoint={`/api/courses/${courseId}/skills`}
                    emptyLabel={t("skillsEmptyLabel")}
                    createLabel={(query) => t("skillsCreateLabel", { query })}
                    showCombobox
                  />
                </div>

                <div>
                  <h3 className="font-medium text-base mb-2">
                    {t("topics")} <span className="font-light">({t("optional")})</span>
                  </h3>
                  <MultiSelectComboboxBadges
                    value={topics}
                    onChange={setTopics}
                    placeholder={t("topicsPlaceholder")}
                    emptyLabel={t("topicsEmptyLabel")}
                    createLabel={(query) => t("topicsCreateLabel", { query })}
                    showCombobox={false}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                className="rounded-md border border-red-200 bg-red-50 p-3 mb-4"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="onboarding"
              className="w-full py-6 rounded-4xl font-medium"
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Pencil strokeWidth={3} className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">{submitting ? t("saving") : t("save")}</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AssignmentEditConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        impact={editImpact}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />
    </>
  );
}

export function EditAssignmentModal(props: EditAssignmentModalProps) {
  if (!props.open) {
    return null;
  }

  return <EditAssignmentModalBody key={props.assignment.id} {...props} />;
}
