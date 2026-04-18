"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface HashtagConfigProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
}

export default function HashtagConfig({ hashtags, onChange }: HashtagConfigProps) {
  const [input, setInput] = useState("");

  function addHashtag() {
    const tag = input.trim();
    if (tag && !hashtags.includes(tag)) {
      onChange([...hashtags, tag]);
      setInput("");
    }
  }

  function removeHashtag(tag: string) {
    onChange(hashtags.filter((h) => h !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addHashtag();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1 text-sm">
            #{tag}
            <button
              onClick={() => removeHashtag(tag)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="新增 hashtag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-48"
        />
        <Button variant="outline" size="sm" onClick={addHashtag} disabled={!input.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          新增
        </Button>
      </div>
    </div>
  );
}
