"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SendEmailForm from "@/components/outreach/send-email-form";
import TemplateManager from "@/components/outreach/template-manager";
import OutreachHistory from "@/components/outreach/outreach-history";

export default function OutreachPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">開發信管理</h2>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>寄送開發信</TabsTrigger>
          <TabsTrigger value={1}>模板管理</TabsTrigger>
          <TabsTrigger value={2}>寄送紀錄</TabsTrigger>
        </TabsList>

        <TabsContent value={0}>
          <SendEmailForm />
        </TabsContent>
        <TabsContent value={1}>
          <TemplateManager />
        </TabsContent>
        <TabsContent value={2}>
          <OutreachHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
