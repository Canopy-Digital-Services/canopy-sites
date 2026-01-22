type SettingsSectionProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
};

export function SettingsSection({
  label,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">{label}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
