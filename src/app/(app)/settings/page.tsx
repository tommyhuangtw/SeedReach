import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
      <Settings className="h-12 w-12" />
      <p className="text-lg">設定功能開發中...</p>
    </div>
  );
}
