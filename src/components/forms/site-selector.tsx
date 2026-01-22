"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moveFormToSite } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

type SiteSelectorProps = {
  formId: string;
  currentSiteId: string;
};

export function SiteSelector({ formId, currentSiteId }: SiteSelectorProps) {
  const { toast } = useToast();
  const [siteId, setSiteId] = useState(currentSiteId);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch user's sites
    async function fetchSites() {
      try {
        const response = await fetch("/api/user/sites");
        if (response.ok) {
          const data = await response.json();
          setSites(data.sites || []);
        }
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      }
    }
    fetchSites();
  }, []);

  const handleChange = async (newSiteId: string) => {
    if (newSiteId === siteId) return;

    setIsLoading(true);
    try {
      await moveFormToSite(formId, newSiteId);
      setSiteId(newSiteId);
      toast.success("Form moved to selected site");
    } catch (error) {
      console.error("Failed to move form:", error);
      toast.error("Failed to move form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sites.length === 0) {
    return <span className="text-sm text-muted-foreground">Loading sites...</span>;
  }

  return (
    <Select value={siteId} onValueChange={handleChange} disabled={isLoading}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sites.map((site) => (
          <SelectItem key={site.id} value={site.id}>
            {site.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
