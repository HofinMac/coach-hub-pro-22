import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import avatarA01 from "@/assets/avatars/avatar_a_01.png";
import avatarA02 from "@/assets/avatars/avatar_a_02.png";
import avatarA03 from "@/assets/avatars/avatar_a_03.png";
import avatarA04 from "@/assets/avatars/avatar_a_04.png";
import avatarA05 from "@/assets/avatars/avatar_a_05.png";
import avatarA06 from "@/assets/avatars/avatar_a_06.png";
import avatarA07 from "@/assets/avatars/avatar_a_07.png";
import avatarA08 from "@/assets/avatars/avatar_a_08.png";
import avatarA09 from "@/assets/avatars/avatar_a_09.png";
import avatarA10 from "@/assets/avatars/avatar_a_10.png";
import avatarA11 from "@/assets/avatars/avatar_a_11.png";
import avatarA12 from "@/assets/avatars/avatar_a_12.png";
import avatarB01 from "@/assets/avatars/avatar_b_01.png";
import avatarB02 from "@/assets/avatars/avatar_b_02.png";
import avatarB03 from "@/assets/avatars/avatar_b_03.png";
import avatarB04 from "@/assets/avatars/avatar_b_04.png";
import avatarB05 from "@/assets/avatars/avatar_b_05.png";
import avatarB06 from "@/assets/avatars/avatar_b_06.png";
import avatarB07 from "@/assets/avatars/avatar_b_07.png";
import avatarB08 from "@/assets/avatars/avatar_b_08.png";
import avatarB09 from "@/assets/avatars/avatar_b_09.png";
import avatarB10 from "@/assets/avatars/avatar_b_10.png";
import avatarB11 from "@/assets/avatars/avatar_b_11.png";
import avatarB12 from "@/assets/avatars/avatar_b_12.png";

const ALL_AVATARS = [
  avatarA01, avatarA02, avatarA03, avatarA04, avatarA05, avatarA06,
  avatarA07, avatarA08, avatarA09, avatarA10, avatarA11, avatarA12,
  avatarB01, avatarB02, avatarB03, avatarB04, avatarB05, avatarB06,
  avatarB07, avatarB08, avatarB09, avatarB10, avatarB11, avatarB12,
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

interface AvatarPickerProps {
  /** Called with a data: URL of the chosen avatar (ready to upload like any other photo) */
  onSelect: (dataUrl: string) => void;
  count?: number;
}

export function AvatarPicker({ onSelect, count = 12 }: AvatarPickerProps) {
  const [order] = useState(() => shuffle(ALL_AVATARS));
  const [visibleCount, setVisibleCount] = useState(Math.min(count, order.length));
  const [loadingSrc, setLoadingSrc] = useState<string | null>(null);

  const visible = order.slice(0, visibleCount);
  const hasMore = visibleCount < order.length;

  const showMore = useCallback(() => {
    setVisibleCount((v) => Math.min(v + count, order.length));
  }, [count, order.length]);

  const handlePick = async (src: string) => {
    setLoadingSrc(src);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("Nepodařilo se načíst avatar");
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      onSelect(dataUrl);
    } catch {
      toast.error("Avatar se nepodařilo načíst, zkuste to prosím znovu");
    } finally {
      setLoadingSrc(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {visible.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => handlePick(src)}
            disabled={loadingSrc !== null}
            className="relative aspect-square rounded-full border-2 border-border overflow-hidden hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          >
            <img src={src} alt="Avatar" className="h-full w-full object-cover" loading="lazy" />
            {loadingSrc === src && (
              <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </span>
            )}
          </button>
        ))}
      </div>
      {hasMore && (
        <Button type="button" variant="outline" size="sm" onClick={showMore} disabled={loadingSrc !== null} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Zobrazit další
        </Button>
      )}
    </div>
  );
}
