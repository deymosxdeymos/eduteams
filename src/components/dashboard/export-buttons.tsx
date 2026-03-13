"use client";

import { FileText, Share, Table } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExportButtonsProps {
  assignmentId: string;
  hasTeams: boolean;
  canManage: boolean;
}

export function ExportButtons({ assignmentId, hasTeams, canManage }: ExportButtonsProps) {
  const t = useTranslations("dashboard.assignment.export");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [open, setOpen] = useState(false);

  // Only render if user can manage and teams exist
  if (!canManage || !hasTeams) {
    return null;
  }

  const handleExport = async (format: "pdf" | "csv") => {
    const setLoading = format === "pdf" ? setExportingPdf : setExportingCsv;
    setLoading(true);
    setOpen(false); // Close popover when export starts

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/export/${format}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || t("errorFailed", { format: format.toUpperCase() }));
        return;
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `team-formation-${new Date().toISOString().split("T")[0]}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Success - file downloaded (no alert needed as download is obvious)
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  const isExporting = exportingPdf || exportingCsv;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border border-gray-600 h-12 w-12"
          disabled={isExporting}
          title={isExporting ? t("exporting") : t("export") || "Export"}
        >
          <Share className="w-4 h-4 text-gray-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-left font-normal"
            disabled={exportingPdf}
            onClick={() => handleExport("pdf")}
          >
            <FileText className="w-4 h-4 mr-2" />
            <span>{exportingPdf ? t("exporting") : t("exportPdf")}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left font-normal"
            disabled={exportingCsv}
            onClick={() => handleExport("csv")}
          >
            <Table className="w-4 h-4 mr-2" />
            <span>{exportingCsv ? t("exporting") : t("exportCsv")}</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
